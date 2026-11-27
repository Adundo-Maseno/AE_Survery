# Graph Report - AE_Survery  (2026-11-27)

## Corpus Check
- 25 files · ~200,757 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1539 nodes · 3733 edges · 58 communities (50 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7def60e9`
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
- runQuestionAiSummary
- analytics.js
- .getDataset
- .applyStack
- Os
- ua
- ae
- en
- db.js
- A
- Ks
- Da
- ja
- Ji
- pa
- handleGlobalKeydown
- report-export.js
- .getParsed
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
- adr/README.md
- m
- C
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
- updateElements
- .getLabels
- copyText

## God Nodes (most connected - your core abstractions)
1. `render()` - 139 edges
2. `AESurveyStore` - 100 edges
3. `showToast()` - 85 edges
4. `zs` - 73 edges
5. `i` - 71 edges
6. `Os` - 58 edges
7. `render()` - 46 edges
8. `showToast()` - 31 edges
9. `$n` - 28 edges
10. `renderAnalyzeStage()` - 26 edges

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

## Communities (58 total, 8 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.06
Nodes (4): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData(), resolve()

### Community 2 - "field-app.js"
Cohesion: 0.06
Nodes (106): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), buildResumeUrl(), captureGPS(), clearAudioRecording(), clearBarcode() (+98 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.03
Nodes (45): add(), addControllers(), addPlugins(), addScales(), afterInit(), beforeLayout(), Bi(), buildTicks() (+37 more)

### Community 4 - "i"
Cohesion: 0.06
Nodes (10): Ce(), ea(), i, k(), oa(), ra(), stop(), ta() (+2 more)

### Community 5 - "P"
Cohesion: 0.11
Nodes (12): at(), dt(), e, Fa, g(), getCenterPoint(), Ha(), ht() (+4 more)

### Community 6 - "app.js"
Cohesion: 0.04
Nodes (67): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), clearAiSurveyFile(), clearSurveySelection(), closeAiSurveyModal(), closeVersionHistoryModal(), deleteQuestion() (+59 more)

### Community 7 - "A"
Cohesion: 0.09
Nodes (18): apply(), be(), bt(), constructor(), describe(), Fe(), Fs, Ge() (+10 more)

### Community 8 - "showToast"
Cohesion: 0.06
Nodes (62): addQuestionToActivePage(), addSurveyPage(), applySurveyThemePreset(), archiveSurveyConfirm(), autoTranslateSurvey(), bulkArchiveSelectedSurveys(), bulkDeleteSelectedSurveys(), captureFieldGPS() (+54 more)

### Community 9 - "runQuestionAiSummary"
Cohesion: 0.47
Nodes (6): getCachedQuestionAiSummary(), _getQuestionAiCacheKey(), _loadQuestionAiSummaryCache(), renderOpenEndedQuestionSummary(), runQuestionAiSummary(), _saveQuestionAiSummaryCache()

### Community 10 - "analytics.js"
Cohesion: 0.04
Nodes (21): analyzeVerbatims(), _buildBriefingPlainText(), buildFilteredReportUrl(), _computeFieldOpsMetrics(), computeResponseScore(), copyFilteredReportUrl(), copyVerbatimBriefing(), deleteCustomTheme() (+13 more)

### Community 12 - ".applyStack"
Cohesion: 0.33
Nodes (3): _calculateBarValuePixels(), _s(), ys()

### Community 13 - "Os"
Cohesion: 0.11
Nodes (4): Os, Ss(), vs(), yt()

### Community 14 - "ua"
Cohesion: 0.11
Nodes (18): Ai(), ct(), ft(), getLabelAndValue(), gt(), hi(), inRange(), ka() (+10 more)

### Community 15 - "ae"
Cohesion: 0.20
Nodes (12): ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany(), idbReadAll(), isGoogleAppsScriptHost() (+4 more)

### Community 16 - "en"
Cohesion: 0.14
Nodes (7): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 17 - "db.js"
Cohesion: 0.09
Nodes (29): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), _collectSurveyQuestions(), computeRecordHash(), computeSyncFallbackHash() (+21 more)

### Community 18 - "A"
Cohesion: 0.14
Nodes (19): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+11 more)

### Community 19 - "Ks"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.10
Nodes (10): bn(), buildLookupTable(), Da, getDecimalForValue(), initOffsets(), kn(), mn(), sn() (+2 more)

### Community 22 - "ja"
Cohesion: 0.11
Nodes (5): configure(), determineDataLimits(), getValueForPixel(), ja, Va

### Community 23 - "Ji"
Cohesion: 0.07
Nodes (14): Ae(), as(), cs(), de(), ds(), gs, hs(), Ji (+6 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.12
Nodes (21): cancelKioskPinPrompt(), closeAssignTeamModal(), closePasteOutlineModal(), closeSyncSettingsModal(), closeTemplateLibraryModal(), formatPendingSyncMeta(), getPendingSyncItems(), handleGlobalKeydown() (+13 more)

### Community 26 - "report-export.js"
Cohesion: 0.29
Nodes (15): buildExecutiveReportHTML(), buildSlideDeckHTML(), _cleanTitle(), _computeQuestionBreakdown(), _esc(), exportPDF(), exportWordDoc(), _formatDate() (+7 more)

### Community 27 - ".getParsed"
Cohesion: 0.18
Nodes (8): _calculateBarIndexPixels(), _getRuler(), _getStackCount(), _getStackIndex(), _getStacks(), ma, resolveDataElementOptions(), wt()

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
Cohesion: 0.23
Nodes (14): computePortfolioRollup(), escapeAttr(), escapeHtml(), escapeJs(), exportPortfolioRollupCSV(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal() (+6 more)

### Community 34 - "$n"
Cohesion: 0.05
Nodes (21): An(), Ci(), Di(), draw(), Fn(), He(), I(), Is() (+13 more)

### Community 35 - "builder.js"
Cohesion: 0.13
Nodes (13): getSavedLibraryQuestions(), QUESTION_TYPES_CATALOG, renderBuilder(), renderLibrarySidebar(), renderLiveSimulator(), renderPreFlightPanel(), renderQuestionBankSidebar(), renderQuestionEditorCard() (+5 more)

### Community 36 - "setRunnerAnswer"
Cohesion: 0.50
Nodes (4): recalculateRunnerCalculatedFields(), refreshPipedDom(), setRunnerAnswer(), setRunnerAnswerSilent()

### Community 37 - "templates.js"
Cohesion: 0.52
Nodes (6): buildSurveyFromTemplate(), extractInlineOptions(), inferQuestionTypeAndOptions(), parseOutlineToSurvey(), remapPipingTokens(), uid()

### Community 38 - "collector.js"
Cohesion: 0.16
Nodes (23): buildQRPosterHTML(), buildWhatsAppShareUrl(), copyUnusedInviteLinks(), getSafeBrandLogo(), getSafeRedirectUrl(), getSurveyShareUrl(), initRunnerForSurvey(), isLegacyHardcodedDefault() (+15 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "m"
Cohesion: 0.16
Nodes (13): ca(), da(), Gi(), ii(), c(), m(), f(), parseArrayData() (+5 more)

### Community 43 - "C"
Cohesion: 0.09
Nodes (20): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), getMaxOverflow(), getPixelForTick() (+12 more)

### Community 44 - "._computeLabelItems"
Cohesion: 0.17
Nodes (3): Es(), L(), Rs()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.19
Nodes (21): auditDataQuality(), getCategoricalQuestions(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab(), renderAskSurveyDrawer() (+13 more)

### Community 48 - "cleanQuestionTitle"
Cohesion: 0.15
Nodes (22): _answerSurveyOfflineFallback(), askSurveyQuestion(), _buildAskSurveyContext(), bulkFlagHygieneRecords(), cleanQuestionTitle(), computeDataHygiene(), computeStratifiedQuotas(), _extractMediaItems() (+14 more)

### Community 50 - "ae"
Cohesion: 0.07
Nodes (19): ae, color(), ee(), Et(), ie(), i(), It(), jt() (+11 more)

### Community 52 - "mean"
Cohesion: 0.14
Nodes (22): betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), fDistributionPValue(), gammaLowerSeries(), gammaUpperContinuedFraction(), invertMatrix() (+14 more)

### Community 53 - "boot"
Cohesion: 0.15
Nodes (19): approveSingleResponse(), boot(), checkGeminiModelsHealth(), flagSingleResponse(), generateSurveyFromAiOrDoc(), getCurrentUser(), getPendingSyncCount(), handleCloudDataUpdated() (+11 more)

### Community 54 - ".parse"
Cohesion: 0.16
Nodes (4): ks(), Ms(), Ps(), ws()

### Community 55 - "_computeLongitudinalData"
Cohesion: 0.22
Nodes (9): _computeLongitudinalData(), _extractWaveChoiceValues(), formatQuestionTypeLabel(), _formatWaveNumber(), _formatWavePValue(), _isWaveChoiceQuestion(), _isWaveNumericQuestion(), _normalizeWaveQuestionTitle() (+1 more)

### Community 56 - "mountCharts"
Cohesion: 0.29
Nodes (10): destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap(), mountLisaMap() (+2 more)

### Community 57 - "exportExcelWorkbook"
Cohesion: 0.18
Nodes (17): exportExcelWorkbook(), exportQuestionCsv(), exportVerbatimCsv(), formatAnswerDisplay(), _formatVerbatimDate(), _getPinnedSet(), getQuestionDisplayMap(), _getRecordKey() (+9 more)

### Community 58 - "updateElements"
Cohesion: 0.33
Nodes (4): addElements(), Ui(), _update(), updateElements()

### Community 63 - "copyText"
Cohesion: 0.40
Nodes (5): copyLiveReportLink(), copyText(), generateSurveyInvites(), getLiveReportUrl(), openLiveReport()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 243 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `i` connect `i` to `$n`, `chart.umd.min.js`, `P`, `m`, `A`, `ae`, `Ji`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.05920426422996383 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `$n`, `chart.umd.min.js`, `C`, `._computeLabelItems`, `.getContext`, `en`, `ja`, `.getLabels`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12878787878787878 - nodes in this community are weakly interconnected._
- **Why does `ae` connect `ae` to `chart.umd.min.js`, `P`, `ae`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0628245067497404 - nodes in this community are weakly interconnected._