# Graph Report - AE_Survery  (2026-11-26)

## Corpus Check
- 23 files · ~142,163 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1302 nodes · 3129 edges · 63 communities (53 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef22f41a`
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
- se
- bs
- db.js
- ae
- Ks
- Da
- A
- downloadBlob
- gs
- pa
- handleGlobalKeydown
- updateElements
- .getParsed
- P
- On
- manifest.json
- text-intelligence.js
- Key Highlights & Capabilities
- escapeHtml
- .parse
- builder.js
- .update
- qa
- collector.js
- i18n.js
- ja
- adr/README.md
- t
- draw
- .isHorizontal
- qrcode.js
- ._computeLabelItems
- renderAnalyzeStage
- closePersonnelModals
- Qi
- closeAssignTaskModal
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
- I

## God Nodes (most connected - your core abstractions)
1. `render()` - 99 edges
2. `AESurveyStore` - 86 edges
3. `zs` - 73 edges
4. `i` - 71 edges
5. `Os` - 58 edges
6. `showToast()` - 57 edges
7. `render()` - 43 edges
8. `$n` - 28 edges
9. `showToast()` - 28 edges
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

## Communities (63 total, 10 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.07
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 2 - "field-app.js"
Cohesion: 0.07
Nodes (89): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading() (+81 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (35): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset() (+27 more)

### Community 4 - "i"
Cohesion: 0.07
Nodes (10): Ce(), ea(), fs(), i, k(), ra(), sa(), ta() (+2 more)

### Community 5 - "Fa"
Cohesion: 0.09
Nodes (14): at(), dt(), e, Et(), Fa, getCenterPoint(), ht(), It() (+6 more)

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (50): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion(), dismissSyncError(), duplicateQuestion() (+42 more)

### Community 7 - "A"
Cohesion: 0.13
Nodes (10): apply(), be(), constructor(), describe(), Fs, get(), me(), override() (+2 more)

### Community 8 - "showToast"
Cohesion: 0.06
Nodes (32): addQuestionToActivePage(), addSurveyPage(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), copyText(), createBlankSurvey() (+24 more)

### Community 9 - "$n"
Cohesion: 0.15
Nodes (6): afterInit(), draw(), $n, Nn(), size(), wi()

### Community 10 - "analytics.js"
Cohesion: 0.06
Nodes (10): analyzeVerbatims(), _buildBriefingPlainText(), copyVerbatimBriefing(), generateExecutiveBriefing(), getPinnedQuotes(), getTextQuestions(), iqr(), percentile() (+2 more)

### Community 11 - "en"
Cohesion: 0.14
Nodes (7): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 12 - ".getDataset"
Cohesion: 0.19
Nodes (3): initialize(), Ms(), Ss()

### Community 14 - "C"
Cohesion: 0.13
Nodes (16): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), kn(), mi() (+8 more)

### Community 15 - "se"
Cohesion: 0.22
Nodes (7): ee(), ie(), jt(), ke(), Le(), se(), Xt()

### Community 17 - "db.js"
Cohesion: 0.11
Nodes (22): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), computeSyncFallbackHash(), constantTimeCompare() (+14 more)

### Community 18 - "ae"
Cohesion: 0.09
Nodes (14): ae, te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany() (+6 more)

### Community 19 - "Ks"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.13
Nodes (4): Da, mn(), xn(), yn

### Community 21 - "A"
Cohesion: 0.14
Nodes (19): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+11 more)

### Community 22 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 23 - "gs"
Cohesion: 0.07
Nodes (14): Ae(), as(), cs(), de(), ds(), gs, hs(), Ji (+6 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.17
Nodes (15): cancelKioskPinPrompt(), closeAssignTeamModal(), closeSyncSettingsModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal(), openSyncSettingsModal(), renderModals() (+7 more)

### Community 26 - "updateElements"
Cohesion: 0.18
Nodes (10): addElements(), _calculateBarValuePixels(), ct(), getLabelAndValue(), _getRuler(), ua(), Ui(), _update() (+2 more)

### Community 27 - ".getParsed"
Cohesion: 0.26
Nodes (5): da(), ma, parseArrayData(), parsePrimitiveData(), resolveDataElementOptions()

### Community 28 - "P"
Cohesion: 0.18
Nodes (8): _calculateBarIndexPixels(), _getStackCount(), _getStackIndex(), _getStacks(), label(), P(), stop(), Vs

### Community 29 - "On"
Cohesion: 0.20
Nodes (6): An(), Ci(), Di(), He(), On, z()

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

### Community 31 - "text-intelligence.js"
Cohesion: 0.20
Nodes (22): analyzeVerbatims(), _assignThemes(), _cleanQuestionTitle(), _extractQuestionCode(), _extractTextValue(), _formatSegmentValue(), generateExecutiveBriefing(), _getGasConfig() (+14 more)

### Community 32 - "Key Highlights & Capabilities"
Cohesion: 0.18
Nodes (10): 1. Operations Management Portal (`index.html`), 2. Standalone Mobile Field PWA (`field.html`), 3. Cryptographic Integrity & Agronomic Anomaly Detection, 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`), A. Deploying Google Apps Script (`Code.gs`), AE Survey — Enterprise Offline-First Field & Cloud Survey Platform, B. Personnel Access Roster & RBAC Roles, File Directory Reference (+2 more)

### Community 33 - "escapeHtml"
Cohesion: 0.29
Nodes (10): escapeAttr(), escapeHtml(), escapeJs(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderHeaderBar(), renderLoginPortal() (+2 more)

### Community 34 - ".parse"
Cohesion: 0.15
Nodes (4): ks(), Ps(), ws(), yt()

### Community 35 - "builder.js"
Cohesion: 0.27
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - ".update"
Cohesion: 0.23
Nodes (6): Fn(), hn(), jn(), ln(), rn(), x()

### Community 38 - "collector.js"
Cohesion: 0.33
Nodes (9): initRunnerForSurvey(), isLegacyHardcodedDefault(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner() (+1 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 40 - "ja"
Cohesion: 0.13
Nodes (6): configure(), determineDataLimits(), g(), Ha(), ja, Na()

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "t"
Cohesion: 0.12
Nodes (18): bn(), bt(), buildLookupTable(), getDecimalForValue(), initOffsets(), inRange(), ka(), Ma() (+10 more)

### Community 43 - "draw"
Cohesion: 0.08
Nodes (27): Ai(), ca(), color(), Fe(), ft(), Ge(), getMaxOverflow(), Gi() (+19 more)

### Community 44 - ".isHorizontal"
Cohesion: 0.36
Nodes (3): Ln, _refresh(), start()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 46 - "._computeLabelItems"
Cohesion: 0.17
Nodes (3): Es(), L(), Rs()

### Community 47 - "renderAnalyzeStage"
Cohesion: 0.23
Nodes (19): cleanQuestionTitle(), getCategoricalQuestions(), getCellHeatmapStyle(), getContinuousValue(), getNumericQuestions(), renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab() (+11 more)

### Community 48 - "closePersonnelModals"
Cohesion: 0.67
Nodes (3): closePersonnelModals(), savePersonnel(), saveResetPin()

### Community 52 - "mean"
Cohesion: 0.19
Nodes (17): betaInc(), cohensD(), fDistributionPValue(), invertMatrix(), mean(), moransI(), multivariateOLS(), normalCdfUpper() (+9 more)

### Community 53 - "boot"
Cohesion: 0.22
Nodes (11): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), handleCloudDataUpdated(), isUserActivelyEditingOrInModal(), mirrorSyncSettingsToIdb(), promptInstall() (+3 more)

### Community 55 - ".getPixelForDecimal"
Cohesion: 0.14
Nodes (5): getPixelForTick(), getPixelForValue(), getValueForPixel(), mt(), Va

### Community 56 - "mountCharts"
Cohesion: 0.23
Nodes (12): auditDataQuality(), destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap() (+4 more)

### Community 57 - "exportExcelWorkbook"
Cohesion: 0.31
Nodes (11): exportExcelWorkbook(), exportVerbatimCsv(), _formatVerbatimDate(), getFilteredResponses(), _getPinnedSet(), getQuestionDisplayMap(), _getRecordKey(), renderQualitativeTextTab() (+3 more)

### Community 58 - "renderSingleQuestionAnalyticsCard"
Cohesion: 0.25
Nodes (9): exportQuestionCsv(), formatAnswerDisplay(), formatQuestionTypeLabel(), renderQuestionChartCanvas(), renderQuestionStatsPanel(), renderQuestionSummaries(), renderQuestionTabulationTable(), renderQuestionVerbatimPanel() (+1 more)

### Community 59 - ".getLabels"
Cohesion: 0.33
Nodes (3): buildTicks(), ia(), init()

### Community 61 - "logGamma"
Cohesion: 0.50
Nodes (5): chiSquarePValue(), chiSquareTest(), gammaLowerSeries(), gammaUpperContinuedFraction(), logGamma()

### Community 62 - "I"
Cohesion: 0.40
Nodes (4): generateLabels(), I(), Is(), ya()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 217 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ae` connect `ae` to `draw`, `chart.umd.min.js`, `Fa`, `se`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.07079414838035528 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `.parse`, `chart.umd.min.js`, `.getDataset`, `pa`, `updateElements`, `.getParsed`, `.applyStack`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12878787878787878 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `chart.umd.min.js`, `ja`, `en`, `._computeLabelItems`, `.getContext`, `.getPixelForDecimal`, `.getLabels`, `On`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0713064713064713 - nodes in this community are weakly interconnected._