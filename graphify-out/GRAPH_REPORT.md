# Graph Report - AE_Survery  (2026-11-26)

## Corpus Check
- 25 files · ~158,940 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1370 nodes · 3298 edges · 61 communities (53 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `666c3c9e`
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
- en
- .getDataset
- Os
- C
- ae
- cs
- db.js
- ae
- Ks
- Da
- A
- downloadBlob
- Ji
- pa
- handleGlobalKeydown
- report-export.js
- .getParsed
- P
- la
- manifest.json
- text-intelligence.js
- Key Highlights & Capabilities
- escapeHtml
- .parse
- builder.js
- Vs
- templates.js
- collector.js
- i18n.js
- ja
- adr/README.md
- t
- draw
- copyLiveReportLink
- qrcode.js
- ._computeLabelItems
- renderAnalyzeStage
- closePersonnelModals
- Qi
- mean
- boot
- .getContext
- .getPixelForDecimal
- mountCharts
- exportExcelWorkbook
- renderSingleQuestionAnalyticsCard
- .getLabels
- .applyStack
- logGamma

## God Nodes (most connected - your core abstractions)
1. `render()` - 104 edges
2. `AESurveyStore` - 86 edges
3. `zs` - 73 edges
4. `i` - 71 edges
5. `showToast()` - 63 edges
6. `Os` - 58 edges
7. `render()` - 43 edges
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

## Communities (61 total, 8 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.07
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 1 - "zs"
Cohesion: 0.12
Nodes (3): d(), Si(), zs

### Community 2 - "field-app.js"
Cohesion: 0.07
Nodes (89): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading() (+81 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.03
Nodes (37): addControllers(), addPlugins(), addScales(), afterInit(), beforeLayout(), Bi(), cn(), dataset() (+29 more)

### Community 4 - "i"
Cohesion: 0.07
Nodes (7): Ce(), ea(), i, k(), ra(), ta(), W()

### Community 5 - "Fa"
Cohesion: 0.10
Nodes (13): at(), de(), dt(), _e(), e, Fa, getCenterPoint(), ht() (+5 more)

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (52): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), closeAssignTaskModal(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion(), dismissSyncError() (+44 more)

### Community 7 - "A"
Cohesion: 0.14
Nodes (9): apply(), color(), constructor(), describe(), Fs, i(), ne(), oe() (+1 more)

### Community 8 - "showToast"
Cohesion: 0.06
Nodes (35): addQuestionToActivePage(), addSurveyPage(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), createBlankSurvey(), createFromTemplate() (+27 more)

### Community 9 - "$n"
Cohesion: 0.05
Nodes (23): An(), Ci(), Di(), draw(), Fe(), Fn(), Ge(), generateLabels() (+15 more)

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (13): analyzeVerbatims(), _buildBriefingPlainText(), copyVerbatimBriefing(), deleteCustomTheme(), generateExecutiveBriefing(), getCustomThemes(), getPinnedQuotes(), getTextQuestions() (+5 more)

### Community 11 - "en"
Cohesion: 0.15
Nodes (6): en, _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 12 - ".getDataset"
Cohesion: 0.20
Nodes (4): addElements(), initialize(), Ui(), _update()

### Community 14 - "C"
Cohesion: 0.13
Nodes (16): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), kn(), mi() (+8 more)

### Community 15 - "ae"
Cohesion: 0.08
Nodes (14): ae, ee(), Et(), ie(), It(), jt(), ke(), Le() (+6 more)

### Community 16 - "cs"
Cohesion: 0.20
Nodes (9): as(), cs(), ds(), hs(), ns(), os(), St(), us() (+1 more)

### Community 17 - "db.js"
Cohesion: 0.11
Nodes (22): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), computeSyncFallbackHash(), constantTimeCompare() (+14 more)

### Community 18 - "ae"
Cohesion: 0.20
Nodes (12): ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany(), idbReadAll(), isGoogleAppsScriptHost() (+4 more)

### Community 19 - "Ks"
Cohesion: 0.13
Nodes (5): Bs(), Gs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.13
Nodes (4): Da, mn(), xn(), yn

### Community 21 - "A"
Cohesion: 0.21
Nodes (13): A(), afterDatasetsUpdate(), be(), get(), H(), j(), me(), N() (+5 more)

### Community 22 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 23 - "Ji"
Cohesion: 0.08
Nodes (8): Ae(), bs, gs, Ji, ki(), qi(), Xi(), xs

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.12
Nodes (21): cancelKioskPinPrompt(), closeAssignTeamModal(), closePasteOutlineModal(), closeSyncSettingsModal(), closeTemplateLibraryModal(), escapeJs(), handleGlobalKeydown(), nextRunnerPage() (+13 more)

### Community 26 - "report-export.js"
Cohesion: 0.36
Nodes (10): buildExecutiveReportHTML(), _cleanTitle(), _computeQuestionBreakdown(), _esc(), exportPDF(), exportWordDoc(), _formatDate(), _getQuestions() (+2 more)

### Community 28 - "P"
Cohesion: 0.15
Nodes (13): _calculateBarIndexPixels(), _calculateBarValuePixels(), ct(), getLabelAndValue(), _getRuler(), _getStackCount(), _getStackIndex(), _getStacks() (+5 more)

### Community 29 - "la"
Cohesion: 0.20
Nodes (10): add(), diff(), endOf(), format(), formats(), _getAnims(), has(), la() (+2 more)

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
Nodes (11): escapeAttr(), escapeHtml(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderHeaderBar(), renderLoginPortal(), renderPublicReportMain() (+3 more)

### Community 34 - ".parse"
Cohesion: 0.16
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 35 - "builder.js"
Cohesion: 0.27
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 37 - "templates.js"
Cohesion: 0.52
Nodes (6): buildSurveyFromTemplate(), extractInlineOptions(), inferQuestionTypeAndOptions(), parseOutlineToSurvey(), remapPipingTokens(), uid()

### Community 38 - "collector.js"
Cohesion: 0.33
Nodes (9): initRunnerForSurvey(), isLegacyHardcodedDefault(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner() (+1 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 40 - "ja"
Cohesion: 0.12
Nodes (7): configure(), determineDataLimits(), r(), g(), Ha(), ja, Na()

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "t"
Cohesion: 0.11
Nodes (20): Ai(), bn(), bt(), buildLookupTable(), ft(), getDecimalForValue(), initOffsets(), inRange() (+12 more)

### Community 43 - "draw"
Cohesion: 0.10
Nodes (20): ca(), da(), getMaxOverflow(), Gi(), gt(), hi(), ii(), c() (+12 more)

### Community 44 - "copyLiveReportLink"
Cohesion: 0.50
Nodes (4): copyLiveReportLink(), copyText(), getLiveReportUrl(), openLiveReport()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 46 - "._computeLabelItems"
Cohesion: 0.16
Nodes (5): Es(), Is(), L(), O(), Rs()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.26
Nodes (17): auditDataQuality(), getCategoricalQuestions(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab(), renderAutomatedInsightsBanner() (+9 more)

### Community 48 - "closePersonnelModals"
Cohesion: 0.67
Nodes (3): closePersonnelModals(), savePersonnel(), saveResetPin()

### Community 52 - "mean"
Cohesion: 0.19
Nodes (17): betaInc(), cohensD(), fDistributionPValue(), invertMatrix(), mean(), moransI(), multivariateOLS(), normalCdfUpper() (+9 more)

### Community 53 - "boot"
Cohesion: 0.20
Nodes (12): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), handleCloudDataUpdated(), init(), isUserActivelyEditingOrInModal(), mirrorSyncSettingsToIdb() (+4 more)

### Community 55 - ".getPixelForDecimal"
Cohesion: 0.14
Nodes (5): getPixelForTick(), getPixelForValue(), getValueForPixel(), mt(), Va

### Community 56 - "mountCharts"
Cohesion: 0.29
Nodes (10): destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap(), mountLisaMap() (+2 more)

### Community 57 - "exportExcelWorkbook"
Cohesion: 0.20
Nodes (20): cleanQuestionTitle(), exportExcelWorkbook(), exportQuestionCsv(), exportVerbatimCsv(), _extractResponseLocationValue(), _formatVerbatimDate(), getCellHeatmapStyle(), getFilteredResponses() (+12 more)

### Community 58 - "renderSingleQuestionAnalyticsCard"
Cohesion: 0.29
Nodes (8): formatAnswerDisplay(), formatQuestionTypeLabel(), renderQuestionChartCanvas(), renderQuestionStatsPanel(), renderQuestionSummaries(), renderQuestionTabulationTable(), renderQuestionVerbatimPanel(), renderSingleQuestionAnalyticsCard()

### Community 59 - ".getLabels"
Cohesion: 0.33
Nodes (3): buildTicks(), ia(), init()

### Community 61 - "logGamma"
Cohesion: 0.50
Nodes (5): chiSquarePValue(), chiSquareTest(), gammaLowerSeries(), gammaUpperContinuedFraction(), logGamma()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 222 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zs` connect `zs` to `chart.umd.min.js`, `ja`, `en`, `._computeLabelItems`, `.getContext`, `.getPixelForDecimal`, `.getLabels`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.07079414838035528 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `chart.umd.min.js`, `Fa`, `draw`, `ae`, `cs`, `Ks`, `P`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12299465240641712 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `.parse`, `chart.umd.min.js`, `.getDataset`, `P`, `pa`, `.getParsed`, `.applyStack`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0713064713064713 - nodes in this community are weakly interconnected._