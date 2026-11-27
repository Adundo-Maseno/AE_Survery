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

  isLegacyHardcodedDefault(val) {
    if (!val || typeof val !== 'string') return true;
    const currentUser =
      window.AESession && typeof window.AESession.getCurrentUser === 'function'
        ? window.AESession.getCurrentUser()
        : null;
    if (currentUser && currentUser.fullName && val.includes(currentUser.fullName)) {
      return false; // Valid currently authenticated user!
    }
    const lower = val.toLowerCase().trim();
    return (
      lower.includes('grace wanjiku') ||
      lower.includes('enum-04') ||
      lower === 'field enumerator' ||
      lower === 'unassigned field enumerator'
    );
  },

  resolveEnumeratorName(survey = null) {
    // 1. If self-administered respondent mode or web link
    if (
      survey &&
      (survey.collectionMode === 'self_administered' ||
        (survey.collectors && survey.collectors.some((c) => c.id === this.activeCollectorId && c.type === 'weblink')))
    ) {
      return 'Self-Administered (Web Link)';
    }

    // 2. Currently authenticated staff member in AESession
    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    if (currentUser) {
      if (currentUser.role === 'admin') {
        return `${currentUser.fullName} (HQ Admin)`;
      } else if (currentUser.role === 'supervisor') {
        return `${currentUser.fullName} (Supervisor)`;
      } else {
        return `${currentUser.fullName} (${currentUser.id})`;
      }
    }

    // 3. User-customized enumerator in current session (if not the old hardcoded legacy default)
    if (this.enumeratorName && !this.isLegacyHardcodedDefault(this.enumeratorName)) {
      return this.enumeratorName;
    }

    // 4. Stored local operator preference
    const savedEnum = typeof localStorage !== 'undefined' ? localStorage.getItem('ae_active_enumerator') : null;
    if (savedEnum && !this.isLegacyHardcodedDefault(savedEnum)) {
      return savedEnum;
    }

    // 5. Collector-specific assignment if explicitly set and not legacy
    if (survey && window.aeStore) {
      const cols = window.aeStore.getCollectorsForSurvey(survey.id);
      const activeCol = cols.find((c) => c.id === this.activeCollectorId) || cols[0];
      if (activeCol && activeCol.enumeratorDefault && !this.isLegacyHardcodedDefault(activeCol.enumeratorDefault)) {
        return activeCol.enumeratorDefault;
      }
    }

    // 6. Settings default if customized
    const globalDefault = (window.aeStore && window.aeStore.settings) ? window.aeStore.settings.defaultEnumerator : null;
    if (globalDefault && !this.isLegacyHardcodedDefault(globalDefault)) {
      return globalDefault;
    }

    // 7. Dynamic lookup of first active enumerator in personnel
    if (window.aeStore && typeof window.aeStore.getPersonnel === 'function') {
      const activeEnums = window.aeStore.getPersonnel({ role: 'enumerator' }).filter((p) => p.active !== false);
      if (activeEnums.length > 0) {
        return `${activeEnums[0].fullName} (${activeEnums[0].id})`;
      }
    }

    return 'Unassigned Field Enumerator';
  },

  initRunnerForSurvey(survey, forceReset = false) {
    if (!survey) return;
    const cols = window.aeStore.getCollectorsForSurvey(survey.id);
    const defaultColId = cols.length > 0 ? cols[0].id : 'col_kiosk_rift';
    const resolvedEnum = this.resolveEnumeratorName(survey);

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
        this.enumeratorName =
          !savedDraft.enumeratorName || this.isLegacyHardcodedDefault(savedDraft.enumeratorName)
            ? resolvedEnum
            : savedDraft.enumeratorName;
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
    this.campaignMeta = this.parseCampaignAndPrefillParams(survey);
    if (forceReset) {
      window.aeStore.clearRunnerDraft(survey.id);
    }
    if (!cols.some((c) => c.id === this.activeCollectorId)) {
      this.activeCollectorId = defaultColId;
    }
    this.enumeratorName = resolvedEnum;
  },

  // --------------------------------------------------------------------------
  // FEATURE: URL PRE-FILL (?prefill_<qId>=...) & CAMPAIGN TRACKING (?utm_...)
  // --------------------------------------------------------------------------
  parseCampaignAndPrefillParams(survey) {
    const utm = {};
    if (typeof window === 'undefined' || !window.location || !window.location.search) return utm;
    try {
      const params = new URLSearchParams(window.location.search);
      const src = params.get('utm_source');
      const med = params.get('utm_medium');
      const cmp = params.get('utm_campaign');
      if (src) utm.source = src.trim().slice(0, 80);
      if (med) utm.medium = med.trim().slice(0, 80);
      if (cmp) utm.campaign = cmp.trim().slice(0, 100);

      const qIds = new Set(
        (window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
          ? window.aeStore.getQuestionsForSurvey(survey)
          : (survey?.pages || []).flatMap((p) => p.questions || [])
        ).map((q) => q.id)
      );

      params.forEach((val, key) => {
        if (key.startsWith('prefill_')) {
          const qId = key.slice('prefill_'.length);
          if (qId && qIds.has(qId) && val !== '' && this.draftAnswers[qId] === undefined) {
            this.draftAnswers[qId] = val;
          }
        }
      });
    } catch (e) {}
    return utm;
  },

  buildPrefilledCampaignUrl(surveyId, opts = {}) {
    const base = (typeof window !== 'undefined' && window.location)
      ? `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}field.html`
      : 'https://ae-survey.pages.dev/field.html';
    const params = new URLSearchParams();
    params.set('survey', String(surveyId || ''));
    params.set('mode', 'respondent');
    if (opts.utmSource) params.set('utm_source', String(opts.utmSource).trim());
    if (opts.utmCampaign) params.set('utm_campaign', String(opts.utmCampaign).trim());
    if (opts.prefillQId && opts.prefillValue) {
      params.set(`prefill_${String(opts.prefillQId).trim()}`, String(opts.prefillValue).trim());
    }
    return `${base}?${params.toString()}`;
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

  getSafeBrandLogo(survey) {
    const branding = survey && survey.branding && typeof survey.branding === 'object' ? survey.branding : null;
    if (!branding) return '';
    const dataUrl = typeof branding.logoDataUrl === 'string' ? branding.logoDataUrl.trim() : '';
    if (dataUrl && /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(dataUrl)) {
      return dataUrl;
    }
    if (dataUrl && /^data:image\//i.test(dataUrl) && !/^data:image\/svg/i.test(dataUrl)) {
      return dataUrl;
    }
    const logoUrl = typeof branding.logoUrl === 'string' ? branding.logoUrl.trim() : '';
    if (logoUrl && /^https:\/\/[^\s]+$/i.test(logoUrl)) {
      return logoUrl;
    }
    return '';
  },

  getSafeRedirectUrl(survey) {
    const branding = survey && survey.branding && typeof survey.branding === 'object' ? survey.branding : null;
    if (!branding || typeof branding.redirectUrl !== 'string') return '';
    const url = branding.redirectUrl.trim();
    return /^https:\/\/[^\s]+$/i.test(url) ? url : '';
  },

  recomputeCalculatedFields(survey = null, updateDomInPlace = true) {
    if (!window.AEFormulaEngine || typeof window.AEFormulaEngine.evaluateCalculatedFields !== 'function') return {};
    const targetSurvey =
      survey ||
      (window.aeStore && typeof window.aeStore.getSurveyById === 'function'
        ? window.aeStore.getSurveyById(this.activeSurveyId)
        : null);
    if (!targetSurvey) return {};

    const calculated = window.AEFormulaEngine.evaluateCalculatedFields(targetSurvey, this.draftAnswers);
    Object.entries(calculated).forEach(([qId, val]) => {
      if (val !== null && Number.isFinite(val)) {
        this.draftAnswers[qId] = val;
      } else {
        delete this.draftAnswers[qId];
      }
    });

    if (updateDomInPlace && typeof document !== 'undefined') {
      document.querySelectorAll('[data-calculated-for]').forEach((cardEl) => {
        const qId = cardEl.getAttribute('data-calculated-for');
        if (!Object.prototype.hasOwnProperty.call(calculated, qId)) return;
        const val = calculated[qId];
        const valueNode = cardEl.querySelector('[data-calculated-value]') || cardEl;
        valueNode.textContent = val !== null && Number.isFinite(val) ? val.toLocaleString() : '—';
      });
    }
    return calculated;
  },

  setRunnerAnswer(questionId, value) {
    this.draftAnswers[questionId] = value;
    delete this.validationErrors[questionId];
    this.recomputeCalculatedFields(null, false);
    this.persistDraft();
    if (window.AEApp && typeof window.AEApp.render === 'function') {
      window.AEApp.render();
    }
  },

  setRunnerAnswerSilent(questionId, value) {
    this.draftAnswers[questionId] = value;
    delete this.validationErrors[questionId];
    this.recomputeCalculatedFields(null, true);
    this.persistDraft();
  },

  renderUnavailableCard(survey, avail) {
    const brandLogo = this.getSafeBrandLogo(survey);
    const resolvedTheme = window.AEThemePresets ? window.AEThemePresets.resolve(survey && survey.theme) : null;
    const accent = (resolvedTheme && resolvedTheme.accentColor) || (survey && survey.theme && survey.theme.accentColor) || '#247B50';
    const headingFont = (resolvedTheme && resolvedTheme.headingFont) || '"Fraunces", Georgia, serif';
    const statusMap = {
      not_yet_open: { badge: 'Not Yet Open', icon: 'fa-clock', tone: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' },
      closed_date: { badge: 'Survey Closed', icon: 'fa-calendar-xmark', tone: 'bg-[#FFEDEA] text-[#831C1E] border-[#F5C2C0]' },
      quota_reached: { badge: 'Target Reached', icon: 'fa-users-check', tone: 'bg-[#DCFAE5] text-[#04250E] border-[#A7F3D0]' },
      archived: { badge: 'Survey Archived', icon: 'fa-box-archive', tone: 'bg-[#F4F6F4] text-[#525B56] border-[#CFD5D0]' }
    };
    const meta = statusMap[avail && avail.status] || {
      badge: 'Survey Unavailable',
      icon: 'fa-circle-info',
      tone: 'bg-[#F4F6F4] text-[#525B56] border-[#CFD5D0]'
    };
    const msg =
      (survey && survey.schedule && survey.schedule.closedMessage && String(survey.schedule.closedMessage).trim()) ||
      (avail && avail.reason) ||
      'This survey is currently unavailable.';

    return `
      <div class="max-w-lg mx-auto my-6 bg-white border border-[#E4E7E4] border-t-4 rounded-[12px] p-8 text-center space-y-5 shadow-sm"
        style="border-top-color:${accent};">
        <div class="flex flex-col items-center gap-3">
          ${
            brandLogo
              ? `<img src="${AEApp.escapeAttr(brandLogo)}" alt="${AEApp.escapeAttr((survey && survey.title) || 'Survey')} Logo" class="h-10 w-auto max-w-[180px] object-contain" />`
              : `<div class="w-12 h-12 rounded-full bg-[#F4F6F4] text-[#247B50] flex items-center justify-center text-xl">
                  <i class="fa-solid ${meta.icon}"></i>
                </div>`
          }
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.tone}">
            <i class="fa-solid ${meta.icon} text-[11px]"></i>
            <span>${AEApp.escapeHtml(meta.badge)}</span>
          </span>
        </div>

        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-[#111613] tracking-tight ae-break-words" style="font-family:${headingFont};">
            ${AEApp.escapeHtml((survey && survey.title) || 'Survey Unavailable')}
          </h2>
          <p class="text-sm text-[#525B56] leading-relaxed ae-break-words max-w-md mx-auto">
            ${AEApp.escapeHtml(msg)}
          </p>
        </div>

        ${
          avail && avail.maxResponses
            ? `<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#F8F9F8] border border-[#E4E7E4] text-xs text-[#525B56] tabular-nums">
                <span>Responses collected:</span>
                <strong class="text-[#111613]">${avail.count} / ${avail.maxResponses}</strong>
              </div>`
            : ''
        }
      </div>
    `;
  },

  renderCollectStage(survey) {
    if (!survey) return '<div class="p-8 text-center">No survey selected.</div>';

    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    if (window.aeStore && window.aeStore.canUserAccessSurvey) {
      const check = window.aeStore.canUserAccessSurvey(currentUser, survey.id);
      if (!check.allowed) {
        return `
          <div class="bg-white border-2 border-[#C4242A] rounded-[12px] p-8 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
            <div class="w-12 h-12 rounded-full bg-[#FFEDEA] text-[#C4242A] mx-auto flex items-center justify-center text-xl">
              <i class="fa-solid fa-lock"></i>
            </div>
            <div>
              <h2 class="text-base font-bold text-[#111613]">Access Restricted</h2>
              <p class="text-xs text-[#525B56] mt-1.5 leading-relaxed">
                ${AEApp.escapeHtml(check.reason)}
              </p>
            </div>
            <button onclick="AEApp.switchStage('dashboard')"
              class="h-9 px-4 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold ae-press">
              Return to Operations Dashboard
            </button>
          </div>
        `;
      }
    }

    if (!this.startedAtIso || this.activeSurveyId !== survey.id) {
      this.initRunnerForSurvey(survey, false);
    }

    // Always keep enumeratorName synchronized with the authenticated user unless deliberately overridden
    const resolvedExpectedEnum = this.resolveEnumeratorName(survey);
    if (!this.enumeratorName || this.isLegacyHardcodedDefault(this.enumeratorName)) {
      this.enumeratorName = resolvedExpectedEnum;
    } else if (currentUser) {
      const userExpected =
        currentUser.role === 'admin'
          ? `${currentUser.fullName} (HQ Admin)`
          : currentUser.role === 'supervisor'
          ? `${currentUser.fullName} (Supervisor)`
          : `${currentUser.fullName} (${currentUser.id})`;
      if (
        this.isLegacyHardcodedDefault(this.enumeratorName) ||
        (this.enumeratorName.includes('Grace Wanjiku') && currentUser.fullName !== 'Grace Wanjiku')
      ) {
        this.enumeratorName = userExpected;
      }
    }

    const allSurveys = window.aeStore.getSurveysForUser
      ? window.aeStore.getSurveysForUser(currentUser, { includeArchived: true })
      : window.aeStore.surveys || [];
    const collectors = window.aeStore.getCollectorsForSurvey(survey.id);
    const responses = window.aeStore.getResponsesForSurvey(survey.id, currentUser);
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
    if (!this.justSubmittedBanner && window.aeStore && typeof window.aeStore.getSurveyAvailability === 'function') {
      const avail = window.aeStore.getSurveyAvailability(rawSurvey);
      if (avail && !avail.open) {
        return this.renderUnavailableCard(rawSurvey, avail);
      }
    }

    const lang = (window.AEApp && window.AEApp.runnerLang) || (window.AEI18n ? window.AEI18n.getLanguage() : 'en');
    const survey = window.AEI18n ? window.AEI18n.localizeSurvey(rawSurvey, lang) : rawSurvey;
    const pages = survey.pages || [];
    if (this.currentPageIndex >= pages.length) this.currentPageIndex = 0;
    const page = pages[this.currentPageIndex];
    const progressPct = Math.round(((this.currentPageIndex + 1) / Math.max(1, pages.length)) * 100);
    const resolvedTheme = window.AEThemePresets ? window.AEThemePresets.resolve(survey.theme) : null;
    const accent = (resolvedTheme && resolvedTheme.accentColor) || (survey.theme && survey.theme.accentColor) || '#247B50';
    const headingFont = (resolvedTheme && resolvedTheme.headingFont) || '"Fraunces", Georgia, serif';
    const headerBg = accent === '#007A4B' || accent === '#247B50' ? '#1F6A45' : accent;
    const brandLogo = this.getSafeBrandLogo(rawSurvey);
    const safeRedirectUrl = this.getSafeRedirectUrl(rawSurvey);
    let customThankYouTitle =
      rawSurvey && rawSurvey.branding && rawSurvey.branding.thankYouTitle && String(rawSurvey.branding.thankYouTitle).trim()
        ? String(rawSurvey.branding.thankYouTitle).trim()
        : '';
    let customThankYouMsg =
      rawSurvey && rawSurvey.branding && rawSurvey.branding.thankYouMessage && String(rawSurvey.branding.thankYouMessage).trim()
        ? String(rawSurvey.branding.thankYouMessage).trim()
        : '';

    // Evaluate Conditional Thank-You Rule (Completion Workflow)
    if (this.justSubmittedBanner && rawSurvey && rawSurvey.completionWorkflow && rawSurvey.completionWorkflow.conditionalEnabled) {
      const cw = rawSurvey.completionWorkflow;
      const ans = this.justSubmittedBanner.submittedAnswers ? this.justSubmittedBanner.submittedAnswers[cw.condQuestionId] : undefined;
      if (ans !== undefined && ans !== null && ans !== '') {
        let matched = false;
        const op = cw.condOperator || 'equals';
        if (op === 'lte') {
          const n = Number(ans), t = Number(cw.condValue);
          matched = Number.isFinite(n) && Number.isFinite(t) && n <= t;
        } else if (op === 'gte') {
          const n = Number(ans), t = Number(cw.condValue);
          matched = Number.isFinite(n) && Number.isFinite(t) && n >= t;
        } else {
          matched = String(ans).trim().toLowerCase() === String(cw.condValue || '').trim().toLowerCase();
        }
        if (matched) {
          if (cw.condTitle) customThankYouTitle = cw.condTitle;
          if (cw.condMessage) customThankYouMsg = cw.condMessage;
        }
      }
    }

    // Check Stratified Sampling Quota Warning for currently selected draft answer
    let stratumWarningHtml = '';
    if (
      !this.justSubmittedBanner &&
      rawSurvey &&
      rawSurvey.stratifiedQuotas &&
      rawSurvey.stratifiedQuotas.enabled &&
      rawSurvey.stratifiedQuotas.warnWhenFull !== false &&
      rawSurvey.stratifiedQuotas.questionId &&
      window.AEAnalytics &&
      typeof window.AEAnalytics.computeStratifiedQuotas === 'function'
    ) {
      const sqId = rawSurvey.stratifiedQuotas.questionId;
      const picked = this.draftAnswers ? this.draftAnswers[sqId] : undefined;
      if (picked !== undefined && picked !== null && picked !== '') {
        const allResps = window.aeStore ? window.aeStore.getResponsesForSurvey(rawSurvey.id) : [];
        const qData = window.AEAnalytics.computeStratifiedQuotas(rawSurvey, allResps);
        if (qData) {
          const pickedVals = Array.isArray(picked) ? picked.map(String) : [String(picked)];
          const fullHit = qData.rows.find((r) => r.isFull && pickedVals.includes(r.option));
          if (fullHit) {
            stratumWarningHtml = `
              <div class="bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] px-4 py-2.5 flex items-center gap-2.5 text-xs text-[#92400E]">
                <i class="fa-solid fa-bullseye text-[#D97706]"></i>
                <span><strong>Quota reached for "${AEApp.escapeHtml(fullHit.option)}"</strong> (${fullHit.current}/${fullHit.target}). Consider prioritizing under-sampled groups.</span>
              </div>
            `;
          }
        }
      }
    }

    const allQuestions = window.aeStore.getQuestionsForSurvey(survey).filter((q) =>
      !window.AEPiping || typeof window.AEPiping.isQuestionVisible !== 'function'
        ? true
        : window.AEPiping.isQuestionVisible(q, this.draftAnswers, rawSurvey)
    );
    const answeredCount = allQuestions.filter((q) => {
      const v = this.draftAnswers[q.id];
      if (v === undefined || v === null || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true;
    }).length;

    return `
      <div class="max-w-3xl mx-auto space-y-4">
        ${stratumWarningHtml}
        ${
          this.justSubmittedBanner
            ? `<div class="bg-[#DCFAE5] border border-[#247B50]/30 rounded-[8px] p-4 space-y-2.5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <i class="fa-solid fa-circle-check text-[#247B50] text-base mt-0.5"></i>
                    <div class="min-w-0">
                      <div class="text-sm font-semibold text-[#04250E] ae-break-words">${AEApp.escapeHtml(customThankYouTitle || this.justSubmittedBanner.title)}</div>
                      <div class="text-xs text-[#04250E]/85 mt-0.5 ae-break-words">${AEApp.escapeHtml(customThankYouMsg || this.justSubmittedBanner.subtitle)}</div>
                      ${
                        this.justSubmittedBanner.autoRedirectUrl
                          ? `<div class="text-[11px] text-[#247B50] font-medium mt-1"><i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>Redirecting automatically in 3 seconds…</div>`
                          : ''
                      }
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 shrink-0">
                    ${
                      safeRedirectUrl
                        ? `<a href="${AEApp.escapeAttr(safeRedirectUrl)}" target="_blank" rel="noopener noreferrer"
                            class="h-8 px-3 rounded-[6px] bg-[#247B50] text-xs font-semibold text-white hover:bg-[#1F6A45] inline-flex items-center gap-1.5 ae-press">
                            Continue &rarr;
                          </a>`
                        : ''
                    }
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
            <span class="text-xs font-medium text-[#525B56]">Offline draft</span>
            <div class="flex items-center justify-between gap-2 text-xs font-medium text-[#04250E] bg-[#DCFAE5]/75 px-3 h-9 rounded-[6px] tabular-nums">
              <span class="inline-flex items-center gap-1.5 truncate">
                <span class="w-1.5 h-1.5 rounded-full bg-[#247B50] shrink-0"></span>
                <span class="truncate">${answeredCount > 0 ? `Saved · ${answeredCount} of ${allQuestions.length} answered` : 'Ready · auto-saves offline'}</span>
              </span>
              <span class="text-[11px] text-[#04250E]/75 shrink-0">Auto-save</span>
            </div>
          </div>
        </div>

        <!-- Respondent Survey Instrument Card -->
        <div class="bg-white border border-[#E4E7E4] rounded-[12px] overflow-hidden">
          <!-- Survey Header (The single place Fraunces editorial serif is used as a welcoming respondent greeting) -->
          <div class="p-7 sm:p-8 text-white" style="background-color: ${headerBg}">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div class="flex items-center gap-2.5">
                ${
                  brandLogo
                    ? `<img src="${AEApp.escapeAttr(brandLogo)}"
                        alt="${AEApp.escapeAttr(survey.title)} Logo"
                        class="h-8 w-auto max-w-[150px] object-contain rounded bg-white/95 px-1.5 py-0.5 shrink-0"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />`
                    : `<img src="./icons/agri_experience_logo.png"
                        alt="Agri Experience Logo"
                        class="h-7 w-auto max-w-[120px] object-contain rounded bg-white/10 px-1 py-0.5 shrink-0"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />`
                }
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
            <h2 class="text-[22px] sm:text-[26px] font-semibold tracking-tight text-white leading-snug ae-break-words" style="text-wrap: balance; font-family: ${headingFont};">
              ${AEApp.escapeHtml(survey.title)}
            </h2>
            ${
              survey.description
                ? `<p class="text-sm text-white/90 mt-2.5 max-w-2xl leading-relaxed ae-break-words" style="text-wrap: pretty;">${AEApp.escapeHtml(survey.description)}</p>`
                : ''
            }

            ${
              survey.theme?.showProgressBar !== false
                ? `<div class="mt-6 w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-[#3FC07A] h-full transition-transform duration-300 ease-out origin-left" style="transform: scaleX(${progressPct / 100})"></div>
                  </div>`
                : ''
            }
          </div>

          <!-- Current Page Title & Quick-Key Accelerator Hint -->
          <div class="bg-[#F8F9F8] px-6 sm:px-8 py-4 border-b border-[#EFEFEF] flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-[#111613] ae-break-words">${AEApp.escapeHtml(page.title)}</h3>
              ${
                page.description
                  ? `<p class="text-xs text-[#525B56] mt-1 leading-relaxed ae-break-words" style="text-wrap: pretty;">${AEApp.escapeHtml(page.description)}</p>`
                  : ''
              }
            </div>
            <div class="hidden sm:flex items-center gap-1.5 text-xs text-[#646E68] shrink-0" title="Enumerator keyboard shortcuts">
              <span>Shortcuts:</span>
              <span class="ae-kbd">1–9</span>
              <span>choose</span>
              <span>·</span>
              <span class="ae-kbd">Shift+Enter</span>
              <span>next</span>
            </div>
          </div>

          <!-- Questions Form Body -->
          <div class="p-6 sm:p-8 space-y-7">
            ${(() => {
              const pageQuestions = page.questions || [];
              const qNumMap = window.AEPiping && typeof window.AEPiping.computeQuestionDisplayNumbers === 'function'
                ? window.AEPiping.computeQuestionDisplayNumbers(pageQuestions)
                : {};
              const visibleQuestions = pageQuestions.filter((q) =>
                !window.AEPiping || typeof window.AEPiping.isQuestionVisible !== 'function'
                  ? true
                  : window.AEPiping.isQuestionVisible(q, this.draftAnswers, rawSurvey)
              );
              return visibleQuestions
                .map((q, idx) => this.renderRespondentQuestion(survey, q, idx, qNumMap))
                .join('');
            })()}
          </div>

          <!-- Navigation Footer -->
          <div class="px-6 sm:px-8 py-4 bg-[#F8F9F8] border-t border-[#EFEFEF] flex flex-wrap items-center justify-between gap-3">
            <div>
              ${
                this.currentPageIndex > 0
                  ? `<button onclick="AEApp.prevRunnerPage()"
                      class="h-10 px-4 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-2 ae-press">
                      <i class="fa-solid fa-arrow-left"></i> Previous page
                    </button>`
                  : `<button onclick="AEApp.resetRunnerDraft('${survey.id}')"
                      class="h-10 px-3 rounded-[6px] text-xs font-medium text-[#525B56] hover:text-[#111613]">
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
                      <span>${this.isSubmitting ? 'Saving…' : window.aeStore.isEffectivelyOnline() ? 'Submit response' : 'Save offline'}</span>
                    </button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderRespondentQuestion(survey, q, idx, qNumMap = {}) {
    const val = this.draftAnswers[q.id];
    const hasErr = this.validationErrors[q.id];
    const showNum = survey.theme?.showQuestionNumbers !== false;
    const pipedTitle = (window.AEPiping && typeof window.AEPiping.interpolate === 'function')
      ? window.AEPiping.interpolate(q.title, this.draftAnswers, survey)
      : q.title;
    const pipedHelp = (window.AEPiping && typeof window.AEPiping.interpolate === 'function')
      ? window.AEPiping.interpolate(q.helpText || '', this.draftAnswers, survey)
      : q.helpText;
    const numInfo = (qNumMap && qNumMap[q.id]) || { label: String(idx + 1), isSub: false };

    return `
      <div id="runner_q_${q.id}" class="space-y-3 pb-7 border-b border-[#EFEFEF] last:border-b-0 last:pb-0 ${
        q.parentQuestionId ? 'ml-3 sm:ml-6 border-l-[3px] border-l-[#247B50] pl-5 bg-[#FAFBF9] rounded-[8px] p-5' : ''
      }">
        <div class="flex items-start justify-between gap-3 min-w-0">
          <label for="runner_input_${q.id}" class="block text-[15px] sm:text-base font-semibold text-[#111613] leading-snug ae-break-words min-w-0 flex-1">
            ${showNum ? `<span class="tabular-nums text-xs font-semibold text-[#247B50] mr-1.5">Q${numInfo.label}.</span>` : ''}
            <span data-piped-title-for="${q.id}">${AEApp.escapeHtml(pipedTitle)}</span>
            ${q.parentQuestionId ? `<span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#DCFAE5]/80 text-[#04250E] ml-1.5">Part ${AEApp.escapeHtml(numInfo.letter || 'b')}</span>` : ''}
            ${q.required ? '<span class="text-[#C4242A] ml-1" title="Required">*</span>' : ''}
          </label>
          <div class="flex items-center gap-1.5 shrink-0">
            <button type="button" onclick="AEApp.speakQuestion('${q.id}')"
              title="Read question aloud"
              class="w-8 h-8 rounded-[6px] text-[#646E68] hover:text-[#247B50] hover:bg-[#F4F6F4] flex items-center justify-center text-xs shrink-0 ae-press"
              aria-label="Read Question Aloud">
              <i class="fa-solid fa-volume-high text-[12px]"></i>
            </button>
            ${
              q.logic && q.logic.enabled
                ? `<span class="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#92400E]">Branching</span>`
                : ''
            }
          </div>
        </div>

        ${
          q.helpText
            ? `<p data-piped-help-for="${q.id}" class="text-[13px] text-[#525B56] leading-relaxed ae-break-words ${pipedHelp ? '' : 'hidden'}" style="text-wrap: pretty;">${AEApp.escapeHtml(pipedHelp)}</p>`
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
        <div role="radiogroup" aria-label="${AEApp.escapeAttr(q.title)}" class="space-y-2">
          ${(q.options || [])
            .map((opt, optIdx) => {
              const checked = val === opt;
              return `
                <div role="radio"
                  aria-checked="${checked}"
                  tabindex="0"
                  onclick="AEApp.setRunnerAnswer('${q.id}', '${AEApp.escapeJs(opt)}')"
                  onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();AEApp.setRunnerAnswer('${q.id}', '${AEApp.escapeJs(opt)}');}"
                  class="flex items-center justify-between gap-3 px-4 py-3.5 rounded-[8px] border cursor-pointer ae-choice-press min-h-[46px] min-w-0 ${
                    checked
                      ? 'border-[#247B50] bg-[#DCFAE5]/45 text-[#111613] font-semibold'
                      : 'border-[#E4E7E4] bg-white hover:bg-[#F8F9F8] hover:border-[#CFD5D0] text-[#111613]'
                  }">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
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
        <div role="group" aria-label="${AEApp.escapeAttr(q.title)}" class="space-y-2">
          ${(q.options || [])
            .map((opt) => {
              const checked = selectedArr.includes(opt);
              return `
                <div role="checkbox"
                  aria-checked="${checked}"
                  tabindex="0"
                  onclick="AEApp.toggleRunnerCheckbox('${q.id}', '${AEApp.escapeJs(opt)}')"
                  onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();AEApp.toggleRunnerCheckbox('${q.id}', '${AEApp.escapeJs(opt)}');}"
                  class="flex items-center gap-3 px-4 py-3.5 rounded-[8px] border cursor-pointer ae-choice-press min-h-[46px] min-w-0 ${
                    checked
                      ? 'border-[#247B50] bg-[#DCFAE5]/45 text-[#111613] font-semibold'
                      : 'border-[#E4E7E4] bg-white hover:bg-[#F8F9F8] hover:border-[#CFD5D0] text-[#111613]'
                  }">
                  <span class="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
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
          class="w-full h-11 text-sm bg-white border border-[#CFD5D0] rounded-[8px] px-3.5 text-[#111613] focus:border-[#247B50] focus:ring-2 focus:ring-[#247B50]/15 focus:outline-none">
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
      const curLang = (window.AEApp && window.AEApp.runnerLang) || (window.AEI18n ? window.AEI18n.getLanguage() : 'en');
      const rawUnit = q.unit || 'units';
      const unitStr = (window.AEI18n && curLang !== 'en') ? window.AEI18n.translatePhrase(rawUnit, curLang) : rawUnit;
      const isKgAcre = rawUnit.toLowerCase().includes('kg');
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
          placeholder="${AEApp.escapeAttr(q.placeholder || 'Write your notes here…')}"
          class="w-full text-sm bg-white border border-[#CFD5D0] rounded-[8px] p-3.5 text-[#111613] leading-relaxed focus:border-[#247B50] focus:ring-2 focus:ring-[#247B50]/15 focus:outline-none">${AEApp.escapeHtml(val || '')}</textarea>
      `;
    }

    if (q.type === 'signature') {
      const hasSig = Boolean(val);
      return `
        <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4 space-y-2.5">
          <div class="flex items-center justify-between text-xs text-[#525B56]">
            <span>Digital consent signature / typed endorsement (Farmer / Agro-Dealer)</span>
            ${hasSig ? `<span class="text-[#247B50] font-medium"><i class="fa-solid fa-circle-check"></i> Signature saved</span>` : ''}
          </div>
          <div class="flex items-center gap-2">
            <input type="text"
              maxlength="120"
              value="${AEApp.escapeAttr(typeof val === 'string' && !val.startsWith('data:') ? val : (hasSig ? 'Signed Electronically' : ''))}"
              oninput="AEApp.setRunnerAnswerSilent('${q.id}', this.value)"
              placeholder="Type full name to sign electronically or open in Field App for touch canvas…"
              class="flex-1 h-9 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-3 text-[#111613] focus:border-[#247B50] focus:outline-none" />
            <button type="button" onclick="AEApp.setRunnerAnswer('${q.id}', 'Signed: ' + new Date().toISOString().slice(0, 10))"
              class="h-9 px-3 rounded-[6px] bg-[#247B50] text-white text-xs font-semibold ae-press shrink-0">
              <i class="fa-solid fa-signature mr-1"></i> Stamp Consent
            </button>
          </div>
        </div>
      `;
    }

    if (q.type === 'photo_proof') {
      const hasPhoto = Boolean(val && (val.dataUrl || val.summary || typeof val === 'string'));
      return `
        <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4 space-y-2.5">
          <div class="flex items-center justify-between text-xs text-[#525B56]">
            <span>Camera photo proof (Auto-compressed to &le;150KB JPEG)</span>
            ${hasPhoto ? `<span class="text-[#247B50] font-medium"><i class="fa-solid fa-circle-check"></i> Image attached</span>` : ''}
          </div>
          <div class="flex items-center justify-between gap-2 bg-white rounded-[6px] border border-[#CFD5D0] p-3">
            ${hasPhoto && val.dataUrl
              ? `<img src="${AEApp.escapeAttr(val.dataUrl)}" alt="Photo Proof" class="max-h-24 object-contain rounded-[4px]" />`
              : `<span class="text-xs text-[#525B56]"><i class="fa-solid fa-camera mr-1.5 text-[#247B50]"></i> ${hasPhoto ? 'Photo reference recorded' : 'Attach field photo or open in Field App'}</span>`}
            <button type="button" onclick="AEApp.setRunnerAnswer('${q.id}', { summary: 'Photo proof attached', sizeKb: 95, capturedAt: new Date().toISOString() })"
              class="h-8 px-3 rounded-[5px] border border-[#CFD5D0] bg-[#F8F9F8] hover:bg-[#EAECE9] text-xs font-medium text-[#111613] ae-press shrink-0">
              ${hasPhoto ? 'Update Photo' : 'Attach Sample Proof'}
            </button>
          </div>
        </div>
      `;
    }

    if (q.type === 'cascading_dropdown') {
      const levels = Array.isArray(q.levels) ? q.levels : ['County', 'Sub-County', 'Ward'];
      const curObj = val && typeof val === 'object' ? val : { level1: '', level2: '', level3: '' };
      const counties = ['Nakuru', 'Uasin Gishu', 'Trans Nzoia', 'Bungoma', 'Kakamega', 'Machakos', 'Meru', 'Kiambu', 'Kisumu', 'Nyeri'];
      return `
        <div class="p-3.5 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label class="block text-[11px] font-medium text-[#525B56] mb-1">${AEApp.escapeHtml(levels[0] || 'Level 1')}</label>
            <select onchange="AEApp.setRunnerAnswer('${q.id}', { level1: this.value, level2: '', level3: '' })"
              class="w-full h-9 rounded-[6px] border border-[#CFD5D0] bg-white px-2.5 text-xs text-[#111613]">
              <option value="">Select ${AEApp.escapeHtml(levels[0] || 'County')}…</option>
              ${counties.map((c) => `<option value="${AEApp.escapeAttr(c)}" ${curObj.level1 === c ? 'selected' : ''}>${AEApp.escapeHtml(c)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-medium text-[#525B56] mb-1">${AEApp.escapeHtml(levels[1] || 'Level 2')}</label>
            <input type="text" value="${AEApp.escapeAttr(curObj.level2 || '')}"
              placeholder="Enter ${AEApp.escapeAttr(levels[1] || 'Sub-County')}…"
              oninput="AEApp.setRunnerAnswerSilent('${q.id}', { level1: '${AEApp.escapeJs(curObj.level1 || '')}', level2: this.value, level3: '${AEApp.escapeJs(curObj.level3 || '')}' })"
              class="w-full h-9 rounded-[6px] border border-[#CFD5D0] bg-white px-2.5 text-xs text-[#111613]" />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-[#525B56] mb-1">${AEApp.escapeHtml(levels[2] || 'Level 3')}</label>
            <input type="text" value="${AEApp.escapeAttr(curObj.level3 || '')}"
              placeholder="Enter ${AEApp.escapeAttr(levels[2] || 'Ward')}…"
              oninput="AEApp.setRunnerAnswerSilent('${q.id}', { level1: '${AEApp.escapeJs(curObj.level1 || '')}', level2: '${AEApp.escapeJs(curObj.level2 || '')}', level3: this.value })"
              class="w-full h-9 rounded-[6px] border border-[#CFD5D0] bg-white px-2.5 text-xs text-[#111613]" />
          </div>
        </div>
      `;
    }

    if (q.type === 'barcode_scanner') {
      return `
        <div class="p-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] flex items-center gap-2">
          <i class="fa-solid fa-barcode text-[#247B50] text-sm shrink-0"></i>
          <input type="text" maxlength="120" value="${AEApp.escapeAttr(val || '')}"
            oninput="AEApp.setRunnerAnswerSilent('${q.id}', this.value)"
            placeholder="Scan or enter KEPHIS lot / barcode number (e.g., KEPHIS-LOT-2026-8841)…"
            class="flex-1 h-9 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-3 text-[#111613] font-mono focus:border-[#247B50] focus:outline-none" />
        </div>
      `;
    }

    if (q.type === 'audio_note') {
      const noteText = val && typeof val === 'object' ? (val.transcript || val.summary || '') : (val || '');
      return `
        <div class="p-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] space-y-2">
          <div class="flex items-center justify-between text-xs text-[#525B56]">
            <span><i class="fa-solid fa-microphone text-[#247B50] mr-1.5"></i> Farmer Voice Testimony / Summary Note</span>
            <button type="button" onclick="AEApp.setRunnerAnswer('${q.id}', { durationSec: 15, mimeType: 'audio/webm', summary: 'Audio note (15s)', capturedAt: new Date().toISOString() })"
              class="text-[#247B50] font-semibold hover:underline">Attach 15s Audio Clip</button>
          </div>
          <input type="text" maxlength="240" value="${AEApp.escapeAttr(noteText)}"
            oninput="AEApp.setRunnerAnswerSilent('${q.id}', { durationSec: 15, mimeType: 'audio/webm', transcript: this.value, summary: 'Audio note (15s)' })"
            placeholder="Optional testimony summary or transcript…"
            class="w-full h-9 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-3 text-[#111613] focus:border-[#247B50] focus:outline-none" />
        </div>
      `;
    }

    if (q.type === 'repeat_group') {
      const rows = Array.isArray(val) && val.length > 0 ? val : [{ item_1: '' }];
      const firstVal = rows[0] && typeof rows[0] === 'object' ? (Object.values(rows[0])[0] || '') : '';
      return `
        <div class="p-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] space-y-2">
          <div class="text-xs font-medium text-[#111613]"><i class="fa-solid fa-layer-group text-[#247B50] mr-1.5"></i> Multi-Item Inventory Roster Entry</div>
          <input type="text" maxlength="200" value="${AEApp.escapeAttr(firstVal)}"
            oninput="AEApp.setRunnerAnswerSilent('${q.id}', [{ variety_name: this.value }])"
            placeholder="Enter primary roster item (e.g., DH04 Hybrid — 40 packs @ KES 650)…"
            class="w-full h-9 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-3 text-[#111613] focus:border-[#247B50] focus:outline-none" />
        </div>
      `;
    }

    if (q.type === 'calculated') {
      const dec = q.decimals !== undefined && q.decimals !== null && q.decimals !== '' ? Number(q.decimals) : 2;
      const computed =
        val !== undefined && val !== null && val !== '' && Number.isFinite(Number(val))
          ? Number(val)
          : (window.AEFormulaEngine && typeof window.AEFormulaEngine.evaluateExpression === 'function'
              ? window.AEFormulaEngine.evaluateExpression(q.formula || '', this.draftAnswers, Number.isInteger(dec) ? dec : 2)
              : null);
      const displayVal = computed !== null && Number.isFinite(computed) ? computed.toLocaleString() : '—';
      const unitStr = q.unit ? String(q.unit).trim() : '';
      return `
        <div data-calculated-for="${AEApp.escapeAttr(q.id)}"
          class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-baseline gap-2 min-w-0">
            <span data-calculated-value class="text-2xl font-bold text-[#111613] tabular-nums leading-none">${AEApp.escapeHtml(displayVal)}</span>
            ${unitStr ? `<span class="text-xs font-semibold text-[#247B50] bg-[#DCFAE5] px-2 py-0.5 rounded-[4px]">${AEApp.escapeHtml(unitStr)}</span>` : ''}
          </div>
          <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#525B56] shrink-0">
            <i class="fa-solid fa-equals text-[#247B50] text-[10px]"></i>
            <span>Auto-calculated</span>
          </span>
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
        class="w-full h-11 text-sm bg-white border border-[#CFD5D0] rounded-[8px] px-3.5 text-[#111613] focus:border-[#247B50] focus:ring-2 focus:ring-[#247B50]/15 focus:outline-none" />
    `;
  },

  renderCollectorsManager(survey, collectors) {
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const respondentUrl = `${window.location.origin}${basePath}field.html?survey=${encodeURIComponent(survey.id)}&mode=respondent`;
    const enumeratorUrl = `${window.location.origin}${basePath}field.html?survey=${encodeURIComponent(survey.id)}`;
    const colMode = survey.collectionMode || 'hybrid';
    const allowsSelfAdmin = colMode !== 'enumerator';
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-white border border-[#E4E7E4] rounded-[8px] p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-base font-semibold text-[#111613]">Active Survey Collectors</h3>
              <p class="text-xs text-[#525B56]">Track responses by self-administered web link, enumerator team, or tablet kiosk</p>
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
                    placeholder="Collector name (e.g., WhatsApp Farmer Broadcast Link)…"
                    class="flex-1 min-w-[200px] h-8 rounded-[6px] border border-[#CFD5D0] bg-white px-2.5 text-xs text-[#111613] focus:outline-none focus:border-[#247B50]" />
                  <select id="ae_new_collector_type" aria-label="Collector channel type"
                    class="h-8 rounded-[6px] border border-[#CFD5D0] bg-white px-2 text-xs text-[#111613]">
                    <option value="weblink">Web Link (Self-Administered)</option>
                    <option value="kiosk">Tablet Kiosk (Enumerator)</option>
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
                    const colShareUrl = c.type === 'weblink'
                      ? `${window.location.origin}${basePath}field.html?survey=${encodeURIComponent(survey.id)}&collector=${encodeURIComponent(c.id)}&mode=respondent`
                      : `${window.location.origin}${basePath}field.html?survey=${encodeURIComponent(survey.id)}&collector=${encodeURIComponent(c.id)}`;
                    return `
                      <tr class="ae-row-hover">
                        <td class="py-3 pl-4 pr-3 max-w-xs">
                          <div class="font-semibold text-[#111613] text-sm ae-break-words">${AEApp.escapeHtml(c.name)}</div>
                          <div class="text-xs text-[#646E68] truncate"><code>${AEApp.escapeHtml(c.id)}</code> · ${AEApp.escapeHtml(c.type === 'weblink' ? 'Public Respondent Link' : (c.enumeratorDefault || 'Field Team'))}</div>
                        </td>
                        <td class="py-3 px-3 whitespace-nowrap">
                          <span class="px-2 py-0.5 rounded-[4px] ${c.type === 'weblink' ? 'bg-[#DCFAE5] text-[#04250E] font-medium' : 'bg-[#F8F9F8] border border-[#E4E7E4] text-[#525B56]'}">
                            ${c.type === 'kiosk' ? 'Tablet Kiosk' : 'Self-Administered Link'}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-right tabular-nums font-semibold text-sm text-[#111613]">
                          ${count}
                        </td>
                        <td class="py-3 pl-3 pr-4 text-right whitespace-nowrap space-x-1">
                          <button onclick="AEApp.copyText('${AEApp.escapeJs(colShareUrl)}', 'Collector link copied to clipboard.')"
                            class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] ae-press"
                            title="Copy direct link for this collector">
                            <i class="fa-regular fa-copy"></i> Copy Link
                          </button>
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

        <!-- Shareable Web Link, Offline QR Poster & Stakeholder Live Results Column -->
        <div class="lg:col-span-5 space-y-4">
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="text-base font-semibold text-[#111613]">Self-Administered &amp; Field Links</h3>
              <p class="text-xs text-[#525B56]">Send links directly to targeted respondents (no login required) or deploy to field enumerators</p>
            </div>
            <span class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold shrink-0 ${
              allowsSelfAdmin ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#FFFBEB] text-[#92400E]'
            }">
              ${allowsSelfAdmin ? 'Public Link Active' : 'Enumerator Only'}
            </span>
          </div>

          <!-- Collection Mode Selector -->
          <div class="p-3 rounded-[6px] bg-[#F8F9F8] border border-[#E4E7E4] space-y-1.5">
            <label for="ae_col_mode_select" class="block text-xs font-semibold text-[#111613]">Survey Administration Mode</label>
            <select id="ae_col_mode_select"
              onchange="AEApp.updateSurveyMeta('collectionMode', this.value)"
              class="w-full h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]">
              <option value="hybrid" ${colMode === 'hybrid' ? 'selected' : ''}>Hybrid — Self-Administered Link + Assigned Enumerators</option>
              <option value="self_administered" ${colMode === 'self_administered' ? 'selected' : ''}>Self-Administered Only — Public Respondent Link (No Login)</option>
              <option value="enumerator" ${colMode === 'enumerator' ? 'selected' : ''}>Enumerator-Assisted Only — Strictly Authenticated Staff</option>
            </select>
          </div>

          <!-- 1. Self-Administered Respondent Link -->
          ${allowsSelfAdmin ? `
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-[#111613] flex items-center gap-1.5">
                <i class="fa-solid fa-earth-africa text-[#247B50]"></i>
                <span>Self-Administered Respondent Link</span>
              </span>
              <a href="${AEApp.escapeAttr(respondentUrl)}" target="_blank" rel="noopener"
                class="text-[#247B50] hover:underline font-medium inline-flex items-center gap-1">
                <span>Test Link</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </a>
            </div>
            <p class="text-[11px] text-[#525B56]">Zero login required. Share via WhatsApp, SMS, or Email with targeted respondents.</p>
            <div class="flex items-center">
              <input type="text" aria-label="Self-Administered Respondent URL" readonly value="${AEApp.escapeAttr(respondentUrl)}"
                class="flex-1 min-w-0 h-9 text-xs bg-[#F8F9F8] border border-[#CFD5D0] rounded-l-[6px] px-3 text-[#111613] focus:outline-none" />
              <button onclick="AEApp.copyText('${AEApp.escapeJs(respondentUrl)}', 'Self-Administered Respondent Link copied to clipboard.')"
                class="h-9 px-3.5 rounded-r-[6px] bg-[#247B50] text-white text-xs font-semibold hover:bg-[#1F6A45] border border-l-0 border-[#247B50] ae-press shrink-0">
                <i class="fa-regular fa-copy mr-1"></i> Copy Link
              </button>
            </div>
          </div>
          ` : `
          <div class="p-3 rounded-[6px] bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-2">
            <div class="font-semibold flex items-center gap-1.5">
              <i class="fa-solid fa-lock text-[11px]"></i>
              <span>Public Respondent Links Disabled (Enumerator-Only Mode)</span>
            </div>
            <p class="text-[11px] leading-relaxed">This survey currently requires authenticated field staff. Switch Administration Mode above to <strong>Hybrid</strong> or <strong>Self-Administered</strong> to enable public respondent links.</p>
          </div>
          `}

          <!-- 2. Field Enumerator Link -->
          <div class="space-y-1.5 pt-2 border-t border-[#EFEFEF]">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-[#111613] flex items-center gap-1.5">
                <i class="fa-solid fa-tablet-screen-button text-[#525B56]"></i>
                <span>Field Enumerator App Link</span>
              </span>
              <span class="text-[11px] text-[#646E68]">Requires staff assignment</span>
            </div>
            <div class="flex items-center">
              <input type="text" aria-label="Field Enumerator Share URL" readonly value="${AEApp.escapeAttr(enumeratorUrl)}"
                class="flex-1 min-w-0 h-8 text-xs bg-[#F8F9F8] border border-[#CFD5D0] rounded-l-[6px] px-3 text-[#525B56] focus:outline-none" />
              <button onclick="AEApp.copyText('${AEApp.escapeJs(enumeratorUrl)}', 'Field Enumerator Link copied to clipboard.')"
                class="h-8 px-3 rounded-r-[6px] bg-[#141A17] text-white text-xs font-medium hover:bg-[#232C27] border border-l-0 border-[#141A17] ae-press shrink-0">
                <i class="fa-regular fa-copy mr-1"></i> Copy
              </button>
            </div>
          </div>

          <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-5 flex flex-col items-center justify-center text-center">
            <canvas id="ae_qr_canvas" width="220" height="220" class="bg-white p-2 rounded-[6px] border border-[#E4E7E4]" role="img" aria-label="QR Code for ${AEApp.escapeAttr(survey.title)}"></canvas>
            <div class="text-xs font-semibold text-[#111613] mt-3 ae-break-words">${AEApp.escapeHtml(survey.title)}</div>
            <div class="text-xs text-[#646E68] mt-0.5">Scan QR to open ${allowsSelfAdmin ? 'Self-Administered Survey' : 'Field Enumerator App'} · ID: <code>${survey.id}</code></div>
            <div class="mt-3.5 w-full flex flex-wrap items-center justify-center gap-2">
              <button type="button" onclick="AECollector.shareViaWhatsApp('${AEApp.escapeJs(survey.id)}')"
                class="flex-1 min-w-[135px] h-8 px-3 rounded-[6px] bg-[#25D366] hover:bg-[#1FB858] text-[#04250E] text-xs font-semibold inline-flex items-center justify-center gap-1.5 ae-press">
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>Share via WhatsApp</span>
              </button>
              <button type="button" onclick="AECollector.printQRPoster('${AEApp.escapeJs(survey.id)}')"
                class="flex-1 min-w-[135px] h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#111613] text-xs font-medium inline-flex items-center justify-center gap-1.5 ae-press">
                <i class="fa-solid fa-print text-[#247B50] text-xs"></i>
                <span>Print A4 QR Poster</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Pre-Filled & Campaign Link Builder (?prefill_ & ?utm_) -->
        ${(() => {
          const allQs = window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
            ? window.aeStore.getQuestionsForSurvey(survey)
            : [];
          const prefillQs = allQs.filter((q) => ['multiple_choice', 'dropdown', 'short_text'].includes(q.type));
          const safeSid = AEApp.escapeJs(survey.id);
          return `
            <div class="bg-[#FAFBF9] border border-[#E4E7E4] rounded-[8px] p-4 space-y-3 text-xs">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-[#111613] flex items-center gap-1.5">
                  <i class="fa-solid fa-link text-[#247B50]"></i> Pre-Filled &amp; Campaign Link Builder
                </span>
                <span class="text-[11px] text-[#646E68]">Track channel (<code>utm_source</code>) &amp; pre-populate answers</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select id="ae_pf_utm_src" class="h-8 px-2 bg-white border border-[#CFD5D0] rounded-[5px] text-xs text-[#111613]">
                  <option value="whatsapp">Channel: WhatsApp</option>
                  <option value="sms">Channel: SMS</option>
                  <option value="email">Channel: Email</option>
                  <option value="poster">Channel: QR Poster</option>
                  <option value="field">Channel: Field Team</option>
                </select>
                <input id="ae_pf_utm_cmp" type="text" placeholder="Campaign (e.g. rift_q4)"
                  class="h-8 px-2.5 bg-white border border-[#CFD5D0] rounded-[5px] text-xs text-[#111613]" />
                <select id="ae_pf_qid" class="h-8 px-2 bg-white border border-[#CFD5D0] rounded-[5px] text-xs text-[#111613]">
                  <option value="">Optional pre-fill question…</option>
                  ${prefillQs.map((q) => `<option value="${AEApp.escapeAttr(q.id)}">${AEApp.escapeHtml((q.title || q.id).slice(0, 38))}</option>`).join('')}
                </select>
                <input id="ae_pf_val" type="text" placeholder="Pre-fill value (e.g. Nakuru)"
                  class="h-8 px-2.5 bg-white border border-[#CFD5D0] rounded-[5px] text-xs text-[#111613]" />
              </div>
              <div class="flex items-center justify-end">
                <button type="button" onclick="AEApp.copyText(AECollector.buildPrefilledCampaignUrl('${safeSid}', { utmSource: document.getElementById('ae_pf_utm_src')?.value, utmCampaign: document.getElementById('ae_pf_utm_cmp')?.value, prefillQId: document.getElementById('ae_pf_qid')?.value, prefillValue: document.getElementById('ae_pf_val')?.value }), 'Pre-filled campaign link copied!')"
                  class="h-7 px-3 rounded-[5px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center gap-1.5 ae-press">
                  <i class="fa-regular fa-copy text-[11px]"></i> Copy Tracked &amp; Pre-Filled Link
                </button>
              </div>
            </div>
          `;
        })()}

        ${(() => {
          const curUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
            ? window.AESession.getCurrentUser()
            : null;
          const isAdmin = Boolean(curUser && curUser.role === 'admin');
          if (!isAdmin) return '';
          const inviteTokens = (survey.accessControl && Array.isArray(survey.accessControl.inviteTokens))
            ? survey.accessControl.inviteTokens
            : [];
          const unusedTokens = inviteTokens.filter((t) => t && !t.used);
          const recentTokens = inviteTokens.slice(-5).reverse();
          return `
            <!-- Admin-only Single-Use Invite Links Card -->
            <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-4 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h4 class="text-sm font-semibold text-[#111613] flex items-center gap-1.5">
                    <i class="fa-solid fa-ticket text-[#247B50] text-xs"></i>
                    <span>Single-Use Invite Links</span>
                  </h4>
                  <p class="text-[11px] text-[#525B56] mt-1 leading-relaxed">
                    Generate one-time respondent links that automatically expire after submission.
                  </p>
                </div>
                <span class="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold tabular-nums shrink-0 ${
                  unusedTokens.length > 0 ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#F4F6F4] text-[#525B56]'
                }">
                  ${unusedTokens.length} unused / ${inviteTokens.length}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button type="button" onclick="AEApp.generateSurveyInvites('${AEApp.escapeJs(survey.id)}', 5)"
                  class="h-8 px-3 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center gap-1.5 ae-press">
                  <i class="fa-solid fa-plus text-[10px]"></i>
                  <span>Generate 5</span>
                </button>
                <button type="button" onclick="AEApp.generateSurveyInvites('${AEApp.escapeJs(survey.id)}', 10)"
                  class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[#111613] text-xs font-medium inline-flex items-center gap-1.5 ae-press">
                  <i class="fa-solid fa-layer-group text-[10px] text-[#247B50]"></i>
                  <span>Generate 10</span>
                </button>
                <button type="button" onclick="AECollector.copyUnusedInviteLinks('${AEApp.escapeJs(survey.id)}')"
                  ${unusedTokens.length === 0 ? 'disabled' : ''}
                  class="flex-1 min-w-[140px] h-8 px-3 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 ae-press">
                  <i class="fa-regular fa-copy text-[11px]"></i>
                  <span>Copy All Unused (${unusedTokens.length})</span>
                </button>
              </div>

              ${recentTokens.length > 0 ? `
                <div class="border border-[#EFEFEF] rounded-[6px] divide-y divide-[#EFEFEF] bg-[#FAFBF9]">
                  ${recentTokens.map((t) => {
                    const invUrl = `${respondentUrl}&invite=${encodeURIComponent(t.token)}`;
                    return `
                      <div class="px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                        <div class="flex items-center gap-2 min-w-0">
                          <code class="text-[#111613] font-mono truncate">${AEApp.escapeHtml(t.token)}</code>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                            t.used ? 'bg-[#F4F6F4] text-[#646E68]' : 'bg-[#DCFAE5] text-[#04250E]'
                          }">${t.used ? 'Used' : 'Unused'}</span>
                        </div>
                        ${!t.used ? `
                          <button type="button" onclick="AEApp.copyText('${AEApp.escapeJs(invUrl)}', 'Invite link copied to clipboard.')"
                            class="text-[#247B50] hover:underline font-medium shrink-0">
                            Copy
                          </button>
                        ` : `<span class="text-[10px] text-[#646E68] shrink-0">${t.usedAt ? new Date(t.usedAt).toLocaleDateString() : 'Redeemed'}</span>`}
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          `;
        })()}

        <!-- Stakeholder Read-Only Live Results Link Card -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-4 space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h4 class="text-sm font-semibold text-[#111613] flex items-center gap-1.5">
                <i class="fa-solid fa-chart-pie text-[#247B50] text-xs"></i>
                <span>Stakeholder Read-Only Live Results Link</span>
              </h4>
              <p class="text-[11px] text-[#525B56] mt-1 leading-relaxed">
                Share aggregated charts, KPIs, and qualitative themes with stakeholders with zero respondent PII, names, or raw GPS exposed.
              </p>
            </div>
            <span class="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#DCFAE5] text-[#04250E] shrink-0">
              Zero PII
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" onclick="AEApp.copyLiveReportLink('${AEApp.escapeJs(survey.id)}')"
              class="flex-1 min-w-[140px] h-8 px-3 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 ae-press">
              <i class="fa-regular fa-copy text-[11px]"></i>
              <span>Copy Live Results Link</span>
            </button>
            <button type="button" onclick="AEApp.openLiveReport('${AEApp.escapeJs(survey.id)}')"
              class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[#111613] text-xs font-medium inline-flex items-center justify-center gap-1.5 ae-press">
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-[#247B50]"></i>
              <span>Open Live Report</span>
            </button>
          </div>
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

  getSurveyShareUrl(survey) {
    if (!survey || !survey.id) return '';
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
      ? window.location.origin
      : 'https://ae-survey.local';
    const pathname = (typeof window !== 'undefined' && window.location && window.location.pathname)
      ? window.location.pathname
      : '/';
    const basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    const colMode = survey.collectionMode || 'hybrid';
    const allowsSelfAdmin = colMode !== 'enumerator';
    return allowsSelfAdmin
      ? `${origin}${basePath}field.html?survey=${encodeURIComponent(survey.id)}&mode=respondent`
      : `${origin}${basePath}field.html?survey=${encodeURIComponent(survey.id)}`;
  },

  buildWhatsAppShareUrl(survey, shareUrl) {
    if (!survey) return 'https://wa.me/';
    const url = shareUrl || this.getSurveyShareUrl(survey);
    const questions = (window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function')
      ? window.aeStore.getQuestionsForSurvey(survey)
      : (survey.pages || []).flatMap((p) => p.questions || []);
    const qCount = questions.length;
    const estMin = Math.max(1, Math.ceil(qCount * 0.4));
    const lines = [
      `You are invited to complete: *${survey.title || 'AE Survey'}*`,
      `Estimated time: ~${estMin} min`,
      '',
      `Open survey: ${url}`
    ];
    return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
  },

  shareViaWhatsApp(surveyId) {
    const survey = window.aeStore && typeof window.aeStore.getSurveyById === 'function'
      ? window.aeStore.getSurveyById(surveyId)
      : null;
    if (!survey) return null;
    const shareUrl = this.getSurveyShareUrl(survey);
    const waUrl = this.buildWhatsAppShareUrl(survey, shareUrl);
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
    return waUrl;
  },

  buildQRPosterHTML(survey, shareUrl) {
    const esc = (str) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const url = shareUrl || this.getSurveyShareUrl(survey);
    const title = (survey && survey.title) || 'AE Survey';
    const description = (survey && survey.description) || '';
    const category = (survey && survey.category) || 'Field Survey';
    const resolvedTheme = window.AEThemePresets ? window.AEThemePresets.resolve(survey && survey.theme) : null;
    const accent = (resolvedTheme && resolvedTheme.accentColor) || (survey && survey.theme && survey.theme.accentColor) || '#247B50';
    const brandLogo = this.getSafeBrandLogo(survey);

    let qrDataUrl = '';
    try {
      if (typeof document !== 'undefined' && window.AEQRCode && typeof window.AEQRCode.drawToCanvas === 'function') {
        const offscreen = document.createElement('canvas');
        offscreen.width = 420;
        offscreen.height = 420;
        window.AEQRCode.drawToCanvas(offscreen, url, {
          margin: 4,
          foreground: '#111613',
          background: '#FFFFFF',
          level: String(url || '').length > 150 ? 'L' : 'M'
        });
        if (typeof offscreen.toDataURL === 'function') {
          qrDataUrl = offscreen.toDataURL('image/png');
        }
      }
    } catch (_) {
      qrDataUrl = '';
    }

    const displayUrl = String(url || '').replace(/^https?:\/\//i, '');
    const logoHtml = brandLogo
      ? `<img src="${esc(brandLogo)}" alt="${esc(title)} Logo" class="poster-logo" />`
      : `<img src="./icons/agri_experience_logo.png" alt="Agri Experience Logo" class="poster-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" /><span class="poster-logo-fallback">Agri Experience · AE Survey</span>`;

    const qrBlockHtml = qrDataUrl
      ? `<img src="${esc(qrDataUrl)}" width="420" height="420" alt="QR Code for ${esc(title)}" class="qr-img" />`
      : `<canvas id="ae_poster_qr_canvas" width="420" height="420" class="qr-img" role="img" aria-label="QR Code for ${esc(title)}"></canvas>
         <script>
           (function() {
             try {
               var c = document.getElementById('ae_poster_qr_canvas');
               if (c && window.opener && window.opener.AEQRCode && typeof window.opener.AEQRCode.drawToCanvas === 'function') {
                 window.opener.AEQRCode.drawToCanvas(c, ${JSON.stringify(String(url || ''))}, { margin: 4, foreground: '#111613', background: '#FFFFFF', level: ${String(url || '').length > 150 ? "'L'" : "'M'"} });
               }
             } catch (e) {}
           })();
         <\/script>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QR Poster — ${esc(title)}</title>
  <style>
    @page { size: A4 portrait; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      color: #111613;
      background: #F4F6F4;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .no-print {
      width: 100%;
      max-width: 720px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 16px;
    }
    .btn {
      padding: 10px 18px;
      border-radius: 8px;
      border: 1px solid #CFD5D0;
      background: #FFFFFF;
      color: #111613;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary {
      background: ${esc(accent)};
      border-color: ${esc(accent)};
      color: #FFFFFF;
    }
    .poster {
      width: 100%;
      max-width: 720px;
      background: #FFFFFF;
      border: 1px solid #E4E7E4;
      border-top: 10px solid ${esc(accent)};
      border-radius: 16px;
      padding: 44px 40px 36px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(17, 22, 19, 0.06);
    }
    .poster-logo {
      max-height: 60px;
      max-width: 240px;
      object-fit: contain;
      margin: 0 auto 14px;
      display: block;
    }
    .poster-logo-fallback {
      display: none;
      align-items: center;
      justify-content: center;
      padding: 6px 14px;
      border-radius: 6px;
      background: #DCFAE5;
      color: #04250E;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 14px;
    }
    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 999px;
      background: #F4F6F4;
      color: #247B50;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 12px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 32px;
      line-height: 1.2;
      color: #111613;
    }
    .desc {
      margin: 0 auto 28px;
      max-width: 560px;
      font-size: 15px;
      line-height: 1.55;
      color: #525B56;
    }
    .qr-frame {
      display: inline-block;
      padding: 18px;
      border: 2px solid #E4E7E4;
      border-radius: 16px;
      background: #FFFFFF;
      margin-bottom: 24px;
    }
    .qr-img {
      width: 420px;
      height: 420px;
      max-width: 100%;
      height: auto;
      display: block;
    }
    .scan-cta {
      font-size: 20px;
      font-weight: 700;
      color: #111613;
      margin: 0 0 10px;
    }
    .url-box {
      display: inline-block;
      padding: 10px 16px;
      border-radius: 8px;
      background: #F8F9F8;
      border: 1px solid #E4E7E4;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      color: #525B56;
      word-break: break-all;
      max-width: 100%;
    }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .no-print { display: none !important; }
      .poster { box-shadow: none; border: 1px solid #E4E7E4; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button type="button" class="btn btn-primary" onclick="window.print()">Print / Save A4 PDF</button>
    <button type="button" class="btn" onclick="window.close()">Close</button>
  </div>
  <main class="poster">
    ${logoHtml}
    <div class="badge">${esc(category)}</div>
    <h1>${esc(title)}</h1>
    ${description ? `<p class="desc">${esc(description)}</p>` : ''}
    <div class="qr-frame">
      ${qrBlockHtml}
    </div>
    <p class="scan-cta">Scan with your phone camera to begin</p>
    <div class="url-box">${esc(displayUrl)}</div>
  </main>
</body>
</html>`;
  },

  printQRPoster(surveyId) {
    const survey = window.aeStore && typeof window.aeStore.getSurveyById === 'function'
      ? window.aeStore.getSurveyById(surveyId)
      : null;
    if (!survey) return null;
    const shareUrl = this.getSurveyShareUrl(survey);
    const html = this.buildQRPosterHTML(survey, shareUrl);
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      const win = window.open('', '_blank', 'width=860,height=1040');
      if (win && win.document) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        setTimeout(() => {
          try { win.focus(); win.print(); } catch (_) {}
        }, 300);
      } else if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        window.AEApp.showToast('Pop-up blocked — allow pop-ups to print the A4 QR Poster.', 'warning');
      }
    }
    return html;
  },

  copyUnusedInviteLinks(surveyId) {
    const survey = window.aeStore && typeof window.aeStore.getSurveyById === 'function'
      ? window.aeStore.getSurveyById(surveyId)
      : null;
    if (!survey) return '';
    const tokens = (survey.accessControl && Array.isArray(survey.accessControl.inviteTokens))
      ? survey.accessControl.inviteTokens.filter((t) => t && !t.used)
      : [];
    if (tokens.length === 0) {
      if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        window.AEApp.showToast('No unused invite links available. Generate a batch first.', 'warning');
      }
      return '';
    }
    const baseUrl = this.getSurveyShareUrl(survey);
    const sep = baseUrl.includes('?') ? '&' : '?';
    const text = tokens.map((t) => `${baseUrl}${sep}invite=${encodeURIComponent(t.token)}`).join('\n');
    if (window.AEApp && typeof window.AEApp.copyText === 'function') {
      window.AEApp.copyText(text, `Copied ${tokens.length} unused single-use invite links.`);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    return text;
  },

  drawQRCode(text) {
    const canvas = document.getElementById('ae_qr_canvas');
    if (!canvas) return;
    if (window.AEQRCode && typeof window.AEQRCode.drawToCanvas === 'function') {
      try {
        window.AEQRCode.drawToCanvas(canvas, text, {
          margin: 4,
          foreground: '#000000',
          background: '#FFFFFF',
          level: String(text || '').length > 150 ? 'L' : 'M'
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
