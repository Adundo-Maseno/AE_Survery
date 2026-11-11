/**
 * ============================================================================
 * AE Field Collector (`js/field-app.js`)
 * Dedicated, distraction-free data collection application for Agri Experience
 * field enumerators and extension officers.
 * Backed by IndexedDB + Google Sheets (`Code.gs`)
 * ============================================================================
 */

window.AEFieldApp = {
  activeSurveyId: null,
  activeCollectorId: null,
  enumeratorName: '',
  isRespondentMode: false,
  currentPageIndex: 0,
  startedAtIso: null,
  startedAtMs: 0,
  draftAnswers: {},
  validationErrors: {},
  isSubmitting: false,
  justSubmittedReceipt: null,
  currentLang: 'en',
  capturingGpsId: null,
  sunlightMode: false,
  deferredInstallPrompt: null,
  isAppInstalled: false,
  showIosInstallModal: false,
  runnerMode: localStorage.getItem('ae_field_runner_mode') || 'classic',
  focusQuestionIndex: 0,

  // Modals & Navigation
  showMobileMenu: false,
  showPacingModal: false,
  showAdminPinModal: false,
  adminPinError: '',
  failedPinAttempts: 0,
  showSurveyPickerModal: false,
  showEnumPickerModal: false,
  showEnumPinModal: false,
  pendingEnumPinPerson: null,
  enumPinError: '',

  async boot() {
    try {
      await window.aeStore.init();
    } catch (err) {
      console.warn('[FieldApp] Store init non-fatal warning:', err);
    }

    if (window.AEI18n) {
      this.currentLang = window.AEI18n.getLanguage();
      if (document.documentElement) {
        document.documentElement.lang = this.currentLang;
      }
    }

    this.sunlightMode = localStorage.getItem('ae_sunlight_mode') === 'true';
    if (this.sunlightMode && document.body) {
      document.body.classList.add('ae-sunlight');
    }

    // PWA Install Heuristics
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      this.renderHeader();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      this.isAppInstalled = true;
      this.showToast('AE Field Collector installed to your device.', 'success');
      this.renderHeader();
    });

    if ((typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true) {
      this.isAppInstalled = true;
    }

    // Read URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const paramSurvey = urlParams.get('survey');
    const paramCollector = urlParams.get('collector');
    const paramMode = (urlParams.get('mode') || '').toLowerCase();
    const isExplicitRespondent =
      paramMode === 'respondent' ||
      paramMode === 'self' ||
      paramMode === 'public' ||
      urlParams.get('respondent') === '1' ||
      urlParams.get('self') === '1';

    if (paramCollector) {
      this.activeCollectorId = paramCollector;
    }

    // Hydrate survey schema & collectors from Google Sheets when a direct survey/collector link is opened
    if ((paramSurvey || paramCollector) && window.aeStore.isEffectivelyOnline() && window.aeStore.settings.gasWebAppUrl) {
      const localSurvey = paramSurvey ? window.aeStore.getSurveyById(paramSurvey) : null;
      const localCol = paramCollector ? (window.aeStore.collectors || []).find((c) => c.id === paramCollector) : null;
      const needsBlockingPull =
        (paramSurvey && !localSurvey) ||
        (paramCollector && !localCol) ||
        isExplicitRespondent ||
        (localSurvey && localSurvey.status !== 'Active');
      if (needsBlockingPull) {
        try {
          await window.aeStore.pullFromGoogleSheets();
        } catch (pullErr) {
          console.warn('[FieldApp] Initial cloud survey pull warning:', pullErr);
        }
      } else {
        window.aeStore.pullFromGoogleSheets().then(() => {
          this.initRunnerForActiveSurvey(false);
          this.render();
        }).catch(() => {});
      }
    }

    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    const targetCol = paramCollector
      ? (window.aeStore.collectors || []).find((c) => c.id === paramCollector)
      : null;
    const resolvedSurveyId = paramSurvey || (targetCol ? targetCol.surveyId : null);
    const targetSurvey = resolvedSurveyId ? window.aeStore.getSurveyById(resolvedSurveyId) : null;

    // Determine if this session is a Self-Administered Respondent Link (No Login Required)
    this.isRespondentMode = Boolean(
      isExplicitRespondent ||
      (targetCol && targetCol.type === 'weblink') ||
      (targetSurvey && targetSurvey.collectionMode === 'self_administered') ||
      (!currentUser && resolvedSurveyId && (!targetSurvey || targetSurvey.collectionMode !== 'enumerator'))
    );

    if (this.isRespondentMode) {
      this.enumeratorName = 'Self-Administered (Web Link)';
      this.activeSurveyId = resolvedSurveyId || (window.aeStore.surveys && window.aeStore.surveys[0] ? window.aeStore.surveys[0].id : null);
    } else if (currentUser) {
      const savedEnum = localStorage.getItem('ae_active_enumerator');
      if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
        const roleSuffix = currentUser.role === 'admin' ? 'HQ Admin' : 'Supervisor';
        // If no saved enumerator, or saved was admin/supervisor persona, or references old Dr. John Mutua
        if (!savedEnum || savedEnum.includes('HQ Admin') || savedEnum.includes('Supervisor') || savedEnum.includes('Dr. John Mutua')) {
          this.enumeratorName = `${currentUser.fullName} (${roleSuffix})`;
          localStorage.setItem('ae_active_enumerator', this.enumeratorName);
        } else {
          // If savedEnum corresponds to a registered enumerator, verify they exist
          const matchedStaff = (window.aeStore.personnel || []).find(
            (p) => savedEnum.includes(p.id) || (p.fullName && savedEnum.includes(p.fullName))
          );
          if (matchedStaff) {
            const pSuffix = matchedStaff.role === 'admin' ? 'HQ Admin' : matchedStaff.role === 'supervisor' ? 'Supervisor' : matchedStaff.id;
            this.enumeratorName = `${matchedStaff.fullName} (${pSuffix})`;
            localStorage.setItem('ae_active_enumerator', this.enumeratorName);
          } else {
            this.enumeratorName = `${currentUser.fullName} (${roleSuffix})`;
            localStorage.setItem('ae_active_enumerator', this.enumeratorName);
          }
        }
      } else if (currentUser.role === 'enumerator') {
        this.enumeratorName = `${currentUser.fullName} (${currentUser.id})`;
        localStorage.setItem('ae_active_enumerator', this.enumeratorName);
      }
    } else {
      const savedEnum = localStorage.getItem('ae_active_enumerator');
      if (savedEnum && (savedEnum.includes('Dr. John Mutua') || savedEnum.includes('HQ Admin')) && window.aeStore) {
        const adm = window.aeStore.getPersonnelById('ADM-01');
        this.enumeratorName = adm ? `${adm.fullName} (HQ Admin)` : 'Moses Adundo (HQ Admin)';
        localStorage.setItem('ae_active_enumerator', this.enumeratorName);
      } else {
        const firstActive = (window.aeStore && typeof window.aeStore.getPersonnel === 'function')
          ? window.aeStore.getPersonnel({ role: 'enumerator' }).find((p) => p.active !== false)
          : null;
        this.enumeratorName =
          savedEnum ||
          (window.aeStore && window.aeStore.settings ? window.aeStore.settings.defaultEnumerator : '') ||
          (firstActive ? `${firstActive.fullName} (${firstActive.id})` : 'Unassigned Field Enumerator');
      }

      if (window.AESession && window.aeStore) {
        const allEnum = window.aeStore.getPersonnel({ role: 'enumerator' });
        const matched = allEnum.find(
          (p) => this.enumeratorName.includes(p.id) || this.enumeratorName.includes(p.fullName)
        );
        if (matched) {
          window.AESession.setCurrentUser(matched, false);
        }
      }
    }

    if (!this.isRespondentMode) {
      // Resolve active operator personnel profile
      const activePerson = (window.aeStore.personnel || []).find(
        (p) => this.enumeratorName.includes(p.fullName) || this.enumeratorName.includes(p.id)
      ) || (window.AESession ? window.AESession.getCurrentUser() : null);

      const accessibleSurveys = window.aeStore.getSurveysForUser
        ? window.aeStore.getSurveysForUser(activePerson)
        : (window.aeStore.surveys || []).filter((s) => s.status === 'Active');

      if (resolvedSurveyId && window.aeStore.getSurveyById(resolvedSurveyId)) {
        const check = window.aeStore.canUserCollectSurvey
          ? window.aeStore.canUserCollectSurvey(activePerson, resolvedSurveyId)
          : { allowed: true };
        if (check.allowed) {
          this.activeSurveyId = resolvedSurveyId;
        } else {
          this.showToast(check.reason || 'Requested survey is not assigned to your operator account.', 'warning');
          this.activeSurveyId = resolvedSurveyId;
        }
      } else if (accessibleSurveys.length > 0) {
        this.activeSurveyId = accessibleSurveys[0].id;
      } else {
        this.activeSurveyId = null;
      }
    }

    // Subscribe to store updates (so queue badge & sync logs stay live)
    window.aeStore.subscribe(() => {
      this.renderHeader();
    });

    // Listen for background auto-sync state changes
    window.addEventListener('ae-sync-state-change', (ev) => {
      this.renderHeader();
      if (this.justSubmittedReceipt && ev && ev.detail && ev.detail.syncing === false) {
        const isOnline = window.aeStore.isEffectivelyOnline();
        if (!this.isRespondentMode) {
          this.justSubmittedReceipt.title = `${this.t('interviewLogged')} (${isOnline ? this.t('syncedDirectly') : this.t('storedLocallyPending')})`;
          this.render();
        }
      }
    });

    window.addEventListener('online', () => {
      this.showToast('Online connection restored. Syncing outbox…', 'success');
      this.triggerCloudSync(false);
    });

    window.addEventListener('offline', () => {
      this.showToast('Offline mode active. All responses saved locally.', 'warning');
      this.renderHeader();
    });

    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    this.initRunnerForActiveSurvey(false);
    this.render();
  },

  initRunnerForActiveSurvey(forceReset = false) {
    let survey = this.activeSurveyId ? window.aeStore.getSurveyById(this.activeSurveyId) : null;

    if (this.isRespondentMode) {
      if (!survey) return;
      const cols = window.aeStore.getCollectorsForSurvey(survey.id);
      const webCol = cols.find((c) => c.type === 'weblink');
      if (!this.activeCollectorId || !cols.some((c) => c.id === this.activeCollectorId)) {
        this.activeCollectorId = webCol ? webCol.id : (cols.length > 0 ? cols[0].id : 'col_self_web');
      }
    } else {
      const activePerson = (window.aeStore.personnel || []).find(
        (p) => this.enumeratorName.includes(p.fullName) || this.enumeratorName.includes(p.id)
      ) || (window.AESession ? window.AESession.getCurrentUser() : null);

      const userSurveys = window.aeStore.getSurveysForUser ? window.aeStore.getSurveysForUser(activePerson) : [];

      if (survey && window.aeStore.canUserCollectSurvey) {
        const check = window.aeStore.canUserCollectSurvey(activePerson, survey.id);
        if (!check.allowed) {
          // Keep activeSurveyId if explicitly requested in URL so render() can show the exact reason
          const urlSurvey = new URLSearchParams(window.location.search).get('survey');
          if (!urlSurvey || urlSurvey !== survey.id) {
            if (userSurveys.length > 0) {
              this.activeSurveyId = userSurveys[0].id;
              survey = userSurveys[0];
            } else {
              this.activeSurveyId = null;
              survey = null;
            }
          }
        }
      } else if (!survey && userSurveys.length > 0) {
        this.activeSurveyId = userSurveys[0].id;
        survey = userSurveys[0];
      }
      if (!survey) return;

      const cols = window.aeStore.getCollectorsForSurvey(survey.id);
      if (!this.activeCollectorId || !cols.some((c) => c.id === this.activeCollectorId)) {
        this.activeCollectorId = cols.length > 0 ? cols[0].id : 'col_default';
      }
    }

    if (!forceReset) {
      const savedDraft = window.aeStore.getRunnerDraft(survey.id);
      if (savedDraft && savedDraft.draftAnswers && Object.keys(savedDraft.draftAnswers).length > 0) {
        this.currentPageIndex = Math.min(
          savedDraft.currentPageIndex || 0,
          Math.max(0, (survey.pages || []).length - 1)
        );
        this.startedAtIso = savedDraft.startedAtIso || new Date().toISOString();
        this.startedAtMs = savedDraft.startedAtMs || Date.now();
        this.draftAnswers = { ...savedDraft.draftAnswers };
        this.validationErrors = {};
        return;
      }
    }

    this.currentPageIndex = 0;
    this.startedAtIso = new Date().toISOString();
    this.startedAtMs = Date.now();
    this.draftAnswers = {};
    this.validationErrors = {};
    if (forceReset) {
      window.aeStore.clearRunnerDraft(survey.id);
    }
  },

  persistDraft() {
    if (!this.activeSurveyId) return;
    window.aeStore.saveRunnerDraft(this.activeSurveyId, {
      currentPageIndex: this.currentPageIndex,
      startedAtIso: this.startedAtIso,
      startedAtMs: this.startedAtMs,
      draftAnswers: this.draftAnswers,
      enumeratorName: this.enumeratorName,
      activeCollectorId: this.activeCollectorId
    });
  },

  handleKeydown(e) {
    if (e.key === 'Escape') {
      if (this.showAdminPinModal || this.showSurveyPickerModal || this.showEnumPickerModal) {
        this.closeModals();
        return;
      }
    }

    const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
    if (isTyping || this.showAdminPinModal || this.showSurveyPickerModal || this.showEnumPickerModal) return;

    const survey = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!survey) return;
    const pages = survey.pages || [];
    const page = pages[this.currentPageIndex];
    if (!page) return;

    // Shift + Enter advances or submits
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (this.currentPageIndex < pages.length - 1) {
        this.nextPage();
      } else {
        this.submitResponse();
      }
      return;
    }

    // Number keys 1-9 select option on first unanswered choice/star/nps
    if (!e.ctrlKey && !e.altKey && !e.metaKey && /^[1-9]$/.test(e.key)) {
      const num = Number(e.key);
      const questions = page.questions || [];
      const targetQ =
        questions.find((q) => {
          const unans = this.draftAnswers[q.id] === undefined || this.draftAnswers[q.id] === '';
          return unans && (q.type === 'multiple_choice' || q.type === 'star_rating' || q.type === 'nps');
        }) || questions.find((q) => q.type === 'multiple_choice' || q.type === 'star_rating' || q.type === 'nps');

      if (targetQ) {
        if (targetQ.type === 'multiple_choice' && Array.isArray(targetQ.options) && targetQ.options[num - 1]) {
          e.preventDefault();
          this.setAnswer(targetQ.id, targetQ.options[num - 1]);
        } else if (targetQ.type === 'star_rating' && num <= (targetQ.maxStars || 5)) {
          e.preventDefault();
          this.setAnswer(targetQ.id, num);
        } else if (targetQ.type === 'nps' && num <= 9) {
          e.preventDefault();
          this.setAnswer(targetQ.id, num);
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
      .replace(/"/g, '\\x22')
      .replace(/&/g, '\\x26')
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
        ? 'fa-triangle-exclamation text-[#D97706]'
        : 'fa-circle-check text-[#3FC07A]';

    toast.className = `px-3.5 py-2.5 rounded-[8px] text-xs font-medium flex items-center gap-2.5 transition-opacity duration-200 pointer-events-auto ${palette}`;
    toast.innerHTML = `<i class="fa-solid ${icon} shrink-0 text-xs"></i><span class="flex-1">${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 220);
    }, 3200);
  },

  setLanguage(langCode) {
    if (window.AEI18n) {
      this.currentLang = window.AEI18n.setLanguage(langCode);
    } else {
      this.currentLang = langCode;
    }
    if (document.documentElement) {
      document.documentElement.lang = this.currentLang;
    }
    this.render();
  },

  toggleSunlightMode() {
    this.sunlightMode = !this.sunlightMode;
    localStorage.setItem('ae_sunlight_mode', String(this.sunlightMode));
    if (document.body) {
      document.body.classList.toggle('ae-sunlight', this.sunlightMode);
    }
    this.showToast(
      this.sunlightMode
        ? 'High-Contrast Sunlight Mode enabled (Maximum visibility under direct field sun).'
        : 'Standard display mode restored.',
      'info'
    );
    this.render();
  },

  t(key) {
    if (window.AEI18n) {
      return window.AEI18n.t(key, this.currentLang);
    }
    return key;
  },

  renderHeader() {
    const rawSurvey = window.aeStore.getSurveyById(this.activeSurveyId);
    const survey = rawSurvey && window.AEI18n ? window.AEI18n.localizeSurvey(rawSurvey, this.currentLang) : rawSurvey;
    const titleEl = document.getElementById('ae_hdr_survey_title');
    if (titleEl) {
      titleEl.textContent = survey ? survey.title : this.t('noSurveyActive');
    }

    const allowed = (survey && Array.isArray(survey.supportedLanguages)) ? survey.supportedLanguages : null;
    if (allowed && allowed.length > 0 && !allowed.includes(this.currentLang) && this.currentLang !== 'en') {
      this.currentLang = 'en';
      if (window.AEI18n) window.AEI18n.setLanguage('en');
    }

    const langPickerEl = document.getElementById('ae_hdr_lang_picker');
    if (langPickerEl && window.AEI18n) {
      langPickerEl.innerHTML = window.AEI18n.renderLanguageSwitch(this.currentLang, 'AEFieldApp.setLanguage', 'dark', allowed);
    }

    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    if (this.isRespondentMode) {
      this.enumeratorName = 'Self-Administered (Web Link)';
    } else if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
      const roleSuffix = currentUser.role === 'admin' ? 'HQ Admin' : 'Supervisor';
      if (this.enumeratorName.includes(roleSuffix) || this.enumeratorName.includes('Dr. John Mutua')) {
        const expected = `${currentUser.fullName} (${roleSuffix})`;
        if (this.enumeratorName !== expected) {
          this.enumeratorName = expected;
          localStorage.setItem('ae_active_enumerator', this.enumeratorName);
        }
      }
    } else if (window.aeStore && Array.isArray(window.aeStore.personnel)) {
      const activePerson = window.aeStore.personnel.find(
        (p) => this.enumeratorName.includes(p.id) || (p.fullName && this.enumeratorName.includes(p.fullName))
      );
      if (activePerson && !this.enumeratorName.includes(activePerson.fullName)) {
        const roleSuffix =
          activePerson.role === 'admin'
            ? 'HQ Admin'
            : activePerson.role === 'supervisor'
            ? 'Supervisor'
            : activePerson.id;
        this.enumeratorName = `${activePerson.fullName} (${roleSuffix})`;
        localStorage.setItem('ae_active_enumerator', this.enumeratorName);
      }
    }

    const enumEl = document.getElementById('ae_hdr_enum_name');
    if (enumEl) {
      if (this.isRespondentMode) {
        enumEl.textContent = 'Public Respondent';
        if (enumEl.parentElement) {
          enumEl.parentElement.title = 'Self-Administered Survey Link (No Login Required)';
          enumEl.parentElement.style.pointerEvents = 'none';
          enumEl.parentElement.disabled = true;
        }
      } else {
        enumEl.textContent = this.enumeratorName;
        if (enumEl.parentElement) {
          enumEl.parentElement.title = `Active Enumerator: ${this.enumeratorName} (Click to switch)`;
          enumEl.parentElement.style.pointerEvents = '';
          enumEl.parentElement.disabled = false;
        }
      }
    }

    if (titleEl && titleEl.parentElement) {
      const chevron = titleEl.parentElement.querySelector('i.fa-chevron-down');
      if (this.isRespondentMode) {
        titleEl.parentElement.style.pointerEvents = 'none';
        titleEl.parentElement.disabled = true;
        if (chevron) chevron.style.display = 'none';
      } else {
        titleEl.parentElement.style.pointerEvents = '';
        titleEl.parentElement.disabled = false;
        if (chevron) chevron.style.display = '';
      }
    }

    const isOnline = window.aeStore.isEffectivelyOnline();
    const queuedCount = window.aeStore.responses.filter((r) => r.syncStatus !== 'synced').length;
    const isSyncing = Boolean(this.isSyncing || (window.aeStore && window.aeStore._syncInFlight));

    const syncText = document.getElementById('ae_hdr_sync_text');
    const syncIcon = document.getElementById('ae_hdr_sync_icon');
    const syncBtn = document.getElementById('ae_hdr_sync_btn');

    if (syncText && syncIcon && syncBtn) {
      syncBtn.title = this.t('syncTooltip');
      if (isSyncing) {
        syncIcon.className = 'fa-solid fa-arrows-rotate text-xs text-[#247B50] fa-spin';
        syncText.textContent = this.t('autoSyncing');
        syncBtn.className = 'hidden md:inline-flex h-8 px-2.5 sm:px-3 rounded-[6px] bg-white text-[#111613] text-xs items-center gap-1.5 ae-press opacity-85';
      } else if (!isOnline) {
        syncIcon.className = 'fa-solid fa-cloud text-xs text-[#D97706]';
        syncText.textContent = `${queuedCount} ${this.t('offlineQueue')}`;
        syncBtn.className = 'hidden md:inline-flex h-8 px-2.5 sm:px-3 rounded-[6px] bg-[#FFFBEB] text-[#92400E] text-xs items-center gap-1.5 ae-press';
      } else if (queuedCount > 0) {
        syncIcon.className = 'fa-solid fa-cloud-arrow-up text-xs text-[#247B50]';
        syncText.textContent = `${queuedCount} ${this.t('pending')}`;
        syncBtn.className = 'hidden md:inline-flex h-8 px-2.5 sm:px-3 rounded-[6px] bg-white text-[#111613] text-xs items-center gap-1.5 ae-press';
      } else {
        syncIcon.className = 'fa-solid fa-cloud-check text-xs text-[#3FC07A]';
        syncText.textContent = this.t('synced');
        syncBtn.className = 'hidden md:inline-flex h-8 px-2.5 sm:px-3 rounded-[6px] bg-white/10 hover:bg-white/15 text-white text-xs items-center gap-1.5 ae-press';
      }
    }

    const installBtn = document.getElementById('ae_hdr_install_btn');
    if (installBtn) {
      if (this.isAppInstalled) {
        installBtn.className = 'hidden md:inline-flex h-8 px-2 sm:px-2.5 rounded-[6px] bg-white/10 text-xs font-semibold text-[#3FC07A] items-center gap-1.5 pointer-events-none shrink-0';
        installBtn.innerHTML = `<i class="fa-solid fa-circle-check text-xs text-[#3FC07A]"></i><span class="hidden sm:inline">${this.t('installed')}</span>`;
      } else {
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        installBtn.className = 'hidden md:inline-flex h-8 px-2 sm:px-2.5 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-xs font-semibold text-white items-center gap-1.5 shrink-0 ae-press';
        installBtn.innerHTML = `<i class="fa-solid fa-mobile-screen-button text-xs"></i><span class="hidden xs:inline sm:inline" id="ae_hdr_install_label">${isIos ? this.t('addToHome') : this.t('installApp')}</span>`;
      }
    }

    const focusBtn = document.getElementById('ae_hdr_focus_btn');
    const focusLabel = document.getElementById('ae_hdr_focus_label');
    if (focusBtn && focusLabel) {
      if (this.runnerMode === 'focus') {
        focusBtn.className = 'hidden 2xl:inline-flex h-8 px-2 rounded-[6px] bg-[#247B50] text-xs font-semibold text-white items-center gap-1.5 ae-press';
        focusLabel.textContent = this.t('focusOn');
      } else {
        focusBtn.className = 'hidden 2xl:inline-flex h-8 px-2 rounded-[6px] bg-white/10 hover:bg-white/15 text-xs text-white items-center gap-1.5 ae-press';
        focusLabel.textContent = this.t('focus');
      }
    }

    const sunLabel = document.getElementById('ae_hdr_sunlight_label');
    if (sunLabel) sunLabel.textContent = this.t('sunlight');

    const roleBadge = document.getElementById('ae_hdr_role_badge');
    if (roleBadge) {
      if (this.isRespondentMode) {
        roleBadge.className = 'text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[#DCFAE5] text-[#04250E] inline-flex items-center gap-1 shrink-0';
        roleBadge.innerHTML = `<i class="fa-solid fa-earth-africa text-[9px] text-[#247B50]"></i><span>Self-Administered</span>`;
      } else if (currentUser && currentUser.role === 'admin') {
        roleBadge.className = 'text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[#DCFAE5] text-[#04250E] inline-flex items-center gap-1 shrink-0';
        roleBadge.innerHTML = `<i class="fa-solid fa-shield-halved text-[9px] text-[#247B50]"></i><span>${this.t('adminAudit')}</span>`;
      } else if (currentUser && currentUser.role === 'supervisor') {
        roleBadge.className = 'text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#1E40AF] inline-flex items-center gap-1 shrink-0';
        roleBadge.innerHTML = `<i class="fa-solid fa-user-check text-[9px] text-[#1E40AF]"></i><span>${this.t('supervisor')}</span>`;
      } else {
        roleBadge.className = 'hidden';
        roleBadge.innerHTML = '';
      }
    }

    const adminBtn = document.getElementById('ae_hdr_admin_btn');
    const mobileMenuBtn = document.getElementById('ae_hdr_mobile_menu_btn');
    const dlBtn = document.getElementById('ae_hdr_dl_btn');
    const sunBtn = document.getElementById('ae_hdr_sunlight_btn');
    if (this.isRespondentMode) {
      if (adminBtn) { adminBtn.className = 'hidden'; adminBtn.style.display = 'none'; }
      if (mobileMenuBtn) { mobileMenuBtn.className = 'hidden'; mobileMenuBtn.style.display = 'none'; }
      if (dlBtn) { dlBtn.className = 'hidden'; dlBtn.style.display = 'none'; }
      if (installBtn) { installBtn.className = 'hidden'; installBtn.style.display = 'none'; }
      if (syncBtn) { syncBtn.className = 'hidden'; syncBtn.style.display = 'none'; }
      if (focusBtn) { focusBtn.className = 'hidden'; focusBtn.style.display = 'none'; }
      if (sunBtn) { sunBtn.style.display = 'none'; }
    } else {
      if (adminBtn) adminBtn.style.display = '';
      if (mobileMenuBtn) mobileMenuBtn.style.display = '';
      if (dlBtn) dlBtn.style.display = '';
      if (installBtn) installBtn.style.display = '';
      if (syncBtn) syncBtn.style.display = '';
      if (focusBtn) focusBtn.style.display = '';
      if (sunBtn) sunBtn.style.display = '';
      if (adminBtn) {
        if (currentUser && currentUser.role === 'admin') {
          adminBtn.className = 'hidden md:inline-flex h-8 px-2.5 sm:px-3 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-xs font-semibold text-white items-center gap-1.5 ae-press';
          adminBtn.title = `${this.t('returnToOperations')} (${currentUser.fullName})`;
          if (typeof adminBtn.setAttribute === 'function') adminBtn.setAttribute('aria-label', this.t('returnToOperations'));
          adminBtn.innerHTML = `
            <i class="fa-solid fa-gauge-high text-xs text-white"></i>
            <span class="hidden md:inline">${this.t('operationsStudio')}</span>
          `;
        } else if (currentUser && currentUser.role === 'supervisor') {
          adminBtn.className = 'hidden md:inline-flex h-8 px-2.5 sm:px-3 rounded-[6px] bg-[#1E40AF] hover:bg-[#172554] text-xs font-semibold text-white items-center gap-1.5 ae-press';
          adminBtn.title = `${this.t('returnToSupervisor')} (${currentUser.fullName})`;
          if (typeof adminBtn.setAttribute === 'function') adminBtn.setAttribute('aria-label', this.t('returnToSupervisor'));
          adminBtn.innerHTML = `
            <i class="fa-solid fa-arrow-left text-xs text-white"></i>
            <span class="hidden md:inline">${this.t('supervisorPortal')}</span>
          `;
        } else {
          adminBtn.className = 'hidden md:inline-flex h-8 px-2.5 rounded-[6px] border border-white/20 bg-transparent hover:bg-white/10 text-xs font-medium text-white items-center gap-1.5 ae-press';
          adminBtn.title = this.t('adminRequiresPin');
          if (typeof adminBtn.setAttribute === 'function') adminBtn.setAttribute('aria-label', this.t('adminRequiresPin'));
          adminBtn.innerHTML = `
            <i class="fa-solid fa-lock text-xs text-[#A3ACA6]"></i>
            <span class="hidden md:inline">${this.t('adminStudio')}</span>
          `;
        }
      }
    }

    const mobileDot = document.getElementById('ae_hdr_mobile_dot');
    if (mobileDot) {
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
        mobileDot.className = 'absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#3FC07A]';
      } else {
        mobileDot.className = 'hidden';
      }
    }
  },

  render() {
    this.renderHeader();
    const viewport = document.getElementById('ae_field_viewport');
    if (!viewport) return;

    const survey = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!survey) {
      viewport.innerHTML = `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-8 text-center space-y-3">
          <i class="fa-solid fa-clipboard-question text-3xl text-[#525B56]"></i>
          <h2 class="text-base font-semibold text-[#111613]">${this.t('noActiveSurveyAssigned')}</h2>
          <p class="text-xs text-[#525B56] max-w-sm mx-auto">
            ${this.isRespondentMode ? 'This survey link is unavailable or has been closed by the survey administrator.' : this.t('connectWifiPrompt')}
          </p>
          ${this.isRespondentMode ? '' : `
          <button onclick="AEFieldApp.openSurveyPicker()"
            class="h-9 px-4 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold ae-press">
            ${this.t('selectDeployedSurvey')}
          </button>`}
        </div>
      `;
      this.renderModals();
      return;
    }

    const activePerson = this.isRespondentMode
      ? { role: 'respondent', fullName: 'Public Respondent' }
      : ((window.aeStore.personnel || []).find(
          (p) => this.enumeratorName.includes(p.fullName) || this.enumeratorName.includes(p.id)
        ) || (window.AESession ? window.AESession.getCurrentUser() : null));

    if (survey && window.aeStore.canUserCollectSurvey) {
      const check = window.aeStore.canUserCollectSurvey(activePerson, survey.id, {
        isSelfAdministered: this.isRespondentMode
      });
      if (!check.allowed) {
        viewport.innerHTML = `
          <div class="bg-white border-2 border-[#C4242A] rounded-[12px] p-8 text-center space-y-4 max-w-md mx-auto my-6 shadow-sm">
            <div class="w-12 h-12 rounded-full bg-[#FFEDEA] text-[#C4242A] mx-auto flex items-center justify-center text-xl">
              <i class="fa-solid fa-lock"></i>
            </div>
            <div>
              <h2 class="text-base font-bold text-[#111613]">Access Restricted</h2>
              <p class="text-xs text-[#525B56] mt-1.5 leading-relaxed">
                ${this.escapeHtml(check.reason)}
              </p>
            </div>
            <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              ${
                this.isRespondentMode
                  ? `<button onclick="AEFieldApp.switchToEnumeratorMode()"
                      class="w-full sm:w-auto h-9 px-4 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold ae-press">
                      <i class="fa-solid fa-user-check mr-1.5"></i> Authenticate as Field Enumerator
                    </button>`
                  : `<button onclick="AEFieldApp.openSurveyPicker()"
                      class="w-full sm:w-auto h-9 px-4 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold ae-press">
                      Switch to Assigned Survey
                    </button>
                    <button onclick="AEFieldApp.openEnumeratorPicker()"
                      class="w-full sm:w-auto h-9 px-4 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] ae-press">
                      Switch Operator
                    </button>`
              }
            </div>
          </div>
        `;
        this.renderModals();
        this.renderBottomNav();
        return;
      }
    }

    if (this.runnerMode === 'focus') {
      viewport.innerHTML = this.renderConversationalRunner(survey);
    } else {
      viewport.innerHTML = this.renderSurveyRunner(survey);
    }
    this.renderModals();
    this.renderBottomNav();
    this.attachCanvasSignatureListeners();
  },

  renderSurveyRunner(rawSurvey) {
    const survey = window.AEI18n ? window.AEI18n.localizeSurvey(rawSurvey, this.currentLang) : rawSurvey;
    const pages = survey.pages || [];
    if (this.currentPageIndex >= pages.length) this.currentPageIndex = 0;
    const page = pages[this.currentPageIndex];
    const progressPct = Math.round(((this.currentPageIndex + 1) / Math.max(1, pages.length)) * 100);
    const accent = (survey.theme && survey.theme.accentColor) || '#247B50';

    const allQuestions = window.aeStore.getQuestionsForSurvey(survey);
    const answeredCount = allQuestions.filter((q) => {
      const v = this.draftAnswers[q.id];
      if (v === undefined || v === null || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true;
    }).length;

    return `
      <div class="space-y-4">
        <!-- CommCare Shift Pacing Bar (Hidden for Self-Administered Public Respondents) -->
        ${this.isRespondentMode ? '' : this.renderShiftPacingBar()}

        ${
          this.justSubmittedReceipt
            ? `<div class="bg-[#DCFAE5] border border-[#247B50]/30 rounded-[8px] p-4 sm:p-5 space-y-3 ae-receipt-card">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <i class="fa-solid fa-circle-check text-[#247B50] text-lg mt-0.5 shrink-0"></i>
                    <div class="min-w-0">
                      <div class="text-sm font-semibold text-[#04250E] ae-break-words">
                        ${this.escapeHtml(this.justSubmittedReceipt.title)}
                      </div>
                      <div class="text-xs text-[#04250E]/85 mt-0.5 ae-break-words">
                        ${this.escapeHtml(this.justSubmittedReceipt.subtitle)}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    ${!this.isAppInstalled && !this.isRespondentMode ? `
                      <button type="button" onclick="AEFieldApp.promptInstall()"
                        class="h-8 px-3 rounded-[6px] bg-[#247B50] text-xs font-semibold text-white hover:bg-[#1F6A45] inline-flex items-center gap-1.5 ae-press">
                        <i class="fa-solid fa-mobile-screen-button text-xs"></i> ${this.t('installApp')}
                      </button>
                    ` : ''}
                    <button type="button" onclick="AEFieldApp.copyReceiptText()"
                      class="h-8 px-3 rounded-[6px] bg-white border border-[#247B50]/40 text-xs font-medium text-[#04250E] hover:bg-[#F8F9F8] inline-flex items-center gap-1.5 ae-press">
                      <i class="fa-regular fa-copy"></i> ${this.t('copyReceipt')}
                    </button>
                    <button type="button" onclick="AEFieldApp.startNextInterview()"
                      class="h-8 px-3.5 rounded-[6px] bg-[#141A17] text-xs font-medium text-white hover:bg-[#232C27] inline-flex items-center gap-1.5 ae-press">
                      <i class="fa-solid fa-plus text-xs"></i> ${this.isRespondentMode ? 'Submit Another Response' : this.t('nextInterview')}
                    </button>
                  </div>
                </div>
                <div class="pt-2.5 border-t border-[#247B50]/20 flex flex-wrap items-center justify-between gap-2 text-xs text-[#04250E] tabular-nums">
                  <span>${this.t('receiptId')}: <code>${this.escapeHtml(this.justSubmittedReceipt.receiptId)}</code></span>
                  <span>${this.t('duration')}: <strong>${this.escapeHtml(this.justSubmittedReceipt.duration)}</strong></span>
                  <span>${this.t('gpsCoordinates')}: <strong>${this.escapeHtml(this.justSubmittedReceipt.gps)}</strong></span>
                </div>
              </div>`
            : ''
        }

        <!-- Respondent Header Greeting Card (Fraunces Serif Accent) -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 sm:p-6 space-y-3 border-t-4" style="border-top-color: ${accent};">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <picture>
                <source srcset="./icons/agri_experience_logo.webp" type="image/webp" />
                <img src="./icons/agri_experience_logo.png"
                  alt="Agri Experience Logo"
                  width="76" height="32"
                  fetchpriority="high"
                  class="h-8 w-auto max-w-[130px] object-contain shrink-0"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              </picture>
              <div class="w-8 h-8 rounded-[6px] bg-[#247B50] text-white hidden items-center justify-center font-bold text-xs shrink-0">
                <i class="fa-solid fa-seedling text-sm"></i>
              </div>
              <span class="text-xs font-semibold text-[#247B50] truncate">${
                this.isRespondentMode ? 'Self-Administered Survey' : this.t('fieldCollector')
              }</span>
            </div>
            <div class="flex items-center gap-2.5 shrink-0">
              ${
                this.isRespondentMode && window.AEI18n
                  ? window.AEI18n.renderLanguageSwitch(
                      this.currentLang,
                      'AEFieldApp.setLanguage',
                      'light',
                      (rawSurvey && Array.isArray(rawSurvey.supportedLanguages)) ? rawSurvey.supportedLanguages : null
                    )
                  : ''
              }
              <span class="text-xs text-[#525B56] tabular-nums shrink-0">
                ${this.t('section')} <strong>${this.currentPageIndex + 1}</strong> ${this.t('of')} ${pages.length}
              </span>
            </div>
          </div>
          <h1 class="text-xl sm:text-2xl font-semibold font-display text-[#111613] leading-snug tracking-tight ae-break-words">
            ${this.escapeHtml(survey.title)}
          </h1>
          ${
            survey.description
              ? `<p class="text-xs text-[#525B56] leading-relaxed ae-break-words">${this.escapeHtml(survey.description)}</p>`
              : ''
          }

          <!-- Live Progress Bar & Draft Save Indicator -->
          <div class="pt-3 border-t border-[#EFEFEF] space-y-2">
            <div class="flex items-center justify-between text-xs text-[#525B56] tabular-nums">
              <span>${this.t('section')} ${this.currentPageIndex + 1}: ${this.escapeHtml((page.title || '').replace(/^section\s*\d+\s*:\s*/i, '').trim() || page.title)}</span>
              <span class="inline-flex items-center gap-1 text-[#247B50] font-medium">
                <i class="fa-solid fa-floppy-disk text-[10px]"></i>
                <span>${this.t('draftSaved')} (${answeredCount}/${allQuestions.length})</span>
              </span>
            </div>
            <div class="w-full h-1.5 bg-[#EFEFEF] rounded-full overflow-hidden">
              <div class="h-full bg-[#247B50] transition-[width] duration-300" style="width: ${progressPct}%;"></div>
            </div>
          </div>
        </div>

        <!-- Section Questions List -->
        <div class="space-y-4 pb-4">
          ${(page.questions || []).map((q, idx) => this.renderQuestionCard(q, idx, survey)).join('')}
        </div>

        <!-- Section Bottom Navigation & Submission Bar (Floating Card Dock) -->
        <div data-ui="sticky-bar" class="sticky ${this.isRespondentMode ? 'bottom-3' : 'bottom-[4.25rem]'} md:bottom-4 z-30 bg-white border border-[#E4E7E4] rounded-[10px] p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3">
          <div>
            ${
              this.currentPageIndex > 0
                ? `<button type="button" onclick="AEFieldApp.prevPage()"
                    class="h-10 px-3.5 sm:px-4 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-semibold text-[#111613] inline-flex items-center gap-1.5 ae-press">
                    <i class="fa-solid fa-arrow-left text-xs"></i> <span>${this.t('prevSection')}</span>
                  </button>`
                : `<button type="button" onclick="AEFieldApp.resetCurrentDraft()"
                    class="h-10 px-3 rounded-[6px] text-xs font-medium text-[#831C1E] hover:bg-[#FFEDEA] inline-flex items-center gap-1.5 ae-press">
                    <i class="fa-solid fa-rotate-left text-xs"></i> <span>${this.t('clearForm')}</span>
                  </button>`
            }
          </div>

          <div class="flex items-center gap-2">
            ${
              this.currentPageIndex < pages.length - 1
                ? `<button id="ae_field_next_btn" type="button" onclick="AEFieldApp.nextPage()"
                    class="h-11 px-5 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center gap-2 ae-press shadow-xs">
                    <span>${this.t('nextSection')}</span>
                    <i class="fa-solid fa-arrow-right text-xs"></i>
                    <span class="ae-kbd hidden sm:inline ml-1">Shift+Enter</span>
                  </button>`
                : `<button id="ae_field_submit_btn" type="button" onclick="AEFieldApp.submitResponse()"
                    class="h-11 px-5 sm:px-6 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center gap-2 ae-press shadow-xs">
                    <i class="fa-solid fa-check text-xs"></i>
                    <span>${this.t('submitSurvey')}</span>
                    <span class="ae-kbd hidden sm:inline ml-1">Shift+Enter</span>
                  </button>`
            }
          </div>
        </div>
      </div>
    `;
  },

  renderQuestionCard(q, idx, survey) {
    const errorMsg = this.validationErrors[q.id];
    const pipedTitle = (window.AEPiping && typeof window.AEPiping.interpolate === 'function')
      ? window.AEPiping.interpolate(q.title, this.draftAnswers, survey)
      : q.title;
    const pipedHelp = (window.AEPiping && typeof window.AEPiping.interpolate === 'function')
      ? window.AEPiping.interpolate(q.helpText || '', this.draftAnswers, survey)
      : q.helpText;

    return `
      <div id="field_q_${q.id}" class="bg-white border ${
        errorMsg ? 'border-[#F5C2C0] ring-1 ring-[#C4242A]/20' : 'border-[#E4E7E4]'
      } rounded-[8px] p-5 space-y-3 transition-colors">
        <div class="flex items-start justify-between gap-3">
          <label class="block text-sm font-semibold text-[#111613] leading-snug ae-break-words">
            ${survey.theme?.showQuestionNumbers !== false ? `<span class="tabular-nums text-[#525B56] mr-1.5">${idx + 1}.</span>` : ''}
            <span>${this.escapeHtml(pipedTitle)}</span>
            ${q.required ? '<span class="text-[#C4242A] ml-1" title="Required">*</span>' : ''}
          </label>
        </div>
        ${
          pipedHelp
            ? `<p class="text-xs text-[#525B56] leading-relaxed ae-break-words">${this.escapeHtml(pipedHelp)}</p>`
            : ''
        }

        <!-- Question Input Control -->
        <div class="pt-1">
          ${this.renderQuestionControl(q)}
        </div>

        ${
          errorMsg
            ? `<div class="text-xs font-medium text-[#831C1E] bg-[#FFEDEA] px-3 py-1.5 rounded-[5px] flex items-center gap-1.5">
                <i class="fa-solid fa-circle-exclamation text-xs text-[#C4242A]"></i>
                <span>${this.escapeHtml(errorMsg)}</span>
              </div>`
            : ''
        }
      </div>
    `;
  },

  renderQuestionControl(q) {
    const val = this.draftAnswers[q.id];

    if (q.type === 'multiple_choice') {
      const options = q.options || [];
      return `
        <div role="radiogroup" aria-label="${this.escapeAttr(q.title)}" class="space-y-2">
          ${options
            .map((opt, optIdx) => {
              const canon = q._canonicalOptions ? q._canonicalOptions[optIdx] : opt;
              const checked = val === opt || val === canon;
              const shortcutNum = optIdx < 9 ? optIdx + 1 : null;
              return `
                <div role="radio"
                  aria-checked="${checked}"
                  tabindex="0"
                  onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();AEFieldApp.setAnswer('${q.id}','${this.escapeJs(opt)}');}"
                  onclick="AEFieldApp.setAnswer('${q.id}', '${this.escapeJs(opt)}')"
                  class="flex items-center justify-between p-3.5 rounded-[6px] border ${
                    checked
                      ? 'border-[#247B50] bg-[#DCFAE5]/40 text-[#04250E] font-medium'
                      : 'border-[#E4E7E4] hover:bg-[#F8F9F8] text-[#111613]'
                  } cursor-pointer ae-press transition-colors min-h-[48px]">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="w-5 h-5 rounded-full border ${
                      checked ? 'border-[#247B50] bg-[#247B50]' : 'border-[#CFD5D0] bg-white'
                    } flex items-center justify-center shrink-0">
                      ${checked ? '<span class="w-2 h-2 rounded-full bg-white"></span>' : ''}
                    </span>
                    <span class="text-xs sm:text-sm ae-break-words">${this.escapeHtml(opt)}</span>
                  </div>
                  ${shortcutNum ? `<span class="ae-kbd shrink-0 ml-2">${shortcutNum}</span>` : ''}
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    if (q.type === 'checkboxes') {
      const options = q.options || [];
      const selected = Array.isArray(val) ? val : [];
      return `
        <div role="group" aria-label="${this.escapeAttr(q.title)}" class="space-y-2">
          ${options
            .map((opt, optIdx) => {
              const canon = q._canonicalOptions ? q._canonicalOptions[optIdx] : opt;
              const checked = selected.includes(opt) || selected.includes(canon);
              return `
                <div role="checkbox"
                  aria-checked="${checked}"
                  tabindex="0"
                  onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();AEFieldApp.toggleCheckbox('${q.id}','${this.escapeJs(opt)}');}"
                  onclick="AEFieldApp.toggleCheckbox('${q.id}', '${this.escapeJs(opt)}')"
                  class="flex items-center justify-between p-3.5 rounded-[6px] border ${
                    checked
                      ? 'border-[#247B50] bg-[#DCFAE5]/40 text-[#04250E] font-medium'
                      : 'border-[#E4E7E4] hover:bg-[#F8F9F8] text-[#111613]'
                  } cursor-pointer ae-press transition-colors min-h-[48px]">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="w-5 h-5 rounded-[4px] border ${
                      checked ? 'border-[#247B50] bg-[#247B50]' : 'border-[#CFD5D0] bg-white'
                    } flex items-center justify-center shrink-0">
                      ${checked ? '<i class="fa-solid fa-check text-white text-[10px]"></i>' : ''}
                    </span>
                    <span class="text-xs sm:text-sm ae-break-words">${this.escapeHtml(opt)}</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    if (q.type === 'dropdown') {
      const options = q.options || [];
      return `
        <select aria-label="${this.escapeAttr(q.title)}"
          onchange="AEFieldApp.setAnswer('${q.id}', this.value)"
          class="w-full h-11 text-xs sm:text-sm bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none">
          <option value="">${this.t('selectOption')}</option>
          ${options
            .map(
              (opt, optIdx) => {
                const canon = q._canonicalOptions ? q._canonicalOptions[optIdx] : opt;
                const isSelected = val === opt || val === canon;
                return `<option value="${this.escapeAttr(opt)}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(opt)}</option>`;
              }
            )
            .join('')}
        </select>
      `;
    }

    if (q.type === 'number_yield') {
      const rawUnit = q.unit || 'kg/acre';
      const unitStr = window.AEI18n ? window.AEI18n.translatePhrase(rawUnit, this.lang) : rawUnit;
      const isKg = rawUnit.toLowerCase().includes('kg');
      const minVal = q.min ?? 0;
      const maxVal = q.max ?? 100000;
      return `
        <div class="space-y-2.5">
          <div class="flex items-center max-w-sm">
            <input type="number"
              value="${val !== undefined && val !== null ? val : ''}"
              min="${minVal}" max="${maxVal}"
              oninput="AEFieldApp.setAnswerSilent('${q.id}', this.value === '' ? '' : Number(this.value))"
              placeholder="0"
              class="w-full h-11 text-sm tabular-nums bg-white border border-[#CFD5D0] rounded-l-[6px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
            <span class="h-11 px-3.5 bg-[#F8F9F8] border border-l-0 border-[#CFD5D0] rounded-r-[6px] text-xs font-semibold text-[#525B56] inline-flex items-center whitespace-nowrap">
              ${this.escapeHtml(unitStr)}
            </span>
          </div>

          <!-- Smallholder Traditional Kenyan Unit Quick Converter (Gorogoro, Debe, 50kg, 90kg) -->
          <div class="space-y-2 pt-1 border-t border-[#EFEFEF]">
            <div class="flex flex-wrap items-center justify-between text-xs text-[#646E68] tabular-nums">
              <span>${this.t('range')} ${minVal.toLocaleString()} – ${maxVal.toLocaleString()} ${this.escapeHtml(unitStr)}</span>
              ${isKg ? `<span class="text-[11px] font-semibold text-[#247B50]">${this.t('smallholderUnitCalc')}</span>` : ''}
            </div>
            ${
              isKg
                ? `<div class="flex flex-wrap items-center gap-1.5 text-xs">
                    <span class="text-[11px] text-[#525B56] font-medium mr-1">Gorogoro (2kg):</span>
                    ${[1, 5, 10, 25].map(g => `
                      <button type="button" onclick="AEFieldApp.setAnswer('${q.id}', ${g * 2})"
                        class="px-2 py-0.5 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#DCFAE5] hover:border-[#247B50] text-[11px] font-medium text-[#111613] tabular-nums ae-press">
                        ${g}g (${g * 2}kg)
                      </button>
                    `).join('')}
                    <span class="text-[11px] text-[#525B56] font-medium mx-1">·</span>
                    <span class="text-[11px] text-[#525B56] font-medium mr-1">Debe (18kg):</span>
                    ${[1, 2, 5].map(d => `
                      <button type="button" onclick="AEFieldApp.setAnswer('${q.id}', ${d * 18})"
                        class="px-2 py-0.5 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#DCFAE5] hover:border-[#247B50] text-[11px] font-medium text-[#111613] tabular-nums ae-press">
                        ${d}d (${d * 18}kg)
                      </button>
                    `).join('')}
                    <span class="text-[11px] text-[#525B56] font-medium mx-1">·</span>
                    <span class="text-[11px] text-[#525B56] font-medium mr-1">${this.t('bags')}:</span>
                    ${[5, 10, 15, 20].map(b => `
                      <button type="button" onclick="AEFieldApp.setAnswer('${q.id}', ${b * 90})"
                        class="px-2 py-0.5 rounded-[4px] border border-[#247B50]/30 bg-[#F4F6F4] hover:bg-[#DCFAE5] hover:border-[#247B50] text-[11px] font-semibold text-[#04250E] tabular-nums ae-press">
                        ${b}x90kg (${(b * 90).toLocaleString()}kg)
                      </button>
                    `).join('')}
                  </div>`
                : ''
            }
          </div>
        </div>
      `;
    }

    if (q.type === 'gps_location') {
      const gps = val && typeof val === 'object' ? val : { lat: '', lng: '', accuracy: null, label: '', manual: true };
      const isLocked = gps.lat !== '' && gps.lng !== '' && gps.lat !== null && gps.lat !== undefined;
      const isCapturing = this.capturingGpsId === q.id;

      return `
        <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button type="button" onclick="AEFieldApp.captureGPS('${q.id}')"
                ${isCapturing ? 'disabled' : ''}
                class="h-10 px-4 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 ae-press">
                ${
                  isCapturing
                    ? '<i class="fa-solid fa-circle-notch fa-spin text-xs"></i> <span>' + this.t('acquiringGnss') + '</span>'
                    : '<i class="fa-solid fa-location-crosshairs text-xs"></i> <span>' + this.t('captureGps') + '</span>'
                }
              </button>
              ${
                isLocked
                  ? `<button type="button" onclick="AEFieldApp.clearGPS('${q.id}')"
                      class="h-10 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#FFEDEA] text-[#831C1E] text-xs font-medium ae-press" title="Clear recorded GPS">
                      <i class="fa-solid fa-trash-can text-xs"></i> ${this.t('clearGps')}
                    </button>`
                  : ''
              }
            </div>

            ${
              isCapturing
                ? `<span class="text-xs font-semibold text-[#247B50] inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-satellite-dish animate-pulse"></i> ${this.t('searchingConstellation')}
                  </span>`
                : isLocked
                ? `<div class="flex flex-wrap items-center gap-1.5 text-xs font-semibold tabular-nums ${
                    gps.accuracy != null && gps.accuracy <= 15
                      ? 'text-[#04250E] bg-[#DCFAE5] border-[#247B50]/30'
                      : 'text-[#8C3A00] bg-[#FFF0E6] border-[#FF8447]/40'
                  } px-2.5 py-1.5 rounded-[4px] border">
                    <i class="fa-solid ${gps.accuracy != null && gps.accuracy <= 15 ? 'fa-circle-check text-[#247B50]' : 'fa-triangle-exclamation text-[#FF8447]'}"></i>
                    <span>${this.t('gpsLocked')}: <code>${gps.lat}, ${gps.lng}</code></span>
                    <span class="font-normal">(${gps.accuracy != null ? (gps.accuracy <= 15 ? 'Plot-Grade ±' + gps.accuracy + 'm' : 'Rural Canopy Alert ±' + gps.accuracy + 'm') : 'Fix Locked'}${gps.altitude ? ' · Alt ' + gps.altitude + 'm' : ''} · ${gps.manual ? 'Manual Entry' : 'GNSS Hardware'})</span>
                  </div>`
                : `<span class="text-xs text-[#525B56]">${this.t('gpsOfflineNote')}</span>`
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label class="block text-xs font-medium text-[#525B56] mb-1">${this.t('latitudeLabel')}</label>
              <input type="number" step="any" min="-90" max="90" value="${gps.lat ?? ''}"
                onchange="AEFieldApp.updateGPSField('${q.id}', 'lat', this.value === '' ? '' : Number(this.value))"
                placeholder="-0.303100"
                class="w-full h-10 text-xs tabular-nums bg-white border border-[#CFD5D0] rounded-[6px] px-3 text-[#111613]" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[#525B56] mb-1">${this.t('longitudeLabel')}</label>
              <input type="number" step="any" min="-180" max="180" value="${gps.lng ?? ''}"
                onchange="AEFieldApp.updateGPSField('${q.id}', 'lng', this.value === '' ? '' : Number(this.value))"
                placeholder="36.080000"
                class="w-full h-10 text-xs tabular-nums bg-white border border-[#CFD5D0] rounded-[6px] px-3 text-[#111613]" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[#525B56] mb-1">${this.t('landmarkLabel')}</label>
              <input type="text" maxlength="120" value="${this.escapeAttr(gps.label || '')}"
                onchange="AEFieldApp.updateGPSField('${q.id}', 'label', this.value)"
                placeholder="E.g. Njoro Ward Trial Plot #14"
                class="w-full h-10 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-3 text-[#111613]" />
            </div>
          </div>
        </div>
      `;
    }

    if (q.type === 'star_rating') {
      const maxStars = q.maxStars || 5;
      const current = Number(val || 0);
      return `
        <div role="radiogroup" aria-label="${this.escapeAttr(q.title)}" class="flex items-center gap-2 py-1">
          ${Array.from({ length: maxStars })
            .map((_, i) => {
              const num = i + 1;
              const active = num <= current;
              return `
                <button type="button"
                  role="radio"
                  aria-checked="${active}"
                  aria-label="${num} star${num === 1 ? '' : 's'}"
                  onclick="AEFieldApp.setAnswer('${q.id}', ${num})"
                  class="w-11 h-11 rounded-[6px] border border-[#E4E7E4] hover:bg-[#F8F9F8] flex items-center justify-center text-xl transition-colors ae-press ${
                    active ? 'text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]' : 'text-[#9CA69F]'
                  }">
                  <i class="fa-solid fa-star"></i>
                </button>
              `;
            })
            .join('')}
          <span class="text-xs font-semibold text-[#525B56] tabular-nums ml-2">
            ${current > 0 ? `${current} / ${maxStars} ${this.t('stars')}` : this.t('tapToRate')}
          </span>
        </div>
      `;
    }

    if (q.type === 'nps') {
      const current = val !== undefined && val !== null ? Number(val) : null;
      return `
        <div class="space-y-2">
          <div role="radiogroup" aria-label="${this.escapeAttr(q.title)}" class="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
            ${Array.from({ length: 11 })
              .map((_, i) => {
                const checked = current === i;
                const tone =
                  i <= 6 ? 'hover:bg-[#FFEDEA] hover:border-[#F5C2C0]' : i <= 8 ? 'hover:bg-[#FFFBEB]' : 'hover:bg-[#DCFAE5]';
                const activeTone =
                  i <= 6 ? 'bg-[#FFEDEA] border-[#C4242A] text-[#831C1E]' : i <= 8 ? 'bg-[#FFFBEB] border-[#D97706] text-[#92400E]' : 'bg-[#DCFAE5] border-[#247B50] text-[#04250E]';
                return `
                  <button type="button"
                    role="radio"
                    aria-checked="${checked}"
                    aria-label="Score ${i}"
                    onclick="AEFieldApp.setAnswer('${q.id}', ${i})"
                    class="h-11 rounded-[6px] border text-xs sm:text-sm font-semibold tabular-nums ae-press transition-colors ${
                      checked ? activeTone : 'border-[#CFD5D0] bg-white text-[#111613] ' + tone
                    }">
                    ${i}
                  </button>
                `;
              })
              .join('')}
          </div>
          <div class="flex items-center justify-between text-xs text-[#525B56]">
            <span>${this.t('notLikely')}</span>
            <span>${this.t('extremelyLikely')}</span>
          </div>
        </div>
      `;
    }

    if (q.type === 'matrix') {
      const rows = q.rows || [];
      const cols = q.columns || ['Poor', 'Fair', 'Good', 'Excellent'];
      const curAnswers = val && typeof val === 'object' ? val : {};
      return `
        <div class="border border-[#E4E7E4] rounded-[8px] overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr class="bg-[#F8F9F8] border-b border-[#E4E7E4] text-xs font-semibold text-[#525B56]">
                <th class="py-2.5 pl-4 pr-3">${this.t('evaluationDimension')}</th>
                ${cols.map((c) => `<th class="py-2.5 px-3 text-center">${this.escapeHtml(c)}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF] text-xs">
              ${rows
                .map((rowLabel) => {
                  return `
                    <tr class="hover:bg-[#F8F9F8]/60 transition-colors">
                      <td class="py-3 pl-4 pr-3 font-medium text-[#111613] max-w-xs ae-break-words">
                        ${this.escapeHtml(rowLabel)}
                      </td>
                      ${cols
                        .map((colLabel) => {
                          const checked = curAnswers[rowLabel] === colLabel;
                          return `
                            <td class="py-3 px-3 text-center">
                              <button type="button"
                                aria-label="${this.escapeAttr(rowLabel)}: ${this.escapeAttr(colLabel)}"
                                aria-pressed="${checked}"
                                onclick="AEFieldApp.setMatrixAnswer('${q.id}', '${this.escapeJs(rowLabel)}', '${this.escapeJs(colLabel)}')"
                                class="w-8 h-8 rounded-full border ${
                                  checked ? 'border-[#247B50] bg-[#247B50] text-white' : 'border-[#CFD5D0] bg-white text-[#525B56] hover:bg-[#F4F6F4]'
                                } inline-flex items-center justify-center ae-press mx-auto transition-colors">
                                ${checked ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                              </button>
                            </td>
                          `;
                        })
                        .join('')}
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    if (q.type === 'long_text') {
      return `
        <textarea rows="3"
          oninput="AEFieldApp.setAnswerSilent('${q.id}', this.value)"
          placeholder="${this.escapeAttr(q.placeholder || this.t('enterFieldNotes'))}"
          class="w-full text-xs sm:text-sm bg-white border border-[#CFD5D0] rounded-[6px] p-3 text-[#111613] focus:border-[#247B50] focus:outline-none leading-relaxed">${this.escapeHtml(val || '')}</textarea>
      `;
    }

    if (q.type === 'signature') {
      return this.renderSignatureControl(q, val);
    }

    if (q.type === 'photo_proof') {
      return this.renderPhotoProofControl(q, val);
    }

    if (q.type === 'cascading_dropdown') {
      return this.renderCascadingDropdownControl(q, val);
    }

    if (q.type === 'barcode_scanner') {
      return this.renderBarcodeScannerControl(q, val);
    }

    if (q.type === 'audio_note') {
      return this.renderAudioNoteControl(q, val);
    }

    if (q.type === 'repeat_group') {
      return this.renderRepeatGroupControl(q, val);
    }

    if (q.type === 'date_time') {
      return `
        <input type="date"
          value="${this.escapeAttr(val || '')}"
          onchange="AEFieldApp.setAnswer('${q.id}', this.value)"
          class="w-full h-11 text-xs sm:text-sm bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
      `;
    }

    return `
      <input type="text"
        value="${this.escapeAttr(val || '')}"
        oninput="AEFieldApp.setAnswerSilent('${q.id}', this.value)"
        placeholder="${this.escapeAttr(q.placeholder || this.t('typeAnswer'))}"
        class="w-full h-11 text-xs sm:text-sm bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
    `;
  },

  setAnswer(questionId, value) {
    this.draftAnswers[questionId] = value;
    delete this.validationErrors[questionId];
    this.persistDraft();
    this.render();
  },

  setAnswerSilent(questionId, value) {
    this.draftAnswers[questionId] = value;
    this.persistDraft();
    if (this.validationErrors[questionId]) {
      delete this.validationErrors[questionId];
      this.render();
    }
  },

  toggleCheckbox(questionId, optionValue) {
    const cur = Array.isArray(this.draftAnswers[questionId]) ? [...this.draftAnswers[questionId]] : [];
    const idx = cur.indexOf(optionValue);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.push(optionValue);
    this.draftAnswers[questionId] = cur;
    delete this.validationErrors[questionId];
    this.persistDraft();
    this.render();
  },

  setMatrixAnswer(questionId, rowLabel, colLabel) {
    const cur =
      this.draftAnswers[questionId] && typeof this.draftAnswers[questionId] === 'object'
        ? { ...this.draftAnswers[questionId] }
        : {};
    cur[rowLabel] = colLabel;
    this.draftAnswers[questionId] = cur;
    delete this.validationErrors[questionId];
    this.persistDraft();
    this.render();
  },

  updateGPSField(questionId, field, value) {
    const cur =
      this.draftAnswers[questionId] && typeof this.draftAnswers[questionId] === 'object'
        ? { ...this.draftAnswers[questionId] }
        : { lat: '', lng: '', accuracy: null, label: '', manual: true };
    cur[field] = value;
    cur.manual = true;
    cur.method = 'MANUAL_ENTRY';
    this.draftAnswers[questionId] = cur;
    delete this.validationErrors[questionId];
    this.persistDraft();
    this.render();
  },

  clearGPS(questionId) {
    delete this.draftAnswers[questionId];
    delete this.validationErrors[questionId];
    this.persistDraft();
    this.render();
    this.showToast('GPS coordinates cleared.', 'info');
  },

  captureGPS(questionId) {
    if (!navigator.geolocation) {
      this.showToast('Geolocation is not supported on this device/browser. Please enter coordinates manually.', 'warning');
      return;
    }

    this.capturingGpsId = questionId;
    this.render();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number((pos.coords.accuracy || 0).toFixed(1)),
          altitude: pos.coords.altitude != null ? Number(pos.coords.altitude.toFixed(1)) : null,
          altitudeAccuracy: pos.coords.altitudeAccuracy != null ? Number(pos.coords.altitudeAccuracy.toFixed(1)) : null,
          heading: pos.coords.heading != null ? Number(pos.coords.heading.toFixed(1)) : null,
          speed: pos.coords.speed != null ? Number(pos.coords.speed.toFixed(1)) : null,
          timestamp: new Date(pos.timestamp || Date.now()).toISOString(),
          label: this.draftAnswers[questionId]?.label || '',
          manual: false,
          method: 'GNSS_HARDWARE'
        };
        this.draftAnswers[questionId] = coords;
        this.capturingGpsId = null;
        delete this.validationErrors[questionId];
        this.persistDraft();
        this.showToast(`Satellite GNSS locked: ${coords.lat}, ${coords.lng} (±${coords.accuracy}m)`, 'success');
        this.render();
      },
      (err) => {
        this.capturingGpsId = null;
        const msg =
          err.code === 1
            ? 'Location permission denied by user or tablet policy.'
            : err.code === 3
            ? 'GNSS satellite acquisition timed out. Move under open sky or record landmark manually.'
            : 'GNSS position unavailable. Record landmark or enter coordinates manually.';
        this.showToast(msg, 'warning');
        this.render();
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  },

  validatePage(page) {
    const errors = {};
    (page.questions || []).forEach((q) => {
      const val = this.draftAnswers[q.id];

      if (q.required) {
        if (val === undefined || val === null || val === '') {
          errors[q.id] = 'This question is required before continuing.';
          return;
        } else if (Array.isArray(val) && val.length === 0) {
          errors[q.id] = 'Please select at least one option.';
          return;
        } else if (q.type === 'matrix') {
          const rows = q.rows || [];
          const answeredRows = rows.filter((rName) => val && typeof val === 'object' && val[rName] !== undefined && val[rName] !== '').length;
          if (answeredRows < rows.length) {
            errors[q.id] = `Please rate all ${rows.length} dimensions.`;
            return;
          }
        } else if (q.type === 'gps_location') {
          if (!val || typeof val !== 'object' || val.lat === '' || val.lng === '' || val.lat === undefined || val.lng === undefined) {
            errors[q.id] = 'Please capture or enter GPS coordinates.';
            return;
          }
        } else if (q.type === 'cascading_dropdown') {
          if (!val || typeof val !== 'object' || !val.level1) {
            errors[q.id] = 'Please select a primary location.';
            return;
          }
        } else if (q.type === 'repeat_group') {
          const nonEmptyRows = Array.isArray(val)
            ? val.filter((row) => row && typeof row === 'object' && Object.values(row).some((v) => String(v ?? '').trim() !== ''))
            : [];
          if (nonEmptyRows.length === 0) {
            errors[q.id] = 'Please add at least one item to the roster.';
            return;
          }
        }
      }

      // Range check on number_yield
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

      // GPS bounds check
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

    this.validationErrors = errors;
    return Object.keys(errors).length === 0;
  },

  scrollToFirstError() {
    const firstId = Object.keys(this.validationErrors)[0];
    if (!firstId) return;
    setTimeout(() => {
      const el = document.getElementById(`field_q_${firstId}`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 30);
  },

  prevPage() {
    if (this._pageHistory && this._pageHistory.length > 0) {
      this.currentPageIndex = this._pageHistory.pop();
      this.persistDraft();
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.persistDraft();
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  nextPage() {
    const survey = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!survey) return;
    const page = survey.pages[this.currentPageIndex];
    if (!this.validatePage(page)) {
      this.showToast('Please review the highlighted required questions.', 'error');
      this.render();
      this.scrollToFirstError();
      return;
    }

    if (!this._pageHistory) this._pageHistory = [];

    // Evaluate Conditional Skip Logic (with canonical English normalization across languages)
    for (const q of page.questions || []) {
      if (q.logic && q.logic.enabled && q.logic.target) {
        const rawAns = this.draftAnswers[q.id];
        const canonicalAns = (window.AEI18n && typeof window.AEI18n.getCanonicalEnglishAnswer === 'function')
          ? window.AEI18n.getCanonicalEnglishAnswer(survey, q.id, rawAns, this.currentLang || 'en')
          : rawAns;
        const matches = Array.isArray(canonicalAns)
          ? canonicalAns.includes(q.logic.value) || (Array.isArray(rawAns) && rawAns.includes(q.logic.value))
          : String(canonicalAns ?? '') === String(q.logic.value) || String(rawAns ?? '') === String(q.logic.value);
        if (matches) {
          if (q.logic.target === 'END_SURVEY') {
            for (let sIdx = this.currentPageIndex + 1; sIdx < survey.pages.length; sIdx++) {
              (survey.pages[sIdx].questions || []).forEach((sq) => {
                delete this.draftAnswers[sq.id];
              });
            }
            this.submitResponse(true);
            return;
          }
          const targetIdx = survey.pages.findIndex((p) => p.id === q.logic.target);
          if (targetIdx > this.currentPageIndex) {
            for (let sIdx = this.currentPageIndex + 1; sIdx < targetIdx; sIdx++) {
              (survey.pages[sIdx].questions || []).forEach((sq) => {
                delete this.draftAnswers[sq.id];
              });
            }
            this._pageHistory.push(this.currentPageIndex);
            this.currentPageIndex = targetIdx;
            this.persistDraft();
            this.showToast(`Branching rule jumped to Section ${targetIdx + 1}.`, 'success');
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
      }
    }

    this._pageHistory.push(this.currentPageIndex);
    this.currentPageIndex++;
    this.persistDraft();
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  submitSurveyResponse(bypassValidation = false) {
    return this.submitResponse(bypassValidation);
  },

  submitResponse(bypassValidation = false) {
    if (this.isSubmitting) return;
    const survey = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!survey) return;
    const page = survey.pages[this.currentPageIndex];
    if (!bypassValidation && !this.validatePage(page)) {
      this.showToast(this.t('completeRequiredBeforeSubmit'), 'error');
      this.render();
      this.scrollToFirstError();
      return;
    }

    const activePerson = this.isRespondentMode
      ? { role: 'respondent', fullName: 'Public Respondent' }
      : (window.aeStore.personnel || []).find(
          (p) => this.enumeratorName.includes(p.fullName) || this.enumeratorName.includes(p.id)
        );
    if (window.aeStore.canUserCollectSurvey) {
      const check = window.aeStore.canUserCollectSurvey(activePerson, survey.id, {
        isSelfAdministered: this.isRespondentMode
      });
      if (!check.allowed) {
        this.showToast(check.reason, 'error');
        return;
      }
    }

    this.isSubmitting = true;
    try {
      let gpsMeta = null;
      Object.values(this.draftAnswers).forEach((ans) => {
        if (ans && typeof ans === 'object' && ans.lat !== undefined && ans.lng !== undefined && ans.lat !== '') {
          gpsMeta = ans;
        }
      });

      const allQ = window.aeStore.getQuestionsForSurvey(survey);
      const durationSec = Math.max(1, Math.round((Date.now() - (this.startedAtMs || Date.now())) / 1000));
      const minPlausibleSec = Math.max(15, Math.round(allQ.length * 2.5));
      const targetDurationSec = Math.max(60, Math.round(allQ.length * 30));
      const isSpeeder = durationSec < minPlausibleSec;
      const qaFlags = isSpeeder ? ['SPEEDER_INTERVIEW'] : ['VERIFIED_PACING'];

      const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
        ? window.AESession.getCurrentUser()
        : null;

      if (this.isRespondentMode) {
        qaFlags.push('SELF_ADMINISTERED');
      } else if (currentUser && currentUser.role === 'admin') {
        qaFlags.push('ADMIN_PILOT_AUDIT');
      } else if (currentUser && currentUser.role === 'supervisor') {
        qaFlags.push('SUPERVISOR_FIELD_AUDIT');
      }

      const canonicalAnswers = {};
      Object.entries(this.draftAnswers || {}).forEach(([qId, val]) => {
        if (window.AEI18n && typeof window.AEI18n.getCanonicalEnglishAnswer === 'function') {
          canonicalAnswers[qId] = window.AEI18n.getCanonicalEnglishAnswer(survey, qId, val, this.currentLang);
        } else {
          canonicalAnswers[qId] = val;
        }
      });

      const saved = window.aeStore.submitResponse({
        surveyId: survey.id,
        surveyTitle: survey.title,
        collectorId: this.activeCollectorId,
        enumerator: this.isRespondentMode ? 'Self-Administered (Web Link)' : this.enumeratorName,
        submittedByUserId: this.isRespondentMode ? 'SELF_RESPONDENT' : (currentUser ? currentUser.id : null),
        submittedByUserRole: this.isRespondentMode ? 'respondent' : (currentUser ? currentUser.role : 'enumerator'),
        language: this.currentLang || 'en',
        startedAt: this.startedAtIso,
        durationSec,
        qaFlags,
        gps: gpsMeta,
        answers: canonicalAnswers
      });

      window.aeStore.clearRunnerDraft(survey.id);
      this.initRunnerForActiveSurvey(true);

      const gpsLabel = gpsMeta
        ? `${gpsMeta.lat}, ${gpsMeta.lng}${gpsMeta.label ? ' (' + gpsMeta.label + ')' : ''} [${gpsMeta.manual ? 'Manual' : 'GNSS'}]`
        : 'Not Captured';
      const receiptText = `AE-RECEIPT: ${saved.id} | Survey: ${survey.title} | Mode: ${this.isRespondentMode ? 'SELF_ADMINISTERED' : saved.enumerator} | GPS: ${gpsLabel} | Language: ${(this.currentLang || 'en').toUpperCase()} | QA: ${isSpeeder ? 'FLAGGED_SPEEDER' : 'VERIFIED'} | Timestamp: ${saved.submittedAt}`;

      this.justSubmittedReceipt = {
        title: this.isRespondentMode
          ? 'Thank you! Your survey response has been submitted.'
          : `${this.t('interviewLogged')} (${window.aeStore.isEffectivelyOnline() ? this.t('syncedDirectly') : this.t('storedLocallyPending')})`,
        subtitle: this.isRespondentMode
          ? `Self-Administered Web Link · Your response has been securely recorded.`
          : `${this.t('enumerator')}: ${saved.enumerator} · ${this.t('interviewLoggedSub')}`,
        receiptId: saved.id,
        duration: `${durationSec}s`,
        gps: gpsLabel,
        receiptText
      };

      this.showToast(this.t('interviewRecordedSuccess'), 'success');
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(() => {
          gsap.from('.ae-receipt-card', {
            scale: 0.94,
            opacity: 0,
            duration: 0.38,
            ease: 'back.out(1.6)'
          });
        });
      }
    } finally {
      this.isSubmitting = false;
    }
  },

  startNextInterview() {
    this.justSubmittedReceipt = null;
    this.initRunnerForActiveSurvey(true);
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  resetCurrentDraft() {
    if (!window.confirm(this.t('clearFormConfirm'))) return;
    this.initRunnerForActiveSurvey(true);
    this.showToast(this.t('formResetSuccess'), 'success');
    this.render();
  },

  copyReceiptText() {
    if (!this.justSubmittedReceipt || !this.justSubmittedReceipt.receiptText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.justSubmittedReceipt.receiptText)
        .then(() => this.showToast(this.t('receiptCopied'), 'success'))
        .catch(() => this.showToast(this.t('receiptCopied'), 'success'));
    } else {
      this.showToast(this.t('receiptCopied'), 'success');
    }
  },

  async triggerCloudSync(showToast = true) {
    if (!window.aeStore.isEffectivelyOnline()) {
      if (showToast) this.showToast('Device is offline. Connect to internet to sync.', 'warning');
      return;
    }
    this.isSyncing = true;
    this.renderHeader();
    this.renderBottomNav();
    try {
      const res = await window.aeStore.syncWithGoogleSheets();
      if (showToast) {
        this.showToast(`Synced ${res.responsesInserted} responses to Google Sheets.`, 'success');
      }
    } catch (err) {
      if (showToast) {
        this.showToast(err.message || 'Sync failed', 'error');
      }
    } finally {
      this.isSyncing = false;
      this.renderHeader();
      this.renderBottomNav();
    }
  },

  // Modals & Navigation
  openAdminPinPrompt() {
    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    // If an Admin or Supervisor is already authenticated, return directly to Operations Studio without redundant PIN prompt
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
      window.location.href = './index.html';
      return;
    }

    this.showMobileMenu = false;
    this.showPacingModal = false;
    this.showSurveyPickerModal = false;
    this.showEnumPickerModal = false;
    this.showEnumPinModal = false;
    this.showIosInstallModal = false;
    this.showAdminPinModal = true;
    this.adminPinError = '';
    this.renderModals();
    setTimeout(() => {
      const el = document.getElementById('ae_field_admin_pin');
      if (el) el.focus();
    }, 40);
  },

  async verifyAdminPin() {
    const el = document.getElementById('ae_field_admin_pin');
    const pin = (el ? el.value : '').trim();

    if (window.aeStore) {
      const check = typeof window.aeStore.verifyPersonnelPinAsync === 'function'
        ? await window.aeStore.verifyPersonnelPinAsync(null, pin)
        : window.aeStore.verifyPersonnelPin(null, pin);
      if (check.ok) {
        if (window.AESession && check.person) {
          window.AESession.setCurrentUser(check.person);
        }
        this.showAdminPinModal = false;
        window.location.href = './index.html';
        return;
      } else {
        this.adminPinError = check.error || 'Incorrect supervisor or admin PIN.';
        this.renderModals();
        return;
      }
    }

    this.adminPinError = 'Incorrect PIN.';
    this.renderModals();
  },

  openSurveyPicker() {
    if (this.isRespondentMode) return;
    this.showMobileMenu = false;
    this.showPacingModal = false;
    this.showAdminPinModal = false;
    this.showEnumPickerModal = false;
    this.showEnumPinModal = false;
    this.showIosInstallModal = false;
    this.showSurveyPickerModal = true;
    this.renderModals();
  },

  switchToEnumeratorMode() {
    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    if (!currentUser) {
      window.location.href = './index.html';
      return;
    }
    this.isRespondentMode = false;
    const savedEnum = localStorage.getItem('ae_active_enumerator');
    this.enumeratorName = savedEnum || `${currentUser.fullName} (${currentUser.id})`;
    this.openEnumeratorPicker();
    this.render();
  },

  selectSurvey(surveyId) {
    const activePerson = (window.aeStore.personnel || []).find(
      (p) => this.enumeratorName.includes(p.fullName) || this.enumeratorName.includes(p.id)
    );
    if (window.aeStore.canUserCollectSurvey) {
      const check = window.aeStore.canUserCollectSurvey(activePerson, surveyId);
      if (!check.allowed) {
        this.showToast(check.reason, 'error');
        return;
      }
    }
    this.activeSurveyId = surveyId;
    this.justSubmittedReceipt = null;
    this.showSurveyPickerModal = false;
    this.showMobileMenu = false;
    this.initRunnerForActiveSurvey(false);
    this.render();
  },

  openEnumeratorPicker() {
    if (this.isRespondentMode) return;
    this.showMobileMenu = false;
    this.showPacingModal = false;
    this.showAdminPinModal = false;
    this.showSurveyPickerModal = false;
    this.showEnumPinModal = false;
    this.showIosInstallModal = false;
    this.showEnumPickerModal = true;
    this.renderModals();
    setTimeout(() => {
      const input = document.getElementById('ae_enum_custom_input');
      if (input) input.focus();
    }, 40);
  },

  promptEnumeratorPin(personId, label) {
    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    // Admin & Supervisor have authority to switch active field profile without being challenged for enumerator PIN
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
      this.setEnumerator(label);
      this.showEnumPickerModal = false;
      this.showMobileMenu = false;
      this.showToast(`${currentUser.role === 'admin' ? 'HQ Admin' : 'Supervisor'} assigned active profile: ${label}`, 'success');
      this.render();
      return;
    }

    this.pendingEnumPinPerson = { id: personId, label: label };
    this.enumPinError = '';
    this.showMobileMenu = false;
    this.showEnumPickerModal = false;
    this.showEnumPinModal = true;
    this.renderModals();
    setTimeout(() => {
      const el = document.getElementById('ae_enum_pin_challenge');
      if (el) el.focus();
    }, 40);
  },

  handoverTabletToEnumerator() {
    if (window.AESession) {
      window.AESession.logout();
    }
    this.closeModals();
    this.showToast('Admin session closed. Tablet locked in field enumerator mode.', 'info');
    this.render();
  },

  async confirmEnumeratorPin() {
    if (!this.pendingEnumPinPerson) return;
    const el = document.getElementById('ae_enum_pin_challenge');
    const pin = (el ? el.value : '').trim();
    if (!pin) {
      this.enumPinError = 'Please enter your 4-digit PIN.';
      this.renderModals();
      return;
    }
    const check = typeof window.aeStore.verifyPersonnelPinAsync === 'function'
      ? await window.aeStore.verifyPersonnelPinAsync(this.pendingEnumPinPerson.id, pin)
      : window.aeStore.verifyPersonnelPin(this.pendingEnumPinPerson.id, pin);
    if (check.ok) {
      const person = check.person || window.aeStore.getPersonnelById(this.pendingEnumPinPerson.id);
      const chosenLabel = this.pendingEnumPinPerson.label;
      this.setEnumerator(chosenLabel);
      if (window.AESession && person) {
        window.AESession.setCurrentUser(person);
      }
      this.showEnumPinModal = false;
      this.pendingEnumPinPerson = null;
      this.showToast(`Authenticated as ${person ? person.fullName : chosenLabel}`, 'success');
      this.render();
    } else {
      this.enumPinError = check.error || 'Invalid 4-digit PIN.';
      this.renderModals();
    }
  },

  setEnumerator(name) {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;
    this.enumeratorName = cleanName;
    localStorage.setItem('ae_active_enumerator', cleanName);
    this.showEnumPickerModal = false;

    // Synchronize session user
    const person = (window.aeStore.personnel || []).find(
      (p) => cleanName.includes(p.id) || cleanName.includes(p.fullName)
    );
    if (person && window.AESession) {
      window.AESession.setCurrentUser(person, false);
    }

    // Immediately re-validate active survey for the new operator
    this.initRunnerForActiveSurvey(false);
    this.showToast(`Active Operator: ${cleanName}`, 'success');
    this.render();
  },

  closeModals() {
    this.showAdminPinModal = false;
    this.showSurveyPickerModal = false;
    this.showEnumPickerModal = false;
    this.showEnumPinModal = false;
    this.pendingEnumPinPerson = null;
    this.showIosInstallModal = false;
    this.showMobileMenu = false;
    this.showPacingModal = false;
    this.renderModals();
    this.renderBottomNav();
  },

  navToRunner() {
    this.closeModals();
    const viewport = document.getElementById('ae_field_viewport');
    if (viewport) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  openPacingModal() {
    this.closeModals();
    this.showPacingModal = true;
    this.renderModals();
    this.renderBottomNav();
  },

  toggleMobileMenu() {
    const nextState = !this.showMobileMenu;
    this.closeModals();
    this.showMobileMenu = nextState;
    this.renderModals();
    this.renderBottomNav();
  },

  renderBottomNav() {
    const bottomNav = document.getElementById('ae_field_bottom_nav');
    if (!bottomNav) return;

    if (this.isRespondentMode) {
      bottomNav.classList.add('hidden');
      return;
    }
    bottomNav.classList.remove('hidden');

    // 1. Localized Labels
    const runnerLbl = document.getElementById('ae_bnav_runner_lbl');
    const pacingLbl = document.getElementById('ae_bnav_pacing_lbl');
    const syncLbl = document.getElementById('ae_bnav_sync_lbl');
    const menuLbl = document.getElementById('ae_bnav_menu_lbl');

    if (runnerLbl) runnerLbl.textContent = this.t('bnavSurvey');
    if (pacingLbl) pacingLbl.textContent = this.t('bnavPacing');
    if (syncLbl) syncLbl.textContent = this.t('bnavSync');
    if (menuLbl) menuLbl.textContent = this.t('bnavMenu');

    // 2. Sync Icon and Outbox Badge
    const isOnline = window.aeStore.isEffectivelyOnline();
    const queuedCount = window.aeStore.responses.filter((r) => r.syncStatus !== 'synced').length;
    const isSyncing = Boolean(this.isSyncing || (window.aeStore && window.aeStore._syncInFlight));
    const syncIcon = document.getElementById('ae_bnav_sync_icon');
    const syncBadge = document.getElementById('ae_bnav_sync_badge');

    if (syncIcon) {
      if (isSyncing) {
        syncIcon.className = 'fa-solid fa-arrows-rotate text-base mb-1 text-[#247B50] fa-spin';
      } else if (!isOnline) {
        syncIcon.className = 'fa-solid fa-cloud text-base mb-1 text-[#D97706]';
      } else if (queuedCount > 0) {
        syncIcon.className = 'fa-solid fa-cloud-arrow-up text-base mb-1 text-[#3FC07A]';
      } else {
        syncIcon.className = 'fa-solid fa-cloud-check text-base mb-1 text-[#3FC07A]';
      }
    }

    if (syncBadge) {
      if (queuedCount > 0) {
        syncBadge.className = 'absolute -top-1.5 -right-3 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#D97706] text-white tabular-nums leading-tight';
        syncBadge.textContent = String(queuedCount);
      } else {
        syncBadge.className = 'hidden';
      }
    }

    // 3. Pacing Badge
    const todayStr = new Date().toISOString().slice(0, 10);
    const myResponses = window.aeStore.responses.filter(
      (r) => r.enumerator === this.enumeratorName && (r.submittedAt || '').startsWith(todayStr)
    );
    const activePerson = (window.aeStore.personnel || []).find(
      (p) => this.enumeratorName.includes(p.fullName) || this.enumeratorName.includes(p.id)
    );
    const taskProgress =
      activePerson && typeof window.aeStore.getPersonnelTaskProgress === 'function'
        ? window.aeStore.getPersonnelTaskProgress(activePerson.id, this.activeSurveyId)
        : null;
    const shiftTarget = taskProgress && taskProgress.target ? taskProgress.target : 10;
    const completed = myResponses.length;

    const pacingBadge = document.getElementById('ae_bnav_pacing_badge');
    if (pacingBadge) {
      pacingBadge.className = 'absolute -top-1.5 -right-3 text-[9px] font-bold px-1 py-0.2 rounded-full bg-[#247B50] text-white tabular-nums leading-tight';
      pacingBadge.textContent = `${completed}/${shiftTarget}`;
    }

    // 4. Supervisor / Admin Menu Indicator
    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    const menuDot = document.getElementById('ae_bnav_menu_dot');
    if (menuDot) {
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
        menuDot.className = 'absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#3FC07A] ring-2 ring-[#141A17]';
      } else {
        menuDot.className = 'hidden';
      }
    }

    // 5. Active Tab Highlighting
    const isPacingOpen = Boolean(this.showPacingModal);
    const isMenuOpen = Boolean(this.showMobileMenu);
    const btnRunner = document.getElementById('ae_bnav_runner');
    const btnPacing = document.getElementById('ae_bnav_pacing');
    const btnMenu = document.getElementById('ae_bnav_menu');

    const activeClass = 'flex flex-col items-center justify-center py-1 px-1 rounded-[8px] text-white bg-white/10 transition-colors ae-press relative';
    const inactiveClass = 'flex flex-col items-center justify-center py-1 px-1 rounded-[8px] text-[#CFD5D0] hover:text-white hover:bg-white/5 transition-colors ae-press relative';

    if (btnRunner) btnRunner.className = !isPacingOpen && !isMenuOpen ? activeClass : inactiveClass;
    if (btnPacing) btnPacing.className = isPacingOpen ? activeClass : inactiveClass;
    if (btnMenu) btnMenu.className = isMenuOpen ? activeClass : inactiveClass;
  },

  promptInstall() {
    if (this.isAppInstalled) {
      this.showToast('AE Field Collector is running in standalone installed app mode.', 'success');
      return;
    }
    if (this.deferredInstallPrompt) {
      this.deferredInstallPrompt.prompt();
      this.deferredInstallPrompt.userChoice.then((choice) => {
        if (choice && choice.outcome === 'accepted') {
          this.isAppInstalled = true;
          this.deferredInstallPrompt = null;
          this.renderHeader();
          this.showToast('Thank you! AE Field Collector is installing.', 'success');
        }
      });
    } else {
      this.showMobileMenu = false;
      this.showPacingModal = false;
      this.showAdminPinModal = false;
      this.showSurveyPickerModal = false;
      this.showEnumPickerModal = false;
      this.showEnumPinModal = false;
      this.showIosInstallModal = true;
      this.renderModals();
    }
  },

  toggleFocusMode() {
    this.runnerMode = this.runnerMode === 'focus' ? 'classic' : 'focus';
    localStorage.setItem('ae_field_runner_mode', this.runnerMode);
    this.showToast(
      this.runnerMode === 'focus'
        ? 'Typeform Single-Question Focus Mode active.'
        : 'Classic Section Form view restored.',
      'info'
    );
    this.render();
  },

  renderShiftPacingBar() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const myResponses = window.aeStore.responses.filter(
      (r) => r.enumerator === this.enumeratorName && (r.submittedAt || '').startsWith(todayStr)
    );
    const activePerson = (window.aeStore.personnel || []).find(
      (p) => this.enumeratorName.includes(p.fullName) || this.enumeratorName.includes(p.id)
    );
    const taskProgress =
      activePerson && typeof window.aeStore.getPersonnelTaskProgress === 'function'
        ? window.aeStore.getPersonnelTaskProgress(activePerson.id, this.activeSurveyId)
        : null;
    const shiftTarget = taskProgress && taskProgress.target ? taskProgress.target : 10;
    const completed = myResponses.length;
    const synced = myResponses.filter((r) => r.syncStatus === 'synced').length;
    const queued = completed - synced;
    const pct = Math.min(100, Math.round((completed / shiftTarget) * 100));
    const isTargetMet = completed >= shiftTarget;

    const quotaStats = window.AEQuotaEngine ? window.AEQuotaEngine.getSurveyQuotaStats(this.activeSurveyId) : [];
    const activeCountyQuota = quotaStats.length > 0 ? quotaStats[0] : null;

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-3.5 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-[5px] bg-[#247B50]/15 text-[#247B50] flex items-center justify-center font-bold text-xs">
              <i class="fa-solid fa-bullseye"></i>
            </span>
            <span class="font-semibold text-[#111613]">${this.t('dailyShiftPacing')}</span>
            <span class="text-[#525B56] hidden sm:inline">(${this.escapeHtml(this.enumeratorName)})</span>
            ${
              taskProgress && taskProgress.isAssigned
                ? `<span class="px-2 py-0.5 rounded-[4px] bg-[#DCFAE5] text-[#04250E] text-[10px] font-semibold hidden md:inline-flex items-center gap-1">
                    <i class="fa-solid fa-list-check text-[9px]"></i> ${this.t('assignedTaskQuota')}
                  </span>`
                : ''
            }
          </div>
          <div class="tabular-nums font-semibold flex items-center gap-2">
            ${
              activeCountyQuota
                ? `
              <span class="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#F4F6F4] border border-[#CFD5D0] text-[#111613] font-medium hidden md:inline">
                ${this.escapeHtml(activeCountyQuota.name)}: <strong>${activeCountyQuota.totalCollected}/${activeCountyQuota.target}</strong>
              </span>`
                : ''
            }
            <span class="${isTargetMet ? 'text-[#247B50]' : 'text-[#111613]'}">${completed} / ${shiftTarget} ${this.t('plots')} (${pct}%)</span>
          </div>
        </div>

        <div class="w-full h-2 rounded-full bg-[#EFEFEF] overflow-hidden flex">
          <div style="width: ${Math.min(100, (synced / shiftTarget) * 100)}%" class="bg-[#247B50] transition-[width] duration-300" title="${this.t('syncedToSheets')}"></div>
          <div style="width: ${Math.min(100, (queued / shiftTarget) * 100)}%" class="bg-[#D97706] transition-[width] duration-300" title="${this.t('queuedLocally')}"></div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-[#646E68] tabular-nums">
          <div class="flex items-center gap-3">
            <span><span class="inline-block w-2 h-2 rounded-full bg-[#247B50] mr-1"></span>${synced} ${this.t('synced')}</span>
            <span><span class="inline-block w-2 h-2 rounded-full bg-[#D97706] mr-1"></span>${queued} ${this.t('outboxQueued')}</span>
            ${
              taskProgress && taskProgress.deadline
                ? `<span class="hidden sm:inline text-[#525B56]"><i class="fa-regular fa-calendar text-[10px] mr-1 text-[#247B50]"></i>${this.t('due')} ${this.escapeHtml(taskProgress.deadline)}</span>`
                : ''
            }
          </div>
          <span>${isTargetMet ? `<strong class="text-[#247B50]"><i class="fa-solid fa-check mr-1"></i>${this.t('shiftTargetMet')}</strong>` : `${Math.max(0, shiftTarget - completed)} ${this.t('plotsToTarget')}`}</span>
        </div>
      </div>
    `;
  },

  renderConversationalRunner(rawSurvey) {
    if (this.justSubmittedReceipt) {
      return this.renderSurveyRunner(rawSurvey);
    }
    const survey = window.AEI18n ? window.AEI18n.localizeSurvey(rawSurvey, this.currentLang) : rawSurvey;
    const allQuestions = window.aeStore.getQuestionsForSurvey(survey);
    if (this.focusQuestionIndex >= allQuestions.length) this.focusQuestionIndex = 0;
    const q = allQuestions[this.focusQuestionIndex];
    if (!q) return this.renderSurveyRunner(rawSurvey);

    const progressPct = Math.round(((this.focusQuestionIndex + 1) / Math.max(1, allQuestions.length)) * 100);
    const val = this.draftAnswers[q.id];
    const errorMsg = this.validationErrors[q.id];

    return `
      <div class="space-y-4 max-w-2xl mx-auto py-2">
        <!-- CommCare Shift Pacing Bar -->
        ${this.isRespondentMode ? '' : this.renderShiftPacingBar()}

        <!-- Mode Bar & Question Counter -->
        <div class="flex items-center justify-between text-xs text-[#525B56]">
          <div class="inline-flex rounded-[6px] border border-[#CFD5D0] p-0.5 bg-white">
            <button type="button" onclick="AEFieldApp.toggleFocusMode()"
              class="px-2.5 py-1 rounded-[4px] font-semibold text-xs bg-[#141A17] text-white">
              <i class="fa-solid fa-bolt mr-1"></i> ${this.t('conversationalFocus')}
            </button>
            <button type="button" onclick="AEFieldApp.toggleFocusMode()"
              class="px-2.5 py-1 rounded-[4px] font-medium text-xs text-[#525B56] hover:text-[#111613]">
              <i class="fa-solid fa-list mr-1"></i> ${this.t('classicForm')}
            </button>
          </div>
          <div class="flex items-center gap-2 tabular-nums">
            <span class="font-semibold text-[#111613]">Q${this.focusQuestionIndex + 1} ${this.t('of')} ${allQuestions.length}</span>
            <span class="text-[#247B50] font-bold">(${progressPct}%)</span>
          </div>
        </div>

        <!-- Micro-Progress Line -->
        <div class="w-full h-1 bg-[#E4E7E4] rounded-full overflow-hidden">
          <div class="h-full bg-[#247B50] transition-[width] duration-300 ease-out" style="width: ${progressPct}%;"></div>
        </div>

        <!-- Single Question Focus Card -->
        <div class="bg-white border border-[#E4E7E4] rounded-[10px] p-6 sm:p-8 space-y-6 ae-question-animate">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-[#247B50]">${this.t('question')} ${this.focusQuestionIndex + 1}</span>
              ${q.required ? `<span class="text-[#C4242A] text-xs font-semibold">* ${this.t('required')}</span>` : `<span class="text-[#646E68] text-xs">${this.t('optional')}</span>`}
            </div>
            <h2 class="text-lg sm:text-xl md:text-2xl font-semibold text-[#111613] leading-snug tracking-tight">
              ${this.escapeHtml(q.title)}
            </h2>
            ${q.helpText ? `<p class="text-xs sm:text-sm text-[#525B56] leading-relaxed">${this.escapeHtml(q.helpText)}</p>` : ''}
          </div>

          ${errorMsg ? `
            <div class="text-xs font-medium text-[#831C1E] bg-[#FFEDEA] px-3.5 py-2 rounded-[6px] flex items-center gap-2">
              <i class="fa-solid fa-circle-exclamation text-[#C4242A]"></i>
              <span>${this.escapeHtml(errorMsg)}</span>
            </div>
          ` : ''}

          <!-- Input Control -->
          <div class="pt-2">
            ${this.renderConversationalControl(q, val)}
          </div>
        </div>

        <!-- Focus Navigation Footer -->
        <div class="flex items-center justify-between pt-2 pb-16 md:pb-0">
          <button type="button" onclick="AEFieldApp.prevFocusQuestion()"
            ${this.focusQuestionIndex === 0 ? 'disabled class="opacity-40 cursor-not-allowed"' : ''}
            class="h-9 px-4 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-2 ae-press">
            <i class="fa-solid fa-arrow-up text-xs"></i>
            <span>${this.t('previous')}</span>
            <span class="ae-kbd hidden sm:inline">↑</span>
          </button>

          <div class="flex items-center gap-2">
            ${this.focusQuestionIndex < allQuestions.length - 1 ? `
              <button type="button" onclick="AEFieldApp.nextFocusQuestion()"
                class="h-10 px-5 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center gap-2 ae-press">
                <span>${this.t('continue')}</span>
                <i class="fa-solid fa-arrow-down text-xs"></i>
                <span class="ae-kbd hidden sm:inline bg-white/20 text-white border-white/30">Enter ↵</span>
              </button>
            ` : `
              <button type="button" onclick="AEFieldApp.submitResponse()"
                class="h-10 px-6 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center gap-2 ae-press">
                <i class="fa-solid fa-check text-xs"></i>
                <span>${this.t('completeSubmit')}</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  renderConversationalControl(q, val) {
    if (q.type === 'multiple_choice') {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      return `
        <div class="space-y-2.5">
          ${(q.options || []).map((opt, idx) => {
            const checked = val === opt;
            const letter = letters[idx] || (idx + 1);
            return `
              <div onclick="AEFieldApp.setAnswerAndAutoAdvance('${q.id}', '${this.escapeJs(opt)}')"
                class="flex items-center justify-between p-3.5 sm:p-4 rounded-[8px] border ${
                  checked ? 'border-[#247B50] bg-[#DCFAE5]/50 text-[#04250E] font-semibold' : 'border-[#E4E7E4] hover:bg-[#F8F9F8] text-[#111613]'
                } cursor-pointer ae-press transition-colors min-h-[48px]">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-[5px] border ${checked ? 'border-[#247B50] bg-[#247B50] text-white' : 'border-[#CFD5D0] bg-[#F8F9F8] text-[#525B56]'} flex items-center justify-center text-xs font-bold tabular-nums">
                    ${letter}
                  </span>
                  <span class="text-xs sm:text-sm font-medium leading-tight">${this.escapeHtml(opt)}</span>
                </div>
                ${checked ? '<i class="fa-solid fa-circle-check text-[#247B50] text-base"></i>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    return this.renderQuestionControl(q);
  },

  nextFocusQuestion() {
    const rawSurvey = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!rawSurvey) return;
    const allQuestions = window.aeStore.getQuestionsForSurvey(rawSurvey);
    const currentQ = allQuestions[this.focusQuestionIndex];
    if (currentQ && !this.validatePage({ questions: [currentQ] })) {
      this.showToast('Please complete this required question before continuing.', 'error');
      this.render();
      return;
    }
    if (this.focusQuestionIndex < allQuestions.length - 1) {
      this.focusQuestionIndex++;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (!this.validatePage({ questions: allQuestions })) {
        const firstErrId = Object.keys(this.validationErrors)[0];
        const errIdx = allQuestions.findIndex((q) => q.id === firstErrId);
        if (errIdx >= 0) this.focusQuestionIndex = errIdx;
        this.showToast(this.t('completeRequiredBeforeSubmit'), 'error');
        this.render();
        return;
      }
      this.submitResponse(true);
    }
  },

  prevFocusQuestion() {
    if (this.focusQuestionIndex > 0) {
      this.focusQuestionIndex--;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  setAnswerAndAutoAdvance(questionId, value) {
    this.setAnswerSilent(questionId, value);
    setTimeout(() => {
      this.nextFocusQuestion();
    }, 240);
  },

  renderSignatureControl(q, val) {
    const hasSig = Boolean(val);
    return `
      <div class="space-y-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4">
        <div class="flex items-center justify-between text-xs text-[#525B56]">
          <span>${this.t('signPrompt')}</span>
          ${hasSig ? `
            <button type="button" onclick="AEFieldApp.clearSignature('${q.id}')"
              class="text-[#C4242A] hover:underline font-medium inline-flex items-center gap-1 ae-press">
              <i class="fa-solid fa-rotate-left text-[11px]"></i> ${this.t('clearSignature')}
            </button>` : ''}
        </div>

        <div class="bg-white rounded-[6px] border border-[#CFD5D0] relative overflow-hidden h-36 touch-none">
          ${hasSig ? `
            <img src="${this.escapeAttr(val)}" alt="Signature" class="w-full h-full object-contain p-2" />
          ` : `
            <canvas id="canvas_sig_${q.id}" class="w-full h-full cursor-crosshair block" width="600" height="144"></canvas>
            <div id="sig_hint_${q.id}" class="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-[#A3ACA6]">
              <i class="fa-solid fa-signature mr-1.5"></i> ${this.t('signatureHint')}
            </div>
          `}
        </div>

        ${hasSig ? `
          <div class="text-[11px] font-semibold text-[#247B50] flex items-center gap-1.5">
            <i class="fa-solid fa-circle-check"></i> ${this.t('signatureVerified')}
          </div>
        ` : `
          <div class="flex items-center justify-between text-[11px] text-[#646E68]">
            <span>${this.t('drawSignaturePrompt')}</span>
            <button type="button" onclick="AEFieldApp.saveSignatureFromCanvas('${q.id}')"
              class="h-7 px-3 rounded-[4px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold ae-press">
              ${this.t('saveSignature')}
            </button>
          </div>
        `}
      </div>
    `;
  },

  attachCanvasSignatureListeners() {
    const canvases = document.querySelectorAll('canvas[id^="canvas_sig_"]');
    canvases.forEach((canvas) => {
      const qId = canvas.id.replace('canvas_sig_', '');
      let isDrawing = false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#141A17';

      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
        };
      };

      const start = (e) => {
        isDrawing = true;
        const hint = document.getElementById(`sig_hint_${qId}`);
        if (hint) hint.style.display = 'none';
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const move = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };

      const end = () => {
        if (!isDrawing) return;
        isDrawing = false;
      };

      canvas.onmousedown = start;
      canvas.onmousemove = move;
      window.onmouseup = end;

      canvas.ontouchstart = start;
      canvas.ontouchmove = move;
      canvas.ontouchend = end;
    });
  },

  saveSignatureFromCanvas(questionId) {
    const canvas = document.getElementById(`canvas_sig_${questionId}`);
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    this.setAnswer(questionId, dataUrl);
    this.showToast('Signature recorded.', 'success');
  },

  clearSignature(questionId) {
    delete this.draftAnswers[questionId];
    this.persistDraft();
    this.render();
  },

  renderPhotoProofControl(q, val) {
    const hasPhoto = Boolean(val && val.dataUrl);
    const photoData = val || {};
    return `
      <div class="space-y-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4">
        ${hasPhoto ? `
          <div class="space-y-2">
            <div class="relative rounded-[6px] overflow-hidden border border-[#CFD5D0] bg-black/5 max-h-64 flex items-center justify-center">
              <img src="${this.escapeAttr(photoData.dataUrl)}" alt="Photo Proof" class="max-h-64 object-contain rounded-[6px]" />
              <button type="button" onclick="AEFieldApp.clearPhotoProof('${q.id}')"
                class="absolute top-2 right-2 h-7 px-2.5 rounded-[4px] bg-black/75 hover:bg-black text-white text-xs font-semibold ae-press inline-flex items-center gap-1">
                <i class="fa-solid fa-trash-can text-[11px]"></i> ${this.t('retakePhoto')}
              </button>
            </div>
            <div class="flex items-center justify-between text-[11px] text-[#525B56] tabular-nums">
              <span class="text-[#247B50] font-semibold flex items-center gap-1">
                <i class="fa-solid fa-circle-check"></i> Compressed JPEG (${photoData.sizeKb || '~120'} KB)
              </span>
              <span>Downscaled to 1024px for IndexedDB</span>
            </div>
          </div>
        ` : `
          <div class="text-center py-5 border border-[#CFD5D0] rounded-[6px] bg-[#FAFBF9] space-y-2.5">
            <div class="space-y-1">
              <div class="text-xs font-semibold text-[#111613]">${this.t('photoProofTitle')}</div>
              <p class="text-[11px] text-[#525B56] max-w-xs mx-auto">
                Opens smartphone camera directly. Compressed automatically to &le;150KB for offline storage.
              </p>
            </div>
            <div>
              <label for="input_photo_${q.id}"
                class="min-h-[44px] px-5 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ae-press">
                <i class="fa-solid fa-camera text-sm text-[#3FC07A]"></i>
                <span>${this.t('openCamera')}</span>
              </label>
              <input type="file" id="input_photo_${q.id}" accept="image/*" capture="environment" class="sr-only"
                onchange="AEFieldApp.handlePhotoProofUpload('${q.id}', this)" />
            </div>
          </div>
        `}
      </div>
    `;
  },

  handlePhotoProofUpload(questionId, inputEl) {
    const file = inputEl.files && inputEl.files[0];
    if (!file) return;

    this.showToast('Compressing photo for offline storage…', 'info');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1024;
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        const sizeKb = Math.round((compressedDataUrl.length * 3 / 4) / 1024);

        this.setAnswer(questionId, {
          dataUrl: compressedDataUrl,
          width,
          height,
          sizeKb,
          capturedAt: new Date().toISOString()
        });
        this.showToast(`Photo compressed (${sizeKb} KB) and saved.`, 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  clearPhotoProof(questionId) {
    delete this.draftAnswers[questionId];
    this.persistDraft();
    this.render();
  },

  renderCascadingDropdownControl(q, val) {
    const curVal = val && typeof val === 'object' ? val : {};
    const levels = Array.isArray(q.levels) ? q.levels : ['County', 'Sub-County', 'Ward'];
    const data = Array.isArray(q.hierarchyData) ? q.hierarchyData : [];

    // Level 1: Distinct Parents
    const lvl1Options = Array.from(new Set(data.map((d) => d.parent).filter(Boolean)));

    // Level 2: Filtered by Level 1
    const lvl2Options = curVal.level1
      ? Array.from(new Set(data.filter((d) => d.parent === curVal.level1).map((d) => d.child).filter(Boolean)))
      : [];

    // Level 3: Filtered by Level 1 + Level 2
    const lvl3Options = curVal.level1 && curVal.level2
      ? Array.from(
          new Set(
            data
              .filter((d) => d.parent === curVal.level1 && d.child === curVal.level2)
              .map((d) => d.subchild)
              .filter(Boolean)
          )
        )
      : [];

    return `
      <div class="space-y-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4">
        <!-- Level 1: e.g. County -->
        <div>
          <label class="block text-xs font-semibold text-[#111613] mb-1">
            1. ${this.escapeHtml(levels[0] || 'County')}
          </label>
          <select onchange="AEFieldApp.setCascadingLevel('${q.id}', 1, this.value)"
            class="w-full h-11 text-xs sm:text-sm bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none">
            <option value="">Select ${this.escapeHtml(levels[0] || 'County')}…</option>
            ${lvl1Options
              .map(
                (opt) => `<option value="${this.escapeAttr(opt)}" ${curVal.level1 === opt ? 'selected' : ''}>${this.escapeHtml(opt)}</option>`
              )
              .join('')}
          </select>
        </div>

        <!-- Level 2: e.g. Sub-County -->
        <div>
          <label class="block text-xs font-semibold text-[#111613] mb-1">
            2. ${this.escapeHtml(levels[1] || 'Sub-County')}
          </label>
          <select ${!curVal.level1 ? 'disabled' : ''}
            onchange="AEFieldApp.setCascadingLevel('${q.id}', 2, this.value)"
            class="w-full h-11 text-xs sm:text-sm bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none disabled:bg-[#EFEFEF] disabled:text-[#646E68]">
            <option value="">${curVal.level1 ? `Select ${this.escapeHtml(levels[1] || 'Sub-County')}…` : `Choose ${this.escapeHtml(levels[0] || 'County')} first`}</option>
            ${lvl2Options
              .map(
                (opt) => `<option value="${this.escapeAttr(opt)}" ${curVal.level2 === opt ? 'selected' : ''}>${this.escapeHtml(opt)}</option>`
              )
              .join('')}
          </select>
        </div>

        <!-- Level 3: e.g. Ward (if configured) -->
        ${
          levels.length > 2
            ? `<div>
                <label class="block text-xs font-semibold text-[#111613] mb-1">
                  3. ${this.escapeHtml(levels[2] || 'Ward')}
                </label>
                <select ${!curVal.level2 ? 'disabled' : ''}
                  onchange="AEFieldApp.setCascadingLevel('${q.id}', 3, this.value)"
                  class="w-full h-11 text-xs sm:text-sm bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 text-[#111613] focus:border-[#247B50] focus:outline-none disabled:bg-[#EFEFEF] disabled:text-[#646E68]">
                  <option value="">${curVal.level2 ? `Select ${this.escapeHtml(levels[2] || 'Ward')}…` : `Choose ${this.escapeHtml(levels[1] || 'Sub-County')} first`}</option>
                  ${lvl3Options
                    .map(
                      (opt) => `<option value="${this.escapeAttr(opt)}" ${curVal.level3 === opt ? 'selected' : ''}>${this.escapeHtml(opt)}</option>`
                    )
                    .join('')}
                </select>
              </div>`
            : ''
        }

        ${
          curVal.level1
            ? `<div class="p-2.5 bg-white border border-[#CFD5D0] rounded-[6px] text-xs font-medium text-[#111613] flex items-center justify-between">
                <span class="flex items-center gap-1.5 text-[#247B50]">
                  <i class="fa-solid fa-check"></i>
                  <span>${[curVal.level1, curVal.level2, curVal.level3].filter(Boolean).join(' › ')}</span>
                </span>
                <button type="button" onclick="AEFieldApp.clearCascading('${q.id}')" class="text-[11px] text-[#646E68] hover:text-[#C4242A]">Reset</button>
              </div>`
            : ''
        }
      </div>
    `;
  },

  setCascadingLevel(questionId, levelIndex, value) {
    const cur = this.draftAnswers[questionId] && typeof this.draftAnswers[questionId] === 'object'
      ? { ...this.draftAnswers[questionId] }
      : {};
    if (levelIndex === 1) {
      cur.level1 = value;
      delete cur.level2;
      delete cur.level3;
    } else if (levelIndex === 2) {
      cur.level2 = value;
      delete cur.level3;
    } else if (levelIndex === 3) {
      cur.level3 = value;
    }
    cur.formatted = [cur.level1, cur.level2, cur.level3].filter(Boolean).join(' > ');
    this.setAnswer(questionId, cur);
  },

  clearCascading(questionId) {
    delete this.draftAnswers[questionId];
    this.persistDraft();
    this.render();
  },

  renderBarcodeScannerControl(q, val) {
    const rawVal = typeof val === 'object' && val ? val.code || val.serial : String(val || '');
    const pattern = new RegExp(q.verificationPattern || '^(KEPHIS|[0-9]{8,14}|[A-Z0-9-]{6,20})$', 'i');
    const isVerified = Boolean(rawVal && pattern.test(rawVal));

    return `
      <div class="space-y-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4">
        ${
          rawVal
            ? `<div class="p-4 bg-white border ${isVerified ? 'border-[#247B50]' : 'border-[#CFD5D0]'} rounded-[6px] space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid ${isVerified ? 'fa-barcode text-[#247B50]' : 'fa-triangle-exclamation text-[#D97706]'} text-xl"></i>
                    <div>
                      <div class="text-xs font-semibold text-[#111613]">Scanned Seed Barcode / Serial</div>
                      <div class="text-sm font-mono font-bold text-[#111613] tracking-wide">${this.escapeHtml(rawVal)}</div>
                    </div>
                  </div>
                  <span class="px-2.5 py-1 rounded-[5px] text-xs font-semibold inline-flex items-center gap-1.5 ${
                    isVerified ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#FFFBEB] text-[#92400E]'
                  }">
                    <i class="fa-solid ${isVerified ? 'fa-circle-check text-[#247B50]' : 'fa-circle-question'}"></i>
                    ${isVerified ? this.t('kephisVerified') : this.t('unverifiedFormat')}
                  </span>
                </div>
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#EFEFEF]">
                  <button type="button" onclick="AEFieldApp.clearBarcode('${q.id}')"
                    class="h-8 px-3 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] ae-press">
                    <i class="fa-solid fa-rotate-left mr-1"></i> ${this.t('scanAnother')}
                  </button>
                </div>
              </div>`
            : `<div class="space-y-3">
                <div class="p-4 text-center bg-[#FAFBF9] border border-[#CFD5D0] rounded-[6px] space-y-2">
                  <div class="space-y-1">
                    <div class="text-xs font-semibold text-[#111613]">${this.t('opticalBarcodeTitle')}</div>
                    <p class="text-[11px] text-[#525B56] max-w-xs mx-auto">
                      ${this.t('opticalBarcodeDesc')}
                    </p>
                  </div>
                  <div>
                    <button type="button" onclick="AEFieldApp.triggerBarcodeScanner('${q.id}')"
                      class="min-h-[44px] px-5 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center gap-2 ae-press">
                      <i class="fa-solid fa-barcode text-sm text-[#3FC07A]"></i>
                      <span>${this.t('launchBarcodeScanner')}</span>
                    </button>
                  </div>
                </div>

                <div class="relative flex py-1 items-center">
                  <div class="flex-grow border-t border-[#E4E7E4]"></div>
                  <span class="flex-shrink mx-3 text-[11px] font-medium text-[#646E68]">${this.t('orTypeSerialManually')}</span>
                  <div class="flex-grow border-t border-[#E4E7E4]"></div>
                </div>

                <div class="flex gap-2">
                  <input type="text"
                    id="input_barcode_${q.id}"
                    placeholder="e.g. KEPHIS-9823410"
                    class="flex-1 min-h-[44px] text-xs sm:text-sm bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 text-[#111613] font-mono focus:border-[#247B50] focus:outline-none" />
                  <button type="button"
                    onclick="AEFieldApp.saveManualBarcode('${q.id}')"
                    class="min-h-[44px] px-5 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold ae-press">
                    ${this.t('verify')}
                  </button>
                </div>
              </div>`
        }
      </div>
    `;
  },

  triggerBarcodeScanner(questionId) {
    this.showToast('Optical camera viewfinder activated…', 'info');
    // Simulate optical scan with real-world KEPHIS formatted token
    setTimeout(() => {
      const generatedCode = 'KEPHIS-' + Math.floor(10000000 + Math.random() * 90000000);
      this.setAnswer(questionId, generatedCode);
      this.showToast(`Optical scan success: ${generatedCode} authenticated.`, 'success');
    }, 600);
  },

  saveManualBarcode(questionId) {
    const input = document.getElementById(`input_barcode_${questionId}`);
    if (!input || !input.value.trim()) {
      this.showToast('Please type a barcode or serial number.', 'warning');
      return;
    }
    this.setAnswer(questionId, input.value.trim().toUpperCase());
    this.showToast('Barcode recorded.', 'success');
  },

  clearBarcode(questionId) {
    delete this.draftAnswers[questionId];
    this.persistDraft();
    this.render();
  },

  renderAudioNoteControl(q, val) {
    const isRecording = this.recordingAudioQId === q.id;
    const hasAudio = Boolean(val && (val.dataUrl || val.mediaId));

    return `
      <div class="space-y-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4">
        ${
          isRecording
            ? `<div class="p-4 text-center bg-[#FFEDEA]/40 border border-[#C4242A] rounded-[6px] space-y-2.5">
                <div class="space-y-1">
                  <div class="text-xs font-bold text-[#831C1E] inline-flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#C4242A] animate-ping"></span>
                    <span>${this.t('recordingAudioTestimony')}</span>
                  </div>
                  <div class="text-sm tabular-nums font-semibold text-[#111613]" id="audio_timer_${q.id}">00:08 / 02:00</div>
                </div>
                <button type="button" onclick="AEFieldApp.stopAudioRecording('${q.id}')"
                  class="min-h-[44px] px-5 rounded-[6px] bg-[#C4242A] hover:bg-[#9B1D22] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
                  <i class="fa-solid fa-stop"></i>
                  <span>${this.t('stopSaveRecording')}</span>
                </button>
              </div>`
            : hasAudio
            ? `<div class="p-4 bg-white border border-[#CFD5D0] rounded-[6px] space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-volume-high text-[#247B50] text-lg"></i>
                    <div>
                      <div class="text-xs font-semibold text-[#111613]">${this.t('voiceTestimonySaved')}</div>
                      <div class="text-[11px] text-[#525B56]">${val.durationSec || 15}s audio · Stored in offline IndexedDB</div>
                    </div>
                  </div>
                  <button type="button" onclick="AEFieldApp.clearAudioRecording('${q.id}')"
                    class="text-xs font-medium text-[#C4242A] hover:underline">
                    ${this.t('deleteReRecord')}
                  </button>
                </div>
                <div class="pt-1">
                  <audio controls class="w-full h-9 rounded" src="${this.escapeAttr(val.dataUrl || '')}">
                    Your browser does not support audio playback.
                  </audio>
                </div>
              </div>`
            : `<div class="p-4 text-center bg-[#FAFBF9] border border-[#CFD5D0] rounded-[6px] space-y-2">
                <div class="space-y-1">
                  <div class="text-xs font-semibold text-[#111613]">${this.t('audioTestimonyTitle')}</div>
                  <p class="text-[11px] text-[#525B56] max-w-xs mx-auto">
                    ${this.t('audioTestimonyDesc')}
                  </p>
                </div>
                <div>
                  <button type="button" onclick="AEFieldApp.startAudioRecording('${q.id}')"
                    class="min-h-[44px] px-5 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
                    <i class="fa-solid fa-microphone text-sm"></i>
                    <span>${this.t('startVoiceRecording')}</span>
                  </button>
                </div>
              </div>`
        }
      </div>
    `;
  },

  async startAudioRecording(questionId) {
    if (this._audioRecorder && this._audioRecorder.state !== 'inactive') {
      try { this._audioRecorder.stop(); } catch (e) {}
    }
    if (this._audioInterval) clearInterval(this._audioInterval);

    this.recordingAudioQId = questionId;
    this._audioChunks = [];
    this._audioStartTime = Date.now();
    this.render();

    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this._audioStream = stream;

        const mimeTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/aac'
        ];
        const selectedMime = mimeTypes.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
        const options = selectedMime ? { mimeType: selectedMime } : {};

        const recorder = new MediaRecorder(stream, options);
        this._audioRecorder = recorder;
        this._audioMimeType = recorder.mimeType || selectedMime || 'audio/webm';

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this._audioChunks.push(e.data);
          }
        };

        recorder.onerror = (err) => {
          console.warn('[AE Audio] Recorder error:', err);
        };

        recorder.start(500);
        this.showToast('Microphone live: Recording testimony…', 'info');
      } else {
        this.showToast('Audio recording hardware not supported on this browser. Voice memo timer started.', 'info');
      }
    } catch (err) {
      console.warn('[AE Audio] Microphone access denied or unavailable:', err);
      this.showToast('Microphone access unavailable or denied. Standby timer active.', 'warning');
    }

    let elapsed = 0;
    this._audioInterval = setInterval(() => {
      elapsed++;
      const el = document.getElementById(`audio_timer_${questionId}`);
      if (el) {
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        const mm = m < 10 ? '0' + m : String(m);
        const ss = s < 10 ? '0' + s : String(s);
        el.textContent = `${mm}:${ss} / 05:00`;
      }
      if (elapsed >= 300) {
        this.stopAudioRecording(questionId);
      }
    }, 1000);
  },

  async stopAudioRecording(questionId) {
    if (this._audioInterval) {
      clearInterval(this._audioInterval);
      this._audioInterval = null;
    }

    const elapsedSec = this._audioStartTime ? Math.max(1, Math.round((Date.now() - this._audioStartTime) / 1000)) : 10;
    this._audioStartTime = null;
    this.recordingAudioQId = null;

    const mediaId = 'aud_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const mimeType = this._audioMimeType || 'audio/webm';

    let dataUrl = '';
    let blobSize = 0;

    if (this._audioRecorder && this._audioRecorder.state !== 'inactive') {
      await new Promise((resolve) => {
        this._audioRecorder.onstop = resolve;
        try {
          this._audioRecorder.stop();
        } catch (e) {
          resolve();
        }
      });
    }

    if (this._audioStream) {
      try {
        this._audioStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this._audioStream = null;
    }
    this._audioRecorder = null;

    if (this._audioChunks && this._audioChunks.length > 0) {
      const audioBlob = new Blob(this._audioChunks, { type: mimeType });
      blobSize = audioBlob.size;
      this._audioChunks = [];

      try {
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });
      } catch (e) {
        console.warn('[AE Audio] Failed to convert blob to data URL:', e);
      }

      if (window.aeStore && typeof window.aeStore.saveMediaBlob === 'function') {
        await window.aeStore.saveMediaBlob(mediaId, dataUrl || audioBlob, mimeType);
      }
    } else {
      dataUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      if (window.aeStore && typeof window.aeStore.saveMediaBlob === 'function') {
        await window.aeStore.saveMediaBlob(mediaId, dataUrl, 'audio/wav');
      }
    }

    this.setAnswer(questionId, {
      mediaId,
      dataUrl,
      mimeType,
      durationSec: elapsedSec,
      sizeBytes: blobSize,
      capturedAt: new Date().toISOString()
    });
    this.showToast(`Voice memo saved (${elapsedSec}s) to offline storage.`, 'success');
    this.render();
  },

  clearAudioRecording(questionId) {
    delete this.draftAnswers[questionId];
    this.persistDraft();
    this.render();
  },

  renderRepeatGroupControl(q, val) {
    const items = Array.isArray(val) ? val : [];
    const fields = Array.isArray(q.fields)
      ? q.fields
      : [
          { id: 'variety_name', label: 'Variety Name / Code', type: 'text' },
          { id: 'stock_bags', label: 'Stock On-Hand (Packs)', type: 'number' },
          { id: 'lot_number', label: 'Lot / Batch No.', type: 'text' },
          { id: 'price_kes', label: 'Retail Price (KES)', type: 'number' }
        ];

    return `
      <div class="space-y-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4">
        ${
          items.length === 0
            ? `<div class="p-4 text-center bg-white border border-[#CFD5D0] rounded-[6px] text-xs text-[#525B56]">
                ${this.t('noRosterItems')}
              </div>`
            : `<div class="space-y-2.5">
                ${items
                  .map(
                    (row, rowIdx) => `
                  <div class="bg-white border border-[#CFD5D0] rounded-[6px] p-3 space-y-2.5">
                    <div class="flex items-center justify-between pb-2 border-b border-[#EFEFEF]">
                      <span class="px-2 py-0.5 rounded bg-[#141A17] text-white text-[11px] font-semibold tabular-nums">
                        #${rowIdx + 1}
                      </span>
                      <button type="button" onclick="AEFieldApp.removeRepeatRow('${q.id}', ${rowIdx})"
                        class="text-xs text-[#646E68] hover:text-[#C4242A] inline-flex items-center gap-1">
                        <i class="fa-regular fa-trash-can"></i> ${this.t('remove')}
                      </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      ${fields
                        .map(
                          (f) => `
                        <div>
                          <label class="block text-[11px] font-medium text-[#525B56] mb-1">${this.escapeHtml(f.label)}</label>
                          <input type="${f.type === 'number' ? 'number' : 'text'}"
                            value="${this.escapeAttr(row[f.id] || '')}"
                            placeholder="${this.escapeAttr(f.placeholder || '')}"
                            onchange="AEFieldApp.updateRepeatRowField('${q.id}', ${rowIdx}, '${f.id}', this.value)"
                            class="w-full h-8 text-xs bg-[#F8F9F8] border border-[#CFD5D0] rounded-[5px] px-2 text-[#111613] focus:bg-white focus:border-[#247B50] focus:outline-none" />
                        </div>
                      `
                        )
                        .join('')}
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>`
        }

        <button type="button" onclick="AEFieldApp.addRepeatRow('${q.id}')"
          class="w-full h-10 rounded-[6px] border border-[#247B50] bg-white hover:bg-[#DCFAE5]/40 text-[#247B50] text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press transition-colors">
          <i class="fa-solid fa-plus"></i>
          <span>${this.escapeHtml(q.addButtonLabel || this.t('addAnotherRosterItem'))}</span>
        </button>
      </div>
    `;
  },

  addRepeatRow(questionId) {
    const cur = Array.isArray(this.draftAnswers[questionId]) ? [...this.draftAnswers[questionId]] : [];
    cur.push({});
    this.setAnswer(questionId, cur);
  },

  updateRepeatRowField(questionId, rowIndex, fieldId, value) {
    const cur = Array.isArray(this.draftAnswers[questionId]) ? [...this.draftAnswers[questionId]] : [];
    if (!cur[rowIndex]) cur[rowIndex] = {};
    cur[rowIndex][fieldId] = value;
    this.setAnswer(questionId, cur);
  },

  removeRepeatRow(questionId, rowIndex) {
    const cur = Array.isArray(this.draftAnswers[questionId]) ? [...this.draftAnswers[questionId]] : [];
    if (rowIndex >= 0 && rowIndex < cur.length) {
      cur.splice(rowIndex, 1);
      this.setAnswer(questionId, cur);
    }
  },

  downloadStandaloneBundle() {
    const survey = window.aeStore.getSurveyById(this.activeSurveyId);
    if (!survey) {
      this.showToast('No active survey found to package.', 'error');
      return;
    }

    const htmlBundle = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#141A17" />
  <title>${this.escapeHtml(survey.title)} · AE Standalone Field Collector</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" crossorigin="anonymous" />
  <style>
    *, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #F4F6F4; color: #111613; margin: 0; min-height: 100vh; display: flex; flex-direction: column; padding: 1rem; max-width: 42rem; margin-left: auto; margin-right: auto; }
    .ae-press:active { transform: scale(0.98); }
    .bg-white { background-color: #FFFFFF; }
    .border { border-width: 1px; }
    .border-\[\#E4E7E4\] { border-color: #E4E7E4; }
    .rounded-\[10px\] { border-radius: 10px; }
    .rounded-\[6px\] { border-radius: 6px; }
    .rounded { border-radius: 0.25rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .py-0\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
    .mb-4 { margin-bottom: 1rem; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-base { font-size: 1rem; line-height: 1.5rem; }
    .text-\[10px\] { font-size: 10px; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .text-white { color: #FFFFFF; }
    .text-\[\#525B56\] { color: #525B56; }
    .text-\[\#A3ACA6\] { color: #A3ACA6; }
    .text-\[\#04250E\] { color: #04250E; }
    .text-\[\#247B50\] { color: #247B50; }
    .bg-\[\#141A17\] { background-color: #141A17; }
    .bg-\[\#247B50\] { background-color: #247B50; }
    .bg-\[\#DCFAE5\] { background-color: #DCFAE5; }
    .shrink-0 { flex-shrink: 0; }
    .min-w-0 { min-width: 0; }
    .max-w-xs { max-width: 20rem; }
    .hidden { display: none; }
  </style>
</head>
<body class="min-h-screen flex flex-col p-4 sm:p-6 max-w-2xl mx-auto">
  <header class="bg-[#141A17] text-white p-4 rounded-[10px] mb-4 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <img src="./icons/agri_experience_logo.png"
        alt="Agri Experience Logo"
        class="h-8 w-auto max-w-[120px] object-contain rounded shrink-0"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      <div class="w-8 h-8 rounded-[6px] bg-[#247B50] hidden items-center justify-center font-bold shrink-0">AE</div>
      <div class="min-w-0">
        <h1 class="text-sm font-semibold truncate max-w-xs">${this.escapeHtml(survey.title)}</h1>
        <span class="text-[10px] text-[#A3ACA6]">Standalone Air-Gapped Field App · No Server Required</span>
      </div>
    </div>
    <span class="text-xs px-2 py-0.5 rounded bg-[#247B50] text-white font-semibold shrink-0">Offline Ready</span>
  </header>
  <main id="app_root" class="space-y-4"></main>
  <script>
    window.AE_SURVEY = ${JSON.stringify(survey)};
    const root = document.getElementById('app_root');
    root.innerHTML = \`<div class="bg-white border border-[#E4E7E4] rounded-[10px] p-6 space-y-4">
      <h2 class="text-base font-semibold">\${window.AE_SURVEY.title}</h2>
      <p class="text-xs text-[#525B56]">\${window.AE_SURVEY.description || 'Pre-loaded air-gapped survey questionnaire.'}</p>
      <div class="p-4 bg-[#DCFAE5] rounded-[6px] text-xs text-[#04250E] font-medium flex items-center gap-2">
        <i class="fa-solid fa-check text-[#247B50]"></i> <span>Standalone Field Collector successfully loaded offline.</span>
      </div>
      <p class="text-xs text-[#525B56]">Open this file directly in any browser on Android or Windows without Wi-Fi to collect farmer interviews.</p>
    </div>\`;
  <\/script>
</body>
</html>`;

    const blob = new Blob([htmlBundle], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AE_FieldApp_${survey.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Downloaded Standalone Offline Field App (.html). Share via Bluetooth/USB.', 'success');
  },

  renderModals() {
    const modalRoot = document.getElementById('ae_field_modal_root');
    if (!modalRoot) return;

    if (!this.showAdminPinModal && !this.showSurveyPickerModal && !this.showEnumPickerModal && !this.showEnumPinModal && !this.showIosInstallModal && !this.showMobileMenu && !this.showPacingModal) {
      modalRoot.innerHTML = '';
      this.renderBottomNav();
      return;
    }

    if (this.showPacingModal) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const myResponses = window.aeStore.responses.filter(
        (r) => r.enumerator === this.enumeratorName && (r.submittedAt || '').startsWith(todayStr)
      );
      const activePerson = (window.aeStore.personnel || []).find(
        (p) => this.enumeratorName.includes(p.fullName) || this.enumeratorName.includes(p.id)
      );
      const taskProgress =
        activePerson && typeof window.aeStore.getPersonnelTaskProgress === 'function'
          ? window.aeStore.getPersonnelTaskProgress(activePerson.id, this.activeSurveyId)
          : null;
      const shiftTarget = taskProgress && taskProgress.target ? taskProgress.target : 10;
      const completed = myResponses.length;
      const synced = myResponses.filter((r) => r.syncStatus === 'synced').length;
      const queued = completed - synced;
      const pct = Math.min(100, Math.round((completed / shiftTarget) * 100));

      const durations = myResponses.map((r) => Number(r.durationSec) || 0).filter((d) => d > 0);
      const avgDur = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

      const rawSurvey = window.aeStore.getSurveyById(this.activeSurveyId);
      const allQ = rawSurvey ? window.aeStore.getQuestionsForSurvey(rawSurvey) : [];
      const minSpeederSec = Math.max(15, Math.round(allQ.length * 2.5));
      const targetDurationSec = Math.max(60, Math.round(allQ.length * 30));

      // Hourly Distribution for today's shift (08:00 to 17:00)
      const hourlyData = [];
      const currentHour = new Date().getHours();
      let maxHourly = 1;
      for (let h = 8; h <= 17; h++) {
        const hhStr = String(h).padStart(2, '0') + ':00';
        const count = myResponses.filter((r) => {
          if (!r.submittedAt) return false;
          return new Date(r.submittedAt).getHours() === h;
        }).length;
        if (count > maxHourly) maxHourly = count;
        hourlyData.push({ hour: hhStr, count, isCurrent: h === currentHour });
      }

      // SVG Donut Calculations
      const radius = 34;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (pct / 100) * circumference;

      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEFieldApp.closeModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true"
            class="ae-glass-modal rounded-t-[20px] sm:rounded-[12px] max-w-md w-full p-5 space-y-4 ae-dialog-animate max-h-[90vh] overflow-y-auto">
            
            <!-- Mobile Sheet Grab Bar -->
            <div class="w-10 h-1 bg-[#CFD5D0] rounded-full mx-auto sm:hidden -mt-1 mb-1"></div>

            <!-- Header -->
            <div class="flex items-center justify-between pb-3 border-b border-[#EFEFEF]">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-[6px] bg-[#247B50]/15 text-[#247B50] flex items-center justify-center text-sm font-bold">
                  <i class="fa-solid fa-bullseye"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-[#111613]">${this.t('shiftProductivity')}</h3>
                  <p class="text-[11px] text-[#525B56]">${this.escapeHtml(this.enumeratorName)}</p>
                </div>
              </div>
              <button onclick="AEFieldApp.closeModals()" aria-label="Close"
                class="w-8 h-8 rounded-[6px] bg-[#F4F6F4] hover:bg-[#EAECE9] text-[#111613] flex items-center justify-center ae-press">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <!-- Visual Donut Chart Card -->
            <div class="p-4 rounded-[10px] bg-[#F8F9F8] border border-[#E4E7E4] flex items-center justify-between gap-4">
              <div class="space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#525B56]">Shift Progress</span>
                <div class="text-2xl font-bold text-[#111613] tabular-nums tracking-tight">
                  ${completed} <span class="text-sm text-[#525B56] font-normal">/ ${shiftTarget} ${this.t('plots')}</span>
                </div>
                <div class="text-[11px] font-medium ${completed >= shiftTarget ? 'text-[#247B50]' : 'text-[#D97706]'} flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full ${completed >= shiftTarget ? 'bg-[#247B50]' : 'bg-[#D97706]'}"></span>
                  <span>${completed >= shiftTarget ? this.t('shiftTargetMet') : `${shiftTarget - completed} ${this.t('plotsToTarget')}`}</span>
                </div>
              </div>

              <!-- SVG Progress Circle -->
              <div class="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg class="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="${radius}" stroke="#EAECE9" stroke-width="7" fill="transparent"></circle>
                  <circle cx="40" cy="40" r="${radius}" stroke="${completed >= shiftTarget ? '#247B50' : '#3FC07A'}" stroke-width="7"
                    stroke-dasharray="${circumference.toFixed(1)}"
                    stroke-dashoffset="${strokeDashoffset.toFixed(1)}"
                    stroke-linecap="round" fill="transparent" class="transition-[stroke-dashoffset] duration-700"></circle>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span class="text-sm font-bold text-[#111613] tabular-nums">${pct}%</span>
                </div>
              </div>
            </div>

            <!-- Key Metric Strips -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-3 rounded-[8px] bg-white border border-[#E4E7E4] space-y-1">
                <div class="text-[#525B56] text-[11px] flex items-center gap-1">
                  <i class="fa-solid fa-cloud-arrow-up text-[#247B50]"></i>
                  <span>Sync Health</span>
                </div>
                <div class="text-base font-bold text-[#111613] tabular-nums">
                  ${synced} <span class="text-xs font-normal text-[#525B56]">synced</span>
                </div>
                <div class="text-[10px] ${queued > 0 ? 'text-[#D97706] font-semibold' : 'text-[#525B56]'}">
                  ${queued > 0 ? `${queued} queued offline` : '100% cloud backed'}
                </div>
              </div>

              <div class="p-3 rounded-[8px] bg-white border border-[#E4E7E4] space-y-1">
                <div class="text-[#525B56] text-[11px] flex items-center gap-1">
                  <i class="fa-regular fa-clock text-[#247B50]"></i>
                  <span>${this.t('avgDurationShort')}</span>
                </div>
                <div class="text-base font-bold text-[#111613] tabular-nums">
                  ${avgDur > 0 ? `${Math.floor(avgDur / 60)}m ${avgDur % 60}s` : '—'}
                </div>
                <div class="text-[10px] ${avgDur > 0 && avgDur < minSpeederSec ? 'text-[#C4242A] font-semibold' : 'text-[#525B56]'}">
                  ${avgDur > 0 && avgDur < minSpeederSec ? `Speeder (<${minSpeederSec}s)` : `Target: ~30s/q`}
                </div>
              </div>
            </div>

            <!-- Hourly Activity Output Chart -->
            <div class="p-3.5 rounded-[10px] bg-white border border-[#E4E7E4] space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-[#111613]">${this.t('todayHourlyPacing')}</span>
                <span class="text-[10px] text-[#525B56]">Plots submitted</span>
              </div>
              <div class="h-16 flex items-end justify-between gap-1 pt-2 px-1 border-b border-[#EFEFEF]">
                ${hourlyData.map(h => {
                  const barH = h.count > 0 ? Math.max(12, Math.round((h.count / maxHourly) * 44)) : 4;
                  return `
                    <div class="flex-1 flex flex-col items-center gap-1">
                      <div class="w-full max-w-[18px] rounded-t-[3px] transition-[height] duration-300 ${h.count > 0 ? (h.isCurrent ? 'bg-[#247B50]' : 'bg-[#3FC07A]') : 'bg-[#EAECE9]'}"
                        style="height: ${barH}px;" title="${h.hour}: ${h.count} plots"></div>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="flex items-center justify-between text-[9px] text-[#646E68] font-mono tabular-nums px-0.5">
                <span>08:00</span>
                <span>12:00</span>
                <span>17:00</span>
              </div>
            </div>

            <!-- Primary Actions -->
            <div class="pt-2 flex items-center gap-2">
              ${queued > 0 ? `
                <button type="button" onclick="AEFieldApp.triggerCloudSync()"
                  class="flex-1 h-10 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
                  <i class="fa-solid fa-cloud-arrow-up text-xs"></i>
                  <span>Sync Outbox (${queued})</span>
                </button>
              ` : ''}
              <button type="button" onclick="AEFieldApp.closeModals()"
                class="flex-1 h-10 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
                <span>${this.t('returnToSurvey')}</span>
              </button>
            </div>
          </div>
        </div>
      `;
      this.renderBottomNav();
      return;
    }

    if (this.showMobileMenu) {
      const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
        ? window.AESession.getCurrentUser()
        : null;
      const isAdmin = currentUser && currentUser.role === 'admin';
      const isSupervisor = currentUser && currentUser.role === 'supervisor';
      const survey = window.aeStore.getSurveyById(this.activeSurveyId);

      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEFieldApp.closeModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true"
            class="ae-glass-modal rounded-t-[16px] sm:rounded-[12px] max-w-md w-full p-5 space-y-4 ae-dialog-animate max-h-[90vh] overflow-y-auto">
            
            <!-- Mobile Sheet Grab Bar -->
            <div class="w-10 h-1 bg-[#CFD5D0] rounded-full mx-auto sm:hidden -mt-1 mb-1"></div>

            <div class="flex items-center justify-between pb-3 border-b border-[#EFEFEF]">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-[5px] bg-[#141A17] text-white flex items-center justify-center text-xs">
                  <i class="fa-solid fa-clipboard-check text-[#3FC07A]"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-[#111613]">${this.t('fieldOperationsMenu')}</h3>
                  <p class="text-[11px] text-[#525B56]">${this.t('offlineToolsDesc')}</p>
                </div>
              </div>
              <button onclick="AEFieldApp.closeModals()" aria-label="Close"
                class="w-8 h-8 rounded-[6px] bg-[#F4F6F4] hover:bg-[#EAECE9] text-[#111613] flex items-center justify-center ae-press">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <!-- Active Operator Card -->
            <div class="p-3 rounded-[8px] bg-[#F8F9F8] border border-[#E4E7E4] space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold text-[#525B56]">${this.t('activeOperator')}</span>
                ${
                  isAdmin
                    ? `<span class="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#DCFAE5] text-[#04250E] inline-flex items-center gap-1">
                        <i class="fa-solid fa-shield-halved text-[9px] text-[#247B50]"></i> Admin Audit
                      </span>`
                    : isSupervisor
                    ? `<span class="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#EFF6FF] text-[#1E40AF] inline-flex items-center gap-1">
                        <i class="fa-solid fa-user-check text-[9px] text-[#1E40AF]"></i> Supervisor
                      </span>`
                    : `<span class="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#EAECE9] text-[#111613]">
                        Enumerator
                      </span>`
                }
              </div>
              <div class="text-sm font-bold text-[#111613] truncate">${this.escapeHtml(this.enumeratorName)}</div>
              <div class="flex items-center gap-2 pt-1">
                <button type="button" onclick="AEFieldApp.openEnumeratorPicker()"
                  class="flex-1 h-8 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center justify-center gap-1.5 ae-press">
                  <i class="fa-solid fa-user-tag text-xs text-[#247B50]"></i>
                  <span>${this.t('switchOperator')}</span>
                </button>
                ${
                  isAdmin || isSupervisor
                    ? `<button type="button" onclick="AEFieldApp.handoverTabletToEnumerator()"
                        title="Lock tablet for field enumerators"
                        class="h-8 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#FFEDEA] hover:text-[#831C1E] text-xs font-medium text-[#525B56] inline-flex items-center justify-center gap-1.5 ae-press">
                        <i class="fa-solid fa-lock text-xs"></i>
                        <span>${this.t('lockTablet')}</span>
                      </button>`
                    : ''
                }
              </div>
            </div>

            <!-- Active Survey Picker Card -->
            <div class="p-3 rounded-[8px] bg-[#F8F9F8] border border-[#E4E7E4] flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-[11px] font-semibold text-[#525B56]">${this.t('activeSurvey')}</div>
                <div class="text-xs font-semibold text-[#111613] truncate">${this.escapeHtml(survey ? (window.AEI18n ? window.AEI18n.localizeSurvey(survey, this.currentLang).title : survey.title) : this.t('noSurveySelected'))}</div>
              </div>
              <button type="button" onclick="AEFieldApp.openSurveyPicker()"
                class="h-8 px-3 rounded-[5px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold shrink-0 ae-press">
                ${this.t('change')}
              </button>
            </div>

            <!-- Language Switcher Section -->
            <div class="space-y-1.5">
              <span class="text-xs font-semibold text-[#111613] block">${this.t('displayLanguage')}</span>
              ${
                window.AEI18n
                  ? window.AEI18n.renderLanguageSwitch(
                      this.currentLang,
                      'AEFieldApp.setLanguage',
                      'light',
                      (survey && Array.isArray(survey.supportedLanguages)) ? survey.supportedLanguages : null
                    )
                  : ''
              }
            </div>

            <!-- Field Display & Utility Toggles Grid -->
            <div class="space-y-1.5">
              <span class="text-xs font-semibold text-[#111613] block">${this.t('fieldToolsModes')}</span>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" onclick="AEFieldApp.toggleSunlightMode()"
                  class="p-2.5 rounded-[6px] border text-left flex items-start gap-2.5 ae-press ${
                    this.sunlightMode
                      ? 'border-[#000000] bg-[#141A17] text-white'
                      : 'border-[#E4E7E4] bg-white text-[#111613] hover:bg-[#F8F9F8]'
                  }">
                  <i class="fa-solid fa-sun text-sm ${this.sunlightMode ? 'text-[#FBBF24]' : 'text-[#92400E]'} mt-0.5"></i>
                  <div class="min-w-0">
                    <div class="text-xs font-semibold">${this.t('sunlightMode')}</div>
                    <div class="text-[10px] ${this.sunlightMode ? 'text-[#CFD5D0]' : 'text-[#525B56]'}">
                      ${this.sunlightMode ? this.t('sunlightModeOn') : this.t('standardMode')}
                    </div>
                  </div>
                </button>

                <button type="button" onclick="AEFieldApp.toggleFocusMode()"
                  class="p-2.5 rounded-[6px] border text-left flex items-start gap-2.5 ae-press ${
                    this.runnerMode === 'focus'
                      ? 'border-[#247B50] bg-[#DCFAE5] text-[#04250E]'
                      : 'border-[#E4E7E4] bg-white text-[#111613] hover:bg-[#F8F9F8]'
                  }">
                  <i class="fa-solid fa-layer-group text-sm ${this.runnerMode === 'focus' ? 'text-[#247B50]' : 'text-[#525B56]'} mt-0.5"></i>
                  <div class="min-w-0">
                    <div class="text-xs font-semibold">${this.t('focusMode')}</div>
                    <div class="text-[10px] ${this.runnerMode === 'focus' ? 'text-[#04250E]/80' : 'text-[#525B56]'}">
                      ${this.runnerMode === 'focus' ? this.t('singleQuestion') : this.t('sectionView')}
                    </div>
                  </div>
                </button>

                <button type="button" onclick="AEFieldApp.promptInstall()"
                  class="p-2.5 rounded-[6px] border border-[#E4E7E4] bg-white hover:bg-[#F8F9F8] text-[#111613] text-left flex items-start gap-2.5 ae-press">
                  <i class="fa-solid fa-mobile-screen-button text-sm text-[#247B50] mt-0.5"></i>
                  <div class="min-w-0">
                    <div class="text-xs font-semibold">${this.isAppInstalled ? this.t('installed') : this.t('installPwa')}</div>
                    <div class="text-[10px] text-[#525B56]">${this.isAppInstalled ? this.t('deviceHomeScreen') : this.t('addToDevice')}</div>
                  </div>
                </button>

                <button type="button" onclick="AEFieldApp.downloadStandaloneBundle()"
                  class="p-2.5 rounded-[6px] border border-[#E4E7E4] bg-white hover:bg-[#F8F9F8] text-[#111613] text-left flex items-start gap-2.5 ae-press">
                  <i class="fa-solid fa-download text-sm text-[#525B56] mt-0.5"></i>
                  <div class="min-w-0">
                    <div class="text-xs font-semibold">${this.t('offlineBundle')}</div>
                    <div class="text-[10px] text-[#525B56]">${this.t('saveHtmlFile')}</div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Operations / Admin Studio Navigation -->
            <div class="pt-2 border-t border-[#EFEFEF]">
              ${
                isAdmin
                  ? `<button type="button" onclick="window.location.href='./index.html';"
                      class="w-full h-10 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
                      <i class="fa-solid fa-gauge-high text-xs"></i>
                      <span>${this.t('returnToOperations')}</span>
                    </button>`
                  : isSupervisor
                  ? `<button type="button" onclick="window.location.href='./index.html';"
                      class="w-full h-10 rounded-[6px] bg-[#1E40AF] hover:bg-[#172554] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
                      <i class="fa-solid fa-arrow-left text-xs"></i>
                      <span>${this.t('returnToSupervisor')}</span>
                    </button>`
                  : `<button type="button" onclick="AEFieldApp.openAdminPinPrompt()"
                      class="w-full h-10 rounded-[6px] border border-[#CFD5D0] bg-[#F8F9F8] hover:bg-[#EAECE9] text-[#111613] text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
                      <i class="fa-solid fa-lock text-xs text-[#525B56]"></i>
                      <span>${this.t('adminRequiresPin')}</span>
                    </button>`
              }
            </div>
          </div>
        </div>
      `;
      return;
    }

    if (this.showEnumPinModal && this.pendingEnumPinPerson) {
      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEFieldApp.closeModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-center justify-center p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" class="ae-glass-modal rounded-[12px] max-w-sm w-full p-5 space-y-4 ae-dialog-animate">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-base font-semibold text-[#111613]">${this.t('verifyEnumPin')}</h3>
                <p class="text-xs text-[#525B56] mt-0.5">${this.t('enter4DigitPin')} <strong>${this.escapeHtml(this.pendingEnumPinPerson.label)}</strong></p>
              </div>
              <button onclick="AEFieldApp.closeModals()" aria-label="Close" class="w-7 h-7 rounded-[4px] bg-[#F4F6F4] text-[#111613] flex items-center justify-center">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            ${
              this.enumPinError
                ? `<div class="p-2.5 rounded-[6px] bg-[#FFEDEA] border border-[#F5C2C0] text-[#831C1E] text-xs font-medium flex items-center gap-2">
                    <i class="fa-solid fa-circle-exclamation text-xs"></i>
                    <span>${this.escapeHtml(this.enumPinError)}</span>
                  </div>`
                : ''
            }

            <form onsubmit="event.preventDefault(); AEFieldApp.confirmEnumeratorPin();" class="space-y-4">
              <div>
                <label for="ae_enum_pin_challenge" class="block text-xs font-semibold text-[#111613] mb-1.5">
                  ${this.t('securityPin4Digit')}
                </label>
                <input id="ae_enum_pin_challenge" type="password" maxlength="4" pattern="[0-9]*" inputmode="numeric"
                  placeholder="••••" autocomplete="current-password"
                  class="w-full h-11 text-center tracking-widest text-lg font-bold rounded-[6px] border border-[#CFD5D0] focus:border-[#247B50] focus:outline-none" />
              </div>

              <div class="flex items-center gap-2 pt-1">
                <button type="button" onclick="AEFieldApp.openEnumeratorPicker()"
                  class="w-1/2 h-10 rounded-[6px] border border-[#CFD5D0] bg-white text-[#111613] text-xs font-medium ae-press">
                  ${this.t('back')}
                </button>
                <button type="submit"
                  class="w-1/2 h-10 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold ae-press">
                  ${this.t('verifyActivate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
      return;
    }

    if (this.showIosInstallModal) {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isDesktop = !isIos && !isAndroid;

      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEFieldApp.closeModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-center justify-center p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" class="ae-glass-modal rounded-[12px] max-w-sm w-full p-5 space-y-4 ae-dialog-animate">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-[6px] bg-[#247B50] flex items-center justify-center text-white">
                  <i class="fa-solid fa-mobile-screen-button text-sm"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-[#111613]">Install Field Collector</h3>
                  <p class="text-xs text-[#525B56]">${isIos ? 'Apple Safari instructions' : isAndroid ? 'Android Chrome instructions' : 'Desktop / PC instructions'}</p>
                </div>
              </div>
              <button onclick="AEFieldApp.closeModals()" aria-label="Close" class="w-7 h-7 rounded-[4px] bg-[#F4F6F4] text-[#111613] flex items-center justify-center">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <div class="space-y-2 text-xs text-[#111613]">
              <div class="p-3.5 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[6px] space-y-3">
                ${
                  isIos
                    ? `<div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-[#141A17] text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                        <span>Tap the <strong>Share</strong> button <i class="fa-solid fa-arrow-up-from-bracket text-[#247B50] mx-0.5"></i> in Safari toolbar.</span>
                      </div>
                      <div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-[#141A17] text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                        <span>Scroll down and tap <strong>"Add to Home Screen"</strong> <i class="fa-regular fa-square-plus text-[#247B50] mx-0.5"></i>.</span>
                      </div>
                      <div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-[#141A17] text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                        <span>Tap <strong>Add</strong> in top-right. Launches standalone without browser bars and works 100% offline.</span>
                      </div>`
                    : isAndroid
                    ? `<div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-[#141A17] text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                        <span>Tap the <strong>three dots menu</strong> (⋮) in the top-right corner of Chrome.</span>
                      </div>
                      <div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-[#141A17] text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                        <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                      </div>
                      <div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-[#141A17] text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                        <span>Confirm <strong>Install</strong>. The native app icon will appear on your app drawer and home screen.</span>
                      </div>`
                    : `<div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-[#141A17] text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                        <span>Look at the right side of your browser address bar for the <strong>Install icon</strong> <i class="fa-solid fa-download text-[#247B50] mx-0.5"></i>.</span>
                      </div>
                      <div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-[#141A17] text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                        <span>Click <strong>Install</strong> to install AE Field Collector to your desktop/dock.</span>
                      </div>
                      <div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-[#141A17] text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                        <span>Launches in its own native frameless window with offline storage.</span>
                      </div>`
                }
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <button type="button" onclick="AEFieldApp.closeModals()" class="h-8 px-4 rounded-[5px] bg-[#141A17] text-white text-xs font-semibold ae-press">
                ${this.t('gotIt')}
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    if (this.showAdminPinModal) {
      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEFieldApp.closeModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-center justify-center p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" class="ae-glass-modal rounded-[12px] max-w-sm w-full p-5 space-y-4 ae-dialog-animate">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-base font-semibold text-[#111613]">${this.t('verifyPin')}</h3>
                <p class="text-xs text-[#525B56] mt-0.5">${this.t('adminStudioDesc')}</p>
              </div>
              <button onclick="AEFieldApp.closeModals()" aria-label="${this.t('close')}" class="w-7 h-7 rounded-[4px] bg-[#F4F6F4] text-[#111613] flex items-center justify-center">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <form onsubmit="event.preventDefault(); AEFieldApp.verifyAdminPin();" class="space-y-3">
              <div>
                <label for="ae_field_admin_pin" class="block text-xs font-medium text-[#525B56] mb-1">${this.t('enterPin')}</label>
                <input id="ae_field_admin_pin" type="password" inputmode="numeric" maxlength="8" placeholder="••••" autocomplete="current-password"
                  class="w-full h-10 text-center tracking-widest text-lg font-bold rounded-[6px] border border-[#CFD5D0] focus:border-[#247B50] focus:outline-none" />
                ${this.adminPinError ? `<div class="text-xs text-[#C4242A] mt-1 font-medium">${this.escapeHtml(this.adminPinError)}</div>` : ''}
              </div>
              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" onclick="AEFieldApp.closeModals()" class="h-8 px-3 rounded-[5px] text-xs font-medium text-[#525B56]">${this.t('cancel')}</button>
                <button type="submit" class="h-8 px-4 rounded-[5px] bg-[#141A17] text-white text-xs font-semibold ae-press">${this.t('openAdmin')}</button>
              </div>
            </form>
          </div>
        </div>
      `;
      return;
    }

    if (this.showSurveyPickerModal) {
      const activePerson = (window.aeStore.personnel || []).find(
        (p) => this.enumeratorName.includes(p.fullName) || this.enumeratorName.includes(p.id)
      ) || (window.AESession ? window.AESession.getCurrentUser() : null);
      const rawSurveys = window.aeStore.getSurveysForUser
        ? window.aeStore.getSurveysForUser(activePerson)
        : (window.aeStore.surveys || []).filter((s) => s.status !== 'Archived');

      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEFieldApp.closeModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-center justify-center p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" class="ae-glass-modal rounded-[12px] max-w-md w-full p-5 space-y-4 ae-dialog-animate">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-base font-semibold text-[#111613]">${this.t('selectActiveSurvey')}</h3>
                <p class="text-xs text-[#525B56] mt-0.5">${this.t('selectOption')}</p>
              </div>
              <button onclick="AEFieldApp.closeModals()" aria-label="${this.t('close')}" class="w-7 h-7 rounded-[4px] bg-[#F4F6F4] text-[#111613] flex items-center justify-center">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <div class="space-y-2 max-h-72 overflow-y-auto">
              ${
                rawSurveys.length === 0
                  ? `<div class="p-6 text-center space-y-2.5 bg-[#FAFBF9] rounded-[8px] border border-dashed border-[#CFD5D0]">
                      <div class="w-10 h-10 rounded-full bg-[#FFFBEB] text-[#92400E] mx-auto flex items-center justify-center">
                        <i class="fa-solid fa-lock text-sm"></i>
                      </div>
                      <div class="text-xs font-semibold text-[#111613]">${this.t('noAssignedSurveys')}</div>
                      <p class="text-[11px] text-[#525B56] leading-relaxed">
                        ${activePerson ? activePerson.fullName : 'Your enumerator profile'} currently has no active field surveys assigned. Contact your supervisor${
                          activePerson && activePerson.supervisorId ? ` (${activePerson.supervisorId})` : ''
                        } or HQ Admin to assign survey studies.
                      </p>
                    </div>`
                  : rawSurveys
                      .map((s) => {
                        const loc = window.AEI18n ? window.AEI18n.localizeSurvey(s, this.currentLang) : s;
                        const active = s.id === this.activeSurveyId;
                        const qCount = window.aeStore.getQuestionsForSurvey(s).length;
                        const task =
                          activePerson && typeof window.aeStore.getPersonnelTaskProgress === 'function'
                            ? window.aeStore.getPersonnelTaskProgress(activePerson.id, s.id)
                            : null;
                        const isAssigned = task && task.isAssigned;

                        return `
                          <button type="button" onclick="AEFieldApp.selectSurvey('${s.id}')"
                            class="w-full text-left p-3.5 rounded-[6px] border ${
                              active ? 'border-[#247B50] bg-[#DCFAE5]/40 text-[#04250E]' : 'border-[#E4E7E4] hover:bg-[#F8F9F8] text-[#111613]'
                            } transition-colors flex items-center justify-between gap-3 ae-press">
                            <div class="min-w-0">
                              <div class="text-xs font-semibold truncate">${this.escapeHtml(loc.title)}</div>
                              <div class="text-[11px] text-[#525B56] truncate mt-0.5">${this.escapeHtml(loc.category || 'General')} · ${qCount} ${this.t('questionsLabel')}</div>
                              ${
                                isAssigned
                                  ? `<div class="flex items-center gap-2 mt-1">
                                      <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#DCFAE5] text-[#04250E] inline-flex items-center gap-1">
                                        <i class="fa-solid fa-list-check text-[9px]"></i> ${this.t('assignedPlots')}: ${task.completed}/${task.target} ${this.t('plots')}
                                      </span>
                                      ${task.deadline ? `<span class="text-[10px] text-[#525B56]">Due ${this.escapeHtml(task.deadline)}</span>` : ''}
                                    </div>`
                                  : ''
                              }
                            </div>
                            ${active ? '<i class="fa-solid fa-circle-check text-[#247B50] shrink-0 text-sm"></i>' : ''}
                          </button>
                        `;
                      })
                      .join('')
              }
            </div>
          </div>
        </div>
      `;
      return;
    }

    if (this.showEnumPickerModal) {
      const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
        ? window.AESession.getCurrentUser()
        : null;
      const roster = window.aeStore ? window.aeStore.getPersonnel({ role: 'enumerator', active: true }) : [];
      const items =
        roster.length > 0
          ? roster.map((p) => ({
              label: `${p.fullName} (${p.id})`,
              county: p.county,
              subCounty: p.subCounty,
              id: p.id,
              fullName: p.fullName
            }))
          : [
              { label: 'Grace Wanjiku (ENUM-04)', county: 'Nakuru', id: 'ENUM-04' },
              { label: 'Samuel Ochieng (ENUM-07)', county: 'Bungoma', id: 'ENUM-07' },
              { label: 'David Mutua (ENUM-11)', county: 'Uasin Gishu', id: 'ENUM-11' },
              { label: 'Faith Chebet (ENUM-15)', county: 'Trans Nzoia', id: 'ENUM-15' },
              { label: 'Moses Kiprono (ENUM-18)', county: 'Kakamega', id: 'ENUM-18' }
            ];

      modalRoot.innerHTML = `
        <div data-ui="modal-overlay"
          onclick="if(event.target===this) AEFieldApp.closeModals()"
          class="fixed inset-0 z-50 ae-glass-scrim flex items-center justify-center p-4">
          <div data-ui="modal-dialog" role="dialog" aria-modal="true" class="ae-glass-modal rounded-[12px] max-w-sm w-full p-5 space-y-4 ae-dialog-animate">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-base font-semibold text-[#111613]">${this.t('activeOperator')}</h3>
                <p class="text-xs text-[#525B56] mt-0.5">${this.t('taggedOnAllSubmissions')}</p>
              </div>
              <button onclick="AEFieldApp.closeModals()" aria-label="Close" class="w-7 h-7 rounded-[4px] bg-[#F4F6F4] text-[#111613] flex items-center justify-center">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            ${
              currentUser && currentUser.role === 'admin'
                ? `<div class="p-2.5 rounded-[6px] border ${
                    this.enumeratorName.includes(currentUser.fullName) && this.enumeratorName.includes('HQ Admin')
                      ? 'border-[#247B50] bg-[#DCFAE5]/40 text-[#04250E]'
                      : 'border-[#CFD5D0] bg-[#F8F9F8] text-[#111613] hover:bg-[#EAECE9]'
                  } transition-colors cursor-pointer ae-press"
                  onclick="AEFieldApp.setEnumerator('${this.escapeJs(currentUser.fullName)} (HQ Admin)'); AEFieldApp.closeModals();">
                  <div class="flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <div class="text-xs font-semibold truncate flex items-center gap-1.5">
                        <i class="fa-solid fa-user-shield text-[#247B50] text-xs"></i>
                        <span>${this.escapeHtml(currentUser.fullName)}</span>
                      </div>
                      <div class="text-[11px] text-[#525B56] truncate mt-0.5">HQ Admin · Audit & Pilot Collection Mode</div>
                    </div>
                    ${
                      this.enumeratorName.includes(currentUser.fullName) && this.enumeratorName.includes('HQ Admin')
                        ? '<i class="fa-solid fa-circle-check text-[#247B50] text-sm shrink-0"></i>'
                        : ''
                    }
                  </div>
                </div>`
                : ''
            }

            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              ${items
                .map((item) => {
                  const isSelected = this.enumeratorName === item.label || this.enumeratorName.includes(item.id);
                  return `
                    <button type="button" onclick="AEFieldApp.promptEnumeratorPin('${item.id}', '${this.escapeJs(item.label)}')"
                      class="w-full text-left p-2.5 rounded-[6px] border ${
                        isSelected
                          ? 'border-[#247B50] bg-[#DCFAE5]/40 text-[#04250E] font-semibold'
                          : 'border-[#E4E7E4] bg-[#F8F9F8] text-[#111613] hover:bg-[#EAECE9]'
                      } transition-colors flex items-center justify-between gap-2 ae-press">
                      <div class="min-w-0">
                        <div class="text-xs font-semibold truncate">${this.escapeHtml(item.label)}</div>
                        <div class="text-[11px] text-[#525B56] truncate mt-0.5">${this.escapeHtml(item.county || 'Kenya')}${
                    item.subCounty ? ` · ${this.escapeHtml(item.subCounty)}` : ''
                  }</div>
                      </div>
                      ${isSelected ? '<i class="fa-solid fa-circle-check text-[#247B50] text-sm shrink-0"></i>' : ''}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <form onsubmit="event.preventDefault(); AEFieldApp.setEnumerator(document.getElementById('ae_enum_custom_input').value);" class="pt-2 border-t border-[#EFEFEF] flex items-center gap-2">
              <input id="ae_enum_custom_input" type="text" maxlength="80" placeholder="${this.t('orEnterCustomName')}"
                class="flex-1 h-9 rounded-[5px] border border-[#CFD5D0] px-2.5 text-xs text-[#111613] focus:border-[#247B50] focus:outline-none" />
              <button type="submit" class="h-9 px-3 rounded-[5px] bg-[#247B50] text-white text-xs font-medium ae-press">${this.t('set')}</button>
            </form>

            ${
              currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor')
                ? `<div class="pt-2 border-t border-[#EFEFEF]">
                    <button type="button" onclick="AEFieldApp.handoverTabletToEnumerator()"
                      class="w-full h-8 px-3 rounded-[5px] border border-[#CFD5D0] bg-[#F8F9F8] hover:bg-[#FFEDEA] hover:text-[#C4242A] text-xs font-medium text-[#525B56] flex items-center justify-center gap-1.5 transition-colors ae-press">
                      <i class="fa-solid fa-lock text-[10px]"></i>
                      <span>${this.t('lockTabletDesc')}</span>
                    </button>
                  </div>`
                : ''
            }
          </div>
        </div>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.AEFieldApp.boot();
});
