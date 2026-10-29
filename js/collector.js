/**
 * ============================================================================
 * AE SURVEY — Stage 3: Collect Responses & Offline Field Kiosk Runner
 * Includes:
 * - Collector Management (Web Link, Offline Tablet Kiosk, QR Poster)
 * - Live Multi-Page Respondent Runner with Conditional Skip Logic
 * - One-Tap HTML5 GPS Capture (with Rural Kenya Field Fallback)
 * - Offline Kiosk Auto-Loop & Enumerator PIN Lock
 * - Pure Canvas QR Code Generator & Air-Gapped JSON Bundle Import/Export
 * ============================================================================
 */

window.AECollector = {
  activeSubTab: 'runner', // 'runner' | 'collectors' | 'airgap'
  kioskLocked: false,
  showPinPrompt: false,
  showNewCollectorForm: false,
  isSubmitting: false,
  activeSurveyId: null,
  currentPageIndex: 0,
  startedAtIso: null,
  startedAtMs: 0,
  draftAnswers: {},
  enumeratorName: '',
  activeCollectorId: 'col_kiosk_rift',
  autoLoopKiosk: true,
  validationErrors: {},
  justSubmittedBanner: null,

  initRunnerForSurvey(survey, forceReset = false) {
    if (!survey) return;
    const cols = window.aeStore.getCollectorsForSurvey(survey.id);
    const defaultColId = cols.length > 0 ? cols[0].id : 'col_kiosk_rift';
    const defaultEnum =
      this.enumeratorName ||
      (cols.length > 0 && cols[0].enumeratorDefault) ||
      window.aeStore.settings.defaultEnumerator ||
      'Grace Wanjiku (Enum-04)';

    // Restore saved draft from localStorage if switching back to this survey and not forcing reset
    if (!forceReset) {
      const savedDraft = window.aeStore.getRunnerDraft(survey.id);
      if (savedDraft && savedDraft.draftAnswers && Object.keys(savedDraft.draftAnswers).length > 0) {
        this.activeSurveyId = survey.id;
        this.currentPageIndex = Math.min(
          savedDraft.currentPageIndex || 0,
          Math.max(0, (survey.pages || []).length - 1)
        );
        this.startedAtIso = savedDraft.startedAtIso || new Date().toISOString();
        this.startedAtMs = savedDraft.startedAtMs || Date.now();
        this.draftAnswers = { ...savedDraft.draftAnswers };
        this.enumeratorName = savedDraft.enumeratorName || defaultEnum;
        this.activeCollectorId = savedDraft.activeCollectorId || defaultColId;
        this.validationErrors = {};
        return;
      }
    }

    this.activeSurveyId = survey.id;
    this.currentPageIndex = 0;
    this.startedAtIso = new Date().toISOString();
    this.startedAtMs = Date.now();
    this.draftAnswers = {};
    this.validationErrors = {};
    if (forceReset) {
      window.aeStore.clearRunnerDraft(survey.id);
    }
    if (!cols.some((c) => c.id === this.activeCollectorId)) {
      this.activeCollectorId = defaultColId;
    }
    if (!this.enumeratorName) {
      this.enumeratorName = defaultEnum;
    }
  },

  persistDraft(surveyId) {
    const id = surveyId || this.activeSurveyId;
    if (!id) return;
    window.aeStore.saveRunnerDraft(id, {
      currentPageIndex: this.currentPageIndex,
      startedAtIso: this.startedAtIso,
      startedAtMs: this.startedAtMs,
      draftAnswers: this.draftAnswers,
      enumeratorName: this.enumeratorName,
      activeCollectorId: this.activeCollectorId
    });
  },

  renderCollectStage(survey) {
    if (!survey) return '<div class="p-8 text-center">No survey selected.</div>';
    if (!this.startedAtIso || this.activeSurveyId !== survey.id) {
      this.initRunnerForSurvey(survey, false);
    }

    const allSurveys = window.aeStore.surveys || [];
    const collectors = window.aeStore.getCollectorsForSurvey(survey.id);
    const responses = window.aeStore.getResponsesForSurvey(survey.id);
    const queuedCount = responses.filter((r) => r.syncStatus !== 'synced').length;
    const activeCol = collectors.find((c) => c.id === this.activeCollectorId) || collectors[0] || { name: 'Field Tablet Kiosk' };

    return `
      <div class="space-y-6">
        <!-- 1. Collector Stage Header Row (Screen-Fit & Aligned with Overview) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFEFEF]">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-[24px] font-semibold text-[#111613] tracking-tight leading-tight">Field Kiosk &amp; Collectors</h1>
              <span class="inline-flex items-center gap-1.5 text-xs text-[#525B56]">
                <span class="w-1.5 h-1.5 rounded-full ${queuedCount > 0 ? 'bg-[#D97706]' : 'bg-[#247B50]'}"></span>
                <span>${queuedCount > 0 ? `${queuedCount} queued offline` : 'All records synced'}</span>
              </span>
            </div>
            <p class="text-sm text-[#525B56] mt-1">
              Field enumeration kiosk for Android tablets, offline QR code packs, and air-gapped survey kits.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <!-- Active Survey Switcher -->
            <select onchange="AEApp.switchStage('collect', this.value)"
              aria-label="Select Survey for Kiosk"
              class="h-8 text-xs font-semibold bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50] max-w-[220px] truncate">
              ${allSurveys
                .map(
                  (s) =>
                    `<option value="${s.id}" ${s.id === survey.id ? 'selected' : ''}>${AEApp.escapeHtml(
                      s.title.substring(0, 32)
                    )}${s.title.length > 32 ? '…' : ''}</option>`
                )
                .join('')}
            </select>

            ${
              !this.kioskLocked
                ? `<button onclick="AEApp.enterKioskMode()"
                    class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
                    <i class="fa-solid fa-lock text-[#247B50]"></i> Lock Tablet Kiosk
                  </button>`
                : ''
            }

            <a href="field.html?survey=${encodeURIComponent(survey.id)}"
              title="Open dedicated standalone Field App"
              class="h-8 px-3.5 rounded-[6px] text-xs font-semibold bg-[#247B50] hover:bg-[#1F6A45] text-white inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-mobile-screen-button text-xs"></i> Launch Field App
            </a>
          </div>
        </div>

        <!-- 2. Divided 4-Cell Metadata Strip (Matching Overview Architecture) -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
          <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF]">
            <div class="p-4">
              <span class="text-xs font-medium text-[#525B56] block">Active Instrument</span>
              <div class="mt-1">
                <strong class="text-sm font-semibold text-[#111613] block truncate" title="${AEApp.escapeAttr(survey.title)}">${AEApp.escapeHtml(survey.title)}</strong>
                <span class="text-xs text-[#247B50] font-medium">${AEApp.escapeHtml(survey.category || 'Field Survey')}</span>
              </div>
            </div>
            <div class="p-4">
              <span class="text-xs font-medium text-[#525B56] block">Active Collector Device</span>
              <div class="mt-1">
                <strong class="text-sm font-semibold text-[#111613] block truncate">${AEApp.escapeHtml(activeCol.name || 'Field Kiosk')}</strong>
                <span class="text-xs text-[#525B56]">${collectors.length} configured collectors</span>
              </div>
            </div>
            <div class="p-4">
              <span class="text-xs font-medium text-[#525B56] block">Default Field Enumerator</span>
              <div class="mt-1">
                <strong class="text-sm font-semibold text-[#111613] block truncate">${AEApp.escapeHtml(this.enumeratorName || 'Field Enumerator')}</strong>
                <span class="text-xs text-[#247B50] font-medium">Logged in for session</span>
              </div>
            </div>
            <div class="p-4">
              <span class="text-xs font-medium text-[#525B56] block">Offline Storage &amp; Sync</span>
              <div class="mt-1 flex items-baseline gap-2">
                <strong class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none">${responses.length}</strong>
                <span class="text-xs text-[#525B56]">responses (${queuedCount} pending push)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Sub-Navigation Tabs Bar (Segmented Controls) -->
        ${
          this.kioskLocked
            ? `<div class="bg-[#141A17] text-white rounded-[8px] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <i class="fa-solid fa-lock text-[#3FC07A]"></i>
                  <div class="min-w-0">
                    <div class="text-xs font-semibold text-white">Offline Field Kiosk Mode Active</div>
                    <div class="text-xs text-[#B4B4B4] truncate">Enumerator: <strong class="text-white">${AEApp.escapeHtml(this.enumeratorName)}</strong> · Local Queue: <strong class="tabular-nums text-white">${queuedCount}</strong> pending sync</div>
                  </div>
                </div>
                ${
                  this.showPinPrompt
                    ? `<form onsubmit="event.preventDefault(); AEApp.verifyKioskPinInput();" class="flex flex-wrap items-center gap-2">
                        <label for="ae_kiosk_pin_input" class="text-xs text-[#B4B4B4]">PIN:</label>
                        <input id="ae_kiosk_pin_input" type="password" inputmode="numeric" maxlength="8" placeholder="••••" autocomplete="current-password"
                          class="w-20 h-8 rounded-[6px] bg-white px-2.5 text-xs font-semibold text-[#111613] tabular-nums focus:outline-none" />
                        <button type="submit" class="h-8 px-3 rounded-[6px] bg-[#247B50] text-white text-xs font-semibold ae-press">Verify PIN</button>
                        <button type="button" onclick="AEApp.cancelKioskPinPrompt()" class="h-8 px-2.5 rounded-[6px] bg-white/10 text-white text-xs">Cancel</button>
                        ${this.pinPromptError ? `<span class="text-xs font-semibold text-[#FCA5A5]">${AEApp.escapeHtml(this.pinPromptError)}</span>` : ''}
                      </form>`
                    : `<button onclick="AEApp.unlockKioskMode()"
                        class="h-8 px-3 rounded-[6px] bg-white/10 hover:bg-white/20 text-xs font-medium text-white inline-flex items-center gap-1.5 ae-press">
                        <i class="fa-solid fa-key text-xs"></i> Exit Kiosk (PIN)
                      </button>`
                }
              </div>`
            : `<div class="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E4E7E4] rounded-[8px] p-2 sm:p-2.5">
                <div class="inline-flex rounded-[6px] border border-[#CFD5D0] p-0.5 bg-[#F8F9F8] flex-wrap">
                  <button onclick="AEApp.setCollectSubTab('runner')"
                    class="h-8 px-3 rounded-[4px] text-xs font-medium inline-flex items-center gap-2 transition-colors ${
                      this.activeSubTab === 'runner'
                        ? 'bg-[#141A17] text-white font-semibold'
                        : 'text-[#525B56] hover:text-[#111613]'
                    }">
                    <i class="fa-solid fa-clipboard-check text-xs"></i> Interactive Field Runner
                  </button>
                  <button onclick="AEApp.setCollectSubTab('collectors')"
                    class="h-8 px-3 rounded-[4px] text-xs font-medium inline-flex items-center gap-2 tabular-nums transition-colors ${
                      this.activeSubTab === 'collectors'
                        ? 'bg-[#141A17] text-white font-semibold'
                        : 'text-[#525B56] hover:text-[#111613]'
                    }">
                    <i class="fa-solid fa-qrcode text-xs"></i> Web Links &amp; QR Codes (${collectors.length})
                  </button>
                  <button onclick="AEApp.setCollectSubTab('airgap')"
                    class="h-8 px-3 rounded-[4px] text-xs font-medium inline-flex items-center gap-2 transition-colors ${
                      this.activeSubTab === 'airgap'
                        ? 'bg-[#141A17] text-white font-semibold'
                        : 'text-[#525B56] hover:text-[#111613]'
                    }">
                    <i class="fa-solid fa-file-import text-xs"></i> Offline JSON Distribution
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <button onclick="AEApp.downloadStandaloneFieldApp('${survey.id}')"
                    class="h-8 px-3 rounded-[6px] text-xs font-medium inline-flex items-center gap-1.5 border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[#111613] transition-colors ae-press">
                    <i class="fa-solid fa-download text-[#247B50] text-xs"></i> Standalone Package (.html)
                  </button>
                </div>
              </div>`
        }

        <!-- 4. Sub-Tab Content -->
        ${
          this.activeSubTab === 'collectors' && !this.kioskLocked
            ? this.renderCollectorsManager(survey, collectors)
            : this.activeSubTab === 'airgap' && !this.kioskLocked
            ? this.renderAirGapManager(survey, responses)
            : this.renderSurveyRunner(survey, collectors)
        }
      </div>
    `;
  },

  renderSurveyRunner(rawSurvey, collectors) {
    const lang = (window.AEApp && window.AEApp.runnerLang) || (window.AEI18n ? window.AEI18n.getLanguage() : 'en');
    const survey = window.AEI18n ? window.AEI18n.localizeSurvey(rawSurvey, lang) : rawSurvey;
    const pages = survey.pages || [];
    if (this.currentPageIndex >= pages.length) this.currentPageIndex = 0;
    const page = pages[this.currentPageIndex];
    const progressPct = Math.round(((this.currentPageIndex + 1) / Math.max(1, pages.length)) * 100);
    const accent = (survey.theme && survey.theme.accentColor) || '#247B50';
    const headerBg = accent === '#007A4B' || accent === '#247B50' ? '#1F6A45' : accent;

    const allQuestions = window.aeStore.getQuestionsForSurvey(survey);
    const answeredCount = allQuestions.filter((q) => {
      const v = this.draftAnswers[q.id];
      if (v === undefined || v === null || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true;
    }).length;

    return `
      <div class="max-w-3xl mx-auto space-y-4">
        ${
          this.justSubmittedBanner
            ? `<div class="bg-[#DCFAE5] border border-[#247B50]/30 rounded-[8px] p-4 space-y-2.5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <i class="fa-solid fa-circle-check text-[#247B50] text-base mt-0.5"></i>
                    <div class="min-w-0">
                      <div class="text-sm font-semibold text-[#04250E] ae-break-words">${AEApp.escapeHtml(this.justSubmittedBanner.title)}</div>
                      <div class="text-xs text-[#04250E]/85 mt-0.5 ae-break-words">${AEApp.escapeHtml(this.justSubmittedBanner.subtitle)}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    ${
                      this.justSubmittedBanner.receiptText
                        ? `<button onclick="AEApp.copyText('${AEApp.escapeJs(this.justSubmittedBanner.receiptText)}', 'Field receipt copied to clipboard.')"
                            class="h-8 px-3 rounded-[6px] bg-white border border-[#247B50]/40 text-xs font-medium text-[#04250E] hover:bg-[#F8F9F8] inline-flex items-center gap-1.5 ae-press">
                            <i class="fa-regular fa-copy"></i> Copy Receipt
                          </button>`
                        : ''
                    }
                    <button onclick="AEApp.switchStage('analyze', '${survey.id}')"
                      class="h-8 px-3 rounded-[6px] bg-[#141A17] text-xs font-medium text-white hover:bg-[#232C27] ae-press">
                      View in Analytics
                    </button>
                  </div>
                </div>
                ${
                  this.justSubmittedBanner.receiptMeta
                    ? `<div class="pt-2 border-t border-[#247B50]/20 flex flex-wrap items-center justify-between gap-2 text-xs text-[#04250E] tabular-nums">
                        <span>Receipt ID: <code>${AEApp.escapeHtml(this.justSubmittedBanner.receiptMeta.id)}</code></span>
                        <span>Duration: <strong>${AEApp.escapeHtml(this.justSubmittedBanner.receiptMeta.duration)}</strong></span>
                        <span>Plot GPS: <strong>${AEApp.escapeHtml(this.justSubmittedBanner.receiptMeta.gps)}</strong></span>
                      </div>`
                    : ''
                }
              </div>`
            : ''
        }

        <!-- Enumerator & Collector Metadata Bar (Divided 3-column strip, sentence-case labels) -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF]">
          <div class="p-3.5 min-w-0">
            <label for="ae_runner_collector_select" class="block text-xs font-medium text-[#525B56] mb-1.5">Active collector</label>
            <select id="ae_runner_collector_select" onchange="AEApp.setRunnerCollector(this.value)"
              class="w-full h-9 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] truncate">
              ${collectors
                .map(
                  (c) => `<option value="${c.id}" ${c.id === this.activeCollectorId ? 'selected' : ''}>${AEApp.escapeHtml(c.name)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="p-3.5 min-w-0">
            <label for="ae_runner_enum_input" class="block text-xs font-medium text-[#525B56] mb-1.5">Enumerator / interviewer ID</label>
            <input type="text"
              id="ae_runner_enum_input"
              maxlength="80"
              value="${AEApp.escapeAttr(this.enumeratorName)}"
              onchange="AEApp.setRunnerEnumerator(this.value)"
              class="w-full h-9 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]"
              placeholder="Enumerator name or code…" />
          </div>
          <div class="p-3.5 flex flex-col justify-between min-w-0">
            <span class="text-xs font-medium text-[#525B56]">Offline draft &amp; storage</span>
            <div class="flex items-center justify-between gap-2 text-xs font-medium text-[#04250E] bg-[#DCFAE5] px-2.5 h-9 rounded-[6px] tabular-nums">
              <span class="inline-flex items-center gap-1.5 truncate">
                <i class="fa-solid fa-hard-drive text-[#247B50]"></i>
                <span class="truncate">${answeredCount > 0 ? `Draft saved (${answeredCount}/${allQuestions.length})` : 'IndexedDB outbox ready'}</span>
              </span>
              <span class="text-[11px] text-[#04250E]/80 shrink-0">Auto-save</span>
            </div>
          </div>
        </div>

        <!-- Respondent Survey Instrument Card -->
        <div class="bg-white border border-[#E4E7E4] rounded-[12px] overflow-hidden">
          <!-- Survey Header (The single place Fraunces editorial serif is used as a welcoming respondent greeting) -->
          <div class="p-6 sm:p-7 text-white" style="background-color: ${headerBg}">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div class="flex items-center gap-2.5">
                <img src="https://drive.google.com/thumbnail?id=1FG3ihsPb06rIDp7DcxtZQsmi9XydO9y4&sz=w1000"
                  alt="Agri Experience Logo"
                  class="h-7 w-auto max-w-[120px] object-contain rounded bg-white/10 px-1 py-0.5 shrink-0"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />
                <span class="hidden w-6 h-6 rounded-[4px] bg-white/20 items-center justify-center text-xs font-bold shrink-0">
                  <i class="fa-solid fa-seedling"></i>
                </span>
                <span class="px-2 py-0.5 rounded-[4px] text-xs font-medium bg-white/15 text-white">
                  ${AEApp.escapeHtml(survey.category || 'Field Survey')}
                </span>
                ${window.AEI18n ? window.AEI18n.renderLanguageSwitch(lang, 'AEApp.setRunnerLanguage', 'dark') : ''}
              </div>
              <span class="text-xs text-white/85 tabular-nums">
                Page ${this.currentPageIndex + 1} of ${pages.length} · ${progressPct}%
              </span>
            </div>
            <h2 class="font-display text-[22px] sm:text-[26px] font-semibold tracking-tight text-white leading-snug ae-break-words">
              ${AEApp.escapeHtml(survey.title)}
            </h2>
            ${
              survey.description
                ? `<p class="text-xs sm:text-sm text-white/85 mt-2 max-w-2xl leading-relaxed ae-break-words">${AEApp.escapeHtml(survey.description)}</p>`
                : ''
            }

            ${
              survey.theme?.showProgressBar !== false
                ? `<div class="mt-5 w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-[#3FC07A] h-full transition-transform duration-200 origin-left" style="transform: scaleX(${progressPct / 100})"></div>
                  </div>`
                : ''
            }
          </div>

          <!-- Current Page Title & Quick-Key Accelerator Hint -->
          <div class="bg-[#F8F9F8] px-6 sm:px-7 py-3.5 border-b border-[#EFEFEF] flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-[#111613] ae-break-words">${AEApp.escapeHtml(page.title)}</h3>
              ${
                page.description
                  ? `<p class="text-xs text-[#525B56] mt-0.5 ae-break-words">${AEApp.escapeHtml(page.description)}</p>`
                  : ''
              }
            </div>
            <div class="hidden sm:flex items-center gap-1.5 text-xs text-[#646E68] shrink-0" title="Enumerator keyboard accelerators">
              <span>Quick keys:</span>
              <span class="ae-kbd">1–9</span>
              <span>select option</span>
              <span>·</span>
              <span class="ae-kbd">Shift+Enter</span>
              <span>next</span>
            </div>
          </div>

          <!-- Questions Form Body -->
          <div class="p-6 sm:p-7 space-y-6">
            ${(page.questions || [])
              .map((q, idx) => this.renderRespondentQuestion(survey, q, idx))
              .join('')}
          </div>

          <!-- Navigation Footer -->
          <div class="px-6 sm:px-7 py-4 bg-[#F8F9F8] border-t border-[#EFEFEF] flex flex-wrap items-center justify-between gap-3">
            <div>
              ${
                this.currentPageIndex > 0
                  ? `<button onclick="AEApp.prevRunnerPage()"
                      class="h-9 px-4 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-2 ae-press">
                      <i class="fa-solid fa-arrow-left"></i> Previous Page
                    </button>`
                  : `<button onclick="AEApp.resetRunnerDraft('${survey.id}')"
                      class="h-9 px-3 rounded-[6px] text-xs font-medium text-[#525B56] hover:text-[#111613]">
                      <i class="fa-solid fa-rotate-left mr-1"></i> Clear form
                    </button>`
              }
            </div>

            <div class="flex items-center gap-3">
              ${
                this.currentPageIndex < pages.length - 1
                  ? `<button onclick="AEApp.nextRunnerPage('${survey.id}')"
                      class="h-10 px-5 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center gap-2 ae-press">
                      <span>Continue to Page ${this.currentPageIndex + 2}</span>
                      <i class="fa-solid fa-arrow-right"></i>
                    </button>`
                  : `<button onclick="AEApp.submitRunnerResponse('${survey.id}')"
                      ${this.isSubmitting ? 'disabled' : ''}
                      class="h-10 px-5 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center gap-2 ae-press">
                      <i class="fa-solid fa-check"></i>
                      <span>${this.isSubmitting ? 'Saving response…' : window.aeStore.isEffectivelyOnline() ? 'Save & Sync Response' : 'Save Response to Offline Queue'}</span>
                    </button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderRespondentQuestion(survey, q, idx) {
    const val = this.draftAnswers[q.id];
    const hasErr = this.validationErrors[q.id];
    const showNum = survey.theme?.showQuestionNumbers !== false;
    const pipedTitle = (window.AEPiping && typeof window.AEPiping.interpolate === 'function')
      ? window.AEPiping.interpolate(q.title, this.draftAnswers, survey)
      : q.title;
    const pipedHelp = (window.AEPiping && typeof window.AEPiping.interpolate === 'function')
      ? window.AEPiping.interpolate(q.helpText || '', this.draftAnswers, survey)
      : q.helpText;

    return `
      <div id="runner_q_${q.id}" class="space-y-2 pb-6 border-b border-[#EFEFEF] last:border-b-0 last:pb-0">
        <div class="flex items-start justify-between gap-2 min-w-0">
          <label for="runner_input_${q.id}" class="block text-sm sm:text-base font-semibold text-[#111613] leading-snug ae-break-words min-w-0">
            ${showNum ? `<span class="tabular-nums text-xs font-semibold text-[#247B50] mr-1.5">Q${idx + 1}.</span>` : ''}
            ${AEApp.escapeHtml(pipedTitle)}
            ${q.required ? '<span class="text-[#C4242A] ml-1" title="Required">*</span>' : ''}
          </label>
          ${
            q.logic && q.logic.enabled
              ? `<span class="shrink-0 text-xs px-2 py-0.5 rounded-[4px] bg-[#FFFBEB] text-[#92400E]">Skip rule</span>`
              : ''
          }
        </div>

        ${
          pipedHelp
            ? `<p class="text-xs text-[#525B56] ae-break-words">${AEApp.escapeHtml(pipedHelp)}</p>`
            : ''
        }

        ${
          hasErr
            ? `<div role="alert" class="text-xs font-medium text-[#831C1E] bg-[#FFEDEA] border border-[#F5C2C0] rounded-[6px] px-3 py-2 flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation text-[#C4242A]"></i> <span>${AEApp.escapeHtml(hasErr)}</span>
              </div>`
            : ''
        }

        <div class="pt-1">
          ${this.renderRespondentInputControl(q, val)}
        </div>
      </div>
    `;
  },

  renderRespondentInputControl(q, val) {
    if (q.type === 'multiple_choice') {
      return `
        <div role="radiogroup" aria-label="${AEApp.escapeAttr(q.title)}" class="space-y-1.5">
          ${(q.options || [])
            .map((opt, optIdx) => {
              const checked = val === opt;
              return `
                <div role="radio"
                  aria-checked="${checked}"
                  tabindex="0"
                  onclick="AEApp.setRunnerAnswer('${q.id}', '${AEApp.escapeJs(opt)}')"
                  onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();AEApp.setRunnerAnswer('${q.id}', '${AEApp.escapeJs(opt)}');}"
                  class="flex items-center justify-between gap-3 px-3.5 py-3 rounded-[8px] border cursor-pointer transition-colors min-h-[44px] min-w-0 ${
                    checked
                      ? 'border-[#247B50] bg-[#DCFAE5]/50 text-[#111613] font-semibold'
                      : 'border-[#E4E7E4] bg-white hover:bg-[#F8F9F8] text-[#111613]'
                  }">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      checked ? 'border-[#247B50] bg-[#247B50]' : 'border-[#9CA69F] bg-white'
                    }">
                      ${checked ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ''}
                    </span>
                    <span class="text-sm ae-break-words min-w-0">${AEApp.escapeHtml(opt)}</span>
                  </div>
                  ${optIdx < 9 ? `<span class="ae-kbd shrink-0 hidden sm:inline-flex" title="Press ${optIdx + 1}">${optIdx + 1}</span>` : ''}
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    if (q.type === 'checkboxes') {
      const selectedArr = Array.isArray(val) ? val : [];
      return `
        <div role="group" aria-label="${AEApp.escapeAttr(q.title)}" class="space-y-1.5">
          ${(q.options || [])
            .map((opt) => {
              const checked = selectedArr.includes(opt);
              return `
                <div role="checkbox"
                  aria-checked="${checked}"
                  tabindex="0"
                  onclick="AEApp.toggleRunnerCheckbox('${q.id}', '${AEApp.escapeJs(opt)}')"
                  onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();AEApp.toggleRunnerCheckbox('${q.id}', '${AEApp.escapeJs(opt)}');}"
                  class="flex items-center gap-3 px-3.5 py-3 rounded-[8px] border cursor-pointer transition-colors min-h-[44px] min-w-0 ${
                    checked
                      ? 'border-[#247B50] bg-[#DCFAE5]/50 text-[#111613] font-semibold'
                      : 'border-[#E4E7E4] bg-white hover:bg-[#F8F9F8] text-[#111613]'
                  }">
                  <span class="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                    checked ? 'border-[#247B50] bg-[#247B50] text-white' : 'border-[#9CA69F] bg-white'
                  }">
                    ${checked ? '<i class="fa-solid fa-check text-[10px]"></i>' : ''}
                  </span>
                  <span class="text-sm ae-break-words min-w-0">${AEApp.escapeHtml(opt)}</span>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    if (q.type === 'dropdown') {
      return `
        <select id="runner_input_${q.id}" onchange="AEApp.setRunnerAnswer('${q.id}', this.value)"
          class="w-full h-10 text-sm bg-white border border-[#CFD5D0] rounded-[8px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none">
          <option value="">Select an answer…</option>
          ${(q.options || [])
            .map(
              (opt) => `<option value="${AEApp.escapeAttr(opt)}" ${val === opt ? 'selected' : ''}>${AEApp.escapeHtml(opt)}</option>`
            )
            .join('')}
        </select>
      `;
    }

    if (q.type === 'star_rating') {
      const maxStars = q.maxStars || 5;
      const current = Number(val || 0);
      return `
        <div role="group" aria-label="${AEApp.escapeAttr(q.title)}" class="flex flex-wrap items-center gap-2">
          ${Array.from({ length: maxStars }, (_, i) => i + 1)
            .map(
              (star) => `
            <button type="button"
              aria-label="Rate ${star} of ${maxStars} stars"
              aria-pressed="${current === star}"
              onclick="AEApp.setRunnerAnswer('${q.id}', ${star})"
              class="w-11 h-11 rounded-[8px] border text-base flex flex-col items-center justify-center ae-press ${
                current >= star
                  ? 'border-[#247B50] bg-[#DCFAE5]/50 text-[#D97706] font-semibold'
                  : 'border-[#CFD5D0] bg-white text-[#9CA69F] hover:text-[#D97706]'
              }">
              <i class="fa-solid fa-star"></i>
              <span class="text-[11px] tabular-nums text-[#111613] mt-0.5">${star}</span>
            </button>
          `
            )
            .join('')}
          ${current > 0 ? `<span class="ml-2 text-xs tabular-nums font-medium text-[#247B50]">${current} of ${maxStars} stars</span>` : ''}
        </div>
      `;
    }

    if (q.type === 'nps') {
      const hasVal = val !== undefined && val !== null && val !== '';
      const numVal = hasVal ? Number(val) : -1;
      return `
        <div role="group" aria-label="${AEApp.escapeAttr(q.title)}" class="space-y-2">
          <div class="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
            ${Array.from({ length: 11 }, (_, i) => i)
              .map(
                (n) => `
              <button type="button"
                aria-label="Score ${n} out of 10"
                aria-pressed="${numVal === n}"
                onclick="AEApp.setRunnerAnswer('${q.id}', ${n})"
                class="h-11 rounded-[6px] border text-sm font-semibold tabular-nums ae-press ${
                  numVal === n
                    ? 'bg-[#247B50] border-[#247B50] text-white'
                    : 'bg-white border-[#CFD5D0] text-[#111613] hover:border-[#247B50]'
                }">
                ${n}
              </button>
            `
              )
              .join('')}
          </div>
          <div class="flex justify-between text-xs text-[#525B56]">
            <span>0 = Not at all likely (Detractor)</span>
            <span>10 = Extremely likely (Promoter)</span>
          </div>
        </div>
      `;
    }

    if (q.type === 'matrix') {
      const rows = q.rows || [];
      const cols = q.columns || ['Poor', 'Fair', 'Good', 'Excellent'];
      const matrixObj = val && typeof val === 'object' ? val : {};
      return `
        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[8px]">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-[#E4E7E4] h-10 text-xs font-normal text-[#525B56]">
                <th class="p-3 font-normal">Statement / trait</th>
                ${cols.map((c) => `<th class="p-3 font-normal text-center">${AEApp.escapeHtml(c)}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF] bg-white">
              ${rows
                .map(
                  (r) => `
                <tr class="ae-row-hover">
                  <td class="p-3 text-xs font-medium text-[#111613] ae-break-words">${AEApp.escapeHtml(r)}</td>
                  ${cols
                    .map((c) => {
                      const picked = matrixObj[r] === c;
                      return `
                        <td class="p-3 text-center">
                          <button type="button"
                            aria-label="${AEApp.escapeAttr(r)}: ${AEApp.escapeAttr(c)}"
                            aria-pressed="${picked}"
                            onclick="AEApp.setRunnerMatrixAnswer('${q.id}', '${AEApp.escapeJs(r)}', '${AEApp.escapeJs(c)}')"
                            class="w-7 h-7 rounded-full border mx-auto flex items-center justify-center ${
                              picked ? 'border-[#247B50] bg-[#247B50] text-white' : 'border-[#9CA69F] bg-white hover:border-[#247B50]'
                            }">
                            ${picked ? '<i class="fa-solid fa-check text-[10px]"></i>' : ''}
                          </button>
                        </td>
                      `;
                    })
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    if (q.type === 'number_yield') {
      const unitStr = q.unit || 'units';
      const isKgAcre = unitStr.toLowerCase().includes('kg');
      const minVal = q.min ?? 0;
      const maxVal = q.max ?? 100000;
      return `
        <div class="space-y-2">
          <div class="flex items-center max-w-xs">
            <input type="number"
              id="runner_input_${q.id}"
              value="${val !== undefined && val !== null ? val : ''}"
              min="${minVal}" max="${maxVal}"
              oninput="AEApp.setRunnerAnswerSilent('${q.id}', this.value === '' ? '' : Number(this.value))"
              placeholder="0"
              class="w-full h-10 text-sm tabular-nums bg-white border border-[#CFD5D0] rounded-l-[6px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
            <span class="h-10 px-3.5 bg-[#F8F9F8] border border-l-0 border-[#CFD5D0] rounded-r-[6px] text-xs font-medium text-[#525B56] inline-flex items-center whitespace-nowrap">
              ${AEApp.escapeHtml(unitStr)}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 text-xs text-[#646E68] tabular-nums">
            <span>Allowed range: ${minVal.toLocaleString()} – ${maxVal.toLocaleString()} ${AEApp.escapeHtml(unitStr)}</span>
            ${
              isKgAcre
                ? `<span class="mx-1">·</span>
                   <span>90kg bag converter:</span>
                   ${[10, 15, 20, 25]
                     .map(
                       (bags) =>
                         `<button type="button" onclick="AEApp.setRunnerAnswer('${q.id}', ${bags * 90})"
                           class="px-2 py-0.5 rounded-[4px] border border-[#CFD5D0] bg-[#F8F9F8] hover:bg-[#DCFAE5] hover:border-[#247B50] text-[11px] font-medium text-[#111613] tabular-nums ae-press">
                           ${bags} bags (${(bags * 90).toLocaleString()} kg)
                         </button>`
                     )
                     .join('')}`
                : ''
            }
          </div>
        </div>
      `;
    }

    if (q.type === 'gps_location') {
      const gps = val && typeof val === 'object' ? val : { lat: '', lng: '', accuracy: '', label: '' };
      return `
        <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onclick="AEApp.captureFieldGPS('${q.id}')"
              class="h-9 px-3.5 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-medium inline-flex items-center gap-2 ae-press">
              <i class="fa-solid fa-location-crosshairs"></i> Capture Live Satellite GPS
            </button>
            ${
              gps.lat !== '' && gps.lng !== ''
                ? `<span class="text-xs font-medium tabular-nums text-[#04250E] bg-[#DCFAE5] px-2.5 py-1 rounded-[4px]">
                    <i class="fa-solid fa-check mr-1"></i>Locked: ${gps.lat}, ${gps.lng} (±${gps.accuracy || 5}m)
                  </span>`
                : `<span class="text-xs text-[#525B56]">Captures offline via device satellite receiver</span>`
            }
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label for="gps_lat_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Latitude (−90 to 90)</label>
              <input id="gps_lat_${q.id}" type="number" step="any" min="-90" max="90" value="${gps.lat ?? ''}"
                onchange="AEApp.updateRunnerGPSField('${q.id}', 'lat', this.value === '' ? '' : Number(this.value))"
                placeholder="-0.3031"
                class="w-full h-9 text-xs tabular-nums bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]" />
            </div>
            <div>
              <label for="gps_lng_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Longitude (−180 to 180)</label>
              <input id="gps_lng_${q.id}" type="number" step="any" min="-180" max="180" value="${gps.lng ?? ''}"
                onchange="AEApp.updateRunnerGPSField('${q.id}', 'lng', this.value === '' ? '' : Number(this.value))"
                placeholder="36.0800"
                class="w-full h-9 text-xs tabular-nums bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]" />
            </div>
            <div>
              <label for="gps_label_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Village / plot landmark</label>
              <input id="gps_label_${q.id}" type="text" maxlength="120" value="${AEApp.escapeAttr(gps.label || '')}"
                onchange="AEApp.updateRunnerGPSField('${q.id}', 'label', this.value)"
                placeholder="E.g. Njoro Ward Plot #4"
                class="w-full h-9 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]" />
            </div>
          </div>
        </div>
      `;
    }

    if (q.type === 'date_time') {
      return `
        <input type="date"
          id="runner_input_${q.id}"
          value="${AEApp.escapeAttr(val || '')}"
          onchange="AEApp.setRunnerAnswer('${q.id}', this.value)"
          class="h-10 text-sm tabular-nums bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
      `;
    }

    if (q.type === 'long_text') {
      return `
        <textarea rows="3"
          id="runner_input_${q.id}"
          maxlength="1200"
          oninput="AEApp.setRunnerAnswerSilent('${q.id}', this.value)"
          placeholder="${AEApp.escapeAttr(q.placeholder || 'Enter detailed field notes…')}"
          class="w-full text-sm bg-white border border-[#CFD5D0] rounded-[8px] p-3 text-[#111613] focus:border-[#247B50] focus:outline-none">${AEApp.escapeHtml(val || '')}</textarea>
      `;
    }

    if (q.type === 'signature') {
      const hasSig = Boolean(val);
      return `
        <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4 space-y-2.5">
          <div class="flex items-center justify-between text-xs text-[#525B56]">
            <span>Digital consent signature pad (Farmer / Agro-Dealer)</span>
            ${hasSig ? `<span class="text-[#247B50] font-medium"><i class="fa-solid fa-circle-check"></i> Signature saved</span>` : ''}
          </div>
          <div class="bg-white rounded-[6px] border border-[#CFD5D0] h-28 flex items-center justify-center p-2">
            ${hasSig ? `<img src="${AEApp.escapeAttr(val)}" alt="Signature" class="max-h-24 object-contain" />` : `<span class="text-xs text-[#A3ACA6]"><i class="fa-solid fa-signature mr-1"></i> Interactive touch canvas active in Field App</span>`}
          </div>
        </div>
      `;
    }

    if (q.type === 'photo_proof') {
      const hasPhoto = Boolean(val && val.dataUrl);
      return `
        <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4 space-y-2.5">
          <div class="flex items-center justify-between text-xs text-[#525B56]">
            <span>Camera photo proof (Auto-compressed to &le;150KB JPEG)</span>
            ${hasPhoto ? `<span class="text-[#247B50] font-medium"><i class="fa-solid fa-circle-check"></i> Image attached (${val.sizeKb || 120} KB)</span>` : ''}
          </div>
          <div class="bg-white rounded-[6px] border border-[#CFD5D0] h-32 flex items-center justify-center p-2">
            ${hasPhoto ? `<img src="${AEApp.escapeAttr(val.dataUrl)}" alt="Photo Proof" class="max-h-28 object-contain rounded-[4px]" />` : `<span class="text-xs text-[#A3ACA6]"><i class="fa-solid fa-camera mr-1"></i> Rear camera capture active in Field App</span>`}
          </div>
        </div>
      `;
    }

    if (q.type === 'cascading_dropdown') {
      const levels = Array.isArray(q.levels) ? q.levels : ['County', 'Sub-County', 'Ward'];
      return `
        <div class="p-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex items-center justify-between">
          <span class="font-medium text-[#111613]"><i class="fa-solid fa-sitemap text-[#247B50] mr-1.5"></i> ${levels.join(' › ')} Cascading Filter</span>
          <span class="text-[#247B50] font-semibold">Active in Field App</span>
        </div>
      `;
    }

    if (q.type === 'barcode_scanner') {
      return `
        <div class="p-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex items-center justify-between">
          <span class="font-medium text-[#111613]"><i class="fa-solid fa-barcode text-[#247B50] mr-1.5"></i> KEPHIS Barcode & QR Authentication</span>
          <span class="text-[#247B50] font-semibold">Active in Field App</span>
        </div>
      `;
    }

    if (q.type === 'audio_note') {
      return `
        <div class="p-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex items-center justify-between">
          <span class="font-medium text-[#111613]"><i class="fa-solid fa-microphone text-[#247B50] mr-1.5"></i> Farmer Voice Testimony Memo</span>
          <span class="text-[#247B50] font-semibold">Active in Field App</span>
        </div>
      `;
    }

    if (q.type === 'repeat_group') {
      return `
        <div class="p-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex items-center justify-between">
          <span class="font-medium text-[#111613]"><i class="fa-solid fa-layer-group text-[#247B50] mr-1.5"></i> Multi-Item Inventory Roster Grid</span>
          <span class="text-[#247B50] font-semibold">Active in Field App</span>
        </div>
      `;
    }

    // Default short_text
    return `
      <input type="text"
        id="runner_input_${q.id}"
        maxlength="240"
        value="${AEApp.escapeAttr(val || '')}"
        oninput="AEApp.setRunnerAnswerSilent('${q.id}', this.value)"
        placeholder="${AEApp.escapeAttr(q.placeholder || 'Type your answer…')}"
        class="w-full h-10 text-sm bg-white border border-[#CFD5D0] rounded-[8px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
    `;
  },

  renderCollectorsManager(survey, collectors) {
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const shareUrl = `${window.location.origin}${basePath}field.html?survey=${encodeURIComponent(survey.id)}`;
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-white border border-[#E4E7E4] rounded-[8px] p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-base font-semibold text-[#111613]">Active Survey Collectors</h3>
              <p class="text-xs text-[#525B56]">Track field responses by enumerator team, tablet kiosk, or web link</p>
            </div>
            <button onclick="AEApp.toggleNewCollectorForm()"
              class="h-8 px-3 rounded-[6px] bg-[#141A17] text-white text-xs font-medium hover:bg-[#232C27] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-plus text-[10px]"></i> Add Collector
            </button>
          </div>

          ${
            this.showNewCollectorForm
              ? `<form onsubmit="event.preventDefault(); AEApp.submitNewCollectorForm('${survey.id}');" class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-3.5 flex flex-wrap items-center gap-2">
                  <input id="ae_new_collector_name" type="text" maxlength="100" required
                    placeholder="Collector name (e.g., Western Region Tablet Kiosk)…"
                    class="flex-1 min-w-[200px] h-8 rounded-[6px] border border-[#CFD5D0] bg-white px-2.5 text-xs text-[#111613] focus:outline-none focus:border-[#247B50]" />
                  <select id="ae_new_collector_type" aria-label="Collector channel type"
                    class="h-8 rounded-[6px] border border-[#CFD5D0] bg-white px-2 text-xs text-[#111613]">
                    <option value="kiosk">Tablet Kiosk</option>
                    <option value="weblink">Web Link</option>
                  </select>
                  <input id="ae_new_collector_pin" type="password" maxlength="8" inputmode="numeric"
                    placeholder="PIN (optional)" autocomplete="new-password"
                    class="w-24 h-8 rounded-[6px] border border-[#CFD5D0] bg-white px-2.5 text-xs text-[#111613] focus:outline-none focus:border-[#247B50]" />
                  <button type="submit" class="h-8 px-3 rounded-[6px] bg-[#247B50] text-white text-xs font-medium ae-press">Save</button>
                  <button type="button" onclick="AEApp.toggleNewCollectorForm()" class="h-8 px-2.5 rounded-[6px] border border-[#CFD5D0] bg-white text-xs text-[#525B56]">Cancel</button>
                </form>`
              : ''
          }

          <div class="border border-[#E4E7E4] rounded-[8px] overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#E4E7E4] h-9 text-xs font-normal text-[#525B56]">
                  <th class="py-2 pl-4 pr-3 font-normal">Collector name</th>
                  <th class="py-2 px-3 font-normal">Channel</th>
                  <th class="py-2 px-3 font-normal text-right">Responses</th>
                  <th class="py-2 pl-3 pr-4 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFEFEF] text-xs">
                ${collectors
                  .map((c) => {
                    const count = window.aeStore
                      .getResponsesForSurvey(survey.id)
                      .filter((r) => r.collectorId === c.id).length;
                    return `
                      <tr class="ae-row-hover">
                        <td class="py-3 pl-4 pr-3 max-w-xs">
                          <div class="font-semibold text-[#111613] text-sm ae-break-words">${AEApp.escapeHtml(c.name)}</div>
                          <div class="text-xs text-[#646E68] truncate"><code>${AEApp.escapeHtml(c.id)}</code> · ${AEApp.escapeHtml(c.enumeratorDefault || 'Field Team')}</div>
                        </td>
                        <td class="py-3 px-3 whitespace-nowrap">
                          <span class="px-2 py-0.5 rounded-[4px] bg-[#F8F9F8] border border-[#E4E7E4] text-[#525B56]">
                            ${c.type === 'kiosk' ? 'Tablet Kiosk' : 'Web Link'}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-right tabular-nums font-semibold text-sm text-[#111613]">
                          ${count}
                        </td>
                        <td class="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                          <button onclick="AEApp.launchCollectorRunner('${c.id}')"
                            class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] ae-press">
                            Open Runner
                          </button>
                        </td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Shareable Web Link & Offline QR Poster Card (Joined input and action per app-screens.md §8.1) -->
        <div class="lg:col-span-5 bg-white border border-[#E4E7E4] rounded-[8px] p-5 space-y-4">
          <div>
            <h3 class="text-base font-semibold text-[#111613]">Direct Web Link &amp; Field QR Code</h3>
            <p class="text-xs text-[#525B56]">Share this link or scan on field tablets to open this survey directly in respondent mode</p>
          </div>

          <div class="flex items-center">
            <input type="text" aria-label="Direct Survey Share URL" readonly value="${AEApp.escapeAttr(shareUrl)}"
              class="flex-1 min-w-0 h-9 text-xs bg-[#F8F9F8] border border-[#CFD5D0] rounded-l-[6px] px-3 text-[#111613] focus:outline-none" />
            <button onclick="AEApp.copyText('${AEApp.escapeJs(shareUrl)}', 'Survey Web Link copied to clipboard.')"
              class="h-9 px-3.5 rounded-r-[6px] bg-[#141A17] text-white text-xs font-medium hover:bg-[#232C27] border border-l-0 border-[#141A17] ae-press shrink-0">
              <i class="fa-regular fa-copy mr-1"></i> Copy
            </button>
          </div>

          <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-5 flex flex-col items-center justify-center text-center">
            <canvas id="ae_qr_canvas" width="180" height="180" class="bg-white p-2 rounded-[6px] border border-[#E4E7E4]" role="img" aria-label="QR Code for ${AEApp.escapeAttr(survey.title)}"></canvas>
            <div class="text-xs font-semibold text-[#111613] mt-3 ae-break-words">${AEApp.escapeHtml(survey.title)}</div>
            <div class="text-xs text-[#646E68] mt-0.5">Survey ID: <code>${survey.id}</code></div>
          </div>
        </div>
      </div>
    `;
  },

  renderAirGapManager(survey, responses) {
    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#EFEFEF]">
        <div class="p-6 space-y-3">
          <div class="text-xs font-medium text-[#247B50]">Portable field backup</div>
          <h3 class="text-base font-semibold text-[#111613]">Export Offline Response Pack (.json)</h3>
          <p class="text-xs text-[#525B56] leading-relaxed">
            When an enumerator tablet operates in remote wards without cellular coverage, export all <strong class="tabular-nums text-[#111613]">${responses.length}</strong> locally stored responses for this survey to a portable JSON bundle (USB, Bluetooth, or SD card).
          </p>
          <div class="pt-1">
            <button onclick="AEApp.exportResponsesPackJSON('${survey.id}')"
              class="h-9 px-4 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-medium inline-flex items-center gap-2 tabular-nums ae-press">
              <i class="fa-solid fa-file-export"></i> Download Offline Responses Pack (${responses.length})
            </button>
          </div>
        </div>

        <div class="p-6 space-y-3">
          <div class="text-xs font-medium text-[#525B56]">HQ consolidation</div>
          <h3 class="text-base font-semibold text-[#111613]">Import Air-Gapped JSON Bundle</h3>
          <p class="text-xs text-[#525B56] leading-relaxed">
            Merge a survey schema or an offline response pack from a field enumerator tablet into this workspace and queue all new records for Google Sheets synchronization.
          </p>
          <div class="pt-1">
            <label class="h-9 px-4 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#111613] text-xs font-medium inline-flex items-center gap-2 cursor-pointer ae-press">
              <i class="fa-solid fa-upload text-[#247B50]"></i> Select JSON Pack to Import
              <input type="file" accept=".json,application/json" class="hidden" onchange="AEApp.importJSONPackFile(this)" />
            </label>
          </div>
        </div>
      </div>
    `;
  },

  drawQRCode(text) {
    const canvas = document.getElementById('ae_qr_canvas');
    if (!canvas) return;
    if (window.AEQRCode && typeof window.AEQRCode.drawToCanvas === 'function') {
      try {
        window.AEQRCode.drawToCanvas(canvas, text, {
          margin: 2,
          foreground: '#141A17',
          background: '#FFFFFF',
          level: 'M'
        });
        return;
      } catch (e) {
        console.warn('QR Code generation error:', e);
      }
    }
    const ctx = canvas.getContext('2d');
    const size = 21;
    const cell = Math.floor(canvas.width / (size + 2));
    const offset = Math.floor((canvas.width - size * cell) / 2);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawFinder = (r0, c0) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (border || inner) {
            ctx.fillStyle = '#141A17';
            ctx.fillRect(offset + (c0 + c) * cell, offset + (r0 + r) * cell, cell, cell);
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);
  }
};
