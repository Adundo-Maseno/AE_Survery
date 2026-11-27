# Graph Report - AE_Survery  (2026-11-27)

## Corpus Check
- 25 files · ~194,671 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1513 nodes · 3660 edges · 65 communities (56 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `06baf1bd`
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
- _update
- analytics.js
- .initialize
- updateElements
- Os
- t
- ae
- en
- db.js
- .notifyPlugins
- Ks
- Da
- getFilteredResponses
- ja
- Ji
- pa
- handleGlobalKeydown
- report-export.js
- .getParsed
- P
- bs
- manifest.json
- text-intelligence.js
- Key Highlights & Capabilities
- escapeHtml
- $n
- builder.js
- setRunnerAnswer
- templates.js
- collector.js
- i18n.js
- vn
- adr/README.md
- m
- .getPixelForDecimal
- ._computeLabelItems
- qrcode.js
- .getContext
- renderAnalyzeStage
- cleanQuestionTitle
- Qi
- ae
- mean
- boot
- .parse
- _computeLongitudinalData
- mountCharts
- exportExcelWorkbook
- runQuestionAiSummary
- .getLabels
- .buildOrUpdateControllers
- Ji
- .update
- copyText
- ._handleEvent

## God Nodes (most connected - your core abstractions)
1. `render()` - 124 edges
2. `AESurveyStore` - 100 edges
3. `showToast()` - 76 edges
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

## Communities (65 total, 9 thin omitted)

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
Cohesion: 0.03
Nodes (47): add(), addControllers(), addPlugins(), addScales(), afterInit(), beforeLayout(), Bi(), cn() (+39 more)

### Community 5 - "P"
Cohesion: 0.08
Nodes (15): at(), de(), dt(), _e(), e, Fa, getCenterPoint(), Ha() (+7 more)

### Community 6 - "app.js"
Cohesion: 0.04
Nodes (59): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), clearSurveySelection(), closeVersionHistoryModal(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion() (+51 more)

### Community 7 - "A"
Cohesion: 0.11
Nodes (17): A(), afterDatasetsUpdate(), apply(), be(), constructor(), describe(), Fs, get() (+9 more)

### Community 8 - "showToast"
Cohesion: 0.07
Nodes (59): addQuestionToActivePage(), addSurveyPage(), applySurveyThemePreset(), archiveSurveyConfirm(), autoTranslateSurvey(), bulkArchiveSelectedSurveys(), bulkDeleteSelectedSurveys(), captureFieldGPS() (+51 more)

### Community 9 - "_update"
Cohesion: 0.12
Nodes (15): addElements(), fi(), getMaxOverflow(), gt(), hi(), li(), mi(), nearest() (+7 more)

### Community 10 - "analytics.js"
Cohesion: 0.04
Nodes (13): analyzeVerbatims(), buildFilteredReportUrl(), copyFilteredReportUrl(), deleteCustomTheme(), generateExecutiveBriefing(), getCustomThemes(), getPinnedQuotes(), getTextQuestions() (+5 more)

### Community 11 - ".initialize"
Cohesion: 0.19
Nodes (3): initialize(), Ms(), Ss()

### Community 12 - "updateElements"
Cohesion: 0.19
Nodes (7): _calculateBarValuePixels(), ct(), getLabelAndValue(), _s(), ua(), updateElements(), ys()

### Community 14 - "t"
Cohesion: 0.11
Nodes (20): Ai(), bn(), bt(), buildLookupTable(), ft(), getDecimalForValue(), initOffsets(), inRange() (+12 more)

### Community 15 - "ae"
Cohesion: 0.20
Nodes (12): ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany(), idbReadAll(), isGoogleAppsScriptHost() (+4 more)

### Community 16 - "en"
Cohesion: 0.13
Nodes (7): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 17 - "db.js"
Cohesion: 0.09
Nodes (29): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), _collectSurveyQuestions(), computeRecordHash(), computeSyncFallbackHash() (+21 more)

### Community 19 - "Ks"
Cohesion: 0.16
Nodes (3): Gs(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.13
Nodes (4): Da, mn(), xn(), yn

### Community 21 - "getFilteredResponses"
Cohesion: 0.15
Nodes (14): _answerSurveyOfflineFallback(), askSurveyQuestion(), _buildAskSurveyContext(), _buildBriefingPlainText(), _computeFieldOpsMetrics(), copyVerbatimBriefing(), exportFieldOpsCsv(), generateAndPublishAiBrief() (+6 more)

### Community 22 - "ja"
Cohesion: 0.18
Nodes (4): configure(), determineDataLimits(), g(), ja

### Community 23 - "Ji"
Cohesion: 0.14
Nodes (11): Ae(), as(), cs(), ds(), gs, hs(), ns(), os() (+3 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.16
Nodes (17): cancelKioskPinPrompt(), closeAssignTeamModal(), closePasteOutlineModal(), closeSyncSettingsModal(), closeTemplateLibraryModal(), formatPendingSyncMeta(), handleGlobalKeydown(), nextRunnerPage() (+9 more)

### Community 26 - "report-export.js"
Cohesion: 0.29
Nodes (15): buildExecutiveReportHTML(), buildSlideDeckHTML(), _cleanTitle(), _computeQuestionBreakdown(), _esc(), exportPDF(), exportWordDoc(), _formatDate() (+7 more)

### Community 27 - ".getParsed"
Cohesion: 0.24
Nodes (4): _getRuler(), ma, resolveDataElementOptions(), wt()

### Community 28 - "P"
Cohesion: 0.18
Nodes (8): _calculateBarIndexPixels(), _getStackCount(), _getStackIndex(), _getStacks(), label(), P(), stop(), Vs

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

### Community 34 - "$n"
Cohesion: 0.05
Nodes (24): An(), Ci(), Di(), draw(), Fe(), Fn(), Ge(), He() (+16 more)

### Community 35 - "builder.js"
Cohesion: 0.14
Nodes (11): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderPreFlightPanel(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput() (+3 more)

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

### Community 40 - "vn"
Cohesion: 0.20
Nodes (11): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), kn(), ot(), parse() (+3 more)

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "m"
Cohesion: 0.16
Nodes (13): ca(), da(), Gi(), ii(), c(), m(), f(), parseArrayData() (+5 more)

### Community 43 - ".getPixelForDecimal"
Cohesion: 0.14
Nodes (5): getPixelForTick(), getPixelForValue(), getValueForPixel(), mt(), Va

### Community 44 - "._computeLabelItems"
Cohesion: 0.17
Nodes (4): Es(), L(), Le(), Rs()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.20
Nodes (20): auditDataQuality(), getCategoricalQuestions(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab(), renderAskSurveyDrawer() (+12 more)

### Community 48 - "cleanQuestionTitle"
Cohesion: 0.23
Nodes (13): cleanQuestionTitle(), computeStratifiedQuotas(), _extractMediaItems(), _extractResponseLocationValue(), getCellHeatmapStyle(), getLocationFilterConfig(), getPinnedGalleryItems(), getPrimaryCategoricalFilterConfig() (+5 more)

### Community 50 - "ae"
Cohesion: 0.07
Nodes (18): ae, color(), ee(), Et(), ie(), i(), It(), jt() (+10 more)

### Community 52 - "mean"
Cohesion: 0.14
Nodes (22): betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), fDistributionPValue(), gammaLowerSeries(), gammaUpperContinuedFraction(), invertMatrix() (+14 more)

### Community 53 - "boot"
Cohesion: 0.16
Nodes (17): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), getPendingSyncCount(), getPendingSyncItems(), handleCloudDataUpdated(), init() (+9 more)

### Community 54 - ".parse"
Cohesion: 0.15
Nodes (4): ks(), Ps(), ws(), yt()

### Community 55 - "_computeLongitudinalData"
Cohesion: 0.22
Nodes (9): _computeLongitudinalData(), _extractWaveChoiceValues(), formatQuestionTypeLabel(), _formatWaveNumber(), _formatWavePValue(), _isWaveChoiceQuestion(), _isWaveNumericQuestion(), _normalizeWaveQuestionTitle() (+1 more)

### Community 56 - "mountCharts"
Cohesion: 0.29
Nodes (10): destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap(), mountLisaMap() (+2 more)

### Community 57 - "exportExcelWorkbook"
Cohesion: 0.18
Nodes (17): exportExcelWorkbook(), exportQuestionCsv(), exportVerbatimCsv(), formatAnswerDisplay(), _formatVerbatimDate(), _getPinnedSet(), getQuestionDisplayMap(), _getRecordKey() (+9 more)

### Community 58 - "runQuestionAiSummary"
Cohesion: 0.47
Nodes (6): getCachedQuestionAiSummary(), _getQuestionAiCacheKey(), _loadQuestionAiSummaryCache(), renderOpenEndedQuestionSummary(), runQuestionAiSummary(), _saveQuestionAiSummaryCache()

### Community 59 - ".getLabels"
Cohesion: 0.33
Nodes (3): buildTicks(), ia(), init()

### Community 60 - ".buildOrUpdateControllers"
Cohesion: 0.19
Nodes (3): Bs(), js(), ta()

### Community 61 - "Ji"
Cohesion: 0.15
Nodes (4): Ji, ki(), qi(), Xi()

### Community 62 - ".update"
Cohesion: 0.26
Nodes (3): ea(), k(), Qs()

### Community 63 - "copyText"
Cohesion: 0.40
Nodes (5): copyLiveReportLink(), copyText(), generateSurveyInvites(), getLiveReportUrl(), openLiveReport()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 244 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zs` connect `zs` to `$n`, `chart.umd.min.js`, `.getPixelForDecimal`, `._computeLabelItems`, `.getContext`, `en`, `ja`, `.getLabels`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.05920426422996383 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `._handleEvent`, `chart.umd.min.js`, `P`, `m`, `.buildOrUpdateControllers`, `.notifyPlugins`, `ae`, `Ks`, `Ji`, `P`, `.update`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12299465240641712 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `chart.umd.min.js`, `.initialize`, `updateElements`, `.parse`, `pa`, `.getParsed`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0628245067497404 - nodes in this community are weakly interconnected._