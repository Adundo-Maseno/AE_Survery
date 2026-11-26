# Graph Report - AE_Survery  (2026-11-26)

## Corpus Check
- 25 files · ~182,138 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1464 nodes · 3557 edges · 66 communities (56 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8e5d61cd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AESurveyStore
- zs
- field-app.js
- chart.umd.min.js
- i
- P
- app.js
- A
- showToast
- $n
- analytics.js
- .buildOrUpdateElements
- _update
- Os
- m
- ae
- en
- db.js
- updateElements
- Ks
- Da
- e
- ja
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
- .notifyPlugins
- builder.js
- setRunnerAnswer
- templates.js
- collector.js
- i18n.js
- Vs
- adr/README.md
- draw
- C
- ._computeLabelItems
- qrcode.js
- .getContext
- renderAnalyzeStage
- .update
- Qi
- ae
- mean
- boot
- _computeLongitudinalData
- mountCharts
- exportExcelWorkbook
- renderSingleQuestionAnalyticsCard
- .getLabels
- downloadBlob
- logGamma
- ._handleEvent
- copyText
- .constructor
- closePersonnelModals

## God Nodes (most connected - your core abstractions)
1. `render()` - 118 edges
2. `AESurveyStore` - 99 edges
3. `showToast()` - 73 edges
4. `zs` - 73 edges
5. `i` - 71 edges
6. `Os` - 58 edges
7. `render()` - 46 edges
8. `showToast()` - 31 edges
9. `$n` - 28 edges
10. `renderModals()` - 26 edges

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

## Communities (66 total, 10 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.06
Nodes (4): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData(), resolve()

### Community 1 - "zs"
Cohesion: 0.12
Nodes (3): d(), Si(), zs

### Community 2 - "field-app.js"
Cohesion: 0.06
Nodes (106): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), buildResumeUrl(), captureGPS(), clearAudioRecording(), clearBarcode() (+98 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (35): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset() (+27 more)

### Community 5 - "P"
Cohesion: 0.10
Nodes (16): at(), _calculateBarIndexPixels(), dt(), Fa, _getRuler(), _getStackCount(), _getStackIndex(), _getStacks() (+8 more)

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (56): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), clearSurveySelection(), closeAssignTaskModal(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion() (+48 more)

### Community 7 - "A"
Cohesion: 0.11
Nodes (17): A(), afterDatasetsUpdate(), apply(), be(), constructor(), describe(), Fs, get() (+9 more)

### Community 8 - "showToast"
Cohesion: 0.05
Nodes (42): addQuestionToActivePage(), addSurveyPage(), applySurveyThemePreset(), archiveSurveyConfirm(), autoTranslateSurvey(), bulkArchiveSelectedSurveys(), bulkDeleteSelectedSurveys(), captureFieldGPS() (+34 more)

### Community 9 - "$n"
Cohesion: 0.05
Nodes (19): afterInit(), An(), Ci(), Di(), Fn(), generateLabels(), I(), initialize() (+11 more)

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (13): analyzeVerbatims(), _buildBriefingPlainText(), copyVerbatimBriefing(), deleteCustomTheme(), generateExecutiveBriefing(), getCustomThemes(), getPinnedQuotes(), getTextQuestions() (+5 more)

### Community 11 - ".buildOrUpdateElements"
Cohesion: 0.16
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 12 - "_update"
Cohesion: 0.50
Nodes (3): addElements(), Ui(), _update()

### Community 14 - "m"
Cohesion: 0.10
Nodes (21): Ai(), fi(), ft(), getMaxOverflow(), gt(), hi(), inRange(), ka() (+13 more)

### Community 15 - "ae"
Cohesion: 0.20
Nodes (12): ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany(), idbReadAll(), isGoogleAppsScriptHost() (+4 more)

### Community 16 - "en"
Cohesion: 0.13
Nodes (7): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 17 - "db.js"
Cohesion: 0.09
Nodes (29): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), _collectSurveyQuestions(), computeRecordHash(), computeSyncFallbackHash() (+21 more)

### Community 18 - "updateElements"
Cohesion: 0.19
Nodes (7): _calculateBarValuePixels(), ct(), getLabelAndValue(), _s(), ua(), updateElements(), ys()

### Community 19 - "Ks"
Cohesion: 0.12
Nodes (5): Bs(), Gs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.10
Nodes (9): bn(), buildLookupTable(), Da, getDecimalForValue(), initOffsets(), mn(), sn(), xn() (+1 more)

### Community 21 - "e"
Cohesion: 0.29
Nodes (5): _e(), e, getCenterPoint(), tooltipPosition(), Ue()

### Community 22 - "ja"
Cohesion: 0.09
Nodes (9): configure(), determineDataLimits(), g(), getPixelForTick(), getPixelForValue(), getValueForPixel(), ja, mt() (+1 more)

### Community 23 - "Ji"
Cohesion: 0.07
Nodes (14): Ae(), as(), cs(), de(), ds(), gs, hs(), Ji (+6 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.12
Nodes (21): cancelKioskPinPrompt(), closeAssignTeamModal(), closePasteOutlineModal(), closeSyncSettingsModal(), closeTemplateLibraryModal(), formatPendingSyncMeta(), getPendingSyncItems(), handleGlobalKeydown() (+13 more)

### Community 26 - "report-export.js"
Cohesion: 0.29
Nodes (15): buildExecutiveReportHTML(), buildSlideDeckHTML(), _cleanTitle(), _computeQuestionBreakdown(), _esc(), exportPDF(), exportWordDoc(), _formatDate() (+7 more)

### Community 28 - "t"
Cohesion: 0.18
Nodes (11): bt(), ei(), Ge(), je(), _notify(), Qa(), Qe(), t() (+3 more)

### Community 29 - "bs"
Cohesion: 0.18
Nodes (5): bs, ki(), qi(), Xi(), xs

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
Cohesion: 0.27
Nodes (11): escapeAttr(), escapeHtml(), escapeJs(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderLoginPortal(), renderPublicReportMain() (+3 more)

### Community 34 - ".notifyPlugins"
Cohesion: 0.18
Nodes (3): Ce(), ea(), oa()

### Community 35 - "builder.js"
Cohesion: 0.15
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - "setRunnerAnswer"
Cohesion: 0.50
Nodes (4): recalculateRunnerCalculatedFields(), refreshPipedDom(), setRunnerAnswer(), setRunnerAnswerSilent()

### Community 37 - "templates.js"
Cohesion: 0.52
Nodes (6): buildSurveyFromTemplate(), extractInlineOptions(), inferQuestionTypeAndOptions(), parseOutlineToSurvey(), remapPipingTokens(), uid()

### Community 38 - "collector.js"
Cohesion: 0.18
Nodes (22): buildQRPosterHTML(), buildWhatsAppShareUrl(), copyUnusedInviteLinks(), getSafeBrandLogo(), getSafeRedirectUrl(), getSurveyShareUrl(), initRunnerForSurvey(), isLegacyHardcodedDefault() (+14 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "draw"
Cohesion: 0.14
Nodes (17): ca(), da(), draw(), Fe(), Gi(), ii(), c(), m() (+9 more)

### Community 43 - "C"
Cohesion: 0.17
Nodes (13): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), kn(), ot(), parse() (+5 more)

### Community 44 - "._computeLabelItems"
Cohesion: 0.16
Nodes (5): Es(), Is(), L(), Rs(), e()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.24
Nodes (18): auditDataQuality(), getCategoricalQuestions(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab(), renderAutomatedInsightsBanner() (+10 more)

### Community 48 - ".update"
Cohesion: 0.24
Nodes (3): k(), Qs(), ra()

### Community 50 - "ae"
Cohesion: 0.07
Nodes (19): ae, color(), ee(), Et(), ie(), i(), It(), jt() (+11 more)

### Community 52 - "mean"
Cohesion: 0.19
Nodes (17): betaInc(), cohensD(), fDistributionPValue(), invertMatrix(), mean(), moransI(), multivariateOLS(), normalCdfUpper() (+9 more)

### Community 53 - "boot"
Cohesion: 0.17
Nodes (16): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), getPendingSyncCount(), handleCloudDataUpdated(), init(), isUserActivelyEditingOrInModal() (+8 more)

### Community 55 - "_computeLongitudinalData"
Cohesion: 0.22
Nodes (9): _computeLongitudinalData(), _extractWaveChoiceValues(), formatQuestionTypeLabel(), _formatWaveNumber(), _formatWavePValue(), _isWaveChoiceQuestion(), _isWaveNumericQuestion(), _normalizeWaveQuestionTitle() (+1 more)

### Community 56 - "mountCharts"
Cohesion: 0.29
Nodes (10): destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap(), mountLisaMap() (+2 more)

### Community 57 - "exportExcelWorkbook"
Cohesion: 0.22
Nodes (19): cleanQuestionTitle(), exportExcelWorkbook(), exportQuestionCsv(), exportVerbatimCsv(), _extractResponseLocationValue(), _formatVerbatimDate(), getCellHeatmapStyle(), getFilteredResponses() (+11 more)

### Community 58 - "renderSingleQuestionAnalyticsCard"
Cohesion: 0.33
Nodes (7): formatAnswerDisplay(), renderQuestionChartCanvas(), renderQuestionStatsPanel(), renderQuestionSummaries(), renderQuestionTabulationTable(), renderQuestionVerbatimPanel(), renderSingleQuestionAnalyticsCard()

### Community 59 - ".getLabels"
Cohesion: 0.33
Nodes (3): buildTicks(), ia(), init()

### Community 60 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 61 - "logGamma"
Cohesion: 0.50
Nodes (5): chiSquarePValue(), chiSquareTest(), gammaLowerSeries(), gammaUpperContinuedFraction(), logGamma()

### Community 63 - "copyText"
Cohesion: 0.40
Nodes (5): copyLiveReportLink(), copyText(), generateSurveyInvites(), getLiveReportUrl(), openLiveReport()

### Community 64 - ".constructor"
Cohesion: 0.50
Nodes (3): fs(), sa(), xe()

### Community 65 - "closePersonnelModals"
Cohesion: 0.67
Nodes (3): closePersonnelModals(), savePersonnel(), saveResetPin()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 231 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zs` connect `zs` to `chart.umd.min.js`, `._computeLabelItems`, `.getContext`, `en`, `ja`, `.getLabels`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.059794214715589204 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `.constructor`, `.notifyPlugins`, `chart.umd.min.js`, `P`, `draw`, `.update`, `ae`, `Ks`, `Ji`, `._handleEvent`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12299465240641712 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `chart.umd.min.js`, `.buildOrUpdateElements`, `_update`, `updateElements`, `.parse`, `pa`, `.getParsed`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0628245067497404 - nodes in this community are weakly interconnected._