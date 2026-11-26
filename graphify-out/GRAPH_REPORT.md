# Graph Report - AE_Survery  (2026-11-26)

## Corpus Check
- 25 files · ~172,339 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1424 nodes · 3455 edges · 57 communities (50 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4c247e4b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AESurveyStore
- zs
- field-app.js
- chart.umd.min.js
- i
- Fa
- app.js
- A
- showToast
- $n
- analytics.js
- .buildOrUpdateElements
- .getDataset
- Os
- draw
- ae
- en
- db.js
- updateElements
- Ks
- Da
- A
- downloadBlob
- Ji
- pa
- handleGlobalKeydown
- report-export.js
- .getParsed
- t
- bs
- manifest.json
- text-intelligence.js
- Key Highlights & Capabilities
- escapeHtml
- _update
- builder.js
- setRunnerAnswer
- templates.js
- collector.js
- i18n.js
- adr/README.md
- e
- C
- copyLiveReportLink
- qrcode.js
- renderAnalyzeStage
- closePersonnelModals
- Qi
- se
- mean
- boot
- _computeLongitudinalData
- mountCharts
- exportExcelWorkbook
- renderSingleQuestionAnalyticsCard
- logGamma

## God Nodes (most connected - your core abstractions)
1. `render()` - 110 edges
2. `AESurveyStore` - 92 edges
3. `zs` - 73 edges
4. `i` - 71 edges
5. `showToast()` - 68 edges
6. `Os` - 58 edges
7. `render()` - 44 edges
8. `showToast()` - 29 edges
9. `$n` - 28 edges
10. `d()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `ADR 0004 Offline-First PWA Storage` --specifies--> `sw.js (Service Worker v3.43)`  [EXTRACTED]
  docs/adr/0004-offline-first-pwa-service-worker-storage.md → sw.js
- `index.html (Admin Studio Shell)` --references--> `manifest.json (Admin PWA)`  [EXTRACTED]
  index.html → manifest.json
- `field.html (PWA Collector Shell)` --references--> `manifest-collector.json (Field PWA)`  [EXTRACTED]
  field.html → manifest-collector.json
- `field.html (PWA Collector Shell)` --implements--> `sw.js (Service Worker v3.43)`  [EXTRACTED]
  field.html → sw.js
- `index.html (Admin Studio Shell)` --implements--> `sw.js (Service Worker v3.43)`  [EXTRACTED]
  index.html → sw.js

## Import Cycles
- None detected.

## Communities (57 total, 7 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.07
Nodes (4): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData(), resolve()

### Community 1 - "zs"
Cohesion: 0.06
Nodes (11): buildTicks(), d(), Es(), He(), ia(), L(), label(), P() (+3 more)

### Community 2 - "field-app.js"
Cohesion: 0.07
Nodes (99): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading() (+91 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.03
Nodes (44): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), _calculateBarIndexPixels(), cn() (+36 more)

### Community 4 - "i"
Cohesion: 0.06
Nodes (11): Ce(), ea(), fs(), i, k(), ra(), sa(), stop() (+3 more)

### Community 5 - "Fa"
Cohesion: 0.09
Nodes (13): at(), dt(), e, Et(), Fa, getCenterPoint(), It(), lt() (+5 more)

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (53): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), closeAssignTaskModal(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion(), dismissSyncError() (+45 more)

### Community 7 - "A"
Cohesion: 0.10
Nodes (15): apply(), be(), color(), constructor(), describe(), Fs, get(), i() (+7 more)

### Community 8 - "showToast"
Cohesion: 0.05
Nodes (39): addQuestionToActivePage(), addSurveyPage(), applySurveyThemePreset(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), createBlankSurvey() (+31 more)

### Community 9 - "$n"
Cohesion: 0.05
Nodes (21): afterInit(), An(), Ci(), Di(), Fn(), generateLabels(), I(), Is() (+13 more)

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (13): analyzeVerbatims(), _buildBriefingPlainText(), copyVerbatimBriefing(), deleteCustomTheme(), generateExecutiveBriefing(), getCustomThemes(), getPinnedQuotes(), getTextQuestions() (+5 more)

### Community 11 - ".buildOrUpdateElements"
Cohesion: 0.14
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 14 - "draw"
Cohesion: 0.13
Nodes (19): Aa(), ca(), da(), draw(), Fe(), Ge(), Gi(), ii() (+11 more)

### Community 15 - "ae"
Cohesion: 0.09
Nodes (14): ae, te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany() (+6 more)

### Community 16 - "en"
Cohesion: 0.05
Nodes (20): configure(), determineDataLimits(), en, r(), g(), _generate(), getPixelForTick(), getPixelForValue() (+12 more)

### Community 17 - "db.js"
Cohesion: 0.09
Nodes (29): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), _collectSurveyQuestions(), computeRecordHash(), computeSyncFallbackHash() (+21 more)

### Community 18 - "updateElements"
Cohesion: 0.24
Nodes (4): _calculateBarValuePixels(), _s(), updateElements(), ys()

### Community 19 - "Ks"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.12
Nodes (5): Da, kn(), mn(), xn(), yn

### Community 21 - "A"
Cohesion: 0.14
Nodes (19): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+11 more)

### Community 22 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 23 - "Ji"
Cohesion: 0.07
Nodes (14): Ae(), as(), cs(), de(), ds(), gs, hs(), Ji (+6 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.13
Nodes (20): cancelKioskPinPrompt(), closeAssignTeamModal(), closePasteOutlineModal(), closeSyncSettingsModal(), closeTemplateLibraryModal(), formatPendingSyncMeta(), handleGlobalKeydown(), nextRunnerPage() (+12 more)

### Community 26 - "report-export.js"
Cohesion: 0.36
Nodes (10): buildExecutiveReportHTML(), _cleanTitle(), _computeQuestionBreakdown(), _esc(), exportPDF(), exportWordDoc(), _formatDate(), _getQuestions() (+2 more)

### Community 28 - "t"
Cohesion: 0.20
Nodes (10): bn(), bt(), buildLookupTable(), getDecimalForValue(), initOffsets(), _notify(), Qa(), sn() (+2 more)

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

### Community 31 - "text-intelligence.js"
Cohesion: 0.11
Nodes (45): analyzeVerbatims(), _assignDynamicThemes(), _betaInc(), _buildTopTermsFromCounts(), _cleanQuestionTitle(), computeThemeScoreImpact(), _customThemesStorageKey(), deleteCustomTheme() (+37 more)

### Community 32 - "Key Highlights & Capabilities"
Cohesion: 0.18
Nodes (10): 1. Operations Management Portal (`index.html`), 2. Standalone Mobile Field PWA (`field.html`), 3. Cryptographic Integrity & Agronomic Anomaly Detection, 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`), A. Deploying Google Apps Script (`Code.gs`), AE Survey — Enterprise Offline-First Field & Cloud Survey Platform, B. Personnel Access Roster & RBAC Roles, File Directory Reference (+2 more)

### Community 33 - "escapeHtml"
Cohesion: 0.25
Nodes (11): escapeAttr(), escapeHtml(), escapeJs(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderLoginPortal(), renderPublicReportMain() (+3 more)

### Community 34 - "_update"
Cohesion: 0.25
Nodes (8): addElements(), getMaxOverflow(), gt(), nearest(), oi(), Ui(), _update(), n()

### Community 35 - "builder.js"
Cohesion: 0.24
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - "setRunnerAnswer"
Cohesion: 0.50
Nodes (4): recalculateRunnerCalculatedFields(), refreshPipedDom(), setRunnerAnswer(), setRunnerAnswerSilent()

### Community 37 - "templates.js"
Cohesion: 0.52
Nodes (6): buildSurveyFromTemplate(), extractInlineOptions(), inferQuestionTypeAndOptions(), parseOutlineToSurvey(), remapPipingTokens(), uid()

### Community 38 - "collector.js"
Cohesion: 0.24
Nodes (16): getSafeBrandLogo(), getSafeRedirectUrl(), initRunnerForSurvey(), isLegacyHardcodedDefault(), persistDraft(), recomputeCalculatedFields(), renderAirGapManager(), renderCollectorsManager() (+8 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "e"
Cohesion: 0.12
Nodes (15): Ai(), ct(), ft(), getLabelAndValue(), hi(), inRange(), ka(), li() (+7 more)

### Community 43 - "C"
Cohesion: 0.15
Nodes (14): beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), mi(), ot(), parse() (+6 more)

### Community 44 - "copyLiveReportLink"
Cohesion: 0.50
Nodes (4): copyLiveReportLink(), copyText(), getLiveReportUrl(), openLiveReport()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.26
Nodes (17): auditDataQuality(), getCategoricalQuestions(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab(), renderAutomatedInsightsBanner() (+9 more)

### Community 48 - "closePersonnelModals"
Cohesion: 0.67
Nodes (3): closePersonnelModals(), savePersonnel(), saveResetPin()

### Community 50 - "se"
Cohesion: 0.22
Nodes (7): ee(), ie(), jt(), ke(), Le(), se(), Xt()

### Community 52 - "mean"
Cohesion: 0.19
Nodes (17): betaInc(), cohensD(), fDistributionPValue(), invertMatrix(), mean(), moransI(), multivariateOLS(), normalCdfUpper() (+9 more)

### Community 53 - "boot"
Cohesion: 0.17
Nodes (16): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), getPendingSyncCount(), getPendingSyncItems(), handleCloudDataUpdated(), init() (+8 more)

### Community 55 - "_computeLongitudinalData"
Cohesion: 0.22
Nodes (9): _computeLongitudinalData(), _extractWaveChoiceValues(), formatQuestionTypeLabel(), _formatWaveNumber(), _formatWavePValue(), _isWaveChoiceQuestion(), _isWaveNumericQuestion(), _normalizeWaveQuestionTitle() (+1 more)

### Community 56 - "mountCharts"
Cohesion: 0.29
Nodes (10): destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap(), mountLisaMap() (+2 more)

### Community 57 - "exportExcelWorkbook"
Cohesion: 0.20
Nodes (20): cleanQuestionTitle(), exportExcelWorkbook(), exportQuestionCsv(), exportVerbatimCsv(), _extractResponseLocationValue(), _formatVerbatimDate(), getCellHeatmapStyle(), getFilteredResponses() (+12 more)

### Community 58 - "renderSingleQuestionAnalyticsCard"
Cohesion: 0.33
Nodes (7): formatAnswerDisplay(), renderQuestionChartCanvas(), renderQuestionStatsPanel(), renderQuestionSummaries(), renderQuestionTabulationTable(), renderQuestionVerbatimPanel(), renderSingleQuestionAnalyticsCard()

### Community 61 - "logGamma"
Cohesion: 0.50
Nodes (5): chiSquarePValue(), chiSquareTest(), gammaLowerSeries(), gammaUpperContinuedFraction(), logGamma()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `i` connect `i` to `zs`, `chart.umd.min.js`, `draw`, `en`, `se`, `A`, `Ji`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.0658454647256439 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `en`, `chart.umd.min.js`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.0595679012345679 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `chart.umd.min.js`, `.buildOrUpdateElements`, `.getDataset`, `updateElements`, `pa`, `.getParsed`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06653465346534654 - nodes in this community are weakly interconnected._