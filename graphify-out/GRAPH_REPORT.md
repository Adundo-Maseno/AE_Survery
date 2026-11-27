# Graph Report - AE_Survery  (2026-11-27)

## Corpus Check
- 27 files · ~209,371 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1603 nodes · 3840 edges · 71 communities (58 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7e9809d6`
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
- .notifyPlugins
- Os
- t
- getFilteredResponses
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
- .update
- mountCharts
- renderSingleQuestionAnalyticsCard
- updateElements
- .getLabels
- run-tests.js
- .isHorizontal
- e
- copyText
- de
- Ji
- Vs
- ._handleEvent
- .constructor
- runQuestionAiSummary

## God Nodes (most connected - your core abstractions)
1. `render()` - 146 edges
2. `AESurveyStore` - 104 edges
3. `showToast()` - 90 edges
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

## Communities (71 total, 13 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.06
Nodes (6): AESurveyStore, getById(), getInitialPersonnelSeed(), getInitialSeedData(), resolve(), sanitizeDeepObject()

### Community 1 - "zs"
Cohesion: 0.14
Nodes (3): d(), Si(), zs

### Community 2 - "field-app.js"
Cohesion: 0.06
Nodes (106): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), buildResumeUrl(), captureGPS(), clearAudioRecording(), clearBarcode() (+98 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (32): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset() (+24 more)

### Community 5 - "P"
Cohesion: 0.10
Nodes (16): at(), _calculateBarIndexPixels(), dt(), Fa, _getRuler(), _getStackCount(), _getStackIndex(), _getStacks() (+8 more)

### Community 6 - "app.js"
Cohesion: 0.04
Nodes (65): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), clearAiSurveyFile(), clearSurveySelection(), closeAiSurveyModal(), closeVersionHistoryModal(), deleteQuestion() (+57 more)

### Community 7 - "A"
Cohesion: 0.10
Nodes (15): apply(), be(), color(), constructor(), describe(), Fs, get(), i() (+7 more)

### Community 8 - "showToast"
Cohesion: 0.05
Nodes (73): addQuestionToActivePage(), addSurveyPage(), applySurveyThemePreset(), archiveSurveyConfirm(), autoTranslateSurvey(), bulkArchiveSelectedSurveys(), bulkDeleteSelectedSurveys(), captureFieldGPS() (+65 more)

### Community 9 - "z"
Cohesion: 0.24
Nodes (3): An(), He(), On

### Community 10 - "analytics.js"
Cohesion: 0.04
Nodes (21): analyzeVerbatims(), buildFilteredReportUrl(), _computeFieldOpsMetrics(), computeResponseScore(), copyFilteredReportUrl(), deleteCustomTheme(), exportFieldOpsCsv(), generateExecutiveBriefing() (+13 more)

### Community 14 - "t"
Cohesion: 0.09
Nodes (24): Ai(), bn(), bt(), buildLookupTable(), ct(), ft(), getDecimalForValue(), getLabelAndValue() (+16 more)

### Community 15 - "getFilteredResponses"
Cohesion: 0.15
Nodes (15): _answerSurveyOfflineFallback(), askSurveyQuestion(), _buildAskSurveyContext(), _buildBriefingPlainText(), bulkFlagHygieneRecords(), computeDataHygiene(), copyVerbatimBriefing(), generateAndPublishAiBrief() (+7 more)

### Community 16 - "en"
Cohesion: 0.14
Nodes (7): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 17 - "db.js"
Cohesion: 0.10
Nodes (27): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), _collectSurveyQuestions(), computeRecordHash(), computeSyncFallbackHash() (+19 more)

### Community 18 - "A"
Cohesion: 0.18
Nodes (16): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+8 more)

### Community 19 - "Ks"
Cohesion: 0.13
Nodes (4): Bs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.09
Nodes (11): Da, getMaxOverflow(), gt(), hi(), li(), mn(), nearest(), oi() (+3 more)

### Community 21 - "qa"
Cohesion: 0.15
Nodes (4): generateLabels(), I(), qa, ya()

### Community 22 - "ja"
Cohesion: 0.08
Nodes (9): configure(), determineDataLimits(), g(), getPixelForTick(), getPixelForValue(), getValueForPixel(), ja, mt() (+1 more)

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
Cohesion: 0.38
Nodes (4): Ci(), Di(), Nn(), z()

### Community 29 - "bs"
Cohesion: 0.15
Nodes (8): addElements(), bs, ki(), qi(), Ui(), _update(), Xi(), xs

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
Nodes (8): afterInit(), Fn(), hn(), initialize(), jn(), $n, rn(), x()

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
Cohesion: 0.15
Nodes (24): buildEmbedIframeSnippet(), buildQRPosterHTML(), buildWhatsAppShareUrl(), copyUnusedInviteLinks(), getSafeBrandLogo(), getSafeRedirectUrl(), getSurveyShareUrl(), initRunnerForSurvey() (+16 more)

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
Cohesion: 0.12
Nodes (20): ca(), da(), draw(), Fe(), Ge(), Gi(), ii(), c() (+12 more)

### Community 43 - "C"
Cohesion: 0.13
Nodes (16): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), kn(), mi() (+8 more)

### Community 44 - "._computeLabelItems"
Cohesion: 0.16
Nodes (3): Es(), L(), Le()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.17
Nodes (22): auditDataQuality(), computeStratifiedQuotas(), getCategoricalQuestions(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab() (+14 more)

### Community 48 - "cleanQuestionTitle"
Cohesion: 0.16
Nodes (24): cleanQuestionTitle(), _computeLongitudinalData(), exportExcelWorkbook(), exportQuestionCsv(), exportVerbatimCsv(), _extractMediaItems(), _extractResponseLocationValue(), _extractWaveChoiceValues() (+16 more)

### Community 50 - "ae"
Cohesion: 0.08
Nodes (16): ae, ee(), ie(), te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany() (+8 more)

### Community 52 - "mean"
Cohesion: 0.14
Nodes (22): betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), fDistributionPValue(), gammaLowerSeries(), gammaUpperContinuedFraction(), invertMatrix() (+14 more)

### Community 53 - "boot"
Cohesion: 0.13
Nodes (21): applyResponseAnswerEdit(), approveSingleResponse(), boot(), checkGeminiModelsHealth(), editResponseAnswerPrompt(), flagSingleResponse(), generateSurveyFromAiOrDoc(), getCurrentUser() (+13 more)

### Community 54 - ".buildOrUpdateElements"
Cohesion: 0.16
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 55 - ".update"
Cohesion: 0.20
Nodes (3): k(), Qs(), ra()

### Community 56 - "mountCharts"
Cohesion: 0.29
Nodes (10): destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap(), mountLisaMap() (+2 more)

### Community 57 - "renderSingleQuestionAnalyticsCard"
Cohesion: 0.15
Nodes (14): computeQuestionSkipFunnel(), formatQuestionTypeLabel(), _formatWaveNumber(), _formatWavePValue(), renderLongitudinalTab(), renderOpenEndedQuestionSummary(), renderPaginatedVerbatimList(), renderQuestionChartCanvas() (+6 more)

### Community 58 - "updateElements"
Cohesion: 0.22
Nodes (4): _calculateBarValuePixels(), _s(), updateElements(), ys()

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
Cohesion: 0.15
Nodes (8): e, Et(), getCenterPoint(), It(), rt(), tooltipPosition(), Tt(), za()

### Community 63 - "copyText"
Cohesion: 0.40
Nodes (5): copyLiveReportLink(), copyText(), generateSurveyInvites(), getLiveReportUrl(), openLiveReport()

### Community 64 - "de"
Cohesion: 0.20
Nodes (6): de(), jt(), ke(), numeric(), se(), Xt()

### Community 68 - ".constructor"
Cohesion: 0.40
Nodes (4): ea(), fs(), sa(), xe()

### Community 69 - "runQuestionAiSummary"
Cohesion: 0.60
Nodes (5): getCachedQuestionAiSummary(), _getQuestionAiCacheKey(), _loadQuestionAiSummaryCache(), runQuestionAiSummary(), _saveQuestionAiSummaryCache()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 272 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `i` connect `i` to `de`, `chart.umd.min.js`, `.constructor`, `P`, `._handleEvent`, `m`, `.notifyPlugins`, `A`, `Ks`, `Ji`, `.update`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.05572545022086307 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `chart.umd.min.js`, `._calculatePadding`, `m`, `._computeLabelItems`, `.isHorizontal`, `en`, `ja`, `.getLabels`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.13763440860215054 - nodes in this community are weakly interconnected._
- **Why does `ae` connect `ae` to `de`, `chart.umd.min.js`, `e`, `A`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0628245067497404 - nodes in this community are weakly interconnected._