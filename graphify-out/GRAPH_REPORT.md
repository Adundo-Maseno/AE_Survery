# Graph Report - AE_Survery  (2026-11-26)

## Corpus Check
- 25 files · ~168,492 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1409 nodes · 3397 edges · 64 communities (54 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `58bf829d`
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
- z
- analytics.js
- en
- $n
- Os
- draw
- ae
- ja
- db.js
- ._computeLabelItems
- Ks
- Da
- A
- downloadBlob
- Ji
- pa
- handleGlobalKeydown
- report-export.js
- ._resize
- qa
- bs
- manifest.json
- text-intelligence.js
- Key Highlights & Capabilities
- escapeHtml
- builder.js
- Vs
- templates.js
- collector.js
- i18n.js
- I
- adr/README.md
- e
- resolveDataElementOptions
- copyLiveReportLink
- qrcode.js
- .update
- renderAnalyzeStage
- closePersonnelModals
- Qi
- de
- mean
- boot
- k
- _computeLongitudinalData
- mountCharts
- exportExcelWorkbook
- renderSingleQuestionAnalyticsCard
- x
- .getLabels
- logGamma
- .constructor
- .buildOrUpdateControllers

## God Nodes (most connected - your core abstractions)
1. `render()` - 109 edges
2. `AESurveyStore` - 87 edges
3. `zs` - 73 edges
4. `i` - 71 edges
5. `showToast()` - 67 edges
6. `Os` - 58 edges
7. `render()` - 44 edges
8. `showToast()` - 28 edges
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

## Communities (64 total, 10 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.07
Nodes (4): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData(), resolve()

### Community 1 - "zs"
Cohesion: 0.12
Nodes (3): d(), Si(), zs

### Community 2 - "field-app.js"
Cohesion: 0.07
Nodes (93): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading() (+85 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (33): add(), addControllers(), addElements(), addPlugins(), addScales(), beforeLayout(), Bi(), cn() (+25 more)

### Community 5 - "Fa"
Cohesion: 0.08
Nodes (16): at(), dt(), e, Et(), Fa, getCenterPoint(), Ha(), ht() (+8 more)

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (53): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), closeAssignTaskModal(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion(), dismissSyncError() (+45 more)

### Community 7 - "A"
Cohesion: 0.10
Nodes (15): apply(), be(), color(), constructor(), describe(), Fs, get(), i() (+7 more)

### Community 8 - "showToast"
Cohesion: 0.06
Nodes (38): addQuestionToActivePage(), addSurveyPage(), applySurveyThemePreset(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), createBlankSurvey() (+30 more)

### Community 9 - "z"
Cohesion: 0.18
Nodes (5): An(), Di(), Nn(), On, z()

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (13): analyzeVerbatims(), _buildBriefingPlainText(), copyVerbatimBriefing(), deleteCustomTheme(), generateExecutiveBriefing(), getCustomThemes(), getPinnedQuotes(), getTextQuestions() (+5 more)

### Community 11 - "en"
Cohesion: 0.12
Nodes (8): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt(), wt()

### Community 12 - "$n"
Cohesion: 0.15
Nodes (6): afterInit(), Ci(), initialize(), $n, W(), wi()

### Community 13 - "Os"
Cohesion: 0.05
Nodes (20): _calculateBarIndexPixels(), _calculateBarValuePixels(), _getRuler(), _getStackCount(), _getStackIndex(), _getStacks(), ks(), ma (+12 more)

### Community 14 - "draw"
Cohesion: 0.09
Nodes (26): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), draw(), Fe(), Ge() (+18 more)

### Community 15 - "ae"
Cohesion: 0.08
Nodes (16): ae, ee(), ie(), te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany() (+8 more)

### Community 16 - "ja"
Cohesion: 0.09
Nodes (9): configure(), determineDataLimits(), g(), getPixelForTick(), getPixelForValue(), getValueForPixel(), ja, mt() (+1 more)

### Community 17 - "db.js"
Cohesion: 0.09
Nodes (29): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), _collectSurveyQuestions(), computeRecordHash(), computeSyncFallbackHash() (+21 more)

### Community 18 - "._computeLabelItems"
Cohesion: 0.14
Nodes (5): Es(), Is(), L(), Le(), Rs()

### Community 19 - "Ks"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.09
Nodes (10): Da, gt(), hi(), kn(), li(), mn(), nearest(), oi() (+2 more)

### Community 21 - "A"
Cohesion: 0.14
Nodes (19): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+11 more)

### Community 22 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 23 - "Ji"
Cohesion: 0.09
Nodes (12): Ae(), as(), cs(), ds(), gs, hs(), Ji, ns() (+4 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.11
Nodes (23): cancelKioskPinPrompt(), closeAssignTeamModal(), closePasteOutlineModal(), closeSyncSettingsModal(), closeTemplateLibraryModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal() (+15 more)

### Community 26 - "report-export.js"
Cohesion: 0.36
Nodes (10): buildExecutiveReportHTML(), _cleanTitle(), _computeQuestionBreakdown(), _esc(), exportPDF(), exportWordDoc(), _formatDate(), _getQuestions() (+2 more)

### Community 28 - "qa"
Cohesion: 0.15
Nodes (4): He(), label(), P(), qa

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
Cohesion: 0.24
Nodes (11): escapeAttr(), escapeHtml(), escapeJs(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderLoginPortal(), renderPublicReportMain() (+3 more)

### Community 35 - "builder.js"
Cohesion: 0.24
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 37 - "templates.js"
Cohesion: 0.52
Nodes (6): buildSurveyFromTemplate(), extractInlineOptions(), inferQuestionTypeAndOptions(), parseOutlineToSurvey(), remapPipingTokens(), uid()

### Community 38 - "collector.js"
Cohesion: 0.24
Nodes (16): getSafeBrandLogo(), getSafeRedirectUrl(), initRunnerForSurvey(), isLegacyHardcodedDefault(), persistDraft(), recomputeCalculatedFields(), renderAirGapManager(), renderCollectorsManager() (+8 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 40 - "I"
Cohesion: 0.21
Nodes (6): generateLabels(), I(), Ln, _refresh(), start(), ya()

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "e"
Cohesion: 0.09
Nodes (23): Ai(), bn(), bt(), buildLookupTable(), ct(), ft(), getDecimalForValue(), getLabelAndValue() (+15 more)

### Community 43 - "resolveDataElementOptions"
Cohesion: 0.21
Nodes (12): ca(), da(), fi(), getMaxOverflow(), ln(), mi(), parseArrayData(), parseObjectData() (+4 more)

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

### Community 50 - "de"
Cohesion: 0.20
Nodes (6): de(), jt(), ke(), numeric(), se(), Xt()

### Community 52 - "mean"
Cohesion: 0.19
Nodes (17): betaInc(), cohensD(), fDistributionPValue(), invertMatrix(), mean(), moransI(), multivariateOLS(), normalCdfUpper() (+9 more)

### Community 53 - "boot"
Cohesion: 0.19
Nodes (14): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), handleCloudDataUpdated(), init(), isUserActivelyEditingOrInModal(), mirrorSyncSettingsToIdb() (+6 more)

### Community 54 - "k"
Cohesion: 0.24
Nodes (3): k(), Qs(), ra()

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

### Community 59 - "x"
Cohesion: 0.31
Nodes (5): Fn(), hn(), jn(), rn(), x()

### Community 60 - ".getLabels"
Cohesion: 0.33
Nodes (3): buildTicks(), ia(), init()

### Community 61 - "logGamma"
Cohesion: 0.50
Nodes (5): chiSquarePValue(), chiSquareTest(), gammaLowerSeries(), gammaUpperContinuedFraction(), logGamma()

### Community 62 - ".constructor"
Cohesion: 0.40
Nodes (4): ea(), fs(), sa(), xe()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ae` connect `ae` to `de`, `chart.umd.min.js`, `Fa`, `A`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.0696629213483146 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `chart.umd.min.js`, `Fa`, `.update`, `draw`, `de`, `A`, `k`, `Ji`, `._resize`, `qa`, `.constructor`, `.buildOrUpdateControllers`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12299465240641712 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `.getContext`, `chart.umd.min.js`, `en`, `resolveDataElementOptions`, `ja`, `._computeLabelItems`, `.getLabels`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06875699888017917 - nodes in this community are weakly interconnected._