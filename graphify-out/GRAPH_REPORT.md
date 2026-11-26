# Graph Report - AE_Survery  (2026-11-26)

## Corpus Check
- 25 files · ~172,820 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1429 nodes · 3469 edges · 61 communities (53 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f04d226`
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
- _update
- Os
- m
- ae
- en
- db.js
- updateElements
- Ks
- Da
- A
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
- z
- builder.js
- setRunnerAnswer
- templates.js
- collector.js
- i18n.js
- qa
- adr/README.md
- sn
- draw
- ._computeLabelItems
- qrcode.js
- .getContext
- renderAnalyzeStage
- I
- Qi
- se
- mean
- boot
- .isHorizontal
- _computeLongitudinalData
- mountCharts
- exportExcelWorkbook
- renderSingleQuestionAnalyticsCard
- .getLabels
- logGamma

## God Nodes (most connected - your core abstractions)
1. `render()` - 115 edges
2. `AESurveyStore` - 92 edges
3. `zs` - 73 edges
4. `i` - 71 edges
5. `showToast()` - 70 edges
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

## Communities (61 total, 8 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.06
Nodes (5): AESurveyStore, getById(), getInitialPersonnelSeed(), getInitialSeedData(), resolve()

### Community 2 - "field-app.js"
Cohesion: 0.07
Nodes (99): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading() (+91 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.03
Nodes (41): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), _calculateBarIndexPixels(), cn() (+33 more)

### Community 4 - "i"
Cohesion: 0.06
Nodes (12): Ce(), ea(), fs(), i, k(), ra(), sa(), stop() (+4 more)

### Community 5 - "Fa"
Cohesion: 0.10
Nodes (13): at(), dt(), e, Et(), Fa, getCenterPoint(), It(), lt() (+5 more)

### Community 6 - "app.js"
Cohesion: 0.05
Nodes (53): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), clearSurveySelection(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion(), dismissSyncError() (+45 more)

### Community 7 - "A"
Cohesion: 0.10
Nodes (15): apply(), be(), color(), constructor(), describe(), Fs, get(), i() (+7 more)

### Community 8 - "showToast"
Cohesion: 0.07
Nodes (58): addQuestionToActivePage(), addSurveyPage(), applySurveyThemePreset(), archiveSurveyConfirm(), autoTranslateSurvey(), bulkArchiveSelectedSurveys(), bulkDeleteSelectedSurveys(), captureFieldGPS() (+50 more)

### Community 9 - "$n"
Cohesion: 0.12
Nodes (9): afterInit(), Fn(), hn(), initialize(), jn(), ln(), $n, rn() (+1 more)

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (13): analyzeVerbatims(), _buildBriefingPlainText(), copyVerbatimBriefing(), deleteCustomTheme(), generateExecutiveBriefing(), getCustomThemes(), getPinnedQuotes(), getTextQuestions() (+5 more)

### Community 11 - ".buildOrUpdateElements"
Cohesion: 0.16
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 12 - "_update"
Cohesion: 0.33
Nodes (3): addElements(), Ui(), _update()

### Community 14 - "m"
Cohesion: 0.08
Nodes (28): Ai(), ca(), da(), fi(), ft(), getMaxOverflow(), Gi(), gt() (+20 more)

### Community 15 - "ae"
Cohesion: 0.09
Nodes (14): ae, te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany() (+6 more)

### Community 16 - "en"
Cohesion: 0.14
Nodes (7): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 17 - "db.js"
Cohesion: 0.09
Nodes (28): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), _collectSurveyQuestions(), computeRecordHash(), computeSyncFallbackHash() (+20 more)

### Community 18 - "updateElements"
Cohesion: 0.22
Nodes (5): _calculateBarValuePixels(), f(), _s(), updateElements(), ys()

### Community 19 - "Ks"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.09
Nodes (11): beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), Da, kn(), mn(), vn(), v() (+3 more)

### Community 21 - "A"
Cohesion: 0.14
Nodes (19): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+11 more)

### Community 22 - "ja"
Cohesion: 0.10
Nodes (5): configure(), determineDataLimits(), getValueForPixel(), ja, Va

### Community 23 - "Ji"
Cohesion: 0.09
Nodes (12): Ae(), as(), cs(), ds(), gs, hs(), Ji, ns() (+4 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.12
Nodes (21): cancelKioskPinPrompt(), closeAssignTeamModal(), closePasteOutlineModal(), closeSyncSettingsModal(), closeTemplateLibraryModal(), formatPendingSyncMeta(), getPendingSyncItems(), handleGlobalKeydown() (+13 more)

### Community 26 - "report-export.js"
Cohesion: 0.36
Nodes (10): buildExecutiveReportHTML(), _cleanTitle(), _computeQuestionBreakdown(), _esc(), exportPDF(), exportWordDoc(), _formatDate(), _getQuestions() (+2 more)

### Community 28 - "t"
Cohesion: 0.25
Nodes (8): bt(), Fe(), Ge(), _notify(), Qa(), t(), vi(), ze()

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

### Community 34 - "z"
Cohesion: 0.19
Nodes (5): An(), Di(), He(), On, z()

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

### Community 40 - "qa"
Cohesion: 0.15
Nodes (3): label(), P(), qa

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "sn"
Cohesion: 0.15
Nodes (13): bn(), buildLookupTable(), ct(), getDecimalForValue(), getLabelAndValue(), initOffsets(), ka(), Ma() (+5 more)

### Community 43 - "draw"
Cohesion: 0.11
Nodes (15): Aa(), C(), draw(), g(), getPixelForTick(), getPixelForValue(), Ha(), ht() (+7 more)

### Community 44 - "._computeLabelItems"
Cohesion: 0.18
Nodes (3): Es(), L(), Rs()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.26
Nodes (17): auditDataQuality(), getCategoricalQuestions(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab(), renderAutomatedInsightsBanner() (+9 more)

### Community 48 - "I"
Cohesion: 0.22
Nodes (6): Ci(), generateLabels(), I(), Is(), Nn(), ya()

### Community 50 - "se"
Cohesion: 0.14
Nodes (9): de(), ee(), ie(), jt(), ke(), Le(), numeric(), se() (+1 more)

### Community 52 - "mean"
Cohesion: 0.19
Nodes (17): betaInc(), cohensD(), fDistributionPValue(), invertMatrix(), mean(), moransI(), multivariateOLS(), normalCdfUpper() (+9 more)

### Community 53 - "boot"
Cohesion: 0.19
Nodes (15): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), getPendingSyncCount(), handleCloudDataUpdated(), init(), isUserActivelyEditingOrInModal() (+7 more)

### Community 54 - ".isHorizontal"
Cohesion: 0.36
Nodes (3): Ln, _refresh(), start()

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

### Community 59 - ".getLabels"
Cohesion: 0.33
Nodes (3): buildTicks(), ia(), init()

### Community 61 - "logGamma"
Cohesion: 0.50
Nodes (5): chiSquarePValue(), chiSquareTest(), gammaLowerSeries(), gammaUpperContinuedFraction(), logGamma()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Os` connect `Os` to `chart.umd.min.js`, `.buildOrUpdateElements`, `_update`, `updateElements`, `pa`, `.getParsed`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.06469298245614036 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `z`, `chart.umd.min.js`, `draw`, `._computeLabelItems`, `.getContext`, `en`, `ja`, `.getLabels`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12878787878787878 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `chart.umd.min.js`, `qa`, `draw`, `m`, `se`, `A`, `Ji`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06653465346534654 - nodes in this community are weakly interconnected._