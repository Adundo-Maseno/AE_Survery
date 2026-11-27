#!/usr/bin/env node
/**
 * AE Survey — Zero-Dependency Automated Regression & Smoke Test Suite
 * Run locally or in CI via: node tests/run-tests.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ✓ ${name}`);
    })
    .catch((err) => {
      console.error(`  ✗ ${name}`);
      console.error('   ', err && err.stack ? err.stack : err);
      process.exitCode = 1;
      throw err;
    });
}

(async () => {
  console.log('AE Survey Regression Test Suite\n');

  // 1. Syntax check all JS modules + sw.js
  await test('Syntax check all JS modules and sw.js', () => {
    const jsDir = path.join(ROOT, 'js');
    const files = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).map((f) => path.join(jsDir, f));
    files.push(path.join(ROOT, 'sw.js'));
    files.forEach((f) => {
      execFileSync(process.execPath, ['-c', f], { stdio: 'pipe' });
    });
  });

  // Load frontend modules in a clean mock browser global
  const storage = {};
  global.localStorage = {
    getItem: (k) => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    get length() { return Object.keys(storage).length; },
    key: (i) => Object.keys(storage)[i] || null
  };
  global.window = global;
  Object.defineProperty(global, 'navigator', { value: { onLine: true, userAgent: 'Node-CI' }, configurable: true });
  global.location = {
    origin: 'https://ae-survey.pages.dev',
    pathname: '/field.html',
    search: '?survey=s_ci&utm_source=whatsapp&utm_campaign=ci_q4&prefill_q_reg=Nakuru'
  };
  global.document = { getElementById: () => null };
  global.AEApp = {
    isPublicReportMode: false,
    escapeHtml: (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    escapeAttr: (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    escapeJs: (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n'),
    getLiveReportUrl: (sid) => `https://ae-survey.pages.dev/index.html?view=report&survey=${encodeURIComponent(sid)}`,
    render: () => {},
    showToast: () => {},
    syncResponseReviewToCloud: () => {}
  };

  eval(fs.readFileSync(path.join(ROOT, 'js/text-intelligence.js'), 'utf8'));
  eval(fs.readFileSync(path.join(ROOT, 'js/analytics.js'), 'utf8'));
  eval(fs.readFileSync(path.join(ROOT, 'js/builder.js'), 'utf8'));
  eval(fs.readFileSync(path.join(ROOT, 'js/collector.js'), 'utf8'));
  eval(fs.readFileSync(path.join(ROOT, 'js/report-export.js'), 'utf8'));

  const survey = {
    id: 's_ci',
    title: 'CI Field Evaluation',
    branding: { thankYouTitle: 'Asante!', thankYouMessage: 'Recorded cleanly.' },
    reportAccess: { passcode: '1234', hideOpenEnded: false, hideGallery: false },
    scoring: { enabled: true, showScoreToRespondent: true, tiers: [{ label: 'Gold / Pass', minPct: 80 }, { label: 'Needs Support', minPct: 0 }] },
    stratifiedQuotas: { enabled: true, questionId: 'q_reg', targets: { Nakuru: 2, Kisumu: 2 }, warnWhenFull: true },
    pages: [{
      id: 'p1',
      title: 'Section 1',
      questions: [
        { id: 'q_reg', type: 'multiple_choice', title: 'Region', options: ['Nakuru', 'Kisumu'], optionPoints: { Nakuru: 10, Kisumu: 5 }, logic: { enabled: true, value: 'Kisumu', target: 'END_SURVEY' } },
        { id: 'q_yield', type: 'number_yield', title: 'Yield (kg)' },
        { id: 'q_fb', type: 'long_text', title: 'Feedback', displayRule: { enabled: true, sourceQuestionId: 'q_reg', mode: 'equals', value: 'Nakuru' } }
      ]
    }]
  };

  const now = new Date().toISOString();
  const responses = [
    { id: 'r1', surveyId: 's_ci', enumerator: 'Alice', submittedAt: now, syncStatus: 'synced', reviewStatus: 'approved', durationSeconds: 200, answers: { q_reg: 'Nakuru', q_yield: 100, q_fb: 'Delivery speed was great <script>alert(1)</script>' } },
    { id: 'r2', surveyId: 's_ci', enumerator: 'Alice', submittedAt: now, syncStatus: 'synced', reviewStatus: 'approved', durationSeconds: 200, answers: { q_reg: 'Nakuru', q_yield: 100, q_fb: 'Delivery speed was great <script>alert(1)</script>' } },
    { id: 'r3', surveyId: 's_ci', enumerator: 'Bob', submittedAt: now, syncStatus: 'synced', durationSeconds: 25, answers: { q_reg: 'Kisumu', q_yield: 110, q_fb: 'asdf' } },
    { id: 'r4', surveyId: 's_ci', enumerator: 'Carol', submittedAt: now, syncStatus: 'synced', durationSeconds: 180, answers: { q_reg: 'Kisumu', q_yield: 105, q_fb: 'Please lower pricing and improve dispatch' } },
    { id: 'r5', surveyId: 's_ci', enumerator: 'Dan', submittedAt: now, syncStatus: 'queued', durationSeconds: 190, answers: { q_reg: 'Nakuru', q_yield: 50000 } }
  ];

  global.aeStore = {
    settings: { gasWebAppUrl: '' },
    surveys: [survey],
    responses,
    getSurveyById: (id) => (id === 's_ci' ? survey : null),
    getQuestionsForSurvey: (s) => (s.pages || []).flatMap((p) => p.questions || []),
    getResponsesForSurvey: () => responses,
    getCollectorsForSurvey: () => [],
    getRunnerDraft: () => null,
    clearRunnerDraft: () => {},
    upsertSurvey: (s) => s,
    flagResponse: () => {}
  };

  // 2. Open-ended substantive synthesis + XSS escaping
  await test('Open-ended substantive synthesis & XSS escaping', () => {
    const analysis = AETeXtEngine.analyzeVerbatims(responses, survey, { questionId: 'q_fb' });
    const insights = AETeXtEngine.synthesizeQuestionInsights(analysis, survey, survey.pages[0].questions[2]);
    assert(insights.narrative.length > 30 && !insights.narrative.includes('sentiment is'));
    const cardHtml = AEAnalytics.renderSingleQuestionAnalyticsCard(survey.pages[0].questions[2], 2, responses, survey, { label: '3', isSub: false });
    assert(cardHtml.includes('Overall Synthesis') && !cardHtml.includes('<script>alert(1)</script>'));
  });

  // 3. Slice-by-Answer, Quotas, Scoring, Data Hygiene, Skip Funnel
  await test('Slice-by-Answer, Stratified Quotas, Scoring, Data Hygiene, and Skip Funnel', () => {
    AEAnalytics.setAnswerFilterQuestion('q_reg');
    AEAnalytics.setAnswerFilterValue('Kisumu');
    assert.strictEqual(AEAnalytics.getFilteredResponses('s_ci').length, 2);
    AEAnalytics.resetFilters();

    const sq = AEAnalytics.computeStratifiedQuotas(survey, responses);
    assert.strictEqual(sq.rows.find((r) => r.option === 'Nakuru').isFull, true);

    const sc = AEAnalytics.computeResponseScore(survey, responses[0].answers);
    assert.strictEqual(sc.pct, 100);
    assert.strictEqual(sc.tier, 'Gold / Pass');

    const hygiene = AEAnalytics.computeDataHygiene(survey, responses);
    assert(hygiene.nearDuplicates.length >= 1 && hygiene.numericOutliers.length >= 1 && hygiene.gibberishTexts.length >= 1);

    const funnel = AEAnalytics.computeQuestionSkipFunnel(survey, responses);
    assert.strictEqual(funnel.find((f) => f.qId === 'q_fb').skipped, 1);
  });

  // 4. Builder Pre-Flight, Logic Map, Inline Thank-You, Blank Form Export
  await test('Builder Pre-Flight Linter, Logic Flow Map, Inline Thank-You, and Blank Form PDF', () => {
    const audit = AEBuilder.runPreFlightAudit(survey);
    assert.strictEqual(audit.ok, true);
    AEBuilder.showLogicMap = true;
    const bHtml = AEBuilder.renderBuilder(survey);
    assert(bHtml.includes('Survey Logic &amp; Branching Flow Map') && bHtml.includes('End Survey') && bHtml.includes('Survey Closing &amp; Thank-You Screen'));
    const blank = AEReportExport.buildBlankQuestionnaireHTML(survey, { lang: 'en' });
    assert(blank.includes('Printable Questionnaire') && blank.includes('Asante!'));
  });

  // 5. Collector Pre-Fill/UTM & Website Embed Snippet
  await test('Collector URL pre-fill, UTM tracking, and Website Embed snippet', () => {
    AECollector.initRunnerForSurvey(survey, true);
    assert.strictEqual(AECollector.draftAnswers.q_reg, 'Nakuru');
    assert.strictEqual(AECollector.campaignMeta.source, 'whatsapp');
    const iframe = AECollector.buildEmbedIframeSnippet('s_ci', 680);
    assert(iframe.includes('<iframe') && iframe.includes('embed=1') && iframe.includes('height="680"'));
    const fieldHtml = fs.readFileSync(path.join(ROOT, 'field.html'), 'utf8');
    assert(fieldHtml.includes('ae-embed-mode') && fieldHtml.includes('embed=1'));
  });

  // 6. Code.gs Gemini Discovery + Fallback Chain + Multimodal Doc Upload + Audit Answer Edit
  await test('Code.gs Gemini REST discovery, fallback chain, and PDF doc upload', () => {
    const propStore = { GEMINI_API_KEY: 'ci-key' };
    const gasSandbox = {
      Logger: { log: () => {} },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (k) => propStore[k] || null,
          setProperty: (k, v) => { propStore[k] = String(v); }
        })
      },
      UrlFetchApp: {
        fetch: (url) => {
          if (url.includes('/v1beta/models?')) {
            return {
              getResponseCode: () => 200,
              getContentText: () => JSON.stringify({
                models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }]
              })
            };
          }
          if (url.includes('gemini-3.')) {
            return { getResponseCode: () => 404, getContentText: () => 'not found' };
          }
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({
              candidates: [{ content: { parts: [{ text: '{"title":"Doc Survey","pages":[{"title":"P1","questions":[{"type":"short_text","title":"Name"}]}]}' }] } }]
            })
          };
        }
      }
    };
    vm.createContext(gasSandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Code.gs'), 'utf8'), gasSandbox);
    const res = gasSandbox.generateSurveyWithGemini_({
      documentFile: { name: 'doc.pdf', mimeType: 'application/pdf', base64Data: 'JVBERi0xLjQ=' }
    });
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.model, 'gemini-2.5-flash');
    assert.strictEqual(propStore.GEMINI_LAST_WORKING_MODEL, 'gemini-2.5-flash');
  });

  // 7. Evidence Gallery methods exist and work without throwing
  await test('Evidence Gallery methods (pin, lightbox, download) exist and do not throw', () => {
    assert.strictEqual(typeof AEAnalytics.togglePinGalleryItem, 'function');
    assert.strictEqual(typeof AEAnalytics.openGalleryLightbox, 'function');
    assert.strictEqual(typeof AEAnalytics.closeGalleryLightbox, 'function');
    assert.strictEqual(typeof AEAnalytics.downloadMediaItem, 'function');

    const prevCreateElement = global.document.createElement;
    let clickedDownload = null;
    global.document.createElement = (tag) => {
      const el = { tagName: tag, href: '', download: '', click() { clickedDownload = this.download; } };
      return el;
    };
    try {
      AEAnalytics._galleryItemsByKey = {
        'r1__q_photo': {
          key: 'r1__q_photo',
          kind: 'photo',
          src: 'data:image/jpeg;base64,AAAA',
          questionId: 'q_photo',
          responseId: 'r1'
        }
      };

      AEAnalytics.togglePinGalleryItem('s_ci', 'r1__q_photo');
      assert(AEAnalytics.getPinnedGalleryItems('s_ci').includes('r1__q_photo'));
      AEAnalytics.togglePinGalleryItem('s_ci', 'r1__q_photo');
      assert(!AEAnalytics.getPinnedGalleryItems('s_ci').includes('r1__q_photo'));

      AEAnalytics.openGalleryLightbox('r1__q_photo');
      assert.strictEqual(AEAnalytics.galleryLightboxKey, 'r1__q_photo');
      AEAnalytics.closeGalleryLightbox();
      assert.strictEqual(AEAnalytics.galleryLightboxKey, null);

      AEAnalytics.downloadMediaItem('r1__q_photo');
      assert.strictEqual(clickedDownload, 'AE_Evidence_q_photo_r1.jpg');
      // Missing item key should be a safe no-op
      AEAnalytics.downloadMediaItem('nonexistent_key');
    } finally {
      global.document.createElement = prevCreateElement;
    }
  });

  // 8. Public Report reportAccess.hideOpenEnded privacy enforcement
  await test('Public Report enforces reportAccess.hideOpenEnded privacy guard', () => {
    const privateSurvey = Object.assign({}, survey, {
      reportAccess: { passcode: '', hideOpenEnded: true, hideGallery: true }
    });
    const prevGetActive = global.aeStore.getActiveSurvey;
    const prevGetById = global.aeStore.getSurveyById;
    global.aeStore.getActiveSurvey = () => privateSurvey;
    global.aeStore.getSurveyById = (id) => (id === 's_ci' ? privateSurvey : null);
    AEApp.isPublicReportMode = true;

    try {
      AEAnalytics.activeTab = 'summary';
      AEAnalytics.openQuestionInVerbatimTab('q_fb');
      assert.strictEqual(AEAnalytics.activeTab, 'summary', 'openQuestionInVerbatimTab must not switch to text tab when hideOpenEnded is true');

      AEAnalytics.activeTab = 'text';
      const html = AEAnalytics.renderAnalyzeStage(privateSurvey);
      assert.strictEqual(AEAnalytics.activeTab, 'summary', 'renderAnalyzeStage must normalize activeTab away from text when hideOpenEnded is true');
      assert(!html.includes('openQuestionInVerbatimTab('), 'Verbatim drilldown buttons must be hidden in public report mode when hideOpenEnded is true');
    } finally {
      AEApp.isPublicReportMode = false;
      AEAnalytics.activeTab = 'summary';
      global.aeStore.getActiveSurvey = prevGetActive;
      global.aeStore.getSurveyById = prevGetById;
    }
  });

  // 9. Blank numeric answers must NOT be coerced to 0 and flagged as outliers
  await test('computeDataHygiene ignores blank/null/undefined numeric answers', () => {
    const numericResponses = [
      { id: 'n1', surveyId: 's_ci', enumerator: 'A', submittedAt: now, durationSeconds: 180, answers: { q_yield: 100 } },
      { id: 'n2', surveyId: 's_ci', enumerator: 'B', submittedAt: now, durationSeconds: 180, answers: { q_yield: 102 } },
      { id: 'n3', surveyId: 's_ci', enumerator: 'C', submittedAt: now, durationSeconds: 180, answers: { q_yield: 104 } },
      { id: 'n4', surveyId: 's_ci', enumerator: 'D', submittedAt: now, durationSeconds: 180, answers: { q_yield: 98 } },
      { id: 'n5', surveyId: 's_ci', enumerator: 'E', submittedAt: now, durationSeconds: 180, answers: { q_yield: 101 } },
      { id: 'n_empty', surveyId: 's_ci', enumerator: 'F', submittedAt: now, durationSeconds: 180, answers: { q_yield: '' } },
      { id: 'n_space', surveyId: 's_ci', enumerator: 'G', submittedAt: now, durationSeconds: 180, answers: { q_yield: '   ' } },
      { id: 'n_null', surveyId: 's_ci', enumerator: 'H', submittedAt: now, durationSeconds: 180, answers: { q_yield: null } },
      { id: 'n_undef', surveyId: 's_ci', enumerator: 'I', submittedAt: now, durationSeconds: 180, answers: {} }
    ];
    const hygiene = AEAnalytics.computeDataHygiene(survey, numericResponses);
    const flaggedIds = hygiene.numericOutliers.map((o) => o.responseId);
    assert(!flaggedIds.includes('n_empty'), 'Empty string must not be flagged as 0 outlier');
    assert(!flaggedIds.includes('n_space'), 'Whitespace string must not be flagged as 0 outlier');
    assert(!flaggedIds.includes('n_null'), 'null must not be flagged as 0 outlier');
    assert(!flaggedIds.includes('n_undef'), 'undefined must not be flagged as 0 outlier');
    assert.strictEqual(hygiene.numericOutliers.length, 0);
  });

  // 10. Per-survey askSurveyHistory isolation
  await test('Ask Your Survey history is isolated per surveyId', () => {
    AEAnalytics.askSurveyHistoryBySurvey = {};
    AEAnalytics.askSurveyHistoryBySurvey['s_alpha'] = [{ question: 'Alpha Q', answer: 'Alpha A', timestamp: now }];
    AEAnalytics.askSurveyHistoryBySurvey['s_beta'] = [{ question: 'Beta Q', answer: 'Beta A', timestamp: now }];

    assert.strictEqual(AEAnalytics.getAskSurveyHistory('s_alpha').length, 1);
    assert.strictEqual(AEAnalytics.getAskSurveyHistory('s_alpha')[0].question, 'Alpha Q');
    assert.strictEqual(AEAnalytics.getAskSurveyHistory('s_beta').length, 1);
    assert.strictEqual(AEAnalytics.getAskSurveyHistory('s_beta')[0].question, 'Beta Q');
    assert.strictEqual(AEAnalytics.getAskSurveyHistory('s_gamma').length, 0);

    AEAnalytics.clearAskSurveyHistory('s_alpha');
    assert.strictEqual(AEAnalytics.getAskSurveyHistory('s_alpha').length, 0);
    assert.strictEqual(AEAnalytics.getAskSurveyHistory('s_beta').length, 1, 'Clearing survey A must not affect survey B');
  });

  // 11. survey.versionHistory stored in localStorage rather than serialized into survey object
  await test('AESurveyStore stores survey versionHistory in localStorage, not on survey object', () => {
    const dbStorage = {};
    const dbSandbox = {
      console,
      Date,
      Math,
      JSON,
      Object,
      Array,
      Set,
      Map,
      RegExp,
      Error,
      Promise,
      setTimeout: () => 0,
      clearTimeout: () => {},
      setInterval: () => 0,
      clearInterval: () => {},
      localStorage: {
        getItem: (k) => (k in dbStorage ? dbStorage[k] : null),
        setItem: (k, v) => { dbStorage[k] = String(v); },
        removeItem: (k) => { delete dbStorage[k]; }
      },
      navigator: { onLine: false, userAgent: 'Node-CI' },
      location: { origin: 'https://ae-survey.pages.dev', pathname: '/index.html', search: '' }
    };
    dbSandbox.window = dbSandbox;
    vm.createContext(dbSandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/db.js'), 'utf8'), dbSandbox);

    const store = dbSandbox.window.aeStore;
    const legacySurvey = {
      id: 'srv_ver_test',
      title: 'Version Test V2',
      schemaVersion: 2,
      pages: [{ id: 'p1', title: 'P1', questions: [{ id: 'q1', type: 'short_text', title: 'Name' }] }],
      versionHistory: [{ version: 1, savedAt: now, savedBy: 'Admin', questionCount: 1, title: 'Legacy V1', pages: [] }]
    };

    const saved1 = store.upsertSurvey(legacySurvey, false);
    assert.strictEqual(saved1.versionHistory, undefined, 'versionHistory must not be attached to survey object');
    assert(!JSON.stringify(saved1).includes('versionHistory'), 'versionHistory must not serialize into survey JSON');

    // Modify schema to create an automatic snapshot
    const saved2 = store.upsertSurvey({
      id: 'srv_ver_test',
      title: 'Version Test V2',
      pages: [{ id: 'p1', title: 'P1', questions: [{ id: 'q1', type: 'short_text', title: 'Full Name' }, { id: 'q2', type: 'number_yield', title: 'Yield' }] }]
    }, false);
    assert.strictEqual(saved2.versionHistory, undefined);

    const rawLocal = dbStorage['ae_survey_versions_srv_ver_test'];
    assert(rawLocal && rawLocal.length > 2, 'Version history must be persisted under ae_survey_versions_<surveyId> in localStorage');
    const hist = store.getSurveyVersionHistory('srv_ver_test');
    assert(Array.isArray(hist) && hist.length >= 2, 'getSurveyVersionHistory must return migrated + newly snapshotted versions');
  });

  // 12. Code.gs unknown doPost action rejection, readAnswersFromDedicatedSheet_ c=9 offset, UPSERT_PERSONNEL role lock
  await test('Code.gs rejects unknown doPost actions, reads dedicated sheet from c=9, and locks non-admin personnel role', () => {
    const propStore = { AE_SYNC_TOKEN: 'ci-secret-token' };
    const personnelRows = [
      ['ID', 'FullName', 'Role', 'County', 'SubCounty', 'Phone', 'Email', 'SupervisorId', 'AssignedSurveys', 'Status', 'PinCode', 'UpdatedAt', 'TaskQuotas'],
      ['enum_01', 'Jane Enum', 'enumerator', 'Nakuru', '', '0700', 'jane@ae.test', 'sup_01', 'srv_a', 'Active', "'1234", now, '{}']
    ];
    const dedicatedRows = [
      ['ResponseID', 'SubmittedAt', 'Enumerator', 'County', 'GPS', 'DurationSec', 'SyncStatus', 'ReviewStatus', 'Administered Language', 'Q1: County', 'Q2a: Custom Metric'],
      ['resp_ded_1', now, 'Jane Enum', 'Nakuru', '', 120, 'synced', 'approved', 'sw', 'Nakuru', '42']
    ];

    function makeMockSheet(name, data) {
      return {
        getName: () => name,
        getLastRow: () => data.length,
        getLastColumn: () => (data[0] ? data[0].length : 0),
        getRange: (row, col, numRows, numCols) => ({
          getValues: () => {
            const out = [];
            for (let r = 0; r < numRows; r++) {
              const srcRow = data[row - 1 + r] || [];
              const slice = [];
              for (let c = 0; c < numCols; c++) slice.push(srcRow[col - 1 + c]);
              out.push(slice);
            }
            return out;
          },
          setValues: (vals) => {
            for (let r = 0; r < vals.length; r++) {
              if (!data[row - 1 + r]) data[row - 1 + r] = [];
              for (let c = 0; c < vals[r].length; c++) {
                data[row - 1 + r][col - 1 + c] = vals[r][c];
              }
            }
          }
        }),
        appendRow: (rowArr) => { data.push(rowArr.slice()); }
      };
    }

    const personnelSheet = makeMockSheet('Personnel', personnelRows);
    const dedicatedSheet = makeMockSheet('Resp_Test_srv999', dedicatedRows);
    const mockSs = {
      getSheets: () => [personnelSheet, dedicatedSheet],
      getSheetByName: (n) => (n === 'Personnel' ? personnelSheet : (n === 'Resp_Test_srv999' ? dedicatedSheet : null))
    };

    const gasSandbox = {
      Logger: { log: () => {} },
      CacheService: {
        getScriptCache: () => ({ get: () => null, put: () => {} })
      },
      LockService: {
        getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} })
      },
      ContentService: {
        MimeType: { JSON: 'application/json' },
        createTextOutput: (txt) => ({
          _text: txt,
          setMimeType() { return this; },
          getContent() { return this._text; }
        })
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (k) => propStore[k] || null,
          setProperty: (k, v) => { propStore[k] = String(v); }
        })
      },
      SpreadsheetApp: {
        getActiveSpreadsheet: () => mockSs
      }
    };
    vm.createContext(gasSandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Code.gs'), 'utf8'), gasSandbox);
    gasSandbox.ensureDatabaseInitialized_ = () => {};

    // 12a. Reject unknown doPost action
    const unknownResObj = gasSandbox.doPost({
      postData: {
        contents: JSON.stringify({
          syncToken: 'ci-secret-token',
          action: 'TOTALLY_BOGUS_ACTION',
          deviceId: 'ci-dev'
        })
      }
    });
    const unknownRes = JSON.parse(unknownResObj.getContent());
    assert.strictEqual(unknownRes.ok, false, 'Unknown doPost action must return ok: false');
    assert(/unknown|unsupported/i.test(String(unknownRes.error || '')), 'Error message should explain unknown action');

    // 12b. readAnswersFromDedicatedSheet_ starts at c=9 (skips Col 9 Administered Language)
    const parsedAnswers = gasSandbox.readAnswersFromDedicatedSheet_(mockSs, 'srv999', 'resp_ded_1');
    assert(parsedAnswers && typeof parsedAnswers === 'object');
    assert.strictEqual(parsedAnswers.q_county, 'Nakuru', 'Col 10 (index 9) must be parsed as q_county');
    assert.strictEqual(parsedAnswers.q_2, '42', 'Col 11 (index 10) must be parsed as q_2');
    assert(!Object.values(parsedAnswers).includes('sw'), 'Col 9 (index 8, Administered Language) must be skipped');

    // 12c. UPSERT_PERSONNEL self-update role lock for non-admin
    gasSandbox.upsertPersonnelRow_({
      id: 'enum_01',
      fullName: 'Jane Updated',
      role: 'admin',
      county: 'Nakuru',
      phone: '0799',
      assignedSurveys: ['srv_a', 'srv_secret'],
      active: false,
      pinCode: '5678'
    }, false);
    assert.strictEqual(personnelRows[1][1], 'Jane Updated', 'Non-privileged fullName update should succeed');
    assert.strictEqual(personnelRows[1][2], 'enumerator', 'Non-admin self-update must NOT escalate role to admin');
    assert.strictEqual(personnelRows[1][8], 'srv_a', 'Non-admin self-update must NOT modify assignedSurveys');
    assert.strictEqual(personnelRows[1][9], 'Active', 'Non-admin self-update must NOT modify Status');
  });

  console.log(`\nALL ${passed} REGRESSION TESTS PASSED.`);
})();
