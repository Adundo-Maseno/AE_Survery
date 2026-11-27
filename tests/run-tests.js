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

  console.log(`\nALL ${passed} REGRESSION TESTS PASSED.`);
})();
