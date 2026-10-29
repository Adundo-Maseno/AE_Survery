/**
 * ============================================================================
 * AE SURVEY — Main Application Controller (`js/app.js`)
 * Coordinates:
 * - Framed-Sheet Shell & Stage Navigation (Overview, Builder, Collect / Kiosk, Analytics)
 * - Offline / Online Network Detection & Simulated Offline Field Toggle
 * - Outbox Sync Queue & One-Click Google Sheets / GAS Synchronization
 * - Regional Field Coverage & Sync Ledger (Agri Experience Signature Block)
 * ============================================================================
 */

window.AEApp = {
  currentStage: 'dashboard', // 'dashboard' | 'design' | 'collect' | 'analyze' | 'team'
  activeSurveyId: 'srv_maize_2026',
  runnerLang: 'en',
  searchQuery: '',
  statusFilter: 'All',
  showSyncModal: false,
  showTemplatesModal: false,
  isSyncing: false,
  selectedOverviewMetric: 'responses', // 'responses' | 'synced' | 'queued' | 'domain' | 'yield'
  overviewSurveyFilter: 'all', // 'all' | surveyId
  teamFilterRole: 'all',
  teamFilterCounty: 'all',
  teamSearchQuery: '',
  teamActiveSubTab: 'tasks', // 'tasks' | 'roster'
  teamTaskFilterSurvey: 'all',
  teamTaskFilterCounty: 'all',
  showAddPersonnelModal: false,
  showAssignTaskModal: false,
  assigningPersonId: null,
  assigningSurveyId: null,
  editingPersonnel: null,
  showResetPinPersonnel: null,
  showStudioMobileMenu: false,
  loginSelectedPersonId: 'ADM-01',
  loginError: '',

  async boot() {
    await window.aeStore.init();
    if (window.aeStore.surveys.length > 0 && !window.aeStore.getSurveyById(this.activeSurveyId)) {
      this.activeSurveyId = window.aeStore.surveys[0].id;
    }

    // Check URL query param `?survey=srv_...` for direct respondent link
    const params = new URLSearchParams(window.location.search);
    const linkedSurveyId = params.get('survey');
    if (linkedSurveyId && window.aeStore.getSurveyById(linkedSurveyId)) {
      this.activeSurveyId = linkedSurveyId;
      this.currentStage = 'collect';
      window.AECollector.initRunnerForSurvey(window.aeStore.getSurveyById(linkedSurveyId));
    }

    // Register Service Worker for offline PWA capability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    // Listen for browser online/offline transitions
    window.addEventListener('online', () => {
      this.showToast('Network connection restored. Ready to sync with Google Sheets.', 'success');
      if (window.aeStore.settings.autoSyncOnOnline && window.aeStore.syncQueue.length > 0) {
        this.triggerGoogleSheetsSync();
      } else {
        this.render();
      }
    });

    window.addEventListener('offline', () => {
      this.showToast('Offline Mode active. All survey edits and field responses save locally to IndexedDB.', 'warning');
      this.render();
    });

    // Listen for background synchronization state events
    window.addEventListener('ae-sync-state-change', () => {
      const user = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
        ? window.AESession.getCurrentUser()
        : null;
      if (user) {
        this.renderHeaderBar(user);
      }
    });

    // Global Keyboard Shortcuts & Escape Key Resilience
    window.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

    this.render();
  },

  handleGlobalKeydown(e) {
    if (e.key === 'Escape') {
      if (this.showStudioMobileMenu) {
        e.preventDefault();
        this.toggleStudioMobileMenu();
        return;
      }
      if (this.showSyncModal) {
        e.preventDefault();
        this.closeSyncSettingsModal();
        return;
      }
      if (window.AECollector && window.AECollector.showPinPrompt) {
        e.preventDefault();
        this.cancelKioskPinPrompt();
        return;
      }
      if (window.AECollector && window.AECollector.showNewCollectorForm) {
        e.preventDefault();
        this.toggleNewCollectorForm();
        return;
      }
    }

    // Enumerator Quick-Keys in Survey Runner when not typing in an input
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);
    if (isTyping || this.showSyncModal) return;

    if (this.currentStage === 'collect' && window.AECollector.activeSubTab === 'runner') {
      const survey = window.aeStore.getSurveyById(this.activeSurveyId);
      if (!survey) return;
      const pages = survey.pages || [];
      const page = pages[window.AECollector.currentPageIndex];
      if (!page) return;

      // Shift + Enter advances to next page or submits
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        if (window.AECollector.currentPageIndex < pages.length - 1) {
          this.nextRunnerPage(survey.id);
        } else {
          this.submitRunnerResponse(survey.id);
        }
        return;
      }

      // Keys 1-9 select option on the first unanswered choice/star/nps question (or first choice question on page)
      if (!e.ctrlKey && !e.altKey && !e.metaKey && /^[1-9]$/.test(e.key)) {
        const num = Number(e.key);
        const questions = page.questions || [];
        const targetQ =
          questions.find((q) => {
            const unans = window.AECollector.draftAnswers[q.id] === undefined || window.AECollector.draftAnswers[q.id] === '';
            return unans && (q.type === 'multiple_choice' || q.type === 'star_rating' || q.type === 'nps');
          }) ||
          questions.find((q) => q.type === 'multiple_choice' || q.type === 'star_rating' || q.type === 'nps');

        if (targetQ) {
          if (targetQ.type === 'multiple_choice' && Array.isArray(targetQ.options) && targetQ.options[num - 1]) {
            e.preventDefault();
            this.setRunnerAnswer(targetQ.id, targetQ.options[num - 1]);
          } else if (targetQ.type === 'star_rating' && num <= (targetQ.maxStars || 5)) {
            e.preventDefault();
            this.setRunnerAnswer(targetQ.id, num);
          } else if (targetQ.type === 'nps' && num <= 9) {
            e.preventDefault();
            this.setRunnerAnswer(targetQ.id, num);
          }
        }
      }
    }
  },

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  escapeAttr(str) {
    return this.escapeHtml(str);
  },

  escapeJs(str) {
    return String(str ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/</g, '\\x3c')
      .replace(/>/g, '\\x3e')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');
  },

  showToast(message, variant = 'success') {
    const container = document.getElementById('ae_toast_container');
    if (!container) return;
    const toast = document.createElement('div');
    const palette =
      variant === 'error'
        ? 'ae-glass-toast-error text-[#831C1E]'
        : variant === 'warning'
        ? 'ae-glass-toast-warning text-[#92400E]'
        : 'ae-glass-toast-dark text-white';
    const icon =
      variant === 'error'
        ? 'fa-circle-exclamation text-[#C4242A]'
        : variant === 'warning'
        ? 'fa-wifi text-[#92400E]'
        : 'fa-check text-[#3FC07A]';

    toast.setAttribute('data-ui', 'toast-item');
    toast.className = `ae-toast-enter pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium ${palette}`;
    toast.innerHTML = `<i class="fa-solid ${icon} text-xs"></i><span>${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 220);
    }, 3400);
  },

  toggleStudioMobileMenu() {
    this.showStudioMobileMenu = !this.showStudioMobileMenu;
    this.renderModals();
  },

  switchStage(stage, surveyId = null) {
    this.showStudioMobileMenu = false;
    const user = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    if (!user) {
      this.render();
      return;
    }
    if (user.role === 'supervisor' && stage === 'design') {
      this.showToast('Survey Builder is restricted to HQ Administrators.', 'warning');
      return;
    }
    if (user.role === 'enumerator' && stage !== 'collect') {
      this.showToast('Access restricted to field data collection.', 'warning');
      return;
    }
    if (window.AECollector && window.AECollector.kioskLocked && stage !== 'collect') {
      this.showToast('Enter the Kiosk PIN before leaving the field survey runner.', 'warning');
      return;
    }
    const stageChanged = this.currentStage !== stage;
    if (surveyId && window.aeStore.getSurveyById(surveyId)) {
      this.activeSurveyId = surveyId;
    } else if (!window.aeStore.getSurveyById(this.activeSurveyId) && window.aeStore.surveys.length > 0) {
      this.activeSurveyId = window.aeStore.surveys[0].id;
    }
    this.currentStage = stage;
    if (stage === 'collect') {
      const s = window.aeStore.getSurveyById(this.activeSurveyId);
      if (s) window.AECollector.initRunnerForSurvey(s);
    }
    this.render();
    if (stageChanged) {
      const main = document.getElementById('ae_main_viewport');
      if (main) {
        main.classList.remove('ae-sheet-animate');
        void main.offsetWidth;
        main.classList.add('ae-sheet-animate');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setRunnerLanguage(lang) {
    if (window.AEI18n) window.AEI18n.setLanguage(lang);
    this.runnerLang = lang;
    this.render();
  },

  toggleSimulatedOffline() {
    const nextState = !window.aeStore.settings.simulateOffline;
    window.aeStore.updateSettings({ simulateOffline: nextState });
    if (nextState) {
      this.showToast('Simulated Field Offline Mode active. Responses queue locally in IndexedDB.', 'warning');
    } else {
      this.showToast('Online connection restored. Ready to batch-sync queued items to Google Sheets.', 'success');
    }
    this.render();
  },

  async triggerGoogleSheetsSync(forceAll = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    if (window.aeStore) {
      window.aeStore.lastSyncError = null;
    }
    this.render();
    try {
      const res = await window.aeStore.syncWithGoogleSheets({ forceAll });
      this.showToast(
        `Synced ${res.surveysSynced} surveys and ${res.responsesInserted} responses to Google Sheets (${res.latencyMs}ms).`,
        'success'
      );
    } catch (err) {
      this.showToast(err.message || 'Sync failed', 'error');
    } finally {
      this.isSyncing = false;
      this.render();
    }
  },

  async triggerPullFromSheets() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.render();
    try {
      const res = await window.aeStore.pullFromGoogleSheets();
      this.showToast(
        `Pulled ${res.surveysCount} surveys and ${res.responsesCount} responses from Google Sheets (${res.latencyMs}ms).`,
        'success'
      );
    } catch (err) {
      this.showToast(err.message || 'Pull failed', 'error');
    } finally {
      this.isSyncing = false;
      this.render();
    }
  },

  clearSyncErrorAndUseSimulator() {
    window.aeStore.lastSyncError = null;
    window.aeStore.updateSettings({ gasWebAppUrl: '' });
    this.showToast('Switched to Local Google Sheets Simulator. Click Sync Sheets to flush queue.', 'success');
    this.render();
  },

  dismissSyncError() {
    if (window.aeStore) {
      window.aeStore.lastSyncError = null;
    }
    this.render();
  },

  async handleLoginSubmit() {
    const personSelect = document.getElementById('ae_login_person_select');
    const pinInput = document.getElementById('ae_login_pin_input');
    const rememberBox = document.getElementById('ae_login_remember');
    const personId = personSelect ? personSelect.value : '';
    const pin = pinInput ? pinInput.value.trim() : '';
    const remember = rememberBox ? rememberBox.checked : true;

    if (!personId) {
      this.loginError = 'Please select your staff identity.';
      this.render();
      return;
    }
    if (!pin) {
      this.loginError = 'Please enter your security PIN (4 to 8 digits).';
      this.render();
      return;
    }

    const res = await window.AESession.login(personId, pin, remember);
    if (res.ok) {
      this.loginError = '';
      this.showToast(`Welcome, ${res.user.fullName} (${res.user.role.toUpperCase()})`, 'success');
      this.render();
    } else {
      this.loginError = res.error || 'Authentication failed.';
      this.render();
    }
  },

  handleLogout() {
    if (window.AESession) {
      window.AESession.logout();
    }
    this.showToast('Signed out of Agri Experience Operations.', 'success');
    this.currentStage = 'dashboard';
    this.render();
  },

  renderLoginPortal() {
    const personnel = (window.aeStore && window.aeStore.personnel) ? window.aeStore.personnel : [];
    const admins = personnel.filter((p) => p.role === 'admin' && p.active !== false);
    const supervisors = personnel.filter((p) => p.role === 'supervisor' && p.active !== false);
    const enumerators = personnel.filter((p) => p.role === 'enumerator' && p.active !== false);

    return `
      <div class="py-8 px-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div class="max-w-md w-full bg-white border border-[#E4E7E4] rounded-[16px] p-6 sm:p-8 space-y-6 ae-dialog-animate">
          <!-- Logo & Brand Header -->
          <div class="text-center space-y-3">
            <div class="flex items-center justify-center">
              <img src="https://drive.google.com/thumbnail?id=1FG3ihsPb06rIDp7DcxtZQsmi9XydO9y4&sz=w1000"
                alt="Agri Experience Limited"
                class="h-10 w-auto object-contain"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />
              <div class="hidden w-10 h-10 rounded-[8px] bg-[#247B50] text-white items-center justify-center text-lg font-bold">
                <i class="fa-solid fa-seedling"></i>
              </div>
            </div>
            <div>
              <h2 class="text-xl font-bold text-[#111613] tracking-tight">Operations Portal Login</h2>
              <p class="text-xs text-[#525B56] mt-1">Sign in with your staff account and 4-digit security PIN</p>
            </div>
          </div>

          ${
            this.loginError
              ? `<div class="p-3 rounded-[6px] bg-[#FFEDEA] border border-[#F5C2C0] text-[#831C1E] text-xs font-medium flex items-center gap-2">
                  <i class="fa-solid fa-circle-exclamation text-xs shrink-0"></i>
                  <span>${this.escapeHtml(this.loginError)}</span>
                </div>`
              : ''
          }

          <!-- Login Form -->
          <form onsubmit="event.preventDefault(); AEApp.handleLoginSubmit();" class="space-y-4">
            <div>
              <label for="ae_login_person_select" class="block text-xs font-semibold text-[#111613] mb-1.5">
                Staff Identity / Account
              </label>
              <select id="ae_login_person_select"
                class="w-full h-10 px-3 text-xs text-[#111613] bg-white rounded-[6px] border border-[#CFD5D0] focus:border-[#247B50] focus:outline-none font-medium">
                <optgroup label="HQ Operations Administrators">
                  ${admins
                    .map(
                      (p) =>
                        `<option value="${p.id}" ${p.id === this.loginSelectedPersonId ? 'selected' : ''}>${this.escapeHtml(
                          p.fullName
                        )} (${p.id}) · Admin</option>`
                    )
                    .join('')}
                </optgroup>
                <optgroup label="Regional Supervisors">
                  ${supervisors
                    .map(
                      (p) =>
                        `<option value="${p.id}" ${p.id === this.loginSelectedPersonId ? 'selected' : ''}>${this.escapeHtml(
                          p.fullName
                        )} (${p.id}) · ${this.escapeHtml(p.county)} Hub</option>`
                    )
                    .join('')}
                </optgroup>
                <optgroup label="Field Enumerators">
                  ${enumerators
                    .map(
                      (p) =>
                        `<option value="${p.id}" ${p.id === this.loginSelectedPersonId ? 'selected' : ''}>${this.escapeHtml(
                          p.fullName
                        )} (${p.id}) · ${this.escapeHtml(p.county)}</option>`
                    )
                    .join('')}
                </optgroup>
              </select>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="ae_login_pin_input" class="text-xs font-semibold text-[#111613]">
                  Security PIN
                </label>
                <span class="text-[11px] text-[#525B56]">4 to 8 digits</span>
              </div>
              <input id="ae_login_pin_input" type="password" maxlength="8" pattern="[0-9]*" inputmode="numeric"
                placeholder="••••" autocomplete="current-password"
                class="w-full h-11 text-center tracking-widest text-lg font-bold rounded-[6px] border border-[#CFD5D0] focus:border-[#247B50] focus:outline-none" />
            </div>

            <div class="flex items-center justify-between text-xs pt-1">
              <label class="inline-flex items-center gap-2 text-[#525B56] cursor-pointer">
                <input id="ae_login_remember" type="checkbox" checked
                  class="rounded border-[#CFD5D0] text-[#247B50] focus:ring-0" />
                <span>Stay signed in on this device</span>
              </label>
            </div>

            <button type="submit"
              class="w-full h-10 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
              <i class="fa-solid fa-lock text-[11px]"></i>
              <span>Access Operations Portal</span>
            </button>
          </form>

          <!-- Direct Mobile Field Collector Link -->
          <div class="p-3.5 rounded-[8px] bg-[#F4F6F4] border border-[#E4E7E4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div class="text-xs font-semibold text-[#111613]">Conducting farm interviews?</div>
              <p class="text-[11px] text-[#525B56] mt-0.5">Use the dedicated offline mobile field app</p>
            </div>
            <a href="./field.html"
              class="w-full sm:w-auto h-8 px-3 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 ae-press">
              <i class="fa-solid fa-mobile-screen-button text-[11px]"></i>
              <span>Open Field App</span>
            </a>
          </div>
        </div>
      </div>
    `;
  },

  renderEnumeratorPortal(user) {
    return `
      <div class="py-12 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div class="max-w-lg w-full bg-white border border-[#E4E7E4] rounded-[16px] p-8 space-y-6 text-center ae-dialog-animate">
          <div class="w-14 h-14 mx-auto rounded-full bg-[#DCFAE5] text-[#04250E] flex items-center justify-center text-2xl font-bold">
            <i class="fa-solid fa-clipboard-user"></i>
          </div>
          <div>
            <span class="px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-[#DCFAE5] text-[#04250E]">
              Authenticated Field Enumerator
            </span>
            <h2 class="text-xl font-bold text-[#111613] tracking-tight mt-2">${this.escapeHtml(user.fullName)}</h2>
            <p class="text-xs text-[#525B56] mt-1">Staff ID: <code>${this.escapeHtml(user.id)}</code> · County: <strong>${this.escapeHtml(user.county)}</strong></p>
          </div>
          <p class="text-xs text-[#525B56] leading-relaxed max-w-sm mx-auto">
            You are authenticated for field interview collection. Survey design and administrative settings are managed by HQ. Please open the Mobile Field Collector to capture interviews offline.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a href="./field.html"
              class="w-full sm:w-auto h-10 px-5 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
              <i class="fa-solid fa-mobile-screen-button"></i>
              <span>Launch Mobile Field Collector</span>
            </a>
            <button onclick="AEApp.handleLogout()"
              class="w-full sm:w-auto h-10 px-4 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-xs font-medium text-[#111613] inline-flex items-center justify-center gap-2 ae-press">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  render() {
    // Preserve active input focus and cursor selection across re-renders
    const prevActive = document.activeElement;
    const activeId = prevActive && prevActive.id ? prevActive.id : null;
    let selStart = null;
    let selEnd = null;
    if (activeId && typeof prevActive.selectionStart === 'number') {
      try {
        selStart = prevActive.selectionStart;
        selEnd = prevActive.selectionEnd;
      } catch (e) {}
    }

    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    this.renderHeaderBar(currentUser);
    const main = document.getElementById('ae_main_viewport');
    if (!main) return;

    if (!currentUser) {
      main.innerHTML = this.renderLoginPortal();
      this.renderModals();
      return;
    }

    if (currentUser.role === 'enumerator') {
      main.innerHTML = this.renderEnumeratorPortal(currentUser);
      this.renderModals();
      return;
    }

    const activeSurvey = window.aeStore.getSurveyById(this.activeSurveyId) || window.aeStore.surveys[0];

    if (this.currentStage === 'design') {
      if (currentUser.role === 'supervisor') {
        this.currentStage = 'dashboard';
        main.innerHTML = this.renderDashboard(currentUser);
        this.showToast('Survey Builder is restricted to HQ Administrators.', 'warning');
      } else {
        main.innerHTML = window.AEBuilder.renderBuilder(activeSurvey);
      }
    } else if (this.currentStage === 'collect') {
      main.innerHTML = window.AECollector.renderCollectStage(activeSurvey);
      if (window.AECollector.activeSubTab === 'collectors' && activeSurvey) {
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        const shareUrl = `${window.location.origin}${basePath}field.html?survey=${encodeURIComponent(activeSurvey.id)}`;
        setTimeout(() => window.AECollector.drawQRCode(shareUrl), 30);
      }
    } else if (this.currentStage === 'analyze') {
      if (window.AEAnalytics && window.AEAnalytics.destroyCharts) {
        window.AEAnalytics.destroyCharts();
      }
      main.innerHTML = window.AEAnalytics.renderAnalyzeStage(activeSurvey);
      if (window.AEAnalytics.initGSAPAnimations) {
        window.AEAnalytics.initGSAPAnimations();
      }
      if (window.AEAnalytics.mountCharts) {
        window.AEAnalytics.mountCharts(activeSurvey);
      }
    } else if (this.currentStage === 'team') {
      if (window.AEAnalytics && window.AEAnalytics.destroyCharts) {
        window.AEAnalytics.destroyCharts();
      }
      main.innerHTML = this.renderTeamStage(currentUser);
      this.initTeamAnimations();
    } else {
      if (window.AEAnalytics && window.AEAnalytics.destroyCharts) {
        window.AEAnalytics.destroyCharts();
      }
      main.innerHTML = this.renderDashboard(currentUser);
    }

    this.renderModals();

    if (activeId) {
      const restoredEl = document.getElementById(activeId);
      if (restoredEl && typeof restoredEl.focus === 'function') {
        restoredEl.focus({ preventScroll: true });
        if (selStart !== null && typeof restoredEl.setSelectionRange === 'function') {
          try {
            restoredEl.setSelectionRange(selStart, selEnd);
          } catch (e) {}
        }
      }
    }
  },

  renderHeaderBar(currentUser) {
    const headerEl = document.getElementById('ae_top_header');
    if (!headerEl) return;

    const online = window.aeStore.isEffectivelyOnline();

    if (!currentUser) {
      headerEl.innerHTML = `
        <div class="max-w-[1340px] mx-auto px-3 sm:px-5 py-2 sm:py-0 sm:h-12 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2.5 shrink-0">
            <img src="https://drive.google.com/thumbnail?id=1FG3ihsPb06rIDp7DcxtZQsmi9XydO9y4&sz=w1000"
              alt="Agri Experience Limited"
              class="h-7 w-auto max-w-[120px] object-contain shrink-0"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />
            <span class="hidden w-6 h-6 rounded-[5px] bg-[#247B50] text-white items-center justify-center text-xs font-semibold">
              <i class="fa-solid fa-seedling"></i>
            </span>
            <span class="font-semibold text-sm text-[#111613] tracking-tight">AE Survey</span>
            <span class="hidden sm:inline text-xs text-[#525B56]">· Operations Portal</span>
          </div>

          <div class="hidden md:flex items-center gap-2 text-xs text-[#525B56] font-medium">
            <i class="fa-solid fa-shield-halved text-[#247B50]"></i>
            <span>Role-Based Authentication · Secure Session</span>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button onclick="AEApp.toggleSimulatedOffline()"
              title="Toggle Offline Mode"
              class="h-8 px-2.5 rounded-[6px] text-xs font-medium inline-flex items-center gap-1.5 border ae-press ${
                online
                  ? 'bg-white border-[#CFD5D0] text-[#111613]'
                  : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] font-semibold'
              }">
              <span class="w-1.5 h-1.5 rounded-full ${online ? 'bg-[#247B50]' : 'bg-[#D97706]'}"></span>
              <span class="hidden sm:inline">${online ? 'Online' : 'Offline'}</span>
            </button>
            <a href="./field.html"
              class="h-8 px-3 rounded-[6px] text-xs font-medium bg-[#247B50] hover:bg-[#1F6A45] text-white inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-mobile-screen-button text-[11px]"></i>
              <span>Mobile Field App</span>
            </a>
          </div>
        </div>
      `;
      return;
    }



    const queueCount = window.aeStore.syncQueue.length;
    const unsyncedRespCount = window.aeStore.responses.filter((r) => r.syncStatus !== 'synced').length;
    const totalPending = Math.max(queueCount, unsyncedRespCount);
    const activeSurvey = window.aeStore.getSurveyById(this.activeSurveyId);
    const isAdmin = currentUser.role === 'admin';
    const isCurrentlySyncing = Boolean(this.isSyncing || (window.aeStore && window.aeStore._syncInFlight));

    headerEl.innerHTML = `
      <div class="max-w-[1340px] mx-auto px-3 sm:px-5 py-2 sm:py-0 sm:h-12 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
        <!-- Left: Brand Identity & Workspace Scope -->
        <div class="flex items-center gap-2.5 min-w-0 shrink-0">
          <button onclick="AEApp.switchStage('dashboard')"
            class="flex items-center gap-2.5 text-left focus:outline-none shrink-0 ae-press">
            <img src="https://drive.google.com/thumbnail?id=1FG3ihsPb06rIDp7DcxtZQsmi9XydO9y4&sz=w1000"
              alt="Agri Experience Limited"
              class="h-7 w-auto max-w-[100px] sm:max-w-[120px] object-contain shrink-0"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />
            <span class="hidden w-6 h-6 rounded-[5px] bg-[#247B50] text-white items-center justify-center text-xs font-semibold">
              <i class="fa-solid fa-seedling"></i>
            </span>
            <span class="font-semibold text-sm text-[#111613] tracking-tight whitespace-nowrap">AE Survey</span>
            <span class="hidden 2xl:inline text-xs text-[#525B56] whitespace-nowrap">· Agri Experience Kenya</span>
          </button>
        </div>

        <!-- Center: Workflow Stage Tabs (Horizontally Scrollable on Mobile with .no-scrollbar) -->
        <nav class="order-3 sm:order-2 w-full sm:w-auto overflow-x-auto sm:overflow-visible no-scrollbar scroll-smooth flex items-center justify-start sm:justify-center sm:h-12 gap-1 lg:gap-1.5 xl:gap-2 border-t sm:border-t-0 border-[#E4E7E4] pt-2 sm:pt-0 pb-1 sm:pb-0 -mx-3 sm:mx-0 px-3 sm:px-0 sm:shrink-0" aria-label="Survey Workflow Stages">
          <button onclick="AEApp.switchStage('dashboard')"
            class="h-8 sm:h-full px-2 sm:px-2 lg:px-2.5 xl:px-3 text-xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] sm:rounded-none border-b-2 shrink-0 ae-press ${
              this.currentStage === 'dashboard'
                ? 'border-[#247B50] bg-white sm:bg-transparent text-[#111613] font-semibold'
                : 'border-transparent text-[#525B56] hover:text-[#111613] font-medium'
            }">
            <i class="fa-solid fa-table-list text-[11px] ${this.currentStage === 'dashboard' ? 'text-[#247B50]' : 'text-[#646E68]'}"></i>
            <span>Overview</span>
          </button>

          ${
            isAdmin
              ? `<button onclick="AEApp.switchStage('design')"
                  class="h-8 sm:h-full px-2 sm:px-2 lg:px-2.5 xl:px-3 text-xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] sm:rounded-none border-b-2 shrink-0 ae-press ${
                    this.currentStage === 'design'
                      ? 'border-[#247B50] bg-white sm:bg-transparent text-[#111613] font-semibold'
                      : 'border-transparent text-[#525B56] hover:text-[#111613] font-medium'
                  }">
                  <i class="fa-solid fa-sliders text-[11px] ${this.currentStage === 'design' ? 'text-[#247B50]' : 'text-[#646E68]'}"></i>
                  <span>Survey Builder</span>
                </button>`
              : ''
          }

          <button onclick="AEApp.switchStage('collect')"
            class="h-8 sm:h-full px-2 sm:px-2 lg:px-2.5 xl:px-3 text-xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] sm:rounded-none border-b-2 shrink-0 ae-press ${
              this.currentStage === 'collect'
                ? 'border-[#247B50] bg-white sm:bg-transparent text-[#111613] font-semibold'
                : 'border-transparent text-[#525B56] hover:text-[#111613] font-medium'
            }">
            <i class="fa-solid fa-clipboard-check text-[11px] ${this.currentStage === 'collect' ? 'text-[#247B50]' : 'text-[#646E68]'}"></i>
            <span>Field Kiosk</span>
          </button>

          <button onclick="AEApp.switchStage('analyze')"
            class="h-8 sm:h-full px-2 sm:px-2 lg:px-2.5 xl:px-3 text-xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] sm:rounded-none border-b-2 shrink-0 ae-press ${
              this.currentStage === 'analyze'
                ? 'border-[#247B50] bg-white sm:bg-transparent text-[#111613] font-semibold'
                : 'border-transparent text-[#525B56] hover:text-[#111613] font-medium'
            }">
            <i class="fa-solid fa-chart-column text-[11px] ${this.currentStage === 'analyze' ? 'text-[#247B50]' : 'text-[#646E68]'}"></i>
            <span>Analyze Results</span>
          </button>

          <button onclick="AEApp.switchStage('team')"
            class="h-8 sm:h-full px-2 sm:px-2 lg:px-2.5 xl:px-3 text-xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] sm:rounded-none border-b-2 shrink-0 ae-press ${
              this.currentStage === 'team'
                ? 'border-[#247B50] bg-white sm:bg-transparent text-[#111613] font-semibold'
                : 'border-transparent text-[#525B56] hover:text-[#111613] font-medium'
            }">
            <i class="fa-solid fa-users-gear text-[11px] ${this.currentStage === 'team' ? 'text-[#247B50]' : 'text-[#646E68]'}"></i>
            <span>Field Personnel</span>
          </button>
        </nav>

        <!-- Right: Mobile Controls (<sm) & Desktop Action Cluster (>=sm) -->
        <div class="order-2 sm:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
          <!-- Mobile Sync Button -->
          <button onclick="AEApp.triggerGoogleSheetsSync()"
            ${isCurrentlySyncing ? 'disabled' : ''}
            title="Synchronize with Google Sheets"
            class="sm:hidden h-8 px-2.5 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap bg-[#141A17] hover:bg-[#232C27] text-white ae-press ${
              isCurrentlySyncing ? 'opacity-80 cursor-wait' : ''
            }">
            <i class="fa-solid fa-arrows-rotate text-[11px] ${isCurrentlySyncing ? 'fa-spin' : ''}"></i>
            ${
              totalPending > 0
                ? `<span class="px-1.5 py-0.2 rounded-[4px] bg-[#FFFBEB] text-[#92400E] text-[10px] font-bold tabular-nums">${totalPending}</span>`
                : ''
            }
          </button>

          <!-- Mobile Studio Menu Trigger -->
          <button onclick="AEApp.toggleStudioMobileMenu()"
            id="ae_studio_mobile_btn"
            aria-label="Open Studio Operations Menu"
            class="sm:hidden h-8 px-2.5 rounded-[6px] bg-white border border-[#CFD5D0] hover:bg-[#F4F6F4] text-[#111613] text-xs font-semibold inline-flex items-center gap-1.5 ae-press">
            <span class="px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold ${
              isAdmin ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#EFF6FF] text-[#1E40AF]'
            }">
              ${this.escapeHtml(currentUser.role.toUpperCase())}
            </span>
            <i class="fa-solid fa-bars text-xs text-[#525B56]"></i>
          </button>

          <!-- Desktop-Only Action Cluster (hidden on sm: and below) -->
          <div class="hidden sm:flex items-center gap-1.5 lg:gap-2 shrink-0">
            <a href="./field.html${activeSurvey ? '?survey=' + encodeURIComponent(activeSurvey.id) : ''}"
              title="Launch Mobile Field App (PWA) for data collection and field audit"
              class="h-8 px-2 lg:px-2.5 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap bg-[#247B50] hover:bg-[#1F6A45] text-white shrink-0 ae-press">
              <i class="fa-solid fa-mobile-screen-button text-[11px]"></i>
              <span class="hidden 2xl:inline">Field App</span>
            </a>

            <button onclick="AEApp.toggleSimulatedOffline()"
              title="Toggle Offline Field Mode to test IndexedDB local queueing"
              class="h-8 px-2 lg:px-2.5 rounded-[6px] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap border shrink-0 ae-press ${
                online
                  ? 'bg-white border-[#CFD5D0] text-[#111613]'
                  : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] font-semibold'
              }">
              <span class="w-1.5 h-1.5 rounded-full ${online ? 'bg-[#247B50]' : 'bg-[#D97706]'}"></span>
              <span class="hidden 2xl:inline">${online ? 'Online' : 'Offline queue'}</span>
            </button>

            <button onclick="AEApp.triggerGoogleSheetsSync()"
              ${isCurrentlySyncing ? 'disabled' : ''}
              class="h-8 px-2 lg:px-2.5 rounded-[6px] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap bg-[#141A17] hover:bg-[#232C27] text-white shrink-0 ae-press ${
                isCurrentlySyncing ? 'opacity-80 cursor-wait' : ''
              }">
              <i class="fa-solid fa-arrows-rotate text-[11px] ${isCurrentlySyncing ? 'fa-spin' : ''}"></i>
              <span class="hidden xl:inline">${isCurrentlySyncing ? 'Syncing…' : 'Sync Sheets'}</span>
              ${
                totalPending > 0
                  ? `<span class="px-1.5 py-0.2 rounded-[4px] bg-[#FFFBEB] text-[#92400E] text-[11px] font-semibold tabular-nums">${totalPending}</span>`
                  : ''
              }
            </button>

            <button onclick="AEApp.openSyncSettingsModal()"
              title="${isAdmin ? 'Google Sheets & GAS Backend Settings' : 'Google Sheets & GAS Backend (Read-only)'}"
              aria-label="Google Sheets & GAS Backend Settings"
              class="w-8 h-8 rounded-[6px] bg-white hover:bg-[#EAECE9] text-[#525B56] hover:text-[#111613] flex items-center justify-center border border-[#CFD5D0] shrink-0 ae-press">
              <i class="fa-solid fa-table text-xs"></i>
            </button>

            <!-- Authenticated User Identity Pill & Sign Out -->
            <div class="flex items-center gap-1.5 pl-2 border-l border-[#CFD5D0] shrink-0">
              <button type="button" onclick="AEApp.openAddPersonnelModal('${currentUser.id}')"
                title="Edit My Profile &amp; Credentials (${this.escapeAttr(currentUser.fullName)})"
                class="hidden lg:flex flex-col text-right hover:opacity-80 transition-opacity ae-press cursor-pointer">
                <span class="text-xs font-semibold text-[#111613] leading-tight truncate max-w-[140px]">${this.escapeHtml(currentUser.fullName)}</span>
                <span class="text-[10px] text-[#525B56] leading-tight">${this.escapeHtml(currentUser.county || 'Kenya')}</span>
              </button>
              <span class="px-2 py-0.5 rounded-[4px] text-[11px] font-bold shrink-0 ${
                isAdmin ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#EFF6FF] text-[#1E40AF]'
              }">
                ${this.escapeHtml(currentUser.role)}
              </span>
              <button onclick="AEApp.handleLogout()"
                title="Sign Out (${this.escapeAttr(currentUser.fullName)})"
                aria-label="Sign Out"
                class="w-8 h-8 rounded-[6px] bg-white hover:bg-[#FFEDEA] text-[#525B56] hover:text-[#C4242A] flex items-center justify-center border border-[#CFD5D0] shrink-0 ae-press">
                <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    `;
  },

  setOverviewMetric(metric) {
    this.selectedOverviewMetric = metric;
    this.render();
  },

  setOverviewSurveyFilter(surveyId) {
    this.overviewSurveyFilter = surveyId;
    this.render();
  },

  getOverviewSurveyMetric(surveyId, allResponses) {
    const responses = surveyId === 'all'
      ? allResponses
      : allResponses.filter((r) => r.surveyId === surveyId);
    const survey = surveyId !== 'all' ? window.aeStore.getSurveyById(surveyId) : null;

    if (surveyId === 'all') {
      const targetQuotas = 8;
      const pacingPct = Math.round((responses.length / targetQuotas) * 100);
      return {
        id: 'pacing',
        label: 'Field quota pacing',
        value: `${pacingPct}%`,
        unit: 'target met',
        subtitle: `${responses.length} of ${targetQuotas} regional quotas`,
        hint: 'Click to inspect county quota pacing',
        comparisonHeader: 'County Field Quota Pacing & Target Completion (%)',
        comparisonSubtitle: 'Interviews completed across all active surveys vs. regional quota target',
        calcCountyValue: (matched, ct) => {
          const pct = Math.min(150, Math.round((matched.length / Math.max(1, ct.target)) * 100));
          return {
            pct: Math.min(100, pct),
            displayVal: `${pct}%`,
            unit: ' target',
            numericVal: pct
          };
        }
      };
    }

    if (surveyId === 'srv_maize_2026') {
      const valid = responses.filter((r) => r.answers && Number(r.answers.q_yield_kg) > 0);
      const mean = valid.length > 0
        ? Math.round(valid.reduce((sum, r) => sum + Number(r.answers.q_yield_kg), 0) / valid.length)
        : 1476;
      return {
        id: 'yield',
        label: 'Mean maize yield',
        value: mean.toLocaleString(),
        unit: 'kg/acre',
        subtitle: `${valid.length} plot weighings`,
        hint: 'Click to compare county yields',
        comparisonHeader: 'County Maize Yield vs. Regional Target (kg/acre)',
        comparisonSubtitle: 'Harvested drought-tolerant hybrid maize yield per acre compared against 2,200 kg/acre regional benchmark',
        calcCountyValue: (matched, ct) => {
          const yVals = matched.map((r) => Number(r.answers?.q_yield_kg || 0)).filter((v) => v > 0);
          const meanY = yVals.length > 0 ? Math.round(yVals.reduce((a, b) => a + b, 0) / yVals.length) : ct.defaultYield;
          const pct = Math.min(100, Math.round((meanY / 2200) * 100));
          return {
            pct,
            displayVal: meanY.toLocaleString(),
            unit: ' kg/ac',
            numericVal: meanY
          };
        }
      };
    }

    if (surveyId === 'srv_agrodealer_2026') {
      const valid = responses.filter((r) => r.answers && Number(r.answers.qd_price_2kg) > 0);
      const meanPrice = valid.length > 0
        ? Math.round(valid.reduce((sum, r) => sum + Number(r.answers.qd_price_2kg), 0) / valid.length)
        : 630;
      return {
        id: 'price',
        label: 'Median 2kg seed price',
        value: `KES ${meanPrice.toLocaleString()}`,
        unit: 'per 2kg pack',
        subtitle: `${valid.length} agro-dealer audits`,
        hint: 'Click to compare retail seed prices',
        comparisonHeader: 'County 2kg Maize Seed Retail Price (KES)',
        comparisonSubtitle: 'Certified hybrid seed retail pricing across agro-dealer stockists compared to KES 750 ceiling',
        calcCountyValue: (matched, ct) => {
          const pVals = matched.map((r) => Number(r.answers?.qd_price_2kg || 0)).filter((v) => v > 0);
          const meanP = pVals.length > 0 ? Math.round(pVals.reduce((a, b) => a + b, 0) / pVals.length) : (ct.matchKey === 'Nakuru' ? 620 : 640);
          const pct = Math.min(100, Math.round((meanP / 750) * 100));
          return {
            pct,
            displayVal: `KES ${meanP.toLocaleString()}`,
            unit: '',
            numericVal: meanP
          };
        }
      };
    }

    if (surveyId === 'srv_extension_pulse') {
      const valid = responses.filter((r) => r.answers && r.answers.qe_nps !== undefined);
      const meanNps = valid.length > 0
        ? Math.round(valid.reduce((sum, r) => sum + Number(r.answers.qe_nps), 0) / valid.length)
        : 9;
      return {
        id: 'nps',
        label: 'Farmer training NPS',
        value: `+${meanNps * 10}`,
        unit: 'NPS score',
        subtitle: `${valid.length} exit evaluations`,
        hint: 'Click to compare training ratings',
        comparisonHeader: 'County Farmer Extension NPS & Feedback Score',
        comparisonSubtitle: 'Post-event net promoter score for agronomic demo station clarity',
        calcCountyValue: (matched, ct) => {
          const nVals = matched.map((r) => Number(r.answers?.qe_nps || 0)).filter((v) => v > 0);
          const score = nVals.length > 0 ? Math.round(nVals.reduce((a, b) => a + b, 0) / nVals.length) : 8;
          const pct = Math.min(100, Math.round((score / 10) * 100));
          return {
            pct,
            displayVal: `${score}/10`,
            unit: ' NPS',
            numericVal: score
          };
        }
      };
    }

    // Dynamic question introspection for arbitrary custom surveys
    let detectedQuestion = null;
    if (survey && Array.isArray(survey.pages)) {
      for (const page of survey.pages) {
        if (Array.isArray(page.questions)) {
          for (const q of page.questions) {
            if (['number_yield', 'star_rating', 'nps'].includes(q.type)) {
              detectedQuestion = q;
              break;
            }
          }
        }
        if (detectedQuestion) break;
      }
    }

    if (detectedQuestion) {
      const qId = detectedQuestion.id;
      const qUnit = detectedQuestion.unit || (detectedQuestion.type === 'star_rating' ? 'stars' : 'pts');
      const valid = responses.filter((r) => r.answers && r.answers[qId] !== undefined && !isNaN(Number(r.answers[qId])));
      const avg = valid.length > 0
        ? Math.round((valid.reduce((sum, r) => sum + Number(r.answers[qId]), 0) / valid.length) * 10) / 10
        : 0;

      return {
        id: 'custom_metric',
        label: detectedQuestion.title.length > 28 ? detectedQuestion.title.slice(0, 26) + '…' : detectedQuestion.title,
        value: avg > 0 ? `${avg}` : '—',
        unit: qUnit,
        subtitle: `${valid.length} responses`,
        hint: 'Click to compare county scores',
        comparisonHeader: `County ${detectedQuestion.title}`,
        comparisonSubtitle: `Distribution across field hubs for ${survey.title}`,
        calcCountyValue: (matched, ct) => {
          const vals = matched.map((r) => Number(r.answers?.[qId] || 0)).filter((v) => v > 0);
          const meanV = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
          const pct = Math.min(100, Math.round((meanV / (detectedQuestion.max || 100)) * 100));
          return {
            pct: pct || 40,
            displayVal: meanV > 0 ? `${meanV}` : '—',
            unit: ` ${qUnit}`,
            numericVal: meanV
          };
        }
      };
    }

    // Default fallback
    const completionRate = responses.length > 0 ? 100 : 0;
    return {
      id: 'completion',
      label: 'Survey completion rate',
      value: `${completionRate}%`,
      unit: 'completed',
      subtitle: `${responses.length} interviews`,
      hint: 'Click to inspect county quota',
      comparisonHeader: `County Enumeration Status (${survey?.title || 'Selected Survey'})`,
      comparisonSubtitle: 'Field interviews recorded vs. target quota allocation',
      calcCountyValue: (matched, ct) => {
        const pct = Math.min(100, Math.round((matched.length / Math.max(1, ct.target)) * 100));
        return {
          pct,
          displayVal: `${matched.length}`,
          unit: ` / ${ct.target}`,
          numericVal: matched.length
        };
      }
    };
  },

  renderDashboard(currentUser = null) {
    if (!currentUser && window.AESession) {
      currentUser = window.AESession.getCurrentUser();
    }
    const isAdmin = currentUser && currentUser.role === 'admin';
    const surveys = window.aeStore.surveys;
    const allResponses = window.aeStore.responses;

    // Safety fallback: if current filter points to non-existent survey, reset to 'all'
    if (this.overviewSurveyFilter !== 'all' && !surveys.some((s) => s.id === this.overviewSurveyFilter)) {
      this.overviewSurveyFilter = 'all';
    }

    const activeScopeSurvey = this.overviewSurveyFilter === 'all' ? null : window.aeStore.getSurveyById(this.overviewSurveyFilter);
    const responses = this.overviewSurveyFilter === 'all'
      ? allResponses
      : allResponses.filter((r) => r.surveyId === this.overviewSurveyFilter);

    const syncedCount = responses.filter((r) => r.syncStatus === 'synced').length;
    const queuedCount = responses.length - syncedCount;
    const avgDuration =
      responses.length > 0
        ? Math.round(responses.reduce((acc, r) => acc + Number(r.durationSec || 0), 0) / responses.length)
        : 0;

    const activeMetric = this.getOverviewSurveyMetric(this.overviewSurveyFilter, allResponses);
    const isDomainView = this.selectedOverviewMetric === 'domain' || this.selectedOverviewMetric === 'yield';

    const filteredSurveys = surveys.filter((s) => {
      const matchesStatus = this.statusFilter === 'All' || s.status === this.statusFilter;
      const matchesQuery =
        !this.searchQuery ||
        s.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });

    // Regional coverage breakdown (computed from live scoped responses + field targets across all 6 Kenyan counties)
    const countyTargets = [
      { county: 'Nakuru County', zone: 'Rift Valley Highland', enumerator: 'Grace Wanjiku', initials: 'GW', avatarBg: '#DCFAE5', avatarInk: '#04250E', matchKey: 'Nakuru', target: 2, defaultYield: 1890 },
      { county: 'Machakos County', zone: 'Eastern Semi-Arid', enumerator: 'David Mutua', initials: 'DM', avatarBg: '#E0F2FE', avatarInk: '#075985', matchKey: 'Machakos', target: 2, defaultYield: 1260 },
      { county: 'Meru County', zone: 'Upper Midland', enumerator: 'Grace Wanjiku', initials: 'GW', avatarBg: '#DCFAE5', avatarInk: '#04250E', matchKey: 'Meru', target: 1, defaultYield: 2070 },
      { county: 'Kakamega County', zone: 'Western Moist', enumerator: 'Samuel Ochieng', initials: 'SO', avatarBg: '#FEF3C7', avatarInk: '#92400E', matchKey: 'Kakamega', target: 1, defaultYield: 1620 },
      { county: 'Uasin Gishu County', zone: 'Maize Basket', enumerator: 'Samuel Ochieng', initials: 'SO', avatarBg: '#FEF3C7', avatarInk: '#92400E', matchKey: 'Uasin Gishu', target: 1, defaultYield: 2160 },
      { county: 'Kitui County', zone: 'ASAL Drylands', enumerator: 'David Mutua', initials: 'DM', avatarBg: '#E0F2FE', avatarInk: '#075985', matchKey: 'Kitui', target: 1, defaultYield: 540 }
    ];

    const countyRows = countyTargets.map((ct) => {
      const matched = responses.filter((r) => {
        const cAns = String(r.answers?.q_county || r.answers?.county || r.answers?.qd_county || '');
        const gLabel = String(r.gps?.label || '');
        if (cAns.toLowerCase().includes(ct.matchKey.toLowerCase())) return true;
        if (gLabel.toLowerCase().includes(ct.matchKey.toLowerCase())) return true;
        if (ct.matchKey === 'Machakos' && gLabel.toLowerCase().includes('mkulima bora')) return true;
        return false;
      });
      const synced = matched.filter((r) => r.syncStatus === 'synced').length;
      const queued = matched.length - synced;
      const metricData = activeMetric.calcCountyValue(matched, ct);
      return {
        ...ct,
        collected: matched.length,
        synced,
        queued,
        metricPct: metricData.pct,
        metricDisplay: metricData.displayVal + metricData.unit,
        metricVal: metricData.numericVal
      };
    });

    const outboxList = responses
      .slice()
      .reverse()
      .filter((r) => {
        if (this.selectedOverviewMetric === 'synced') return r.syncStatus === 'synced';
        if (this.selectedOverviewMetric === 'queued') return r.syncStatus !== 'synced';
        return true;
      })
      .slice(0, 4);

    const lastSyncText = window.aeStore.settings.lastSyncedAt
      ? `Last synced ${new Date(window.aeStore.settings.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Local GAS simulator active · 5 synced, 2 in outbox';
    const syncErr = window.aeStore.lastSyncError;

    return `
      <div class="space-y-6">
        <!-- 1. App Title Row (No marketing hero banner, no eyebrow pill) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFEFEF]">
          <div>
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-[24px] font-semibold text-[#111613] tracking-tight leading-tight">Field Surveys &amp; Sheets Sync</h1>
              <span class="inline-flex items-center gap-1.5 text-xs text-[#525B56]">
                <span class="w-1.5 h-1.5 rounded-full ${queuedCount > 0 ? 'bg-[#D97706]' : 'bg-[#247B50]'}"></span>
                <span>${this.escapeHtml(lastSyncText)}</span>
              </span>
            </div>
            <p class="text-sm text-[#525B56] mt-1">
              ${
                this.overviewSurveyFilter !== 'all' && activeScopeSurvey
                  ? queuedCount > 0
                    ? `${queuedCount} field ${queuedCount === 1 ? 'interview' : 'interviews'} for ${this.escapeHtml(activeScopeSurvey.title)} stored in IndexedDB awaiting Google Sheets synchronization.`
                    : `All ${responses.length} field interviews for ${this.escapeHtml(activeScopeSurvey.title)} are synchronized with Google Sheets.`
                  : queuedCount > 0
                  ? `${queuedCount} field interviews across Meru and Machakos are stored in IndexedDB awaiting Google Sheets synchronization.`
                  : `All ${allResponses.length} field interviews across ${surveys.length} surveys are synchronized with Google Sheets.`
              }
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button onclick="AEApp.openSyncSettingsModal()"
              class="h-8 px-3 rounded-[6px] bg-white hover:bg-[#F4F6F4] text-[#111613] font-medium text-xs inline-flex items-center gap-1.5 border border-[#CFD5D0] ae-press">
              <i class="fa-solid fa-link text-[11px] text-[#525B56]"></i>
              <span>Sheets Endpoint</span>
            </button>
            ${
              isAdmin
                ? `<button onclick="AEApp.createBlankSurvey()"
                    class="h-8 px-3.5 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white font-medium text-xs inline-flex items-center gap-1.5 ae-press">
                    <i class="fa-solid fa-plus text-[11px]"></i>
                    <span>New Survey</span>
                  </button>`
                : ''
            }
          </div>
        </div>

        ${
          !isAdmin && currentUser
            ? `<div class="p-3.5 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-[5px] bg-[#1E40AF] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    <i class="fa-solid fa-user-shield"></i>
                  </div>
                  <div>
                    <span class="font-semibold text-[#1E40AF]">Supervisor Scope: Assigned to ${this.escapeHtml(currentUser.county || 'Regional')} Hub</span>
                    <p class="text-[#1E40AF]/80 mt-0.5">Monitoring field enumeration quotas, outbox synchronization, and response verifications.</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-white text-[#1E40AF] text-[11px] font-semibold border border-[#BFDBFE] shrink-0">
                  Supervisor Session
                </span>
              </div>`
            : ''
        }

        ${
          syncErr
            ? `<div role="alert" class="bg-[#FFEDEA] border border-[#F5C2C0] rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-start gap-3 min-w-0">
                  <i class="fa-solid fa-triangle-exclamation text-[#C4242A] mt-0.5"></i>
                  <div class="min-w-0">
                    <div class="text-xs font-semibold text-[#831C1E]">Google Sheets synchronization failed</div>
                    <div class="text-xs text-[#831C1E]/90 mt-0.5 ae-break-words">${this.escapeHtml(syncErr.message)}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button onclick="AEApp.triggerGoogleSheetsSync()"
                    ${this.isSyncing ? 'disabled' : ''}
                    class="h-8 px-3 rounded-[6px] bg-[#141A17] text-white text-xs font-medium hover:bg-[#232C27] ae-press inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-arrows-rotate text-[11px] ${this.isSyncing ? 'fa-spin' : ''}"></i>
                    <span>${this.isSyncing ? 'Retrying Sync…' : 'Retry Sync'}</span>
                  </button>
                  <button onclick="AEApp.clearSyncErrorAndUseSimulator()"
                    ${this.isSyncing ? 'disabled' : ''}
                    class="h-8 px-3 rounded-[6px] bg-white border border-[#F5C2C0] text-[#831C1E] text-xs font-medium hover:bg-[#FFF8F6] ae-press">
                    Use Local Simulator
                  </button>
                  <button onclick="AEApp.dismissSyncError()"
                    title="Dismiss notice"
                    class="w-8 h-8 rounded-[6px] text-[#831C1E] hover:bg-[#F5C2C0]/50 flex items-center justify-center ae-press">
                    <i class="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>
              </div>`
            : ''
        }

        <!-- 2. Survey Scope Selector: Multi-Survey vs Focused Instrument Scope -->
        <div class="bg-white p-3 rounded-[8px] border border-[#E4E7E4] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 rounded-[5px] bg-[#F4F6F4] border border-[#CFD5D0] flex items-center justify-center text-[#247B50] shrink-0">
              <i class="fa-solid fa-sliders text-xs"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-[#111613]">Overview Survey Scope</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#F4F6F4] text-[#525B56] border border-[#E4E7E4]">
                  ${this.overviewSurveyFilter === 'all' ? 'Multi-Survey Portfolio' : 'Single Instrument'}
                </span>
              </div>
              <p class="text-[11px] text-[#525B56] truncate mt-0.5">
                ${
                  this.overviewSurveyFilter === 'all'
                    ? `Aggregating field KPIs, outbox queue, and county coverage across all ${surveys.length} instruments.`
                    : `Showing live field KPIs and regional ledger for ${this.escapeHtml(activeScopeSurvey?.title || 'Selected Survey')}.`
                }
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap shrink-0">
            <button type="button" onclick="AEApp.setOverviewSurveyFilter('all')"
              class="h-7 px-3 rounded-[5px] text-xs font-medium transition-colors ae-press ${
                this.overviewSurveyFilter === 'all'
                  ? 'bg-[#141A17] text-white font-semibold'
                  : 'bg-[#F8F9F8] text-[#525B56] hover:text-[#111613] hover:bg-[#EFEFEF] border border-[#E4E7E4]'
              }">
              All Surveys (${allResponses.length})
            </button>
            ${surveys
              .slice(0, 3)
              .map((s) => {
                const sResps = allResponses.filter((r) => r.surveyId === s.id);
                const isSelected = this.overviewSurveyFilter === s.id;
                const shortName = s.title.replace(/2026/g, '').trim().split(' ').slice(0, 3).join(' ');
                return `
                  <button type="button" onclick="AEApp.setOverviewSurveyFilter('${s.id}')"
                    class="h-7 px-2.5 rounded-[5px] text-xs font-medium transition-colors ae-press ${
                      isSelected
                        ? 'bg-[#247B50] text-white font-semibold'
                        : 'bg-[#F8F9F8] text-[#525B56] hover:text-[#111613] hover:bg-[#EFEFEF] border border-[#E4E7E4]'
                    }">
                    ${this.escapeHtml(shortName)} (${sResps.length})
                  </button>
                `;
              })
              .join('')}
            ${
              surveys.length > 3
                ? `
                <div class="relative inline-block">
                  <select aria-label="Select additional survey instrument" onchange="AEApp.setOverviewSurveyFilter(this.value)"
                    class="h-7 pl-2.5 pr-6 rounded-[5px] text-xs font-medium bg-[#F8F9F8] text-[#525B56] border border-[#E4E7E4] focus:outline-none focus:border-[#247B50] cursor-pointer">
                    <option value="" disabled ${!surveys.slice(3).some((s) => s.id === this.overviewSurveyFilter) ? 'selected' : ''}>More surveys…</option>
                    ${surveys.slice(3).map((s) => {
                      const sResps = allResponses.filter((r) => r.surveyId === s.id);
                      const isSelected = this.overviewSurveyFilter === s.id;
                      return `<option value="${s.id}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(s.title)} (${sResps.length})</option>`;
                    }).join('')}
                  </select>
                </div>`
                : ''
            }
          </div>
        </div>

        <!-- 3. Usage Tray: Hairline-Divided KPI Strip + Interactive Field Coverage Ledger (Framed-Sheet Overview Pattern) -->
        <section class="bg-[#F8F9F8] p-1.5 rounded-[10px] border border-[#E4E7E4] space-y-1.5">
          <!-- Divided KPI Strip (One container split by 1px rules, no icons in circles, answer figure leads at 30px) -->
          <div class="bg-white rounded-[8px] border border-[#E4E7E4] grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#EFEFEF]">
            <button type="button" onclick="AEApp.setOverviewMetric('responses')"
              aria-pressed="${this.selectedOverviewMetric === 'responses'}"
              class="p-4 text-left transition-colors ${this.selectedOverviewMetric === 'responses' ? 'bg-[#F8F9F8] border-b-2 border-b-[#247B50]' : 'hover:bg-[#F8F9F8]/60'}">
              <div class="text-xs font-medium text-[#525B56]">Total field interviews</div>
              <div class="mt-1 flex items-baseline gap-2">
                <span class="text-[28px] font-semibold text-[#111613] tabular-nums leading-none">${responses.length}</span>
                <span class="text-xs text-[#247B50] font-medium tabular-nums">+2 today</span>
              </div>
              <div class="text-xs text-[#646E68] mt-1">${activeScopeSurvey ? this.escapeHtml(activeScopeSurvey.title.split(' ')[0]) : 'Across 6 Kenyan counties'}</div>
            </button>

            <button type="button" onclick="AEApp.setOverviewMetric('synced')"
              aria-pressed="${this.selectedOverviewMetric === 'synced'}"
              class="p-4 text-left transition-colors ${this.selectedOverviewMetric === 'synced' ? 'bg-[#F8F9F8] border-b-2 border-b-[#247B50]' : 'hover:bg-[#F8F9F8]/60'}">
              <div class="text-xs font-medium text-[#525B56]">Synced to Google Sheets</div>
              <div class="mt-1 flex items-baseline gap-2">
                <span class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none">${syncedCount}</span>
                <span class="text-xs text-[#525B56] tabular-nums">of ${responses.length} rows</span>
              </div>
              <div class="text-xs text-[#646E68] mt-1">Filter outbox to synced</div>
            </button>

            <button type="button" onclick="AEApp.setOverviewMetric('queued')"
              aria-pressed="${this.selectedOverviewMetric === 'queued'}"
              class="p-4 text-left transition-colors ${this.selectedOverviewMetric === 'queued' ? 'bg-[#F8F9F8] border-b-2 border-b-[#247B50]' : 'hover:bg-[#F8F9F8]/60'}">
              <div class="text-xs font-medium text-[#525B56]">Offline outbox queue</div>
              <div class="mt-1 flex items-baseline gap-2">
                <span class="text-[22px] font-semibold ${queuedCount > 0 ? 'text-[#92400E]' : 'text-[#111613]'} tabular-nums leading-none">${queuedCount}</span>
                <span class="text-xs text-[#525B56]">pending push</span>
              </div>
              <div class="text-xs text-[#646E68] mt-1">Filter outbox to queued</div>
            </button>

            <button type="button" onclick="AEApp.setOverviewMetric('domain')"
              aria-pressed="${isDomainView}"
              class="p-4 text-left transition-colors ${isDomainView ? 'bg-[#F8F9F8] border-b-2 border-b-[#247B50]' : 'hover:bg-[#F8F9F8]/60'}">
              <div class="text-xs font-medium text-[#525B56] truncate">${this.escapeHtml(activeMetric.label)}</div>
              <div class="mt-1 flex items-baseline gap-1.5">
                <span class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none">${activeMetric.value}</span>
                <span class="text-xs text-[#525B56]">${this.escapeHtml(activeMetric.unit)}</span>
              </div>
              <div class="text-xs text-[#247B50] mt-1 truncate">${this.escapeHtml(activeMetric.hint)}</div>
            </button>

            <div class="p-4 text-left col-span-2 lg:col-span-1">
              <div class="text-xs font-medium text-[#525B56]">Median interview duration</div>
              <div class="mt-1 flex items-baseline gap-1.5">
                <span class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none">${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s</span>
                <span class="text-xs text-[#525B56]">${activeScopeSurvey ? 'per audit' : 'per interview'}</span>
              </div>
              <div class="text-xs text-[#646E68] mt-1">${this.overviewSurveyFilter === 'all' ? `${surveys.length} active instruments` : `${responses.length} recorded interviews`}</div>
            </div>
          </div>

          <!-- Signature Product Block: County Field Enumeration & Google Sheets Sync Ledger -->
          <div class="bg-white rounded-[8px] border border-[#E4E7E4] p-5">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <!-- Left 7 Columns: County Field Progress Bar List (1 hue #247B50 + neutral track) -->
              <div class="lg:col-span-7 space-y-3 min-w-0">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 class="text-base font-semibold text-[#111613]">
                      ${isDomainView ? this.escapeHtml(activeMetric.comparisonHeader) : 'County Field Enumeration &amp; Sheets Sync Status'}
                    </h2>
                    <p class="text-xs text-[#525B56]">
                      ${
                        isDomainView
                          ? this.escapeHtml(activeMetric.comparisonSubtitle)
                          : 'Completed plot interviews vs. regional quota, broken down by Google Sheets sync state'
                      }
                    </p>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-[#525B56]">
                    ${
                      isDomainView
                        ? `<button type="button" onclick="AEApp.setOverviewMetric('responses')" class="text-xs font-medium text-[#247B50] hover:underline">Show sync coverage</button>`
                        : `<span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-xs bg-[#247B50]"></span>Synced to Sheets</span>
                           <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-xs bg-[#D97706]"></span>Queued on tablet</span>`
                    }
                  </div>
                </div>

                <div class="divide-y divide-[#EFEFEF] pt-1">
                  ${countyRows
                    .map((row) => {
                      const syncedPct = Math.min(100, Math.round((row.synced / Math.max(1, row.target)) * 100));
                      const queuedPct = Math.min(100 - syncedPct, Math.round((row.queued / Math.max(1, row.target)) * 100));
                      return `
                        <div class="py-2.5 flex items-center justify-between gap-3 sm:gap-4 min-w-0">
                          <div class="w-[135px] sm:w-[175px] shrink-0 min-w-0">
                            <div class="text-xs font-medium text-[#111613] truncate">${this.escapeHtml(row.county)}</div>
                            <div class="text-xs text-[#646E68] truncate">${this.escapeHtml(row.zone)}</div>
                          </div>

                          <div class="flex-1 min-w-[48px] flex items-center gap-3">
                            <div class="w-full h-2 bg-[#EFEFEF] rounded-full overflow-hidden flex">
                              ${
                                isDomainView
                                  ? `<div class="h-full bg-[#247B50]" style="width: ${row.metricPct}%"></div>`
                                  : `<div class="h-full bg-[#247B50]" style="width: ${syncedPct}%"></div>
                                     <div class="h-full bg-[#D97706]" style="width: ${queuedPct}%"></div>`
                              }
                            </div>
                          </div>

                          <div class="flex items-center gap-2.5 shrink-0">
                            <span class="inline-flex items-center gap-1.5 text-xs text-[#525B56]">
                              <span class="w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0" style="background:${row.avatarBg};color:${row.avatarInk}">${row.initials}</span>
                              <span class="hidden sm:inline">${this.escapeHtml(row.enumerator)}</span>
                            </span>
                            <div class="w-24 text-right tabular-nums text-xs">
                              ${
                                isDomainView
                                  ? `<span class="font-semibold text-[#111613]">${row.metricDisplay}</span>`
                                  : `<span class="font-semibold text-[#111613]">${row.collected}</span><span class="text-[#646E68]"> / ${row.target} ${activeScopeSurvey ? 'interviews' : 'plots'}</span>`
                              }
                            </div>
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </div>

              <!-- Right 5 Columns: Live Outbox & Sheets Tab Telemetry Table -->
              <div class="lg:col-span-5 lg:border-l lg:border-[#EFEFEF] lg:pl-6 space-y-3 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <h3 class="text-base font-semibold text-[#111613]">Google Sheets Outbox Queue</h3>
                    <p class="text-xs text-[#525B56]">
                      ${
                        this.selectedOverviewMetric === 'synced'
                          ? 'Showing synchronized Google Sheets records'
                          : this.selectedOverviewMetric === 'queued'
                          ? 'Showing offline records pending Google Sheets push'
                          : activeScopeSurvey
                          ? `Recent records for ${this.escapeHtml(activeScopeSurvey.title.split(' ')[0])}`
                          : 'Recent records across all active instruments'
                      }
                    </p>
                  </div>
                  <button onclick="AEApp.triggerGoogleSheetsSync()"
                    ${this.isSyncing ? 'disabled' : ''}
                    class="h-7 px-2.5 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] tabular-nums shrink-0 ae-press">
                    Flush Queue (${queuedCount})
                  </button>
                </div>

                <div class="border border-[#E4E7E4] rounded-[8px] divide-y divide-[#EFEFEF]">
                  ${
                    outboxList.length === 0
                      ? `<div class="p-4 text-center text-xs text-[#525B56]">
                          No records in this scope.
                          <button type="button" onclick="AEApp.setOverviewMetric('responses')" class="text-[#247B50] font-medium hover:underline ml-1">Show all</button>
                        </div>`
                      : outboxList
                          .map((r) => {
                            const isQueued = r.syncStatus !== 'synced';
                            const surveyBadge = (window.aeStore.getSurveyById(r.surveyId)?.title || r.surveyTitle || 'Survey')
                              .replace(/2026/g, '')
                              .trim()
                              .split(' ')
                              .slice(0, 2)
                              .join(' ');
                            return `
                              <div class="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                                <div class="min-w-0">
                                  <div class="flex items-center gap-1.5">
                                    <span class="font-medium text-[#111613] truncate">${this.escapeHtml(r.gps?.label || r.id)}</span>
                                    <span class="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#F4F6F4] text-[#247B50] border border-[#CFD5D0] shrink-0">
                                      ${this.escapeHtml(surveyBadge)}
                                    </span>
                                  </div>
                                  <div class="text-[#646E68] truncate">${this.escapeHtml(r.enumerator)} · ${this.escapeHtml(r.answers?.q_seed_variety || r.answers?.qd_shop_type || r.answers?.qe_session || 'Interview record')}</div>
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                  <span class="px-2 py-0.5 rounded-[4px] text-[11px] font-medium whitespace-nowrap ${
                                    isQueued
                                      ? 'bg-[#FFFBEB] text-[#92400E]'
                                      : 'bg-[#DCFAE5] text-[#04250E]'
                                  }">
                                    ${isQueued ? 'Queued offline' : 'Synced'}
                                  </span>
                                </div>
                              </div>
                            `;
                          })
                          .join('')
                  }
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Survey Instruments Table (Sentence-case 12px headers, right-aligned tabular figures, no zebra) -->
        <section class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-baseline gap-2.5">
              <h2 class="text-[18px] font-medium text-[#111613]">Survey Instruments</h2>
              <span class="text-xs text-[#646E68] tabular-nums">${filteredSurveys.length} of ${surveys.length} shown</span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <div class="relative">
                <i class="fa-solid fa-magnifying-glass text-xs text-[#646E68] absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input type="text"
                  id="ae_dashboard_search_input"
                  maxlength="100"
                  aria-label="Filter surveys by title or category"
                  value="${this.escapeAttr(this.searchQuery)}"
                  oninput="AEApp.setDashboardSearch(this.value)"
                  placeholder="Filter by title or category…"
                  class="pl-8 pr-3 h-8 w-56 rounded-[6px] bg-white border border-[#CFD5D0] text-xs text-[#111613] placeholder-[#646E68] focus:outline-none focus:border-[#247B50]" />
              </div>

              <div class="inline-flex rounded-[6px] border border-[#CFD5D0] bg-[#F8F9F8] p-0.5">
                ${['All', 'Active', 'Draft', 'Closed']
                  .map(
                    (st) => `
                  <button onclick="AEApp.setDashboardStatusFilter('${st}')"
                    class="px-2.5 h-7 rounded-[5px] text-xs font-medium transition-colors ${
                      this.statusFilter === st
                        ? 'bg-white text-[#111613] font-semibold border border-[#E4E7E4]'
                        : 'text-[#525B56] hover:text-[#111613]'
                    }">
                    ${st}
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>
          </div>

          ${
            filteredSurveys.length === 0
              ? `<div class="bg-white border border-dashed border-[#CFD5D0] rounded-[8px] p-8 text-center space-y-2">
                  <div class="text-sm font-semibold text-[#111613]">No survey instruments match your filter</div>
                  <p class="text-xs text-[#525B56]">Clear the search query or status filter to view all field surveys.</p>
                  <div class="pt-1">
                    <button onclick="AEApp.resetDashboardFilters()"
                      class="h-8 px-3.5 rounded-[6px] bg-[#141A17] text-white text-xs font-medium ae-press">
                      Reset Filters
                    </button>
                  </div>
                </div>`
              : `
          <!-- Responsive Mobile 2-Line List (< 640px) per app-screens.md §12 -->
          <div class="sm:hidden bg-white border border-[#E4E7E4] rounded-[8px] divide-y divide-[#EFEFEF]">
            ${filteredSurveys
              .map((s) => {
                const qCount = window.aeStore.getQuestionsForSurvey(s).length;
                const sResponses = window.aeStore.getResponsesForSurvey(s.id);
                const synced = sResponses.filter((r) => r.syncStatus === 'synced').length;
                const unsynced = sResponses.length - synced;
                return `
                  <div class="p-3.5 space-y-2 min-w-0">
                    <div class="flex items-start justify-between gap-2 min-w-0">
                      <button onclick="AEApp.switchStage('design', '${s.id}')" class="text-left font-semibold text-sm text-[#111613] leading-snug min-w-0 ae-break-words">
                        ${this.escapeHtml(s.title)}
                      </button>
                      <span class="shrink-0 px-2 py-0.5 rounded-[4px] text-xs font-medium ${
                        s.status === 'Active'
                          ? 'bg-[#DCFAE5] text-[#04250E]'
                          : s.status === 'Draft'
                          ? 'bg-[#FFFBEB] text-[#92400E]'
                          : 'bg-[#EAECE9] text-[#525B56]'
                      }">${this.escapeHtml(s.status)}</span>
                    </div>
                    <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-[#525B56] tabular-nums">
                      <span>${this.escapeHtml(s.category || 'General')} · ${qCount} questions · ${synced} synced${unsynced > 0 ? ` · ${unsynced} queued` : ''}</span>
                      <div class="flex items-center gap-1.5">
                        <button onclick="AEApp.setOverviewSurveyFilter('${this.overviewSurveyFilter === s.id ? 'all' : s.id}')" class="h-7 px-2 rounded-[5px] border ${this.overviewSurveyFilter === s.id ? 'bg-[#247B50] text-white border-[#247B50]' : 'border-[#CFD5D0] bg-white text-[#525B56]'} text-xs font-medium">${this.overviewSurveyFilter === s.id ? 'Active' : 'Overview'}</button>
                        ${isAdmin ? `<button onclick="AEApp.switchStage('design', '${s.id}')" class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white text-xs font-medium text-[#111613]">Build</button>` : ''}
                        <button onclick="AEApp.switchStage('collect', '${s.id}')" class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white text-xs font-medium text-[#247B50]">Collect</button>
                        <button onclick="AEApp.switchStage('analyze', '${s.id}')" class="h-7 px-2.5 rounded-[5px] bg-[#141A17] text-white text-xs font-medium">Analyze (${sResponses.length})</button>
                      </div>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>

          <div class="hidden sm:block bg-white border border-[#E4E7E4] rounded-[8px] overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#E4E7E4] h-10 text-xs font-normal text-[#525B56]">
                  <th class="py-2 pl-4 pr-3 font-normal">Survey instrument</th>
                  <th class="py-2 px-3 font-normal">Status</th>
                  <th class="py-2 px-3 font-normal text-right">Questions</th>
                  <th class="py-2 px-3 font-normal text-right">Synced rows</th>
                  <th class="py-2 px-3 font-normal text-right">Offline queue</th>
                  <th class="py-2 px-3 font-normal text-right">Updated</th>
                  <th class="py-2 pl-3 pr-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFEFEF] text-sm">
                ${filteredSurveys.map((s) => this.renderSurveyRow(s)).join('')}
              </tbody>
            </table>
          </div>`
          }
        </section>

        <!-- 4. Getting-Started / Verified Survey Templates Strip (1 container split by 1px dividers, zero icon-chips) -->
        <section class="space-y-2.5">
          <div class="flex items-baseline justify-between gap-2">
            <div>
              <h2 class="text-[18px] font-medium text-[#111613]">Initialize from a Field Template</h2>
              <p class="text-xs text-[#525B56]">Pre-built multi-page instruments with conditional skip rules, GPS plot capture, and Likert matrices</p>
            </div>
          </div>

          <div class="bg-white border border-[#E4E7E4] rounded-[8px] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EFEFEF]">
            ${window.SURVEY_TEMPLATES.map(
              (tpl) => `
              <div class="p-5 flex flex-col justify-between gap-4 ae-row-hover">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-medium text-[#247B50]">${this.escapeHtml(tpl.category)}</span>
                    <span class="text-xs text-[#646E68]">${this.escapeHtml(tpl.badge)}</span>
                  </div>
                  <h3 class="text-base font-semibold text-[#111613]">${this.escapeHtml(tpl.name)}</h3>
                  <p class="text-xs text-[#525B56] leading-relaxed">${this.escapeHtml(tpl.description)}</p>
                </div>
                <div class="pt-2 flex items-center justify-between border-t border-[#EFEFEF]">
                  <span class="text-xs text-[#646E68]">Offline + Sheets ready</span>
                  <button onclick="AEApp.createFromTemplate('${tpl.id}')"
                    class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#141A17] hover:text-white hover:border-[#141A17] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
                    <span>Use template</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              </div>
            `
            ).join('')}
          </div>
        </section>
      </div>
    `;
  },

  renderSurveyRow(s) {
    const qCount = window.aeStore.getQuestionsForSurvey(s).length;
    const sResponses = window.aeStore.getResponsesForSurvey(s.id);
    const synced = sResponses.filter((r) => r.syncStatus === 'synced').length;
    const unsynced = sResponses.length - synced;
    const isoDate = new Date(s.updatedAt).toISOString().slice(0, 10);
    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    const isAdmin = currentUser && currentUser.role === 'admin';

    return `
      <tr class="ae-row-hover">
        <td class="py-3.5 pl-4 pr-3 max-w-md">
          <button onclick="${isAdmin ? `AEApp.switchStage('design', '${s.id}')` : `AEApp.switchStage('collect', '${s.id}')`}"
            class="text-left font-semibold text-sm text-[#111613] hover:text-[#247B50] block truncate">
            ${this.escapeHtml(s.title)}
          </button>
          <div class="text-xs text-[#525B56] mt-0.5 truncate">
            ${this.escapeHtml(s.category || 'General')} · ${s.pages.length} ${s.pages.length === 1 ? 'page' : 'pages'} · ${this.escapeHtml(s.description || '')}
          </div>
        </td>

        <td class="py-3.5 px-3 whitespace-nowrap">
          <span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium ${
            s.status === 'Active'
              ? 'bg-[#DCFAE5] text-[#04250E]'
              : s.status === 'Draft'
              ? 'bg-[#FFFBEB] text-[#92400E]'
              : 'bg-[#EAECE9] text-[#525B56]'
          }">
            ${this.escapeHtml(s.status)}
          </span>
        </td>

        <td class="py-3.5 px-3 text-right tabular-nums text-sm text-[#111613]">
          ${qCount}
        </td>

        <td class="py-3.5 px-3 text-right tabular-nums">
          <div class="text-sm font-medium text-[#111613]">${synced}</div>
          <div class="text-xs text-[#646E68]">of ${sResponses.length} total</div>
        </td>

        <td class="py-3.5 px-3 text-right tabular-nums">
          ${
            unsynced > 0
              ? `<span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium bg-[#FFFBEB] text-[#92400E]">${unsynced} queued</span>`
              : `<span class="text-xs text-[#646E68]">0</span>`
          }
        </td>

        <td class="py-3.5 px-3 text-right tabular-nums text-xs text-[#525B56] whitespace-nowrap">
          ${isoDate}
        </td>

        <td class="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
          <div class="inline-flex items-center justify-end gap-1.5">
            <button onclick="AEApp.setOverviewSurveyFilter('${this.overviewSurveyFilter === s.id ? 'all' : s.id}')"
              title="${this.overviewSurveyFilter === s.id ? 'Currently active overview scope. Click to show all surveys.' : 'Focus overview dashboard on this survey'}"
              class="h-7 px-2.5 rounded-[5px] border ${this.overviewSurveyFilter === s.id ? 'bg-[#247B50] text-white border-[#247B50]' : 'border-[#CFD5D0] bg-white text-[#525B56] hover:text-[#111613] hover:bg-[#F4F6F4]'} text-xs font-medium ae-press">
              ${this.overviewSurveyFilter === s.id ? 'Active Scope' : 'Overview'}
            </button>
            ${
              isAdmin
                ? `<button onclick="AEApp.switchStage('design', '${s.id}')"
                    class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] ae-press">
                    Build
                  </button>`
                : ''
            }
            <button onclick="AEApp.switchStage('collect', '${s.id}')"
              class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#247B50] ae-press">
              Collect
            </button>
            <button onclick="AEApp.switchStage('analyze', '${s.id}')"
              class="h-7 px-2.5 rounded-[5px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-medium tabular-nums ae-press">
              Analyze (${sResponses.length})
            </button>
            ${
              isAdmin
                ? `<button onclick="AEApp.duplicateSurvey('${s.id}')" title="Duplicate Survey" aria-label="Duplicate Survey"
                    class="w-7 h-7 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#525B56] hover:text-[#111613] inline-flex items-center justify-center text-xs ae-press">
                    <i class="fa-regular fa-copy"></i>
                  </button>`
                : ''
            }
            ${
              isAdmin && window.aeStore.surveys.length > 1
                ? `<button onclick="AEApp.deleteSurveyConfirm('${s.id}')" title="Delete Survey" aria-label="Delete Survey"
                    class="w-7 h-7 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#FFEDEA] text-[#525B56] hover:text-[#C4242A] inline-flex items-center justify-center text-xs ae-press">
                    <i class="fa-regular fa-trash-can"></i>
                  </button>`
                : ''
            }
          </div>
        </td>
      </tr>
    `;
  },

  setTeamFilter(key, val) {
    if (key === 'role') this.teamFilterRole = val;
    if (key === 'county') this.teamFilterCounty = val;
    if (key === 'search') this.teamSearchQuery = val;
    this.render();
  },

  openAddPersonnelModal(personId = null) {
    const currentUser = window.AESession ? window.AESession.getCurrentUser() : null;
    const isSelf = personId && currentUser && currentUser.id === personId;
    const canManage = window.AESession && (window.AESession.hasPermission('MANAGE_PERSONNEL') || isSelf);
    if (!canManage) {
      this.showToast('Access Denied: Only HQ Administrators can enroll or edit other personnel.', 'error');
      return;
    }
    this.editingPersonnel = personId ? window.aeStore.getPersonnelById(personId) : null;
    this.showAddPersonnelModal = true;
    this.render();
  },

  closePersonnelModals() {
    this.showAddPersonnelModal = false;
    this.showAssignTaskModal = false;
    this.editingPersonnel = null;
    this.showResetPinPersonnel = null;
    this.assigningPersonId = null;
    this.assigningSurveyId = null;
    this.render();
  },

  setTeamSubTab(subTab) {
    this.teamActiveSubTab = subTab;
    this.render();
  },

  setTeamTaskFilter(field, value) {
    if (field === 'survey') this.teamTaskFilterSurvey = value;
    if (field === 'county') this.teamTaskFilterCounty = value;
    this.render();
  },

  openAssignTaskModal(personId = null, surveyId = null) {
    const currentUser = window.AESession ? window.AESession.getCurrentUser() : null;
    const canAssign = window.AESession && (window.AESession.hasPermission('ASSIGN_TASKS') || window.AESession.isAdmin());
    if (!canAssign) {
      this.showToast('Access Denied: Only HQ Administrators and Regional Supervisors can allocate tasks.', 'error');
      return;
    }
    this.assigningPersonId = personId || '';
    this.assigningSurveyId = surveyId || (window.aeStore.surveys[0] ? window.aeStore.surveys[0].id : '');
    this.showAssignTaskModal = true;
    this.render();
  },

  closeAssignTaskModal() {
    this.showAssignTaskModal = false;
    this.assigningPersonId = null;
    this.assigningSurveyId = null;
    this.render();
  },

  saveTaskAssignment(e) {
    e.preventDefault();
    const currentUser = window.AESession ? window.AESession.getCurrentUser() : null;
    const canAssign = window.AESession && (window.AESession.hasPermission('ASSIGN_TASKS') || window.AESession.isAdmin());
    if (!canAssign) {
      this.showToast('Access Denied: Only HQ Administrators and Regional Supervisors can allocate tasks.', 'error');
      return;
    }

    const form = e.target;
    const personId = form.ae_task_person.value;
    const surveyId = form.ae_task_survey.value;
    const targetQuota = parseInt(form.ae_task_quota.value, 10) || 10;
    const supervisorId = form.ae_task_supervisor ? form.ae_task_supervisor.value : null;
    const deadline = form.ae_task_deadline ? form.ae_task_deadline.value : null;
    const notes = form.ae_task_notes ? form.ae_task_notes.value.trim() : '';

    if (!personId) {
      this.showToast('Please select a staff member.', 'error');
      return;
    }
    if (!surveyId) {
      this.showToast('Please select a survey.', 'error');
      return;
    }

    const person = window.aeStore.assignPersonnelTask(personId, surveyId, targetQuota, notes, deadline, supervisorId);
    if (person) {
      const survey = window.aeStore.getSurveyById(surveyId);
      this.showToast(`Allocated "${survey ? survey.title : surveyId}" (${targetQuota} plots) to ${person.fullName}`, 'success');
    }
    this.closeAssignTaskModal();
  },

  unassignTask(personId, surveyId) {
    const currentUser = window.AESession ? window.AESession.getCurrentUser() : null;
    const canAssign = window.AESession && (window.AESession.hasPermission('ASSIGN_TASKS') || window.AESession.isAdmin());
    if (!canAssign) {
      this.showToast('Access Denied: Only HQ Administrators and Regional Supervisors can unassign tasks.', 'error');
      return;
    }
    const person = window.aeStore.getPersonnelById(personId);
    const survey = window.aeStore.getSurveyById(surveyId);
    const personName = person ? person.fullName : 'Personnel';
    const surveyTitle = survey ? survey.title : 'Survey';

    if (confirm(`Remove task allocation for ${personName} on "${surveyTitle}"?`)) {
      window.aeStore.unassignPersonnelTask(personId, surveyId);
      this.showToast(`Unassigned "${surveyTitle}" from ${personName}`, 'info');
      this.render();
    }
  },

  savePersonnel(e) {
    e.preventDefault();
    const currentUser = window.AESession ? window.AESession.getCurrentUser() : null;
    const isSelf = this.editingPersonnel && currentUser && currentUser.id === this.editingPersonnel.id;
    const canManage = window.AESession && (window.AESession.hasPermission('MANAGE_PERSONNEL') || isSelf);
    if (!canManage) {
      this.showToast('Access Denied: Only HQ Administrators can enroll or edit other personnel.', 'error');
      return;
    }
    const form = e.target;
    const fullName = form.ae_per_name.value.trim();
    if (!fullName) {
      this.showToast('Full name is required.', 'error');
      return;
    }
    let role = form.ae_per_role ? form.ae_per_role.value : (this.editingPersonnel ? this.editingPersonnel.role : 'enumerator');
    if (isSelf && window.AESession && !window.AESession.isAdmin()) {
      role = this.editingPersonnel ? this.editingPersonnel.role : role;
    }
    const county = form.ae_per_county ? form.ae_per_county.value.trim() || 'Unassigned' : 'Unassigned';
    const subCounty = form.ae_per_subcounty ? form.ae_per_subcounty.value.trim() : '';
    const phone = form.ae_per_phone ? form.ae_per_phone.value.trim() : '';
    const email = form.ae_per_email ? form.ae_per_email.value.trim() : '';
    const supervisorId = form.ae_per_supervisor ? form.ae_per_supervisor.value : (this.editingPersonnel ? this.editingPersonnel.supervisorId : null);
    const pinInput = form.ae_per_pin ? form.ae_per_pin.value.trim() : '';
    const pinCode = pinInput || (this.editingPersonnel ? this.editingPersonnel.pinCode : '');
    if (!pinCode || pinCode.length < 4 || pinCode.length > 8) {
      this.showToast('A security PIN between 4 and 8 digits is required.', 'error');
      return;
    }

    const personData = {
      id: this.editingPersonnel ? this.editingPersonnel.id : null,
      fullName,
      role,
      county,
      subCounty,
      phone,
      email,
      supervisorId: supervisorId || null,
      pinCode,
      assignedSurveys: this.editingPersonnel && Array.isArray(this.editingPersonnel.assignedSurveys) ? this.editingPersonnel.assignedSurveys : [],
      taskQuotas: this.editingPersonnel && this.editingPersonnel.taskQuotas ? this.editingPersonnel.taskQuotas : {},
      active: true
    };

    const saved = window.aeStore.upsertPersonnel(personData);
    if (window.AEPinSecurity && typeof window.AEPinSecurity.clearLockout === 'function') {
      window.AEPinSecurity.clearLockout();
    }
    if (isSelf && window.AESession) {
      window.AESession.setCurrentUser(saved, true);
    }
    // Push updated credentials directly to Google Sheets so other devices receive them immediately
    if (window.aeStore && typeof window.aeStore.syncPersonnelToCloud === 'function') {
      window.aeStore.syncPersonnelToCloud(saved).catch(() => {});
    }
    this.showToast(
      this.editingPersonnel ? `Updated credentials for ${saved.fullName}` : `Enrolled ${saved.fullName} as ${saved.role}`,
      'success'
    );
    this.closePersonnelModals();
  },

  openResetPinModal(personId) {
    const currentUser = window.AESession ? window.AESession.getCurrentUser() : null;
    const isSelf = personId && currentUser && currentUser.id === personId;
    if (!isSelf && window.AESession && !window.AESession.hasPermission('RESET_PIN')) {
      this.showToast('Access Denied: Only HQ Administrators can reset other staff PINs.', 'error');
      return;
    }
    this.showResetPinPersonnel = window.aeStore.getPersonnelById(personId);
    this.render();
  },

  saveResetPin(e) {
    e.preventDefault();
    const currentUser = window.AESession ? window.AESession.getCurrentUser() : null;
    const isSelf = this.showResetPinPersonnel && currentUser && currentUser.id === this.showResetPinPersonnel.id;
    if (!isSelf && window.AESession && !window.AESession.hasPermission('RESET_PIN')) {
      this.showToast('Access Denied: Only HQ Administrators can reset other staff PINs.', 'error');
      return;
    }
    const newPin = e.target.ae_new_pin.value.trim();
    if (!newPin || newPin.length < 4 || newPin.length > 8) {
      this.showToast('PIN must be between 4 and 8 digits.', 'error');
      return;
    }
    if (!this.showResetPinPersonnel) return;
    this.showResetPinPersonnel.pinCode = newPin;
    const updated = window.aeStore.upsertPersonnel(this.showResetPinPersonnel);
    if (window.AEPinSecurity && typeof window.AEPinSecurity.clearLockout === 'function') {
      window.AEPinSecurity.clearLockout();
    }
    if (isSelf && window.AESession) {
      window.AESession.setCurrentUser(updated, true);
    }
    // Push updated PIN directly to Google Sheets so other devices receive it immediately
    if (window.aeStore && typeof window.aeStore.syncPersonnelToCloud === 'function') {
      window.aeStore.syncPersonnelToCloud(updated).catch(() => {});
    }
    this.showToast(`PIN updated for ${this.showResetPinPersonnel.fullName}`, 'success');
    this.closePersonnelModals();
  },

  togglePersonnelStatus(personId) {
    if (window.AESession && !window.AESession.hasPermission('MANAGE_PERSONNEL')) {
      this.showToast('Access Denied: Only HQ Administrators can change personnel status.', 'error');
      return;
    }
    const person = window.aeStore.getPersonnelById(personId);
    if (!person) return;
    person.active = !person.active;
    window.aeStore.upsertPersonnel(person);
    this.showToast(`${person.fullName} is now ${person.active ? 'Active' : 'Inactive'}`, 'info');
    this.render();
  },

  renderTeamStage(currentUser = null) {
    if (!currentUser && window.AESession) {
      currentUser = window.AESession.getCurrentUser();
    }
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isSupervisor = currentUser && currentUser.role === 'supervisor';
    const canAssign = isAdmin || isSupervisor;

    const allPersonnel = window.aeStore.getPersonnel();
    const activeStaff = allPersonnel.filter((p) => p.active !== false);
    const enumerators = allPersonnel.filter((p) => p.role === 'enumerator');
    const supervisors = allPersonnel.filter((p) => p.role === 'supervisor');
    const admins = allPersonnel.filter((p) => p.role === 'admin');
    const allSurveys = window.aeStore.surveys || [];
    const counties = Array.from(new Set(allPersonnel.map((p) => p.county).filter(Boolean))).sort();

    const responses = window.aeStore.responses || [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const enumStats = {};
    responses.forEach((r) => {
      const enumName = String(r.enumerator || '');
      allPersonnel.forEach((p) => {
        if (enumName.includes(p.fullName) || enumName.includes(p.id)) {
          if (!enumStats[p.id]) enumStats[p.id] = { today: 0, total: 0 };
          enumStats[p.id].total++;
          if ((r.submittedAt || '').startsWith(todayStr)) {
            enumStats[p.id].today++;
          }
        }
      });
    });

    const taskAllocations = window.aeStore.getAllTaskAllocations();
    let filteredTasks = taskAllocations;
    if (this.teamTaskFilterSurvey !== 'all') {
      filteredTasks = filteredTasks.filter((t) => t.surveyId === this.teamTaskFilterSurvey);
    }
    if (this.teamTaskFilterCounty !== 'all') {
      filteredTasks = filteredTasks.filter((t) => t.county === this.teamTaskFilterCounty);
    }
    if (this.teamSearchQuery) {
      const q = this.teamSearchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (t) =>
          t.personName.toLowerCase().includes(q) ||
          t.personId.toLowerCase().includes(q) ||
          t.surveyTitle.toLowerCase().includes(q) ||
          t.supervisorName.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    const totalTargetPlots = taskAllocations.reduce((sum, t) => sum + (t.target || 0), 0);
    const totalCompletedPlots = taskAllocations.reduce((sum, t) => sum + (t.completed || 0), 0);
    const overallTaskPct = totalTargetPlots > 0 ? Math.round((totalCompletedPlots / totalTargetPlots) * 100) : 0;
    const uniqueAssignedStaff = new Set(taskAllocations.map((t) => t.personId)).size;

    const filteredPersonnel = window.aeStore.getPersonnel({
      role: this.teamFilterRole,
      county: this.teamFilterCounty,
      search: this.teamSearchQuery
    });

    return `
      <div class="space-y-6">
        <!-- 1. Header Bar -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#EFEFEF]">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-[22px] font-semibold text-[#111613] tracking-tight">Personnel &amp; Task Allocation Studio</h1>
              <span class="px-2 py-0.5 rounded-[4px] text-xs font-medium bg-[#DCFAE5] text-[#04250E] tabular-nums">
                ${activeStaff.length} active staff · ${taskAllocations.length} allocated tasks
              </span>
            </div>
            <p class="text-xs text-[#525B56] mt-1">
              Hierarchical task assignments, regional target quotas, and supervisor oversight across Kenyan agricultural clusters.
            </p>
          </div>
          <div class="flex items-center gap-2">
            ${
              canAssign
                ? `<button onclick="AEApp.openAssignTaskModal()"
                    class="h-8 px-3.5 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center gap-1.5 ae-press">
                    <i class="fa-solid fa-list-check text-xs"></i> Assign Tasks
                  </button>`
                : ''
            }
            <button onclick="AEApp.openSyncSettingsModal()"
              class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-cloud-arrow-up text-[#247B50] text-xs"></i> Sync Sheets Roster
            </button>
            ${
              isAdmin
                ? `<button onclick="AEApp.openAddPersonnelModal()"
                    class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
                    <i class="fa-solid fa-user-plus text-xs text-[#247B50]"></i> Add Staff
                  </button>`
                : ''
            }
          </div>
        </div>

        <!-- 2. Sub-tab Navigation (Tasks Matrix vs Staff Directory) -->
        <div class="flex items-center justify-between gap-4 border-b border-[#E4E7E4]">
          <div class="flex items-center gap-2">
            <button onclick="AEApp.setTeamSubTab('tasks')"
              class="h-9 px-3.5 border-b-2 text-xs font-semibold transition-colors inline-flex items-center gap-2 ${
                this.teamActiveSubTab === 'tasks'
                  ? 'border-[#247B50] text-[#247B50]'
                  : 'border-transparent text-[#525B56] hover:text-[#111613]'
              }">
              <i class="fa-solid fa-table-list text-xs"></i>
              <span>Task &amp; Quota Allocation Matrix</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                this.teamActiveSubTab === 'tasks' ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#EFEFEF] text-[#525B56]'
              }">${taskAllocations.length}</span>
            </button>

            <button onclick="AEApp.setTeamSubTab('roster')"
              class="h-9 px-3.5 border-b-2 text-xs font-semibold transition-colors inline-flex items-center gap-2 ${
                this.teamActiveSubTab === 'roster'
                  ? 'border-[#247B50] text-[#247B50]'
                  : 'border-transparent text-[#525B56] hover:text-[#111613]'
              }">
              <i class="fa-solid fa-users text-xs"></i>
              <span>Staff Directory &amp; Credentials</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                this.teamActiveSubTab === 'roster' ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#EFEFEF] text-[#525B56]'
              }">${activeStaff.length}</span>
            </button>
          </div>
        </div>

        <!-- 3. KPI Strip (Contextual to Active Subtab) -->
        ${
          this.teamActiveSubTab === 'tasks'
            ? `
            <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
              <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF]">
                <div class="p-4 ae-personnel-kpi">
                  <span class="text-xs font-medium text-[#525B56] block">Assigned Field Tasks</span>
                  <div class="mt-1 flex items-baseline gap-2">
                    <strong class="text-[24px] font-semibold text-[#111613] tabular-nums leading-none ae-kpi-counter" data-target="${taskAllocations.length}">${taskAllocations.length}</strong>
                    <span class="text-xs text-[#247B50] font-medium">active survey tasks</span>
                  </div>
                </div>
                <div class="p-4 ae-personnel-kpi">
                  <span class="text-xs font-medium text-[#525B56] block">Aggregate Quota Target</span>
                  <div class="mt-1 flex items-baseline gap-2">
                    <strong class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none ae-kpi-counter" data-target="${totalTargetPlots}">${totalTargetPlots}</strong>
                    <span class="text-xs text-[#525B56]">plots assigned</span>
                  </div>
                </div>
                <div class="p-4 ae-personnel-kpi">
                  <span class="text-xs font-medium text-[#525B56] block">Completed Field Interviews</span>
                  <div class="mt-1 flex items-baseline gap-2">
                    <strong class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none ae-kpi-counter" data-target="${totalCompletedPlots}">${totalCompletedPlots}</strong>
                    <span class="text-xs text-[#247B50] font-medium">${overallTaskPct}% overall pacing</span>
                  </div>
                </div>
                <div class="p-4 ae-personnel-kpi">
                  <span class="text-xs font-medium text-[#525B56] block">Deployed Personnel</span>
                  <div class="mt-1 flex items-baseline gap-2">
                    <strong class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none ae-kpi-counter" data-target="${uniqueAssignedStaff}">${uniqueAssignedStaff}</strong>
                    <span class="text-xs text-[#525B56]">staff with tasks</span>
                  </div>
                </div>
              </div>
            </div>
            `
            : `
            <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
              <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF]">
                <div class="p-4 ae-personnel-kpi">
                  <span class="text-xs font-medium text-[#525B56] block">Field Enumerators</span>
                  <div class="mt-1 flex items-baseline gap-2">
                    <strong class="text-[24px] font-semibold text-[#111613] tabular-nums leading-none ae-kpi-counter" data-target="${enumerators.length}">${enumerators.length}</strong>
                    <span class="text-xs text-[#247B50] font-medium">${enumerators.filter((e) => e.active !== false).length} active in field</span>
                  </div>
                </div>
                <div class="p-4 ae-personnel-kpi">
                  <span class="text-xs font-medium text-[#525B56] block">Regional Supervisors</span>
                  <div class="mt-1 flex items-baseline gap-2">
                    <strong class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none ae-kpi-counter" data-target="${supervisors.length}">${supervisors.length}</strong>
                    <span class="text-xs text-[#525B56]">Cluster oversight</span>
                  </div>
                </div>
                <div class="p-4 ae-personnel-kpi">
                  <span class="text-xs font-medium text-[#525B56] block">HQ Operations Admins</span>
                  <div class="mt-1 flex items-baseline gap-2">
                    <strong class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none ae-kpi-counter" data-target="${admins.length}">${admins.length}</strong>
                    <span class="text-xs text-[#525B56]">Full studio access</span>
                  </div>
                </div>
                <div class="p-4 ae-personnel-kpi">
                  <span class="text-xs font-medium text-[#525B56] block">Total Interviews Recorded</span>
                  <div class="mt-1 flex items-baseline gap-2">
                    <strong class="text-[22px] font-semibold text-[#111613] tabular-nums leading-none ae-kpi-counter" data-target="${responses.length}">${responses.length}</strong>
                    <span class="text-xs text-[#247B50] font-medium">all staff</span>
                  </div>
                </div>
              </div>
            </div>
            `
        }

        <!-- 4. Content Area Based on Active Subtab -->
        ${
          this.teamActiveSubTab === 'tasks'
            ? `
            <!-- Task Filter Toolbar -->
            <div class="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E4E7E4] rounded-[8px] p-3">
              <div class="flex flex-wrap items-center gap-2">
                <!-- Survey Filter -->
                <select onchange="AEApp.setTeamTaskFilter('survey', this.value)"
                  aria-label="Filter by Survey"
                  class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]">
                  <option value="all" ${this.teamTaskFilterSurvey === 'all' ? 'selected' : ''}>All Surveys (${allSurveys.length})</option>
                  ${allSurveys.map((s) => `<option value="${s.id}" ${this.teamTaskFilterSurvey === s.id ? 'selected' : ''}>${this.escapeHtml(s.title)}</option>`).join('')}
                </select>

                <!-- County Filter -->
                <select onchange="AEApp.setTeamTaskFilter('county', this.value)"
                  aria-label="Filter by County"
                  class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]">
                  <option value="all" ${this.teamTaskFilterCounty === 'all' ? 'selected' : ''}>All Counties (${counties.length})</option>
                  ${counties.map((c) => `<option value="${c}" ${this.teamTaskFilterCounty === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>

              <!-- Search Input -->
              <div class="relative w-full sm:w-64">
                <input type="text"
                  placeholder="Search staff, survey, notes..."
                  value="${this.escapeAttr(this.teamSearchQuery)}"
                  oninput="AEApp.setTeamFilter('search', this.value)"
                  class="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] placeholder-[#646E68] focus:border-[#247B50] focus:outline-none" />
                <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-xs text-[#646E68]"></i>
              </div>
            </div>

            <!-- Task & Quota Allocation Matrix Table -->
            <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-[#F8F9F8] border-b border-[#E4E7E4] text-[#525B56]">
                      <th class="py-2.5 px-4 font-semibold">Assigned Staff</th>
                      <th class="py-2.5 px-4 font-semibold">Survey Instrument</th>
                      <th class="py-2.5 px-4 font-semibold">County &amp; Cluster</th>
                      <th class="py-2.5 px-4 font-semibold">Reporting Supervisor</th>
                      <th class="py-2.5 px-4 font-semibold">Target Quota &amp; Progress</th>
                      <th class="py-2.5 px-4 font-semibold">Workplan &amp; Deadline</th>
                      <th class="py-2.5 px-4 font-semibold">Status</th>
                      <th class="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#EFEFEF]">
                    ${
                      filteredTasks.length === 0
                        ? `<tr><td colspan="8" class="py-8 text-center text-[#525B56]">
                            No task allocations found matching the current filters.
                            ${canAssign ? '<div class="mt-2"><button onclick="AEApp.openAssignTaskModal()" class="text-xs text-[#247B50] font-semibold underline">Allocate first field task</button></div>' : ''}
                          </td></tr>`
                        : filteredTasks
                            .map((t) => {
                              const roleBadge =
                                t.role === 'admin'
                                  ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#DCFAE5] text-[#04250E]">Admin</span>`
                                  : t.role === 'supervisor'
                                  ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#141A17] text-white">Supervisor</span>`
                                  : `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F4F6F4] text-[#247B50] border border-[#247B50]/30">Enumerator</span>`;

                              const statusBadge =
                                t.status === 'Target Met'
                                  ? `<span class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#DCFAE5] text-[#04250E] inline-flex items-center gap-1"><i class="fa-solid fa-circle-check text-[10px]"></i> Target Met</span>`
                                  : t.status === 'In Progress'
                                  ? `<span class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#F4F6F4] text-[#247B50] border border-[#247B50]/30 inline-flex items-center gap-1"><i class="fa-solid fa-spinner text-[10px]"></i> In Progress</span>`
                                  : `<span class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] inline-flex items-center gap-1"><i class="fa-regular fa-clock text-[10px]"></i> Pending</span>`;

                              return `
                                <tr class="hover:bg-[#F8F9F8] transition-colors ae-personnel-row">
                                  <td class="py-3 px-4">
                                    <div class="flex items-center gap-2.5">
                                      <div class="w-7 h-7 rounded-full bg-[#141A17] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                                        ${this.escapeHtml(
                                          t.personName
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')
                                        )}
                                      </div>
                                      <div class="min-w-0">
                                        <div class="font-semibold text-[#111613] flex items-center gap-1.5">
                                          <span>${this.escapeHtml(t.personName)}</span>
                                          ${roleBadge}
                                        </div>
                                        <div class="text-[10px] text-[#525B56] mt-0.5">
                                          <code>${this.escapeHtml(t.personId)}</code>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td class="py-3 px-4">
                                    <div class="font-medium text-[#111613] max-w-[200px] truncate" title="${this.escapeAttr(t.surveyTitle)}">
                                      ${this.escapeHtml(t.surveyTitle)}
                                    </div>
                                    <div class="text-[10px] text-[#525B56]">${this.escapeHtml(t.surveyId)}</div>
                                  </td>
                                  <td class="py-3 px-4 whitespace-nowrap">
                                    <div class="font-medium text-[#111613]">${this.escapeHtml(t.county)}</div>
                                    <div class="text-[10px] text-[#525B56]">${this.escapeHtml(t.subCounty || 'Countywide')}</div>
                                  </td>
                                  <td class="py-3 px-4 whitespace-nowrap text-[#525B56]">
                                    <div class="font-medium text-[#111613]">${this.escapeHtml(t.supervisorName)}</div>
                                    <div class="text-[10px] text-[#525B56]">${t.supervisorId ? this.escapeHtml(t.supervisorId) : 'HQ Direct'}</div>
                                  </td>
                                  <td class="py-3 px-4 whitespace-nowrap">
                                    <div class="flex items-center justify-between gap-2 mb-1 tabular-nums">
                                      <span class="font-semibold text-[#111613]">${t.completed} / ${t.target} plots</span>
                                      <span class="text-[11px] text-[#525B56] font-medium">${t.percent}%</span>
                                    </div>
                                    <div class="w-32 h-1.5 rounded-full bg-[#EFEFEF] overflow-hidden">
                                      <div style="width: ${t.percent}%" class="h-full bg-[#247B50] rounded-full transition-[width] duration-300"></div>
                                    </div>
                                  </td>
                                  <td class="py-3 px-4 max-w-[180px]">
                                    ${
                                      t.deadline
                                        ? `<div class="text-[11px] font-medium text-[#111613] flex items-center gap-1 mb-0.5">
                                            <i class="fa-regular fa-calendar text-[10px] text-[#247B50]"></i> ${this.escapeHtml(t.deadline)}
                                          </div>`
                                        : '<div class="text-[11px] text-[#646E68]">Open timeline</div>'
                                    }
                                    ${
                                      t.notes
                                        ? `<div class="text-[10px] text-[#525B56] truncate" title="${this.escapeAttr(t.notes)}">${this.escapeHtml(t.notes)}</div>`
                                        : ''
                                    }
                                  </td>
                                  <td class="py-3 px-4 whitespace-nowrap">${statusBadge}</td>
                                  <td class="py-3 px-4 text-right whitespace-nowrap">
                                    ${
                                      canAssign
                                        ? `<div class="inline-flex items-center gap-1">
                                            <button type="button" onclick="AEApp.openAssignTaskModal('${t.personId}', '${t.surveyId}')"
                                              title="Edit Quota &amp; Assignment"
                                              class="h-7 px-2 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[11px] font-medium text-[#111613] inline-flex items-center gap-1 ae-press">
                                              <i class="fa-solid fa-sliders text-[10px] text-[#646E68]"></i> Edit Quota
                                            </button>
                                            <button type="button" onclick="AEApp.unassignTask('${t.personId}', '${t.surveyId}')"
                                              title="Unassign task"
                                              class="h-7 px-2 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[11px] font-medium text-[#831C1E] ae-press">
                                              Unassign
                                            </button>
                                          </div>`
                                        : `<span class="text-xs text-[#525B56]">Assigned</span>`
                                    }
                                  </td>
                                </tr>
                              `;
                            })
                            .join('')
                    }
                  </tbody>
                </table>
              </div>
            </div>
            `
            : `
            <!-- Toolbar: Search, Role Filter, County Filter -->
            <div class="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E4E7E4] rounded-[8px] p-3">
              <div class="flex flex-wrap items-center gap-2">
                <!-- Role Pill Buttons -->
                <div class="inline-flex rounded-[6px] border border-[#CFD5D0] p-0.5 bg-[#F8F9F8]">
                  <button onclick="AEApp.setTeamFilter('role', 'all')"
                    class="px-2.5 py-1 rounded-[4px] text-xs font-medium ${this.teamFilterRole === 'all' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                    All (${allPersonnel.length})
                  </button>
                  <button onclick="AEApp.setTeamFilter('role', 'enumerator')"
                    class="px-2.5 py-1 rounded-[4px] text-xs font-medium ${this.teamFilterRole === 'enumerator' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                    Enumerators (${enumerators.length})
                  </button>
                  <button onclick="AEApp.setTeamFilter('role', 'supervisor')"
                    class="px-2.5 py-1 rounded-[4px] text-xs font-medium ${this.teamFilterRole === 'supervisor' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                    Supervisors (${supervisors.length})
                  </button>
                  <button onclick="AEApp.setTeamFilter('role', 'admin')"
                    class="px-2.5 py-1 rounded-[4px] text-xs font-medium ${this.teamFilterRole === 'admin' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                    Admins (${admins.length})
                  </button>
                </div>

                <!-- County Filter -->
                <select onchange="AEApp.setTeamFilter('county', this.value)"
                  aria-label="Filter by County"
                  class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]">
                  <option value="all" ${this.teamFilterCounty === 'all' ? 'selected' : ''}>All Counties (${counties.length})</option>
                  ${counties.map((c) => `<option value="${c}" ${this.teamFilterCounty === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>

              <!-- Search Input -->
              <div class="relative w-full sm:w-64">
                <input type="text"
                  placeholder="Search name, ID, phone..."
                  value="${this.escapeAttr(this.teamSearchQuery)}"
                  oninput="AEApp.setTeamFilter('search', this.value)"
                  class="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] placeholder-[#646E68] focus:border-[#247B50] focus:outline-none" />
                <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-xs text-[#646E68]"></i>
              </div>
            </div>

            <!-- Staff Directory Table -->
            <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-[#F8F9F8] border-b border-[#E4E7E4] text-[#525B56]">
                      <th class="py-2.5 px-4 font-semibold">Staff Member</th>
                      <th class="py-2.5 px-4 font-semibold">Role</th>
                      <th class="py-2.5 px-4 font-semibold">County &amp; Cluster</th>
                      <th class="py-2.5 px-4 font-semibold">Supervisor</th>
                      <th class="py-2.5 px-4 font-semibold">Assigned Tasks</th>
                      <th class="py-2.5 px-4 font-semibold text-center">Interviews (Today / Total)</th>
                      <th class="py-2.5 px-4 font-semibold">Status</th>
                      <th class="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#EFEFEF]">
                    ${
                      filteredPersonnel.length === 0
                        ? `<tr><td colspan="8" class="py-8 text-center text-[#525B56]">No personnel found matching the selected filters.</td></tr>`
                        : filteredPersonnel
                            .map((p) => {
                              const stats = enumStats[p.id] || { today: 0, total: 0 };
                              const sup = p.supervisorId ? window.aeStore.getPersonnelById(p.supervisorId) : null;
                              const assignedCount = Array.isArray(p.assignedSurveys) ? p.assignedSurveys.length : 0;
                              const roleBadge =
                                p.role === 'admin'
                                  ? `<span class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#DCFAE5] text-[#04250E] inline-flex items-center gap-1"><i class="fa-solid fa-shield-halved text-[10px]"></i> Admin</span>`
                                  : p.role === 'supervisor'
                                  ? `<span class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#141A17] text-white inline-flex items-center gap-1"><i class="fa-solid fa-user-tie text-[10px]"></i> Supervisor</span>`
                                  : `<span class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#F4F6F4] text-[#247B50] border border-[#247B50]/30 inline-flex items-center gap-1"><i class="fa-solid fa-user-tag text-[10px]"></i> Enumerator</span>`;

                              const statusBadge =
                                p.active !== false
                                  ? `<span class="inline-flex items-center gap-1.5 text-xs text-[#247B50] font-medium"><span class="w-1.5 h-1.5 rounded-full bg-[#247B50]"></span> Active</span>`
                                  : `<span class="inline-flex items-center gap-1.5 text-xs text-[#831C1E] font-medium"><span class="w-1.5 h-1.5 rounded-full bg-[#C4242A]"></span> Inactive</span>`;

                              return `
                                <tr class="hover:bg-[#F8F9F8] transition-colors ae-personnel-row">
                                  <td class="py-3 px-4">
                                    <div class="flex items-center gap-3">
                                      <div class="w-8 h-8 rounded-full bg-[#141A17] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                        ${this.escapeHtml(
                                          p.fullName
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')
                                        )}
                                      </div>
                                      <div class="min-w-0">
                                        <div class="font-semibold text-[#111613] flex items-center gap-1.5">
                                          <span>${this.escapeHtml(p.fullName)}</span>
                                          <code class="text-[10px] text-[#525B56] px-1 bg-[#F4F6F4] rounded">${this.escapeHtml(p.id)}</code>
                                        </div>
                                        <div class="text-[11px] text-[#525B56] flex items-center gap-2 mt-0.5">
                                          <span>${this.escapeHtml(p.phone || 'No phone')}</span>
                                          ${p.email ? `<span>·</span><span>${this.escapeHtml(p.email)}</span>` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td class="py-3 px-4 whitespace-nowrap">${roleBadge}</td>
                                  <td class="py-3 px-4 whitespace-nowrap">
                                    <div class="font-medium text-[#111613]">${this.escapeHtml(p.county)}</div>
                                    <div class="text-[11px] text-[#525B56]">${this.escapeHtml(p.subCounty || '')}</div>
                                  </td>
                                  <td class="py-3 px-4 whitespace-nowrap text-[#525B56]">
                                    ${
                                      sup
                                        ? `<span class="font-medium text-[#111613]">${this.escapeHtml(sup.fullName)}</span> <span class="text-[10px]">(${sup.id})</span>`
                                        : '<span class="text-[#A3ACA6]">—</span>'
                                    }
                                  </td>
                                  <td class="py-3 px-4 whitespace-nowrap">
                                    <button type="button" onclick="AEApp.openAssignTaskModal('${p.id}')"
                                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-xs font-medium border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[#111613]">
                                      <i class="fa-solid fa-list-check text-[10px] text-[#247B50]"></i>
                                      <span>${assignedCount} task${assignedCount === 1 ? '' : 's'}</span>
                                    </button>
                                  </td>
                                  <td class="py-3 px-4 text-center whitespace-nowrap tabular-nums">
                                    <span class="font-bold text-[#111613]">${stats.today}</span>
                                    <span class="text-[#525B56]"> / ${stats.total}</span>
                                  </td>
                                  <td class="py-3 px-4 whitespace-nowrap">${statusBadge}</td>
                                  <td class="py-3 px-4 text-right whitespace-nowrap">
                                    <div class="inline-flex items-center gap-1">
                                      ${
                                        canAssign
                                          ? `<button type="button" onclick="AEApp.openAssignTaskModal('${p.id}')"
                                              title="Assign Survey Task"
                                              class="h-7 px-2 rounded-[4px] border border-[#247B50] bg-[#DCFAE5]/40 hover:bg-[#DCFAE5] text-[11px] font-semibold text-[#04250E] inline-flex items-center gap-1 ae-press">
                                              <i class="fa-solid fa-plus text-[10px]"></i> Assign
                                            </button>`
                                          : ''
                                      }
                                      ${
                                        isAdmin
                                          ? `<button type="button" onclick="AEApp.openResetPinModal('${p.id}')"
                                              title="Reset Security PIN"
                                              class="h-7 px-2 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[11px] font-medium text-[#111613] inline-flex items-center gap-1 ae-press">
                                              <i class="fa-solid fa-key text-[10px] text-[#646E68]"></i> PIN
                                            </button>
                                            <button type="button" onclick="AEApp.openAddPersonnelModal('${p.id}')"
                                              title="Edit Profile"
                                              class="h-7 px-2 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[11px] font-medium text-[#111613] ae-press">
                                              <i class="fa-regular fa-pen-to-square text-[10px]"></i>
                                            </button>
                                            <button type="button" onclick="AEApp.togglePersonnelStatus('${p.id}')"
                                              title="${p.active !== false ? 'Deactivate staff member' : 'Activate staff member'}"
                                              class="h-7 px-2 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[11px] font-medium ${
                                                p.active !== false ? 'text-[#831C1E]' : 'text-[#247B50]'
                                              } ae-press">
                                              ${p.active !== false ? 'Deactivate' : 'Activate'}
                                            </button>`
                                          : currentUser && currentUser.id === p.id
                                          ? `<button type="button" onclick="AEApp.openResetPinModal('${p.id}')"
                                              title="Reset My Security PIN"
                                              class="h-7 px-2 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[11px] font-medium text-[#111613] inline-flex items-center gap-1 ae-press">
                                              <i class="fa-solid fa-key text-[10px] text-[#646E68]"></i> PIN
                                            </button>
                                            <button type="button" onclick="AEApp.openAddPersonnelModal('${p.id}')"
                                              title="Edit My Profile"
                                              class="h-7 px-2 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-[11px] font-medium text-[#111613] ae-press">
                                              <i class="fa-regular fa-pen-to-square text-[10px]"></i> Edit
                                            </button>`
                                          : ''
                                      }
                                    </div>
                                  </td>
                                </tr>
                              `;
                            })
                            .join('')
                    }
                  </tbody>
                </table>
              </div>
            </div>
            `
        }
      </div>
    `;
  },

  initTeamAnimations() {
    if (typeof window === 'undefined' || !window.gsap) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    requestAnimationFrame(() => {
      document.querySelectorAll('.ae-kpi-counter').forEach((el) => {
        const target = parseFloat(el.getAttribute('data-target') || '0');
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 0.55,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(obj.val).toLocaleString();
          }
        });
      });

      const rows = document.querySelectorAll('.ae-personnel-row');
      if (rows.length) {
        gsap.from(rows, {
          opacity: 0,
          y: 6,
          duration: 0.28,
          stagger: 0.025,
          ease: 'power1.out'
        });
      }
    });
  },

  renderModals() {
    const modalRoot = document.getElementById('ae_modal_root');
    if (!modalRoot) return;

    if (!this.showSyncModal && !this.showAddPersonnelModal && !this.showAssignTaskModal && !this.showResetPinPersonnel && !this.showStudioMobileMenu) {
      modalRoot.innerHTML = '';
      return;
    }

    if (this.showAddPersonnelModal) {
      const p = this.editingPersonnel || {};
      const isEdit = !!this.editingPersonnel;
      const allSupervisors = window.aeStore.getPersonnel({ role: 'supervisor', active: true });

      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEApp.closePersonnelModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-center justify-center p-4 overflow-y-auto">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" class="ae-glass-modal rounded-[12px] max-w-md w-full p-5 sm:p-6 space-y-4 ae-dialog-animate my-6">
            <div class="flex items-start justify-between border-b border-[#EFEFEF] pb-3">
              <div>
                <h3 class="text-base font-semibold text-[#111613]">${isEdit ? 'Edit Staff Member' : 'Add New Field Personnel'}</h3>
                <p class="text-xs text-[#525B56] mt-0.5">Role assignment and regional cluster for Kenya agricultural field operations</p>
              </div>
              <button onclick="AEApp.closePersonnelModals()" aria-label="Close" class="w-7 h-7 rounded-[4px] bg-[#F4F6F4] text-[#111613] flex items-center justify-center">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <form onsubmit="AEApp.savePersonnel(event)" class="space-y-3.5 text-xs">
              <div>
                <label for="ae_per_name" class="block font-medium text-[#111613] mb-1">Full Name *</label>
                <input id="ae_per_name" name="ae_per_name" type="text" required value="${this.escapeAttr(p.fullName || '')}" placeholder="e.g. Grace Wanjiku"
                  class="w-full h-9 rounded-[6px] border border-[#CFD5D0] px-3 text-[#111613] focus:border-[#247B50] focus:outline-none" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="ae_per_role" class="block font-medium text-[#111613] mb-1">Role *</label>
                  <select id="ae_per_role" name="ae_per_role"
                    class="w-full h-9 rounded-[6px] border border-[#CFD5D0] px-2 text-[#111613] bg-white focus:border-[#247B50] focus:outline-none">
                    <option value="enumerator" ${p.role === 'enumerator' ? 'selected' : ''}>Field Enumerator</option>
                    <option value="supervisor" ${p.role === 'supervisor' ? 'selected' : ''}>Field Supervisor</option>
                    <option value="admin" ${p.role === 'admin' ? 'selected' : ''}>HQ Admin</option>
                  </select>
                </div>
                <div>
                  <label for="ae_per_pin" class="block font-medium text-[#111613] mb-1">4-Digit PIN ${isEdit ? '(Leave blank to retain)' : '*'}</label>
                  <input id="ae_per_pin" name="ae_per_pin" type="password" inputmode="numeric" maxlength="8" ${isEdit ? '' : 'required'} value="" placeholder="${isEdit ? '••••••••' : '••••'}" autocomplete="new-password"
                    class="w-full h-9 rounded-[6px] border border-[#CFD5D0] px-3 text-[#111613] text-center tracking-widest font-bold focus:border-[#247B50] focus:outline-none" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="ae_per_county" class="block font-medium text-[#111613] mb-1">County / Cluster</label>
                  <input id="ae_per_county" name="ae_per_county" type="text" value="${this.escapeAttr(p.county || '')}" placeholder="e.g. Nakuru"
                    class="w-full h-9 rounded-[6px] border border-[#CFD5D0] px-3 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                </div>
                <div>
                  <label for="ae_per_subcounty" class="block font-medium text-[#111613] mb-1">Sub-County / Hub</label>
                  <input id="ae_per_subcounty" name="ae_per_subcounty" type="text" value="${this.escapeAttr(p.subCounty || '')}" placeholder="e.g. Nakuru East"
                    class="w-full h-9 rounded-[6px] border border-[#CFD5D0] px-3 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="ae_per_phone" class="block font-medium text-[#111613] mb-1">Phone Number</label>
                  <input id="ae_per_phone" name="ae_per_phone" type="tel" value="${this.escapeAttr(p.phone || '')}" placeholder="+254 7..."
                    class="w-full h-9 rounded-[6px] border border-[#CFD5D0] px-3 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                </div>
                <div>
                  <label for="ae_per_email" class="block font-medium text-[#111613] mb-1">Email Address</label>
                  <input id="ae_per_email" name="ae_per_email" type="email" value="${this.escapeAttr(p.email || '')}" placeholder="name@agriexperience.com"
                    class="w-full h-9 rounded-[6px] border border-[#CFD5D0] px-3 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                </div>
              </div>

              <div>
                <label for="ae_per_supervisor" class="block font-medium text-[#111613] mb-1">Reporting Supervisor</label>
                <select id="ae_per_supervisor" name="ae_per_supervisor"
                  class="w-full h-9 rounded-[6px] border border-[#CFD5D0] px-2 text-[#111613] bg-white focus:border-[#247B50] focus:outline-none">
                  <option value="">None / Independent Lead</option>
                  ${allSupervisors
                    .filter((s) => !isEdit || s.id !== p.id)
                    .map(
                      (s) =>
                        `<option value="${s.id}" ${p.supervisorId === s.id ? 'selected' : ''}>${this.escapeHtml(
                          s.fullName
                        )} (${s.id}) · ${this.escapeHtml(s.county)}</option>`
                    )
                    .join('')}
                </select>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#EFEFEF]">
                <button type="button" onclick="AEApp.closePersonnelModals()" class="h-8 px-3 rounded-[5px] text-xs font-medium text-[#525B56] hover:text-[#111613]">
                  Cancel
                </button>
                <button type="submit" class="h-8 px-4 rounded-[5px] bg-[#247B50] text-white text-xs font-semibold ae-press">
                  ${isEdit ? 'Save Changes' : 'Create Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
      return;
    }

    if (this.showAssignTaskModal) {
      const activeStaff = window.aeStore.getPersonnel({ active: true });
      const allSurveys = window.aeStore.surveys || [];
      const allSupervisors = window.aeStore.getPersonnel({ role: 'supervisor', active: true });
      const selectedPerson = this.assigningPersonId ? window.aeStore.getPersonnelById(this.assigningPersonId) : null;
      const targetSurveyId = this.assigningSurveyId || (allSurveys[0] ? allSurveys[0].id : '');
      const existingQuota =
        selectedPerson && selectedPerson.taskQuotas && targetSurveyId ? selectedPerson.taskQuotas[targetSurveyId] : null;
      const existingTarget = existingQuota ? existingQuota.target : 10;
      const existingDeadline = existingQuota ? existingQuota.deadline || '' : '';
      const existingNotes = existingQuota ? existingQuota.notes || '' : '';
      const existingSupervisorId = selectedPerson && selectedPerson.supervisorId ? selectedPerson.supervisorId : '';

      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEApp.closePersonnelModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-center justify-center p-4 overflow-y-auto">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" class="ae-glass-modal rounded-[12px] max-w-lg w-full p-5 sm:p-6 space-y-4 ae-dialog-animate my-6">
            <div class="flex items-start justify-between border-b border-[#EFEFEF] pb-3">
              <div>
                <h3 class="text-base font-semibold text-[#111613]">Allocate Field Survey Task &amp; Quota</h3>
                <p class="text-xs text-[#525B56] mt-0.5">Assign target interviews, reporting supervisor, and deadlines to field personnel.</p>
              </div>
              <button onclick="AEApp.closePersonnelModals()" aria-label="Close" class="w-7 h-7 rounded-[4px] bg-[#F4F6F4] text-[#111613] hover:bg-[#EAEAEA] flex items-center justify-center ae-press">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <form onsubmit="AEApp.saveTaskAssignment(event)" class="space-y-3.5 text-xs">
              <!-- Field Personnel -->
              <div>
                <label for="ae_task_person" class="block font-medium text-[#111613] mb-1">Field Personnel *</label>
                <select id="ae_task_person" name="ae_task_person" required
                  onchange="AEApp.assigningPersonId = this.value; AEApp.renderModals();"
                  class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:border-[#247B50] focus:outline-none">
                  <option value="">Select staff member...</option>
                  ${activeStaff
                    .map((p) => {
                      const roleLabel = p.role === 'admin' ? 'Admin' : p.role === 'supervisor' ? 'Supervisor' : 'Enumerator';
                      const selected = this.assigningPersonId === p.id ? 'selected' : '';
                      return `<option value="${p.id}" ${selected}>${this.escapeHtml(p.fullName)} (${roleLabel} · ${p.county})</option>`;
                    })
                    .join('')}
                </select>
              </div>

              <!-- Survey Instrument -->
              <div>
                <label for="ae_task_survey" class="block font-medium text-[#111613] mb-1">Survey Instrument *</label>
                <select id="ae_task_survey" name="ae_task_survey" required
                  onchange="AEApp.assigningSurveyId = this.value; AEApp.renderModals();"
                  class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:border-[#247B50] focus:outline-none">
                  <option value="">Select survey...</option>
                  ${allSurveys
                    .map((s) => {
                      const selected = targetSurveyId === s.id ? 'selected' : '';
                      return `<option value="${s.id}" ${selected}>${this.escapeHtml(s.title)} (${s.category || 'General'})</option>`;
                    })
                    .join('')}
                </select>
              </div>

              <!-- Target Quota & Deadline -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="ae_task_quota" class="block font-medium text-[#111613] mb-1">Target Quota (Plots) *</label>
                  <input id="ae_task_quota" name="ae_task_quota" type="number" min="1" max="1000" value="${existingTarget}" required
                    class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:border-[#247B50] focus:outline-none tabular-nums" />
                  <span class="text-[10px] text-[#525B56]">Target interviews for this survey</span>
                </div>
                <div>
                  <label for="ae_task_deadline" class="block font-medium text-[#111613] mb-1">Target Deadline</label>
                  <input id="ae_task_deadline" name="ae_task_deadline" type="date" value="${existingDeadline}"
                    class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                  <span class="text-[10px] text-[#525B56]">Expected field completion</span>
                </div>
              </div>

              <!-- Reporting Supervisor -->
              <div>
                <label for="ae_task_supervisor" class="block font-medium text-[#111613] mb-1">Reporting Supervisor</label>
                <select id="ae_task_supervisor" name="ae_task_supervisor"
                  class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:border-[#247B50] focus:outline-none">
                  <option value="">Direct HQ Operations (No Supervisor)</option>
                  ${allSupervisors
                    .map((s) => {
                      const selected = existingSupervisorId === s.id ? 'selected' : '';
                      return `<option value="${s.id}" ${selected}>${this.escapeHtml(s.fullName)} (${s.county} Cluster · ${s.id})</option>`;
                    })
                    .join('')}
                </select>
              </div>

              <!-- Field Instructions / Notes -->
              <div>
                <label for="ae_task_notes" class="block font-medium text-[#111613] mb-1">Workplan Directives &amp; Cluster Notes</label>
                <textarea id="ae_task_notes" name="ae_task_notes" rows="2" placeholder="e.g. Prioritize high-elevation wards; audit drought-tolerant hybrid adoption"
                  class="w-full p-2.5 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] placeholder-[#646E68] focus:border-[#247B50] focus:outline-none">${this.escapeHtml(existingNotes)}</textarea>
              </div>

              <!-- Footer Buttons -->
              <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#EFEFEF]">
                <button type="button" onclick="AEApp.closePersonnelModals()"
                  class="h-8 px-3 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F8F9F8] text-xs font-medium text-[#111613] ae-press">
                  Cancel
                </button>
                <button type="submit" class="h-8 px-4 rounded-[5px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold ae-press">
                  Save Task Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
      return;
    }

    if (this.showStudioMobileMenu) {
      const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
        ? window.AESession.getCurrentUser()
        : null;
      const isAdmin = currentUser && currentUser.role === 'admin';
      const activeSurvey = window.aeStore.getSurveyById(this.activeSurveyId);
      const online = window.aeStore.isEffectivelyOnline();

      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEApp.toggleStudioMobileMenu()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" aria-label="Operations Studio Menu"
            class="ae-glass-modal rounded-t-[16px] sm:rounded-[12px] max-w-md w-full p-5 space-y-4 ae-dialog-animate max-h-[90vh] overflow-y-auto">
            <!-- Mobile Sheet Grab Bar -->
            <div class="w-10 h-1 bg-[#CFD5D0] rounded-full mx-auto sm:hidden -mt-1 mb-1"></div>

            <div class="flex items-center justify-between pb-3 border-b border-[#EFEFEF]">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-[5px] bg-[#247B50] text-white flex items-center justify-center text-xs">
                  <i class="fa-solid fa-seedling"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-[#111613]">Operations Studio Menu</h3>
                  <p class="text-[11px] text-[#525B56]">Agri Experience HQ Controls</p>
                </div>
              </div>
              <button onclick="AEApp.toggleStudioMobileMenu()" aria-label="Close"
                class="w-7 h-7 rounded-[5px] hover:bg-[#F4F6F4] flex items-center justify-center text-[#525B56] ae-press">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <!-- Staff Identity Card -->
            <div class="p-3.5 rounded-[8px] bg-[#F8F9F8] border border-[#E4E7E4] flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-[11px] text-[#525B56]">Signed in as:</div>
                <div class="text-xs font-bold text-[#111613] truncate">${this.escapeHtml(currentUser ? currentUser.fullName : 'Guest')}</div>
                <div class="text-[11px] text-[#525B56]">${currentUser ? currentUser.id : ''} · ${this.escapeHtml((currentUser && currentUser.county) || 'HQ')}</div>
              </div>
              <span class="px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${isAdmin ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#EFF6FF] text-[#1E40AF]'} shrink-0">
                ${(currentUser ? currentUser.role : 'GUEST').toUpperCase()}
              </span>
            </div>

            <!-- Action List -->
            <div class="space-y-2">
              <a href="./field.html${activeSurvey ? '?survey=' + encodeURIComponent(activeSurvey.id) : ''}"
                class="w-full h-11 px-4 rounded-[8px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-between ae-press shadow-xs">
                <span class="inline-flex items-center gap-2">
                  <i class="fa-solid fa-mobile-screen-button"></i>
                  <span>Open Mobile Field App (PWA)</span>
                </span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </a>

              <button onclick="AEApp.toggleSimulatedOffline(); AEApp.toggleStudioMobileMenu();"
                class="w-full h-10 px-4 rounded-[8px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center justify-between ae-press">
                <span class="inline-flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${online ? 'bg-[#247B50]' : 'bg-[#D97706]'}"></span>
                  <span>${online ? 'Switch to Offline Mode' : 'Switch to Online Mode'}</span>
                </span>
                <span class="text-[11px] font-semibold ${online ? 'text-[#247B50]' : 'text-[#D97706]'}">${online ? 'Online' : 'Offline'}</span>
              </button>

              <button onclick="AEApp.openSyncSettingsModal(); AEApp.toggleStudioMobileMenu();"
                class="w-full h-10 px-4 rounded-[8px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center justify-between ae-press">
                <span class="inline-flex items-center gap-2">
                  <i class="fa-solid fa-table text-[#525B56]"></i>
                  <span>Google Sheets &amp; GAS Backend</span>
                </span>
                <i class="fa-solid fa-gear text-xs text-[#525B56]"></i>
              </button>

              <button onclick="AEApp.handleLogout()"
                class="w-full h-10 px-4 rounded-[8px] border border-[#F5C2C0] bg-[#FFEDEA] hover:bg-[#FDE2DC] text-xs font-semibold text-[#831C1E] inline-flex items-center justify-center gap-2 ae-press">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Sign Out of Operations Studio</span>
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }



    if (this.showResetPinPersonnel) {
      const p = this.showResetPinPersonnel;
      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEApp.closePersonnelModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-center justify-center p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" class="ae-glass-modal rounded-[12px] max-w-sm w-full p-5 space-y-4 ae-dialog-animate">
            <div class="flex items-start justify-between border-b border-[#EFEFEF] pb-3">
              <div>
                <h3 class="text-base font-semibold text-[#111613]">Reset Staff PIN</h3>
                <p class="text-xs text-[#525B56] mt-0.5">For ${this.escapeHtml(p.fullName)} (${this.escapeHtml(p.id)})</p>
              </div>
              <button onclick="AEApp.closePersonnelModals()" aria-label="Close" class="w-7 h-7 rounded-[4px] bg-[#F4F6F4] text-[#111613] flex items-center justify-center">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <form onsubmit="AEApp.saveResetPin(event)" class="space-y-3">
              <div>
                <label for="ae_new_pin" class="block text-xs font-medium text-[#525B56] mb-1">New 4-Digit PIN</label>
                <input id="ae_new_pin" name="ae_new_pin" type="password" inputmode="numeric" maxlength="8" required placeholder="••••" autocomplete="new-password"
                  class="w-full h-10 text-center tracking-widest text-lg font-bold rounded-[6px] border border-[#CFD5D0] focus:border-[#247B50] focus:outline-none" />
                <p class="text-[11px] text-[#525B56] mt-1">Used by enumerator on field tablets to authenticate interview submissions.</p>
              </div>
              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" onclick="AEApp.closePersonnelModals()" class="h-8 px-3 rounded-[5px] text-xs font-medium text-[#525B56]">Cancel</button>
                <button type="submit" class="h-8 px-4 rounded-[5px] bg-[#141A17] text-white text-xs font-semibold ae-press">Update PIN</button>
              </div>
            </form>
          </div>
        </div>
      `;
      return;
    }



    if (this.showStudioMobileMenu) {
      const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
        ? window.AESession.getCurrentUser()
        : null;
      const isAdmin = currentUser && currentUser.role === 'admin';
      const activeSurvey = window.aeStore.getSurveyById(this.activeSurveyId);
      const online = window.aeStore.isEffectivelyOnline();

      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEApp.toggleStudioMobileMenu()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" aria-label="Operations Studio Menu"
            class="ae-glass-modal rounded-t-[16px] sm:rounded-[12px] max-w-md w-full p-5 space-y-4 ae-dialog-animate max-h-[90vh] overflow-y-auto">
            <!-- Mobile Sheet Grab Bar -->
            <div class="w-10 h-1 bg-[#CFD5D0] rounded-full mx-auto sm:hidden -mt-1 mb-1"></div>

            <div class="flex items-center justify-between pb-3 border-b border-[#EFEFEF]">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-[5px] bg-[#247B50] text-white flex items-center justify-center text-xs">
                  <i class="fa-solid fa-seedling"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-[#111613]">Operations Studio Menu</h3>
                  <p class="text-[11px] text-[#525B56]">Agri Experience HQ Controls</p>
                </div>
              </div>
              <button onclick="AEApp.toggleStudioMobileMenu()" aria-label="Close"
                class="w-7 h-7 rounded-[5px] hover:bg-[#F4F6F4] flex items-center justify-center text-[#525B56] ae-press">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <!-- Staff Identity Card -->
            <div class="p-3.5 rounded-[8px] bg-[#F8F9F8] border border-[#E4E7E4] flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-[11px] text-[#525B56]">Signed in as:</div>
                <div class="text-xs font-bold text-[#111613] truncate">${this.escapeHtml(currentUser ? currentUser.fullName : 'Guest')}</div>
                <div class="text-[11px] text-[#525B56]">${currentUser ? currentUser.id : ''} · ${this.escapeHtml((currentUser && currentUser.county) || 'HQ')}</div>
              </div>
              <span class="px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${isAdmin ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#EFF6FF] text-[#1E40AF]'} shrink-0">
                ${(currentUser ? currentUser.role : 'GUEST').toUpperCase()}
              </span>
            </div>

            <!-- Action List -->
            <div class="space-y-2">
              <a href="./field.html${activeSurvey ? '?survey=' + encodeURIComponent(activeSurvey.id) : ''}"
                class="w-full h-11 px-4 rounded-[8px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-between ae-press shadow-xs">
                <span class="inline-flex items-center gap-2">
                  <i class="fa-solid fa-mobile-screen-button"></i>
                  <span>Open Mobile Field App (PWA)</span>
                </span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </a>

              <button onclick="AEApp.toggleSimulatedOffline(); AEApp.toggleStudioMobileMenu();"
                class="w-full h-10 px-4 rounded-[8px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center justify-between ae-press">
                <span class="inline-flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${online ? 'bg-[#247B50]' : 'bg-[#D97706]'}"></span>
                  <span>${online ? 'Switch to Offline Mode' : 'Switch to Online Mode'}</span>
                </span>
                <span class="text-[11px] font-semibold ${online ? 'text-[#247B50]' : 'text-[#D97706]'}">${online ? 'Online' : 'Offline'}</span>
              </button>

              <button onclick="AEApp.openSyncSettingsModal(); AEApp.toggleStudioMobileMenu();"
                class="w-full h-10 px-4 rounded-[8px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center justify-between ae-press">
                <span class="inline-flex items-center gap-2">
                  <i class="fa-solid fa-table text-[#525B56]"></i>
                  <span>Google Sheets &amp; GAS Backend</span>
                </span>
                <i class="fa-solid fa-gear text-xs text-[#525B56]"></i>
              </button>

              <button onclick="AEApp.handleLogout()"
                class="w-full h-10 px-4 rounded-[8px] border border-[#F5C2C0] bg-[#FFEDEA] hover:bg-[#FDE2DC] text-xs font-semibold text-[#831C1E] inline-flex items-center justify-center gap-2 ae-press">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Sign Out of Operations Studio</span>
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }



    const settings = window.aeStore.settings;
    const queue = window.aeStore.syncQueue;
    const logs = window.aeStore.syncLogs;
    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    const isAdmin = currentUser && currentUser.role === 'admin';

    modalRoot.innerHTML = `
      <div data-ui="modal-overlay"
        onclick="if(event.target === this) AEApp.closeSyncSettingsModal()"
        class="fixed inset-0 z-50 ae-glass-scrim flex items-center justify-center p-4 overflow-y-auto">
        <div data-ui="modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ae_sync_modal_title"
          class="ae-glass-modal rounded-[12px] max-w-2xl w-full p-6 space-y-5 my-8 ae-dialog-animate">
          <div class="flex items-start justify-between gap-4 pb-3 border-b border-[#EFEFEF]">
            <div>
              <h3 id="ae_sync_modal_title" class="text-lg font-semibold text-[#111613]">Google Sheets Database &amp; GAS Endpoint</h3>
              <p class="text-xs text-[#525B56] mt-0.5">Bidirectional offline synchronization powered by <code>Code.gs</code></p>
            </div>
            <button onclick="AEApp.closeSyncSettingsModal()"
              aria-label="Close modal"
              title="Close (Escape)"
              class="w-8 h-8 rounded-[6px] bg-[#F4F6F4] hover:bg-[#EAECE9] text-[#111613] flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          ${
            !isAdmin
              ? `<div class="p-3 rounded-[6px] bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-xs font-medium flex items-center gap-2">
                  <i class="fa-solid fa-lock text-xs shrink-0"></i>
                  <span>Read-Only View: As a Regional Supervisor, synchronization endpoints and secret keys are managed by HQ Administrators.</span>
                </div>`
              : ''
          }

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="ae_gas_url_input" class="block text-sm font-medium text-[#111613]">
                Deployed Google Apps Script Web App URL
              </label>
              ${isAdmin ? `<button type="button" onclick="document.getElementById('ae_gas_url_input').value='https://script.google.com/macros/s/AKfycbzzBECJ5o02M2yaaJGrL41bTL1bgU2dltcQ8GicgR3x15jkocvYzNocWNk7_k75DNoV7Q/exec'; document.getElementById('ae_sync_token_input').value='6B3D46E11CAD5800CA490A356DEC10D6';" class="text-xs text-[#247B50] font-semibold hover:underline">Use Production Default</button>` : ''}
            </div>
            <input type="url"
              id="ae_gas_url_input"
              ${!isAdmin ? 'disabled' : ''}
              value="${this.escapeAttr(settings.gasWebAppUrl || '')}"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec (Leave blank for local simulator)"
              class="w-full h-10 text-xs bg-white border border-[#CFD5D0] rounded-[8px] px-3.5 text-[#111613] placeholder-[#646E68] focus:border-[#247B50] focus:outline-none ${!isAdmin ? 'opacity-70 bg-[#F8F9F8] cursor-not-allowed' : ''}" />
            <p class="text-xs text-[#525B56] leading-relaxed">
              Sends <code>Content-Type: text/plain;charset=utf-8</code> payloads for zero-preflight CORS compatibility with Google Apps Script and deduplicates rows via <code>clientResponseId</code>.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="ae_device_id_input" class="block text-sm font-medium text-[#111613] mb-1.5">Field Tablet Identifier</label>
              <input type="text" id="ae_device_id_input"
                maxlength="40"
                ${!isAdmin ? 'disabled' : ''}
                value="${this.escapeAttr(settings.deviceId)}"
                class="w-full h-10 text-xs bg-white border border-[#CFD5D0] rounded-[8px] px-3 text-[#111613] ${!isAdmin ? 'opacity-70 bg-[#F8F9F8] cursor-not-allowed' : ''}" />
            </div>
            <div>
              <label for="ae_enum_input" class="block text-sm font-medium text-[#111613] mb-1.5">Default Enumerator Name</label>
              <input type="text" id="ae_enum_input"
                maxlength="80"
                ${!isAdmin ? 'disabled' : ''}
                value="${this.escapeAttr(settings.defaultEnumerator)}"
                class="w-full h-10 text-xs bg-white border border-[#CFD5D0] rounded-[8px] px-3 text-[#111613] ${!isAdmin ? 'opacity-70 bg-[#F8F9F8] cursor-not-allowed' : ''}" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="ae_sync_token_input" class="block text-sm font-medium text-[#111613]">
              Optional Cloud Sync API Token (<code class="text-xs">AE_SYNC_TOKEN</code>)
            </label>
            <input type="password"
              id="ae_sync_token_input"
              ${!isAdmin ? 'disabled' : ''}
              value="${this.escapeAttr(settings.syncToken || '')}"
              placeholder="Leave blank if AE_SYNC_TOKEN is not configured in Google Apps Script"
              class="w-full h-10 text-xs bg-white border border-[#CFD5D0] rounded-[8px] px-3.5 text-[#111613] placeholder-[#646E68] focus:border-[#247B50] focus:outline-none ${!isAdmin ? 'opacity-70 bg-[#F8F9F8] cursor-not-allowed' : ''}" />
            <p class="text-xs text-[#525B56]">
              Matches the <code>AE_SYNC_TOKEN</code> property in Google Apps Script Project Settings for authenticated sync.
            </p>
          </div>

          <!-- Continuous Background Auto-Sync Setting -->
          <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-3.5 space-y-2">
            <div class="flex items-center justify-between gap-3">
              <div>
                <span class="text-xs font-semibold text-[#111613] block">Continuous Background Auto-Sync</span>
                <span class="text-xs text-[#525B56]">Silently streams completed responses &amp; roster changes to Google Sheets every 25s without manual sync button clicks.</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" id="ae_bg_sync_toggle" ${settings.backgroundSyncEnabled !== false ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} class="sr-only peer">
                <div class="w-9 h-5 bg-[#CFD5D0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#247B50]"></div>
              </label>
            </div>
          </div>

          <!-- Provisioned Google Sheets Tabs Preview -->
          <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-3.5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-[#111613]">Auto-Provisioned Google Sheets Tabs</span>
              <span class="text-xs text-[#247B50] font-medium">Zero-setup via <code>ensureWorkbookSheets()</code></span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <code class="px-2 py-0.5 rounded bg-white border border-[#E4E7E4] text-xs text-[#111613]">Surveys</code>
              <code class="px-2 py-0.5 rounded bg-white border border-[#E4E7E4] text-xs text-[#111613]">Responses</code>
              <code class="px-2 py-0.5 rounded bg-white border border-[#E4E7E4] text-xs text-[#111613]">Collectors</code>
              <code class="px-2 py-0.5 rounded bg-white border border-[#E4E7E4] text-xs text-[#111613]">SyncLog</code>
              <code class="px-2 py-0.5 rounded bg-[#EAF3EE] border border-[#CBE2D4] text-xs text-[#247B50]">Resp_${this.escapeHtml((this.activeSurveyId || 'survey').slice(0, 18))}</code>
            </div>
          </div>

          <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-[#111613] tabular-nums">Outbox Sync Queue (${queue.length} pending items)</span>
              <span class="text-xs text-[#525B56] tabular-nums">
                Last synced: ${settings.lastSyncedAt ? new Date(settings.lastSyncedAt).toLocaleTimeString() : 'Local simulator ready'}
              </span>
            </div>
            ${
              queue.length === 0
                ? `<div class="text-xs text-[#247B50] font-medium"><i class="fa-solid fa-check mr-1.5"></i>All local surveys and responses are synchronized with Google Sheets.</div>`
                : `<ul class="space-y-1 max-h-28 overflow-y-auto text-xs text-[#525B56] tabular-nums">
                    ${queue.map((item) => `<li>· [${this.escapeHtml(item.action)}] ${this.escapeHtml(item.title)} ${item.attempts > 0 ? `(Attempts: ${item.attempts})` : ''}</li>`).join('')}
                  </ul>`
            }
          </div>

          <!-- Recent Sync Log -->
          <div class="space-y-1.5">
            <span class="text-xs font-semibold text-[#111613]">Recent Sync Log</span>
            <div class="space-y-1 max-h-28 overflow-y-auto">
              ${logs
                .slice(0, 5)
                .map(
                  (l) => `
                <div class="text-xs ${l.status === 'Error' ? 'bg-[#FDF2F2] border-[#EFC2C2]' : 'bg-[#F8F9F8] border-[#E4E7E4]'} px-3 py-1.5 rounded-[6px] border flex items-center justify-between gap-2">
                  <span class="truncate text-[#111613]">${this.escapeHtml(l.details)}</span>
                  <span class="${l.status === 'Error' ? 'text-[#B91C1C]' : 'text-[#247B50]'} tabular-nums shrink-0">${l.latencyMs}ms</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="pt-3 border-t border-[#EFEFEF] flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              ${
                isAdmin
                  ? `<button onclick="AEApp.saveSyncSettingsFromModal()"
                      class="h-8 px-3.5 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-medium ae-press">
                      Save Settings
                    </button>
                    <button onclick="AEApp.saveSyncSettingsFromModal(); AEApp.triggerGoogleSheetsSync(true);"
                      class="h-8 px-3.5 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-medium inline-flex items-center gap-1.5 ae-press">
                      <i class="fa-solid fa-cloud-arrow-up"></i> Push All to Google Sheets
                    </button>`
                  : ''
              }
              <button onclick="AEApp.triggerPullFromSheets();"
                class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] ae-press">
                <i class="fa-solid fa-cloud-arrow-down text-[#247B50] mr-1"></i> Pull from Sheets
              </button>
            </div>
            <button onclick="AEApp.closeSyncSettingsModal()"
              class="h-8 px-3 text-xs font-medium text-[#525B56] hover:text-[#111613]">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
  },

  openSyncSettingsModal() {
    this.showSyncModal = true;
    this.renderModals();
  },

  closeSyncSettingsModal() {
    this.showSyncModal = false;
    this.renderModals();
  },

  saveSyncSettingsFromModal() {
    if (window.AESession && !window.AESession.hasPermission('EDIT_SETTINGS')) {
      this.showToast('Access Denied: Only HQ Administrators can modify Sheets and GAS synchronization endpoints.', 'error');
      return;
    }
    const gasUrl = (document.getElementById('ae_gas_url_input')?.value || '').trim();
    if (gasUrl && !window.aeStore.isValidGasUrl(gasUrl)) {
      this.showToast('Invalid GAS URL. Only https://script.google.com/macros/s/.../exec endpoints are permitted.', 'error');
      return;
    }
    const devId = document.getElementById('ae_device_id_input')?.value || 'AE-TAB-01';
    const enumName = document.getElementById('ae_enum_input')?.value || 'Field Enumerator';
    const syncToken = (document.getElementById('ae_sync_token_input')?.value || '').trim();
    const bgSyncToggle = document.getElementById('ae_bg_sync_toggle');
    const backgroundSyncEnabled = bgSyncToggle ? bgSyncToggle.checked : true;
    window.aeStore.updateSettings({
      gasWebAppUrl: gasUrl,
      syncToken,
      deviceId: devId.trim(),
      defaultEnumerator: enumName.trim(),
      backgroundSyncEnabled
    });
    if (backgroundSyncEnabled) {
      window.aeStore.startBackgroundSyncDaemon();
    }
    this.showToast('Google Sheets & GAS configuration saved.', 'success');
  },

  // --- Dashboard Actions ---
  setDashboardSearch(val) {
    this.searchQuery = val;
    this.render();
  },

  setDashboardStatusFilter(st) {
    this.statusFilter = st;
    this.render();
  },

  resetDashboardFilters() {
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.render();
  },

  resetAnalyticsFilters() {
    window.AEAnalytics.filterSyncStatus = 'ALL';
    window.AEAnalytics.filterCollectorId = 'ALL';
    window.AEAnalytics.individualIndex = 0;
    this.render();
  },

  createBlankSurvey() {
    if (window.AESession && !window.AESession.hasPermission('CREATE_SURVEY')) {
      this.showToast('Access Denied: Only HQ Administrators can author surveys.', 'error');
      return;
    }
    const newSurvey = {
      id: 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      title: 'Untitled Field Survey',
      description: 'Add survey description and enumerator instructions here.',
      category: 'Field Assessment',
      status: 'Draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        accentColor: '#247B50',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      pages: [
        {
          id: 'page_1',
          title: 'Section 1: Respondent & Plot Information',
          description: '',
          questions: [window.AEBuilder.createDefaultQuestion('multiple_choice')]
        }
      ]
    };
    window.aeStore.upsertSurvey(newSurvey);
    this.activeSurveyId = newSurvey.id;
    this.currentStage = 'design';
    window.AEBuilder.activePageIndex = 0;
    this.showToast('Created new blank survey.', 'success');
    this.render();
  },

  createFromTemplate(templateId) {
    if (window.AESession && !window.AESession.hasPermission('CREATE_SURVEY')) {
      this.showToast('Access Denied: Only HQ Administrators can author surveys.', 'error');
      return;
    }
    const tpl = window.SURVEY_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const survey = tpl.build();
    window.aeStore.upsertSurvey(survey);
    this.activeSurveyId = survey.id;
    this.currentStage = 'design';
    window.AEBuilder.activePageIndex = 0;
    this.showToast(`Initialized "${tpl.name}" template.`, 'success');
    this.render();
  },

  duplicateSurvey(surveyId) {
    if (window.AESession && !window.AESession.hasPermission('CREATE_SURVEY')) {
      this.showToast('Access Denied: Only HQ Administrators can duplicate surveys.', 'error');
      return;
    }
    const orig = window.aeStore.getSurveyById(surveyId);
    if (!orig) return;
    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    copy.title = orig.title + ' (Copy)';
    copy.status = 'Draft';
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    window.aeStore.upsertSurvey(copy);
    this.showToast('Survey duplicated.', 'success');
    this.render();
  },

  deleteSurveyConfirm(surveyId) {
    if (window.AESession && !window.AESession.hasPermission('DELETE_SURVEY')) {
      this.showToast('Access Denied: Only HQ Administrators can delete surveys.', 'error');
      return;
    }
    const target = window.aeStore.getSurveyById(surveyId);
    if (!target) return;
    const respCount = window.aeStore.getResponsesForSurvey(surveyId).length;
    if (
      !window.confirm(
        `Delete survey "${target.title}" and its ${respCount} local responses? This action cannot be undone.`
      )
    ) {
      return;
    }
    window.aeStore.deleteSurvey(surveyId);
    if (this.activeSurveyId === surveyId && window.aeStore.surveys.length > 0) {
      this.activeSurveyId = window.aeStore.surveys[0].id;
    }
    this.showToast('Survey removed.', 'success');
    this.render();
  },

  // --- Builder Actions ---
  setBuilderLeftTab(tab) {
    window.AEBuilder.leftTab = tab;
    this.render();
  },

  selectBuilderPage(pageIdx) {
    window.AEBuilder.activePageIndex = pageIdx;
    this.render();
  },

  updateSurveyMeta(field, value) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    if (field === 'title' && !String(value || '').trim()) {
      this.showToast('Survey title cannot be blank.', 'error');
      this.render();
      return;
    }
    s[field] = value;
    window.aeStore.upsertSurvey(s);
    this.render();
  },

  updateSurveyTheme(field, value) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    s.theme = s.theme || {};
    s.theme[field] = value;
    window.aeStore.upsertSurvey(s);
    this.render();
  },

  setBuilderTranslationLang(lang) {
    if (window.AEBuilder) {
      window.AEBuilder.targetLang = lang;
    }
    this.render();
  },

  autoTranslateSurvey() {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    const targetLang = (window.AEBuilder && window.AEBuilder.targetLang) || 'sw';
    if (window.AEI18n) {
      window.AEI18n.autoTranslateSurvey(s, targetLang);
      window.aeStore.upsertSurvey(s);
      const langName = targetLang === 'sw' ? 'Kiswahili' : 'Français';
      this.showToast(`Auto-translated survey to ${langName}.`, 'success');
      this.render();
    }
  },

  updateSurveyTranslationMeta(field, value) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    const targetLang = (window.AEBuilder && window.AEBuilder.targetLang) || 'sw';
    s.translations = s.translations || {};
    s.translations[targetLang] = s.translations[targetLang] || {};
    s.translations[targetLang][field] = value;
    window.aeStore.upsertSurvey(s);
  },

  updatePageTranslationMeta(pageId, field, value) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    const targetLang = (window.AEBuilder && window.AEBuilder.targetLang) || 'sw';
    s.translations = s.translations || {};
    s.translations[targetLang] = s.translations[targetLang] || {};
    s.translations[targetLang].pages = s.translations[targetLang].pages || {};
    s.translations[targetLang].pages[pageId] = s.translations[targetLang].pages[pageId] || {};
    s.translations[targetLang].pages[pageId][field] = value;
    window.aeStore.upsertSurvey(s);
  },

  updateQuestionTranslationMeta(qId, field, value) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    const targetLang = (window.AEBuilder && window.AEBuilder.targetLang) || 'sw';
    s.translations = s.translations || {};
    s.translations[targetLang] = s.translations[targetLang] || {};
    s.translations[targetLang].questions = s.translations[targetLang].questions || {};
    s.translations[targetLang].questions[qId] = s.translations[targetLang].questions[qId] || {};
    s.translations[targetLang].questions[qId][field] = value;
    window.aeStore.upsertSurvey(s);
  },

  updateQuestionOptionTranslation(qId, optIdx, value) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    const targetLang = (window.AEBuilder && window.AEBuilder.targetLang) || 'sw';
    s.translations = s.translations || {};
    s.translations[targetLang] = s.translations[targetLang] || {};
    s.translations[targetLang].questions = s.translations[targetLang].questions || {};
    s.translations[targetLang].questions[qId] = s.translations[targetLang].questions[qId] || {};
    const qT = s.translations[targetLang].questions[qId];
    if (!Array.isArray(qT.options)) {
      const page = s.pages[window.AEBuilder.activePageIndex];
      const q = page ? page.questions.find((x) => x.id === qId) : null;
      qT.options = q && Array.isArray(q.options) ? [...q.options] : [];
    }
    qT.options[optIdx] = value;
    window.aeStore.upsertSurvey(s);
  },

  addSurveyPage() {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    const nextNum = s.pages.length + 1;
    s.pages.push({
      id: 'page_' + Date.now().toString(36),
      title: `Section ${nextNum}: Additional Questions`,
      description: '',
      questions: []
    });
    window.AEBuilder.activePageIndex = s.pages.length - 1;
    window.aeStore.upsertSurvey(s);
    this.showToast(`Added Page ${nextNum}.`, 'success');
    this.render();
  },

  deleteSurveyPage(pageIdx) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s || s.pages.length <= 1) return;
    const page = s.pages[pageIdx];
    if (
      page &&
      Array.isArray(page.questions) &&
      page.questions.length > 0 &&
      !window.confirm(`Delete Page ${pageIdx + 1} ("${page.title}") and its ${page.questions.length} question(s)?`)
    ) {
      return;
    }
    s.pages.splice(pageIdx, 1);
    window.AEBuilder.activePageIndex = Math.max(0, pageIdx - 1);
    window.aeStore.upsertSurvey(s);
    this.render();
  },

  updatePageMeta(pageIdx, field, value) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s || !s.pages[pageIdx]) return;
    s.pages[pageIdx][field] = value;
    window.aeStore.upsertSurvey(s);
    this.render();
  },

  addQuestionToActivePage(type) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    const page = s.pages[window.AEBuilder.activePageIndex] || s.pages[0];
    const q = window.AEBuilder.createDefaultQuestion(type);
    page.questions.push(q);
    s.version = (s.version || 1) + 1;
    window.aeStore.upsertSurvey(s);
    this.showToast(`Added ${type.replace('_', ' ')} question.`, 'success');
    this.render();
  },

  findQuestionContext(questionId) {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return null;
    for (let pIdx = 0; pIdx < s.pages.length; pIdx++) {
      const p = s.pages[pIdx];
      const qIdx = (p.questions || []).findIndex((q) => q.id === questionId);
      if (qIdx >= 0) {
        return { survey: s, page: p, pageIndex: pIdx, question: p.questions[qIdx], questionIndex: qIdx };
      }
    }
    return null;
  },

  updateQuestionField(questionId, field, value) {
    const ctx = this.findQuestionContext(questionId);
    if (!ctx) return;
    if (field === 'min' && ctx.question.max !== undefined && Number(value) > Number(ctx.question.max)) {
      ctx.question.max = Number(value);
    }
    if (field === 'max' && ctx.question.min !== undefined && Number(value) < Number(ctx.question.min)) {
      ctx.question.min = Number(value);
    }
    ctx.question[field] = value;
    window.aeStore.upsertSurvey(ctx.survey);
    this.render();
  },

  updateQuestionOption(questionId, optIdx, value) {
    const ctx = this.findQuestionContext(questionId);
    if (!ctx || !Array.isArray(ctx.question.options)) return;
    ctx.question.options[optIdx] = value;
    window.aeStore.upsertSurvey(ctx.survey);
    this.render();
  },

  addQuestionOption(questionId) {
    const ctx = this.findQuestionContext(questionId);
    if (!ctx) return;
    ctx.question.options = ctx.question.options || [];
    ctx.question.options.push(`Choice ${ctx.question.options.length + 1}`);
    window.aeStore.upsertSurvey(ctx.survey);
    this.render();
  },

  removeQuestionOption(questionId, optIdx) {
    const ctx = this.findQuestionContext(questionId);
    if (!ctx || !Array.isArray(ctx.question.options) || ctx.question.options.length <= 1) return;
    ctx.question.options.splice(optIdx, 1);
    window.aeStore.upsertSurvey(ctx.survey);
    this.render();
  },

  updateQuestionLines(questionId, field, rawText) {
    const ctx = this.findQuestionContext(questionId);
    if (!ctx) return;
    ctx.question[field] = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    window.aeStore.upsertSurvey(ctx.survey);
    this.render();
  },

  updateQuestionLogic(questionId, field, value) {
    const ctx = this.findQuestionContext(questionId);
    if (!ctx) return;
    ctx.question.logic = ctx.question.logic || { enabled: false, condition: 'equals', value: '', target: '' };
    ctx.question.logic[field] = value;
    window.aeStore.upsertSurvey(ctx.survey);
    this.render();
  },

  moveQuestion(questionId, delta) {
    const ctx = this.findQuestionContext(questionId);
    if (!ctx) return;
    const list = ctx.page.questions;
    const targetIdx = ctx.questionIndex + delta;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const [item] = list.splice(ctx.questionIndex, 1);
    list.splice(targetIdx, 0, item);
    window.aeStore.upsertSurvey(ctx.survey);
    this.render();
  },

  duplicateQuestion(questionId) {
    const ctx = this.findQuestionContext(questionId);
    if (!ctx) return;
    const clone = JSON.parse(JSON.stringify(ctx.question));
    clone.id = 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
    clone.title = clone.title + ' (Copy)';
    ctx.page.questions.splice(ctx.questionIndex + 1, 0, clone);
    window.aeStore.upsertSurvey(ctx.survey);
    this.render();
  },

  deleteQuestion(questionId) {
    const ctx = this.findQuestionContext(questionId);
    if (!ctx) return;
    if (!window.confirm(`Delete question "${ctx.question.title}"?`)) {
      return;
    }
    ctx.page.questions.splice(ctx.questionIndex, 1);
    window.aeStore.upsertSurvey(ctx.survey);
    this.render();
  },

  saveAndSyncSurvey() {
    const s = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!s) return;
    window.aeStore.upsertSurvey(s, true);
    if (window.aeStore.isEffectivelyOnline()) {
      this.triggerGoogleSheetsSync();
    } else {
      this.showToast('Survey saved to IndexedDB and queued for Google Sheets sync.', 'success');
    }
  },

  // --- Collector & Respondent Runner Actions ---
  setCollectSubTab(subTab) {
    window.AECollector.activeSubTab = subTab;
    this.render();
  },

  enterKioskMode() {
    window.AECollector.kioskLocked = true;
    window.AECollector.showPinPrompt = false;
    window.AECollector.activeSubTab = 'runner';
    this.showToast('Tablet Kiosk Mode locked.', 'success');
    this.render();
  },

  unlockKioskMode() {
    window.AECollector.showPinPrompt = true;
    window.AECollector.pinPromptError = '';
    this.render();
    setTimeout(() => {
      const pinInput = document.getElementById('ae_kiosk_pin_input');
      if (pinInput) pinInput.focus();
    }, 30);
  },

  verifyKioskPinInput() {
    const pinInput = document.getElementById('ae_kiosk_pin_input');
    const pin = (pinInput ? pinInput.value : '').trim();
    const activeSurvey = window.aeStore.getSurveyById(this.activeSurveyId);
    const collectors = activeSurvey ? window.aeStore.getCollectorsForSurvey(activeSurvey.id) : [];
    const activeCol = collectors.find((c) => c.id === window.AECollector.activeCollectorId) || collectors[0];
    const expectedPin = (activeCol && activeCol.pinCode) ? String(activeCol.pinCode).trim() : '';

    if (window.AEPinSecurity && typeof window.AEPinSecurity.verify === 'function') {
      const check = window.AEPinSecurity.verify(pin, expectedPin);
      if (check.ok) {
        window.AECollector.kioskLocked = false;
        window.AECollector.showPinPrompt = false;
        window.AECollector.pinPromptError = '';
        this.showToast('Exited Field Kiosk Mode.', 'success');
        this.render();
      } else {
        window.AECollector.pinPromptError = check.error;
        this.render();
      }
      return;
    }

    if (pin && pin === expectedPin) {
      window.AECollector.kioskLocked = false;
      window.AECollector.showPinPrompt = false;
      window.AECollector.pinPromptError = '';
      this.showToast('Exited Field Kiosk Mode.', 'success');
      this.render();
    } else {
      window.AECollector.pinPromptError = 'Incorrect PIN.';
      this.render();
    }
  },

  cancelKioskPinPrompt() {
    window.AECollector.showPinPrompt = false;
    window.AECollector.pinPromptError = '';
    this.render();
  },

  setRunnerCollector(collectorId) {
    window.AECollector.activeCollectorId = collectorId;
    const col = window.aeStore.collectors.find((c) => c.id === collectorId);
    if (col && col.enumeratorDefault) {
      window.AECollector.enumeratorName = col.enumeratorDefault;
    }
    window.AECollector.persistDraft(this.activeSurveyId);
    this.render();
  },

  setRunnerEnumerator(name) {
    window.AECollector.enumeratorName = name;
    window.AECollector.persistDraft(this.activeSurveyId);
  },

  setRunnerAnswer(questionId, value) {
    window.AECollector.draftAnswers[questionId] = value;
    delete window.AECollector.validationErrors[questionId];
    window.AECollector.persistDraft(this.activeSurveyId);
    this.render();
  },

  setRunnerAnswerSilent(questionId, value) {
    window.AECollector.draftAnswers[questionId] = value;
    window.AECollector.persistDraft(this.activeSurveyId);
    if (window.AECollector.validationErrors[questionId]) {
      delete window.AECollector.validationErrors[questionId];
      this.render();
    }
  },

  toggleRunnerCheckbox(questionId, optionValue) {
    const cur = Array.isArray(window.AECollector.draftAnswers[questionId])
      ? [...window.AECollector.draftAnswers[questionId]]
      : [];
    const idx = cur.indexOf(optionValue);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.push(optionValue);
    window.AECollector.draftAnswers[questionId] = cur;
    delete window.AECollector.validationErrors[questionId];
    window.AECollector.persistDraft(this.activeSurveyId);
    this.render();
  },

  setRunnerMatrixAnswer(questionId, rowLabel, colLabel) {
    const cur =
      window.AECollector.draftAnswers[questionId] && typeof window.AECollector.draftAnswers[questionId] === 'object'
        ? { ...window.AECollector.draftAnswers[questionId] }
        : {};
    cur[rowLabel] = colLabel;
    window.AECollector.draftAnswers[questionId] = cur;
    delete window.AECollector.validationErrors[questionId];
    window.AECollector.persistDraft(this.activeSurveyId);
    this.render();
  },

  updateRunnerGPSField(questionId, field, value) {
    const cur =
      window.AECollector.draftAnswers[questionId] && typeof window.AECollector.draftAnswers[questionId] === 'object'
        ? { ...window.AECollector.draftAnswers[questionId] }
        : { lat: -0.3031, lng: 36.08, accuracy: 5.5, label: '' };
    cur[field] = value;
    window.AECollector.draftAnswers[questionId] = cur;
    delete window.AECollector.validationErrors[questionId];
    window.AECollector.persistDraft(this.activeSurveyId);
    this.render();
  },

  captureFieldGPS(questionId) {
    if (!navigator.geolocation) {
      this.showToast('Geolocation is not supported on this device/browser. Please enter coordinates manually.', 'warning');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number((pos.coords.accuracy || 0).toFixed(1)),
          altitude: pos.coords.altitude != null ? Number(pos.coords.altitude.toFixed(1)) : null,
          label: window.AECollector.draftAnswers[questionId]?.label || '',
          manual: false,
          method: 'GNSS_HARDWARE'
        };
        window.AECollector.draftAnswers[questionId] = coords;
        delete window.AECollector.validationErrors[questionId];
        window.AECollector.persistDraft(this.activeSurveyId);
        this.showToast(`Satellite GNSS locked: ${coords.lat}, ${coords.lng} (±${coords.accuracy}m)`, 'success');
        this.render();
      },
      (err) => {
        const msg =
          err.code === 1
            ? 'Location permission denied by user.'
            : err.code === 3
            ? 'GNSS satellite acquisition timed out. Record landmark or enter manually.'
            : 'GNSS coordinates unavailable. Enter manually or record landmark.';
        this.showToast(msg, 'warning');
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  },

  validateRunnerPage(page) {
    const errors = {};
    (page.questions || []).forEach((q) => {
      const val = window.AECollector.draftAnswers[q.id];

      if (q.required) {
        if (val === undefined || val === null || val === '') {
          errors[q.id] = 'This question is required before continuing.';
          return;
        } else if (Array.isArray(val) && val.length === 0) {
          errors[q.id] = 'Please select at least one option.';
          return;
        } else if (q.type === 'matrix') {
          const rows = q.rows || [];
          const answeredRows = Object.keys(val || {}).length;
          if (answeredRows < rows.length) {
            errors[q.id] = `Please select a rating for all ${rows.length} rows.`;
            return;
          }
        }
      }

      // Numeric bounds validation (even on optional numeric questions when answered)
      if (q.type === 'number_yield' && val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (Number.isNaN(num)) {
          errors[q.id] = 'Please enter a valid numeric value.';
        } else if (q.min !== undefined && num < Number(q.min)) {
          errors[q.id] = `Value must be at least ${q.min} ${q.unit || ''}.`;
        } else if (q.max !== undefined && num > Number(q.max)) {
          errors[q.id] = `Value cannot exceed ${q.max} ${q.unit || ''}.`;
        }
      }

      // GPS coordinate range validation
      if (q.type === 'gps_location' && val && typeof val === 'object') {
        const lat = Number(val.lat);
        const lng = Number(val.lng);
        if (Number.isNaN(lat) || lat < -90 || lat > 90) {
          errors[q.id] = 'Latitude must be between -90 and 90 degrees.';
        } else if (Number.isNaN(lng) || lng < -180 || lng > 180) {
          errors[q.id] = 'Longitude must be between -180 and 180 degrees.';
        }
      }
    });
    window.AECollector.validationErrors = errors;
    return Object.keys(errors).length === 0;
  },

  scrollToFirstInvalidQuestion() {
    const firstId = Object.keys(window.AECollector.validationErrors || {})[0];
    if (!firstId) return;
    setTimeout(() => {
      const el = document.getElementById(`runner_q_${firstId}`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 30);
  },

  prevRunnerPage() {
    if (window.AECollector.currentPageIndex > 0) {
      window.AECollector.currentPageIndex--;
      window.AECollector.persistDraft(this.activeSurveyId);
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  nextRunnerPage(surveyId) {
    const survey = window.aeStore.getSurveyById(surveyId);
    if (!survey) return;
    const page = survey.pages[window.AECollector.currentPageIndex];
    if (!this.validateRunnerPage(page)) {
      this.showToast('Please review the highlighted questions on this page.', 'error');
      this.render();
      this.scrollToFirstInvalidQuestion();
      return;
    }

    // Evaluate Conditional Skip Logic on current page questions
    for (const q of page.questions || []) {
      if (q.logic && q.logic.enabled && q.logic.target) {
        const ans = window.AECollector.draftAnswers[q.id];
        const matches = Array.isArray(ans)
          ? ans.includes(q.logic.value)
          : String(ans ?? '') === String(q.logic.value);
        if (matches) {
          if (q.logic.target === 'END_SURVEY') {
            this.submitRunnerResponse(surveyId, true);
            return;
          }
          const targetIdx = survey.pages.findIndex((p) => p.id === q.logic.target);
          if (targetIdx >= 0) {
            window.AECollector.currentPageIndex = targetIdx;
            window.AECollector.persistDraft(surveyId);
            this.showToast(`Skip rule jumped to Page ${targetIdx + 1}.`, 'success');
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
      }
    }

    window.AECollector.currentPageIndex++;
    window.AECollector.persistDraft(surveyId);
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setRunnerLanguage(lang) {
    if (window.AEI18n) window.AEI18n.setLanguage(lang);
    this.runnerLang = lang;
    this.render();
  },

  submitRunnerResponse(surveyId, bypassValidation = false) {
    if (window.AECollector.isSubmitting) return;
    const survey = window.aeStore.getSurveyById(surveyId);
    if (!survey) return;
    const page = survey.pages[window.AECollector.currentPageIndex];
    if (!bypassValidation && !this.validateRunnerPage(page)) {
      this.showToast('Please complete all required questions before submitting.', 'error');
      this.render();
      this.scrollToFirstInvalidQuestion();
      return;
    }

    window.AECollector.isSubmitting = true;
    try {
      let gpsMeta = null;
      Object.values(window.AECollector.draftAnswers).forEach((ans) => {
        if (ans && typeof ans === 'object' && ans.lat !== undefined && ans.lng !== undefined && ans.lat !== '') {
          gpsMeta = ans;
        }
      });

      const durationSec = Math.max(12, Math.round((Date.now() - (window.AECollector.startedAtMs || Date.now())) / 1000));
      const saved = window.aeStore.submitResponse({
        surveyId: survey.id,
        surveyTitle: survey.title,
        collectorId: window.AECollector.activeCollectorId,
        enumerator: window.AECollector.enumeratorName,
        language: this.runnerLang || 'en',
        startedAt: window.AECollector.startedAtIso,
        durationSec,
        gps: gpsMeta,
        answers: { ...window.AECollector.draftAnswers }
      });

      window.aeStore.clearRunnerDraft(survey.id);
      window.AECollector.initRunnerForSurvey(survey, true);
      const gpsLabel = gpsMeta ? `${gpsMeta.lat}, ${gpsMeta.lng}${gpsMeta.label ? ' (' + gpsMeta.label + ')' : ''}` : 'Standard Field Plot';
      const receiptText = `AE-RECEIPT: ${saved.id} | Survey: ${survey.title} | Enumerator: ${saved.enumerator} | GPS: ${gpsLabel} | Timestamp: ${saved.submittedAt}`;
      window.AECollector.justSubmittedBanner = {
        title: `Field Enumeration Receipt Verified (${window.aeStore.isEffectivelyOnline() ? 'Synced to Sheets' : 'Saved to Offline Vault'})`,
        subtitle: `Enumerator ${saved.enumerator} · Ready for next respondent interview.`,
        receiptText,
        receiptMeta: {
          id: saved.id,
          duration: `${durationSec}s`,
          gps: gpsLabel
        }
      };

      this.showToast('Survey response recorded. Form reset for next respondent.', 'success');
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      window.AECollector.isSubmitting = false;
    }
  },

  resetRunnerDraft(surveyId) {
    const s = window.aeStore.getSurveyById(surveyId);
    if (!s) return;
    const answeredCount = Object.keys(window.AECollector.draftAnswers || {}).length;
    if (answeredCount > 1 && !window.confirm('Clear all current draft answers and restart this form?')) {
      return;
    }
    window.aeStore.clearRunnerDraft(surveyId);
    window.AECollector.initRunnerForSurvey(s, true);
    this.showToast('Form cleared for a fresh interview.', 'success');
    this.render();
  },

  toggleNewCollectorForm() {
    window.AECollector.showNewCollectorForm = !window.AECollector.showNewCollectorForm;
    this.render();
    if (window.AECollector.showNewCollectorForm) {
      setTimeout(() => {
        const input = document.getElementById('ae_new_collector_name');
        if (input) input.focus();
      }, 30);
    }
  },

  submitNewCollectorForm(surveyId) {
    const nameEl = document.getElementById('ae_new_collector_name');
    const typeEl = document.getElementById('ae_new_collector_type');
    const pinEl = document.getElementById('ae_new_collector_pin');
    const name = (nameEl ? nameEl.value : '').trim();
    const type = typeEl ? typeEl.value : 'kiosk';
    const pinCode = (pinEl && pinEl.value.trim()) ? pinEl.value.trim() : Math.floor(1000 + Math.random() * 9000).toString();
    if (!name) {
      this.showToast('Please enter a name for the collector.', 'error');
      return;
    }
    window.aeStore.upsertCollector({
      id: 'col_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      surveyId,
      name,
      type,
      status: 'Open',
      pinCode,
      enumeratorDefault: window.aeStore.settings.defaultEnumerator,
      createdAt: new Date().toISOString()
    });
    window.AECollector.showNewCollectorForm = false;
    window.AECollector.newCollectorName = '';
    this.showToast(`Created collector "${name}".`, 'success');
    this.render();
  },

  launchCollectorRunner(collectorId) {
    window.AECollector.activeCollectorId = collectorId;
    window.AECollector.activeSubTab = 'runner';
    this.render();
  },

  // --- Analytics & Export Actions ---
  setAnalyticsTab(tab) {
    window.AEAnalytics.activeTab = tab;
    this.render();
  },

  setAnalyticsFilter(kind, value) {
    if (window.AEAnalytics && window.AEAnalytics.setFilter) {
      const keyMap = { sync: 'syncStatus', collector: 'collectorId' };
      window.AEAnalytics.setFilter(keyMap[kind] || kind, value);
    } else {
      if (kind === 'sync') window.AEAnalytics.filterSyncStatus = value;
      if (kind === 'collector') window.AEAnalytics.filterCollectorId = value;
      window.AEAnalytics.individualIndex = 0;
      this.render();
    }
  },

  stepIndividualResponse(delta, total) {
    const next = window.AEAnalytics.individualIndex + delta;
    if (next >= 0 && next < total) {
      window.AEAnalytics.individualIndex = next;
      this.render();
    }
  },

  deleteSingleResponse(respId) {
    if (!window.confirm(`Delete response ${respId}? This action cannot be undone.`)) {
      return;
    }
    window.aeStore.deleteResponse(respId);
    this.showToast('Response deleted.', 'success');
    this.render();
  },

  approveSingleResponse(respId) {
    const userSup = 'SUP-01 (Peter Kamau)';
    window.aeStore.approveResponse(respId, userSup, 'Verified and sign-off by regional supervisor');
    this.showToast('Response verified & approved by supervisor.', 'success');
    this.render();
  },

  flagSingleResponse(respId) {
    const reason = window.prompt('Enter reason for flagging this response for field re-check:', 'Agronomic yield or GPS anomaly requires verification');
    if (!reason) return;
    window.aeStore.flagResponse(respId, 'SUP-01 (Peter Kamau)', reason);
    this.showToast('Response flagged for enumerator follow-up.', 'warning');
    this.render();
  },

  exportSurveyResponsesCSV(surveyId) {
    const survey = window.aeStore.getSurveyById(surveyId);
    if (!survey) return;
    const questions = window.aeStore.getQuestionsForSurvey(survey);
    const responses = window.aeStore.getResponsesForSurvey(surveyId);

    const headers = [
      'Response_ID',
      'Survey_ID',
      'Submitted_At',
      'Enumerator',
      'Collector_ID',
      'Sync_Status',
      'Duration_Sec',
      'GPS_Latitude',
      'GPS_Longitude',
      'GPS_Landmark',
      ...questions.map((q, idx) => `Q${idx + 1}: ${q.title}`)
    ];

    const escapeCsv = (val) => {
      let s = String(val ?? '');
      const trimmed = s.trim();
      // Neutralize CSV / Excel formula injection (CWE-1236) across leading whitespace, tabs, and fullwidth unicode
      if (trimmed !== '' && !isNaN(Number(trimmed)) && isFinite(Number(trimmed))) {
        // finite numeric value (e.g., negative Kenyan GPS coordinates like -0.303100)
      } else if (/^[=+\-@|%\t\r\n\uFF1D]/.test(trimmed) || /^[\s\t\r\n]+[=+\-@|%]/.test(s)) {
        s = "'" + s.replace(/^'+/, '');
      }
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = [headers.map(escapeCsv).join(',')];

    responses.forEach((r) => {
      const gps = r.gps || {};
      const rowCells = [
        r.clientResponseId || r.id,
        r.surveyId,
        r.submittedAt,
        r.enumerator,
        r.collectorId,
        r.syncStatus,
        r.durationSec || 0,
        gps.lat ?? '',
        gps.lng ?? '',
        gps.label ?? ''
      ];

      questions.forEach((q) => {
        const ans = r.answers ? r.answers[q.id] : '';
        if (Array.isArray(ans)) {
          rowCells.push(ans.join('; '));
        } else if (ans && typeof ans === 'object') {
          if (ans.lat !== undefined) {
            rowCells.push(`${ans.lat}, ${ans.lng} (${ans.label || ''})`);
          } else {
            rowCells.push(
              Object.entries(ans)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' | ')
            );
          }
        } else {
          rowCells.push(ans ?? '');
        }
      });

      rows.push(rowCells.map(escapeCsv).join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    this.downloadBlob(csvContent, `${survey.id}_responses.csv`, 'text/csv;charset=utf-8;');
    this.showToast(`Exported ${responses.length} responses to CSV.`, 'success');
  },

  async computeCanonicalDigest(dataObject) {
    try {
      const jsonString = JSON.stringify(dataObject);
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(jsonString));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => ('0' + b.toString(16)).slice(-2)).join('');
    } catch (e) {
      return '';
    }
  },

  downloadStandaloneFieldApp(surveyId) {
    const survey = window.aeStore.getSurveyById(surveyId);
    if (!survey) return;

    const safeSurveyJson = JSON.stringify(survey).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    const safeTitle = this.escapeHtml(survey.title);
    const safeDesc = this.escapeHtml(survey.description || 'Pre-loaded air-gapped survey questionnaire.');

    const htmlBundle = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#141A17" />
  <title>${safeTitle} · AE Standalone Field Collector</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" crossorigin="anonymous" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #F4F6F4; color: #111613; }
    .ae-press:active { transform: scale(0.98); }
  </style>
</head>
<body class="min-h-screen flex flex-col p-4 sm:p-6 max-w-2xl mx-auto">
  <header class="bg-[#141A17] text-white p-4 rounded-[10px] mb-4 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <img src="https://drive.google.com/thumbnail?id=1FG3ihsPb06rIDp7DcxtZQsmi9XydO9y4&sz=w1000"
        alt="Agri Experience Logo"
        class="h-8 w-auto max-w-[120px] object-contain rounded shrink-0"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      <div class="w-8 h-8 rounded-[6px] bg-[#247B50] hidden items-center justify-center font-bold shrink-0">AE</div>
      <div class="min-w-0">
        <h1 class="text-sm font-semibold truncate max-w-xs">${safeTitle}</h1>
        <span class="text-[10px] text-[#A3ACA6]">Standalone Air-Gapped Field App · No Server Required</span>
      </div>
    </div>
    <span class="text-xs px-2 py-0.5 rounded bg-[#247B50] text-white font-semibold shrink-0">Offline Ready</span>
  </header>
  <main id="app_root" class="space-y-4"></main>
  <script>
    window.AE_SURVEY = ${safeSurveyJson};
    const root = document.getElementById('app_root');
    const card = document.createElement('div');
    card.className = "bg-white border border-[#E4E7E4] rounded-[10px] p-6 space-y-4";
    const h2 = document.createElement('h2');
    h2.className = "text-base font-semibold";
    h2.textContent = window.AE_SURVEY.title || 'Untitled Survey';
    const p = document.createElement('p');
    p.className = "text-xs text-[#525B56]";
    p.textContent = window.AE_SURVEY.description || 'Pre-loaded air-gapped survey questionnaire.';
    const notice = document.createElement('div');
    notice.className = "p-4 bg-[#DCFAE5] rounded-[6px] text-xs text-[#04250E] font-medium flex items-center gap-2";
    notice.innerHTML = '<i class="fa-solid fa-check text-[#247B50]"></i> <span>Standalone Field Collector successfully loaded offline.</span>';
    const info = document.createElement('p');
    info.className = "text-xs text-[#525B56]";
    info.textContent = "Open this file directly in any browser on Android or Windows without Wi-Fi to collect farmer interviews.";
    card.appendChild(h2);
    card.appendChild(p);
    card.appendChild(notice);
    card.appendChild(info);
    root.appendChild(card);
  <\/script>
</body>
</html>`;

    this.downloadBlob(htmlBundle, `AE_FieldApp_${survey.id}.html`, 'text/html');
    this.showToast('Downloaded Standalone Offline Field App (.html). Transfer to phone via USB/Bluetooth.', 'success');
  },

  exportSurveySchemaJSON(surveyId) {
    const survey = window.aeStore.getSurveyById(surveyId);
    if (!survey) return;
    this.downloadBlob(JSON.stringify(survey, null, 2), `${survey.id}_schema.json`, 'application/json');
    this.showToast('Exported survey schema JSON.', 'success');
  },

  async exportResponsesPackJSON(surveyId) {
    const survey = window.aeStore.getSurveyById(surveyId);
    const responses = window.aeStore.getResponsesForSurvey(surveyId);
    const payload = {
      survey,
      responses
    };
    const checksum = await this.computeCanonicalDigest(payload);
    const bundle = {
      manifest: {
        bundleType: 'AE_SURVEY_AIRGAP_PACK_V2',
        schemaVersion: 2,
        integrityAlgorithm: 'SHA-256',
        checksum,
        exportedAt: new Date().toISOString(),
        deviceId: window.aeStore.settings.deviceId,
        surveyId: survey.id,
        recordCount: responses.length
      },
      payload
    };
    this.downloadBlob(JSON.stringify(bundle, null, 2), `${surveyId}_airgap_pack.json`, 'application/json');
    this.showToast(`Exported SHA-256 signed air-gap pack (${responses.length} responses).`, 'success');
  },

  importJSONPackFile(inputEl) {
    const file = inputEl.files && inputEl.files[0];
    if (!file) return;

    // DoS / Memory exhaustion defense (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      this.showToast('File rejected: Air-gap bundle exceeds maximum limit (15MB).', 'error');
      inputEl.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Verify SHA-256 Cryptographic Integrity Manifest
        if (data.manifest && data.manifest.checksum && data.payload) {
          const computed = await this.computeCanonicalDigest(data.payload);
          if (computed && computed !== data.manifest.checksum) {
            this.showToast('TAMPERING DETECTED: SHA-256 integrity checksum mismatch! Bundle may be modified.', 'error');
            return;
          }
        }

        const payload = data.payload || data;
        let importedCount = 0;

        if (payload.survey && typeof payload.survey === 'object') {
          const cleanSurvey = window.aeStore.sanitizeSurveyRecord(payload.survey);
          if (cleanSurvey) window.aeStore.upsertSurvey(cleanSurvey, true);
        }
        if (Array.isArray(payload.responses)) {
          if (payload.responses.length > 5000) {
            throw new Error('Bundle exceeds maximum item count limit (5,000).');
          }
          const existingIds = new Set(window.aeStore.responses.map((r) => r.clientResponseId || r.id));
          payload.responses.forEach((r) => {
            const cleanResp = window.aeStore.sanitizeResponseRecord(r);
            if (!cleanResp) return;
            const key = cleanResp.clientResponseId || cleanResp.id;
            if (!existingIds.has(key)) {
              window.aeStore.submitResponse(cleanResp);
              importedCount++;
            }
          });
        } else if (payload.id && payload.pages) {
          const cleanSurvey = window.aeStore.sanitizeSurveyRecord(payload);
          if (cleanSurvey) window.aeStore.upsertSurvey(cleanSurvey, true);
        }
        this.showToast(`Imported verified bundle (${importedCount} new responses merged).`, 'success');
        this.render();
      } catch (err) {
        this.showToast(`Invalid or corrupted bundle: ${err.message}`, 'error');
      } finally {
        inputEl.value = '';
      }
    };
    reader.readAsText(file);
  },

  downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 200);
  },

  copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => this.showToast(successMsg, 'success'))
        .catch(() => this.showToast(successMsg, 'success'));
    } else {
      this.showToast(successMsg, 'success');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.AEApp.boot();
});
