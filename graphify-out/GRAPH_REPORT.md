# Graph Report - AE_Survery  (2026-11-27)

## Corpus Check
- 25 files · ~203,687 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1553 nodes · 3766 edges · 62 communities (52 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b122265f`
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
- z
- analytics.js
- .applyStack
- Os
- ua
- ae
- en
- db.js
- A
- Ks
- Da
- qa
- ja
- Ji
- pa
- handleGlobalKeydown
- report-export.js
- .getParsed
- I
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
- t
- adr/README.md
- m
- C
- ._computeLabelItems
- qrcode.js
- renderAnalyzeStage
- cleanQuestionTitle
- Qi
- de
- mean
- boot
- .buildOrUpdateElements
- _computeLongitudinalData
- mountCharts
- renderSingleQuestionAnalyticsCard
- updateElements
- .getLabels
- Ji
- .isHorizontal

## God Nodes (most connected - your core abstractions)
1. `render()` - 144 edges
2. `AESurveyStore` - 100 edges
3. `showToast()` - 88 edges
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

## Communities (62 total, 10 thin omitted)

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

### Community 4 - "i"
Cohesion: 0.06
Nodes (14): Ce(), ea(), fs(), i, k(), oa(), Qs(), ra() (+6 more)

### Community 5 - "P"
Cohesion: 0.10
Nodes (17): at(), _calculateBarIndexPixels(), dt(), Fa, g(), _getRuler(), _getStackCount(), _getStackIndex() (+9 more)

### Community 6 - "app.js"
Cohesion: 0.04
Nodes (66): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), clearAiSurveyFile(), clearSurveySelection(), closeAiSurveyModal(), closeVersionHistoryModal(), deleteQuestion() (+58 more)

### Community 7 - "A"
Cohesion: 0.10
Nodes (15): apply(), be(), color(), constructor(), describe(), Fs, get(), i() (+7 more)

### Community 8 - "showToast"
Cohesion: 0.05
Nodes (75): addQuestionToActivePage(), addSurveyPage(), applySurveyThemePreset(), archiveSurveyConfirm(), autoTranslateSurvey(), bulkArchiveSelectedSurveys(), bulkDeleteSelectedSurveys(), captureFieldGPS() (+67 more)

### Community 9 - "z"
Cohesion: 0.23
Nodes (4): An(), He(), On, z()

### Community 10 - "analytics.js"
Cohesion: 0.04
Nodes (23): analyzeVerbatims(), _buildBriefingPlainText(), buildFilteredReportUrl(), _computeFieldOpsMetrics(), computeResponseScore(), computeStratifiedQuotas(), copyFilteredReportUrl(), copyVerbatimBriefing() (+15 more)

### Community 12 - ".applyStack"
Cohesion: 0.33
Nodes (3): _calculateBarValuePixels(), _s(), ys()

### Community 14 - "ua"
Cohesion: 0.12
Nodes (17): Ai(), ct(), e, ft(), getCenterPoint(), getLabelAndValue(), inRange(), ka() (+9 more)

### Community 15 - "ae"
Cohesion: 0.09
Nodes (14): ae, te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany() (+6 more)

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
Cohesion: 0.09
Nodes (11): Da, getMaxOverflow(), gt(), hi(), li(), mn(), nearest(), oi() (+3 more)

### Community 22 - "ja"
Cohesion: 0.11
Nodes (5): configure(), getPixelForTick(), getPixelForValue(), ja, Va

### Community 23 - "Ji"
Cohesion: 0.14
Nodes (11): Ae(), as(), cs(), ds(), gs, hs(), ns(), os() (+3 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.12
Nodes (21): cancelKioskPinPrompt(), closeAssignTeamModal(), closePasteOutlineModal(), closeSyncSettingsModal(), closeTemplateLibraryModal(), formatPendingSyncMeta(), getPendingSyncItems(), handleGlobalKeydown() (+13 more)

### Community 26 - "report-export.js"
Cohesion: 0.25
Nodes (17): buildBlankQuestionnaireHTML(), buildExecutiveReportHTML(), buildSlideDeckHTML(), _cleanTitle(), _computeQuestionBreakdown(), _esc(), exportBlankFormPDF(), exportPDF() (+9 more)

### Community 28 - "I"
Cohesion: 0.24
Nodes (6): Ci(), Di(), generateLabels(), I(), Nn(), ya()

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
Cohesion: 0.20
Nodes (16): computeChannelAttribution(), computePortfolioRollup(), escapeAttr(), escapeHtml(), escapeJs(), exportPortfolioRollupCSV(), getOverviewSurveyMetric(), renderDashboard() (+8 more)

### Community 34 - "$n"
Cohesion: 0.14
Nodes (6): afterInit(), Fn(), initialize(), jn(), $n, x()

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

### Community 40 - "t"
Cohesion: 0.18
Nodes (11): bn(), bt(), buildLookupTable(), getDecimalForValue(), getValueForPixel(), initOffsets(), _notify(), Qa() (+3 more)

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "m"
Cohesion: 0.13
Nodes (19): Aa(), ca(), da(), draw(), Fe(), Ge(), Gi(), ii() (+11 more)

### Community 43 - "C"
Cohesion: 0.13
Nodes (16): beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), kn(), mi(), mt() (+8 more)

### Community 44 - "._computeLabelItems"
Cohesion: 0.14
Nodes (6): Es(), Is(), L(), Le(), Rs(), e()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.19
Nodes (21): auditDataQuality(), getCategoricalQuestions(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab(), renderAskSurveyDrawer() (+13 more)

### Community 48 - "cleanQuestionTitle"
Cohesion: 0.13
Nodes (30): _answerSurveyOfflineFallback(), askSurveyQuestion(), _buildAskSurveyContext(), bulkFlagHygieneRecords(), cleanQuestionTitle(), computeDataHygiene(), exportExcelWorkbook(), exportQuestionCsv() (+22 more)

### Community 50 - "de"
Cohesion: 0.10
Nodes (13): de(), ee(), Et(), ie(), It(), jt(), ke(), numeric() (+5 more)

### Community 52 - "mean"
Cohesion: 0.14
Nodes (22): betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), fDistributionPValue(), gammaLowerSeries(), gammaUpperContinuedFraction(), invertMatrix() (+14 more)

### Community 53 - "boot"
Cohesion: 0.15
Nodes (19): approveSingleResponse(), boot(), checkGeminiModelsHealth(), flagSingleResponse(), generateSurveyFromAiOrDoc(), getCurrentUser(), getPendingSyncCount(), handleCloudDataUpdated() (+11 more)

### Community 54 - ".buildOrUpdateElements"
Cohesion: 0.14
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 55 - "_computeLongitudinalData"
Cohesion: 0.22
Nodes (9): _computeLongitudinalData(), _extractWaveChoiceValues(), formatQuestionTypeLabel(), _formatWaveNumber(), _formatWavePValue(), _isWaveChoiceQuestion(), _isWaveNumericQuestion(), _normalizeWaveQuestionTitle() (+1 more)

### Community 56 - "mountCharts"
Cohesion: 0.29
Nodes (10): destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap(), mountLisaMap() (+2 more)

### Community 57 - "renderSingleQuestionAnalyticsCard"
Cohesion: 0.16
Nodes (15): computeQuestionSkipFunnel(), getCachedQuestionAiSummary(), _getQuestionAiCacheKey(), _loadQuestionAiSummaryCache(), renderOpenEndedQuestionSummary(), renderPaginatedVerbatimList(), renderQuestionChartCanvas(), renderQuestionSkipFunnelCard() (+7 more)

### Community 58 - "updateElements"
Cohesion: 0.33
Nodes (4): addElements(), Ui(), _update(), updateElements()

### Community 59 - ".getLabels"
Cohesion: 0.18
Nodes (4): buildTicks(), determineDataLimits(), ia(), init()

### Community 61 - ".isHorizontal"
Cohesion: 0.36
Nodes (3): Ln, _refresh(), start()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 244 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `i` connect `i` to `chart.umd.min.js`, `P`, `m`, `.getDataset`, `A`, `de`, `Ji`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.05920426422996383 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `chart.umd.min.js`, `._computeLabelItems`, `.getContext`, `en`, `ja`, `.getLabels`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12299465240641712 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `chart.umd.min.js`, `.getDataset`, `.applyStack`, `.buildOrUpdateElements`, `pa`, `updateElements`, `.getParsed`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0628245067497404 - nodes in this community are weakly interconnected._