# Graph Report - AE_Survery  (2026-11-27)

## Corpus Check
- 27 files · ~215,927 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1622 nodes · 3926 edges · 69 communities (58 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2c220c2b`
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
- t
- showToast
- z
- analytics.js
- .getDataset
- sw.js
- Os
- t
- askSurveyQuestion
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
- steps
- adr/README.md
- m
- C
- ._computeLabelItems
- qrcode.js
- .isHorizontal
- renderAnalyzeStage
- cleanQuestionTitle
- Qi
- ae
- mean
- boot
- .buildOrUpdateElements
- _computeLongitudinalData
- mountCharts
- renderSingleQuestionAnalyticsCard
- updateElements
- .getLabels
- run-tests.js
- .isHorizontal
- e
- copyText
- P
- Ji
- .getMinMax
- I
- runQuestionAiSummary

## God Nodes (most connected - your core abstractions)
1. `render()` - 146 edges
2. `AESurveyStore` - 108 edges
3. `showToast()` - 90 edges
4. `zs` - 73 edges
5. `i` - 71 edges
6. `Os` - 58 edges
7. `render()` - 47 edges
8. `showToast()` - 32 edges
9. `$n` - 28 edges
10. `renderAnalyzeStage()` - 27 edges

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

## Communities (69 total, 11 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.06
Nodes (4): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData(), resolve()

### Community 1 - "zs"
Cohesion: 0.12
Nodes (3): d(), Si(), zs

### Community 2 - "field-app.js"
Cohesion: 0.06
Nodes (111): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), buildResumeUrl(), cancelAutoRedirect(), captureGPS(), clearAudioRecording() (+103 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.03
Nodes (40): add(), addControllers(), addPlugins(), addScales(), be(), beforeLayout(), Bi(), cn() (+32 more)

### Community 4 - "i"
Cohesion: 0.06
Nodes (11): Ce(), ea(), fs(), i, k(), ra(), sa(), stop() (+3 more)

### Community 5 - "P"
Cohesion: 0.11
Nodes (11): at(), de(), dt(), Fa, g(), Ha(), ht(), lt() (+3 more)

### Community 6 - "app.js"
Cohesion: 0.04
Nodes (69): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), clearAiSurveyFile(), clearSurveySelection(), closeAiSurveyModal(), closeImportCsvModal(), closeVersionHistoryModal() (+61 more)

### Community 7 - "t"
Cohesion: 0.12
Nodes (12): apply(), bt(), constructor(), describe(), Fe(), Fs, Ge(), _notify() (+4 more)

### Community 8 - "showToast"
Cohesion: 0.06
Nodes (69): addQuestionToActivePage(), addSurveyPage(), applySurveyThemePreset(), archiveSurveyConfirm(), autoTranslateSurvey(), bulkArchiveSelectedSurveys(), bulkDeleteSelectedSurveys(), captureFieldGPS() (+61 more)

### Community 10 - "analytics.js"
Cohesion: 0.03
Nodes (28): analyzeVerbatims(), buildFilteredReportUrl(), clearQuestionSearchTimers(), _computeFieldOpsMetrics(), computeResponseScore(), computeStratifiedQuotas(), copyFilteredReportUrl(), deleteCustomTheme() (+20 more)

### Community 12 - "sw.js"
Cohesion: 0.20
Nodes (12): ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany(), idbReadAll(), isGoogleAppsScriptHost() (+4 more)

### Community 14 - "t"
Cohesion: 0.15
Nodes (13): bn(), buildLookupTable(), ct(), getDecimalForValue(), getLabelAndValue(), initOffsets(), ka(), Ma() (+5 more)

### Community 15 - "askSurveyQuestion"
Cohesion: 0.40
Nodes (5): _answerSurveyOfflineFallback(), askSurveyQuestion(), getAskSurveyHistory(), pinAskAnswerToBrief(), renderAskSurveyDrawer()

### Community 16 - "en"
Cohesion: 0.14
Nodes (7): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 17 - "db.js"
Cohesion: 0.09
Nodes (31): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), _collectSurveyQuestions(), computeRecordHash(), computeSyncFallbackHash() (+23 more)

### Community 18 - "A"
Cohesion: 0.16
Nodes (16): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+8 more)

### Community 19 - "Ks"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.09
Nodes (11): beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), Da, kn(), mn(), vn(), v() (+3 more)

### Community 22 - "ja"
Cohesion: 0.10
Nodes (5): configure(), determineDataLimits(), getValueForPixel(), ja, Va

### Community 23 - "Ji"
Cohesion: 0.14
Nodes (11): Ae(), as(), cs(), ds(), gs, hs(), ns(), os() (+3 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.12
Nodes (21): cancelKioskPinPrompt(), closeAssignTeamModal(), closePasteOutlineModal(), closeSyncSettingsModal(), closeTemplateLibraryModal(), formatPendingSyncMeta(), getPendingSyncItems(), handleGlobalKeydown() (+13 more)

### Community 26 - "report-export.js"
Cohesion: 0.23
Nodes (19): buildBlankQuestionnaireHTML(), buildExecutiveReportHTML(), buildSlideDeckHTML(), _cleanTitle(), _computeQuestionBreakdown(), _esc(), exportBlankFormPDF(), exportPDF() (+11 more)

### Community 28 - "I"
Cohesion: 0.24
Nodes (6): An(), Ci(), Di(), Nn(), wi(), z()

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
Cohesion: 0.13
Nodes (9): afterInit(), Fn(), hn(), jn(), ln(), $n, rn(), W() (+1 more)

### Community 35 - "builder.js"
Cohesion: 0.13
Nodes (14): getSavedLibraryQuestions(), QUESTION_TYPES_CATALOG, renderBuilder(), renderLibrarySidebar(), renderLiveSimulator(), renderLogicFlowMap(), renderPreFlightPanel(), renderQuestionBankSidebar() (+6 more)

### Community 36 - "setRunnerAnswer"
Cohesion: 0.50
Nodes (4): recalculateRunnerCalculatedFields(), refreshPipedDom(), setRunnerAnswer(), setRunnerAnswerSilent()

### Community 37 - "templates.js"
Cohesion: 0.52
Nodes (6): buildSurveyFromTemplate(), extractInlineOptions(), inferQuestionTypeAndOptions(), parseOutlineToSurvey(), remapPipingTokens(), uid()

### Community 38 - "collector.js"
Cohesion: 0.14
Nodes (26): buildEmbedIframeSnippet(), buildQRPosterHTML(), buildWhatsAppShareUrl(), compressFieldPhotoDataUrl(), copyUnusedInviteLinks(), getSafeBrandLogo(), getSafeRedirectUrl(), getSurveyShareUrl() (+18 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 40 - "steps"
Cohesion: 0.12
Nodes (15): jobs, test, name, on, pull_request, push, branches, branches (+7 more)

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "m"
Cohesion: 0.10
Nodes (22): Ai(), ca(), da(), ft(), getMaxOverflow(), Gi(), gt(), hi() (+14 more)

### Community 43 - "C"
Cohesion: 0.12
Nodes (14): Aa(), C(), draw(), fi(), getPixelForTick(), getPixelForValue(), mi(), mt() (+6 more)

### Community 44 - "._computeLabelItems"
Cohesion: 0.18
Nodes (3): Es(), L(), Rs()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.18
Nodes (22): auditDataQuality(), bulkFlagHygieneRecords(), computeDataHygiene(), getCategoricalQuestions(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage() (+14 more)

### Community 48 - "cleanQuestionTitle"
Cohesion: 0.22
Nodes (20): cleanQuestionTitle(), exportExcelWorkbook(), exportQuestionCsv(), exportVerbatimCsv(), _extractMediaItems(), _extractResponseLocationValue(), formatAnswerDisplay(), _formatVerbatimDate() (+12 more)

### Community 50 - "ae"
Cohesion: 0.07
Nodes (18): ae, color(), ee(), Et(), ie(), It(), jt(), ke() (+10 more)

### Community 52 - "mean"
Cohesion: 0.14
Nodes (22): betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), fDistributionPValue(), gammaLowerSeries(), gammaUpperContinuedFraction(), invertMatrix() (+14 more)

### Community 53 - "boot"
Cohesion: 0.12
Nodes (21): applyResponseAnswerEdit(), approveSingleResponse(), boot(), checkGeminiModelsHealth(), editResponseAnswerPrompt(), flagSingleResponse(), generateSurveyFromAiOrDoc(), getCurrentUser() (+13 more)

### Community 54 - ".buildOrUpdateElements"
Cohesion: 0.16
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 55 - "_computeLongitudinalData"
Cohesion: 0.22
Nodes (9): _computeLongitudinalData(), _extractWaveChoiceValues(), formatQuestionTypeLabel(), _formatWaveNumber(), _formatWavePValue(), _isWaveChoiceQuestion(), _isWaveNumericQuestion(), _normalizeWaveQuestionTitle() (+1 more)

### Community 56 - "mountCharts"
Cohesion: 0.29
Nodes (10): destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap(), mountLisaMap() (+2 more)

### Community 57 - "renderSingleQuestionAnalyticsCard"
Cohesion: 0.13
Nodes (19): _buildAskSurveyContext(), _buildBriefingPlainText(), _buildNlpCacheKey(), _cachedAnalyzeVerbatims(), _cachedSynthesizeQuestionInsights(), computeQuestionSkipFunnel(), copyVerbatimBriefing(), generateAndPublishAiBrief() (+11 more)

### Community 58 - "updateElements"
Cohesion: 0.22
Nodes (8): _calculateBarIndexPixels(), _calculateBarValuePixels(), _getRuler(), _getStackCount(), _getStackIndex(), _getStacks(), updateElements(), wt()

### Community 59 - ".getLabels"
Cohesion: 0.33
Nodes (3): buildTicks(), ia(), init()

### Community 60 - "run-tests.js"
Cohesion: 0.11
Nodes (6): assert, { execFileSync }, fs, path, ROOT, vm

### Community 61 - ".isHorizontal"
Cohesion: 0.36
Nodes (3): Ln, _refresh(), start()

### Community 62 - "e"
Cohesion: 0.25
Nodes (6): e, getCenterPoint(), inRange(), pt(), tooltipPosition(), ut()

### Community 63 - "copyText"
Cohesion: 0.40
Nodes (5): copyLiveReportLink(), copyText(), generateSurveyInvites(), getLiveReportUrl(), openLiveReport()

### Community 65 - "Ji"
Cohesion: 0.12
Nodes (7): addElements(), Ji, ki(), qi(), Ui(), _update(), Xi()

### Community 66 - ".getMinMax"
Cohesion: 0.33
Nodes (3): f(), _s(), ys()

### Community 67 - "I"
Cohesion: 0.40
Nodes (4): generateLabels(), I(), Is(), ya()

### Community 69 - "runQuestionAiSummary"
Cohesion: 0.60
Nodes (5): getCachedQuestionAiSummary(), _getQuestionAiCacheKey(), _loadQuestionAiSummaryCache(), runQuestionAiSummary(), _saveQuestionAiSummaryCache()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 269 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zs` connect `zs` to `P`, `chart.umd.min.js`, `C`, `._computeLabelItems`, `.isHorizontal`, `en`, `ja`, `.getLabels`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.057166257166257166 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `.getMinMax`, `chart.umd.min.js`, `.getDataset`, `.buildOrUpdateElements`, `pa`, `updateElements`, `.getParsed`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12299465240641712 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `P`, `chart.umd.min.js`, `P`, `m`, `A`, `ae`, `Ji`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.061946902654867256 - nodes in this community are weakly interconnected._