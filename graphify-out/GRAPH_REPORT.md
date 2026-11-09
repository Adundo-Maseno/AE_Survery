# Graph Report - AE_Survery  (2026-11-09)

## Corpus Check
- 36 files · ~95,625 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .gs 1, .ico 1)

## Summary
- 1147 nodes · 2701 edges · 53 communities (45 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Offline Storage & IndexedDB Subsystem
- Subsystem Community 1
- Offline Storage & IndexedDB Subsystem
- Offline Storage & IndexedDB Subsystem
- Subsystem Community 4
- Subsystem Community 5
- Application Shell & UI Controls
- Subsystem Community 7
- Field Collector PWA & Hardware Capture
- Subsystem Community 9
- Econometric & Field Analytics Engine
- Subsystem Community 11
- Subsystem Community 12
- Subsystem Community 13
- Subsystem Community 14
- Subsystem Community 15
- Subsystem Community 16
- Subsystem Community 17
- Subsystem Community 18
- Econometric & Field Analytics Engine
- Subsystem Community 20
- Subsystem Community 21
- Econometric & Field Analytics Engine
- Subsystem Community 23
- Subsystem Community 24
- Field Collector PWA & Hardware Capture
- Subsystem Community 26
- Subsystem Community 27
- Subsystem Community 28
- Subsystem Community 29
- Econometric & Field Analytics Engine
- Econometric & Field Analytics Engine
- Econometric & Field Analytics Engine
- Subsystem Community 33
- Subsystem Community 34
- Visual Survey Builder & Schema Studio
- Application Shell & UI Controls
- Subsystem Community 37
- Field Collector PWA & Hardware Capture
- Multi-Language & Localization Architecture
- Subsystem Community 40
- Field Collector PWA & Hardware Capture
- Offline Storage & IndexedDB Subsystem
- Application Shell & UI Controls
- Subsystem Community 44
- Subsystem Community 45
- Subsystem Community 46
- Subsystem Community 47
- Field Collector PWA & Hardware Capture
- Subsystem Community 49
- Application Shell & UI Controls
- Econometric & Field Analytics Engine
- Subsystem Community 52

## God Nodes (most connected - your core abstractions)
1. `render()` - 88 edges
2. `zs` - 73 edges
3. `i` - 71 edges
4. `AESurveyStore` - 65 edges
5. `Os` - 58 edges
6. `showToast()` - 50 edges
7. `render()` - 36 edges
8. `$n` - 28 edges
9. `d()` - 25 edges
10. `showToast()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `ADR 0004 Offline-First PWA Storage` --specifies--> `sw.js (Service Worker v3.43)`  [EXTRACTED]
  docs/adr/0004-offline-first-pwa-service-worker-storage.md → sw.js
- `ADR 0003 RBAC Admin Field Transition` --aligns_with--> `PRODUCT.md PRD & Scope`  [EXTRACTED]
  docs/adr/0003-rbac-and-seamless-admin-field-transition.md → PRODUCT.md
- `index.html (Admin Studio Shell)` --references--> `manifest.json (Admin PWA)`  [EXTRACTED]
  index.html → manifest.json
- `index.html (Admin Studio Shell)` --implements--> `sw.js (Service Worker v3.43)`  [EXTRACTED]
  index.html → sw.js
- `field.html (PWA Collector Shell)` --references--> `manifest-collector.json (Field PWA)`  [EXTRACTED]
  field.html → manifest-collector.json

## Import Cycles
- None detected.

## Communities (53 total, 8 thin omitted)

### Community 0 - "Offline Storage & IndexedDB Subsystem"
Cohesion: 0.05
Nodes (20): AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, AESurveyStore, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), constantTimeCompare(), getCurrentUser() (+12 more)

### Community 1 - "Subsystem Community 1"
Cohesion: 0.06
Nodes (11): buildTicks(), d(), Es(), He(), ia(), Is(), L(), Rs() (+3 more)

### Community 2 - "Offline Storage & IndexedDB Subsystem"
Cohesion: 0.08
Nodes (76): addRepeatRow(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading(), clearGPS() (+68 more)

### Community 3 - "Offline Storage & IndexedDB Subsystem"
Cohesion: 0.04
Nodes (34): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset() (+26 more)

### Community 4 - "Subsystem Community 4"
Cohesion: 0.07
Nodes (9): Ce(), ea(), fs(), i, k(), ra(), sa(), ta() (+1 more)

### Community 5 - "Subsystem Community 5"
Cohesion: 0.05
Nodes (20): configure(), determineDataLimits(), en, r(), g(), _generate(), getPixelForTick(), getPixelForValue() (+12 more)

### Community 6 - "Application Shell & UI Controls"
Cohesion: 0.08
Nodes (43): addQuestionOption(), addSurveyPage(), deleteQuestion(), deleteSurveyPage(), dismissSyncError(), duplicateQuestion(), enterKioskMode(), findQuestionContext() (+35 more)

### Community 7 - "Subsystem Community 7"
Cohesion: 0.06
Nodes (12): Ae(), _calculateBarIndexPixels(), Fa, _getStackCount(), _getStackIndex(), _getStacks(), gs, Ji (+4 more)

### Community 8 - "Field Collector PWA & Hardware Capture"
Cohesion: 0.06
Nodes (34): addQuestionToActivePage(), approveSingleResponse(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), closePersonnelModals(), copyText() (+26 more)

### Community 9 - "Subsystem Community 9"
Cohesion: 0.18
Nodes (5): An(), Di(), Nn(), On, z()

### Community 10 - "Econometric & Field Analytics Engine"
Cohesion: 0.09
Nodes (4): getCellHeatmapStyle(), iqr(), percentile(), renderCrossTab()

### Community 11 - "Subsystem Community 11"
Cohesion: 0.09
Nodes (16): at(), dt(), e, Et(), getCenterPoint(), hi(), It(), li() (+8 more)

### Community 12 - "Subsystem Community 12"
Cohesion: 0.15
Nodes (6): afterInit(), Ci(), jn(), $n, W(), wi()

### Community 14 - "Subsystem Community 14"
Cohesion: 0.10
Nodes (22): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), draw(), Fe(), fi() (+14 more)

### Community 15 - "Subsystem Community 15"
Cohesion: 0.09
Nodes (23): Ai(), bn(), bt(), buildLookupTable(), ct(), ft(), getDecimalForValue(), getLabelAndValue() (+15 more)

### Community 16 - "Subsystem Community 16"
Cohesion: 0.14
Nodes (19): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+11 more)

### Community 17 - "Subsystem Community 17"
Cohesion: 0.16
Nodes (4): generateLabels(), I(), qa, ya()

### Community 18 - "Subsystem Community 18"
Cohesion: 0.12
Nodes (4): ae, te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS

### Community 19 - "Econometric & Field Analytics Engine"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 20 - "Subsystem Community 20"
Cohesion: 0.12
Nodes (5): Da, kn(), mn(), xn(), yn

### Community 21 - "Subsystem Community 21"
Cohesion: 0.15
Nodes (4): ks(), Ps(), ws(), yt()

### Community 22 - "Econometric & Field Analytics Engine"
Cohesion: 0.21
Nodes (16): betaInc(), cohensD(), fDistributionPValue(), invertMatrix(), mean(), moransI(), multivariateOLS(), normalCdfUpper() (+8 more)

### Community 23 - "Subsystem Community 23"
Cohesion: 0.13
Nodes (10): de(), ee(), ie(), jt(), ke(), Le(), numeric(), se() (+2 more)

### Community 25 - "Field Collector PWA & Hardware Capture"
Cohesion: 0.17
Nodes (15): cancelKioskPinPrompt(), closeAssignTeamModal(), closeSyncSettingsModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal(), openSyncSettingsModal(), renderModals() (+7 more)

### Community 26 - "Subsystem Community 26"
Cohesion: 0.13
Nodes (15): ca(), color(), getMaxOverflow(), Gi(), gt(), ii(), c(), i() (+7 more)

### Community 27 - "Subsystem Community 27"
Cohesion: 0.21
Nodes (5): da(), ma, parseArrayData(), parsePrimitiveData(), resolveDataElementOptions()

### Community 29 - "Subsystem Community 29"
Cohesion: 0.19
Nodes (3): initialize(), Ms(), Ss()

### Community 30 - "Econometric & Field Analytics Engine"
Cohesion: 0.23
Nodes (12): auditDataQuality(), destroyCharts(), forecastCompletion(), getCountryGeoFocus(), getOptimalDevicePixelRatio(), mountCharts(), mountForensicsChart(), mountGpsLogMap() (+4 more)

### Community 31 - "Econometric & Field Analytics Engine"
Cohesion: 0.18
Nodes (12): exportExcelWorkbook(), exportQuestionCsv(), formatAnswerDisplay(), formatQuestionTypeLabel(), getFilteredResponses(), renderIndividualInspector(), renderQuestionChartCanvas(), renderQuestionStatsPanel() (+4 more)

### Community 32 - "Econometric & Field Analytics Engine"
Cohesion: 0.17
Nodes (12): renderAgronomicCorrelationsTab(), renderAnalyzeStage(), renderAnovaTab(), renderAutomatedInsightsBanner(), renderExecutiveKPIStrip(), renderGPSFieldLog(), renderInsightsTab(), renderMultiDimensionalFilterBar() (+4 more)

### Community 33 - "Subsystem Community 33"
Cohesion: 0.23
Nodes (12): boot(), escapeAttr(), escapeHtml(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderHeaderBar(), renderLoginPortal() (+4 more)

### Community 34 - "Subsystem Community 34"
Cohesion: 0.25
Nodes (6): addElements(), _getRuler(), Ui(), _update(), updateElements(), wt()

### Community 35 - "Visual Survey Builder & Schema Studio"
Cohesion: 0.31
Nodes (7): QUESTION_TYPES_CATALOG, renderBuilder(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderThemeSidebar(), renderTranslationsSidebar()

### Community 36 - "Application Shell & UI Controls"
Cohesion: 0.20
Nodes (10): apply(), be(), constructor(), describe(), get(), me(), override(), re() (+2 more)

### Community 37 - "Subsystem Community 37"
Cohesion: 0.24
Nodes (8): as(), cs(), ds(), hs(), ns(), os(), St(), us()

### Community 38 - "Field Collector PWA & Hardware Capture"
Cohesion: 0.33
Nodes (7): initRunnerForSurvey(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner()

### Community 39 - "Multi-Language & Localization Architecture"
Cohesion: 0.36
Nodes (7): autoTranslateSurvey(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translatePhrase(), translateTerm()

### Community 40 - "Subsystem Community 40"
Cohesion: 0.36
Nodes (3): Ln, _refresh(), start()

### Community 41 - "Field Collector PWA & Hardware Capture"
Cohesion: 0.33
Nodes (7): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), ADR 0004 Offline-First PWA Storage, DESIGN.md Design Tokens & System

### Community 42 - "Offline Storage & IndexedDB Subsystem"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 43 - "Application Shell & UI Controls"
Cohesion: 0.33
Nodes (3): _calculateBarValuePixels(), _s(), ys()

### Community 44 - "Subsystem Community 44"
Cohesion: 0.38
Nodes (5): Fn(), hn(), ln(), rn(), x()

### Community 45 - "Subsystem Community 45"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "Subsystem Community 47"
Cohesion: 0.50
Nodes (5): chiSquarePValue(), chiSquareTest(), gammaLowerSeries(), gammaUpperContinuedFraction(), logGamma()

### Community 48 - "Field Collector PWA & Hardware Capture"
Cohesion: 0.67
Nodes (3): Code.gs (Google Apps Script Backend), ADR 0003 RBAC Admin Field Transition, PRODUCT.md PRD & Scope

## Knowledge Gaps
- **7 isolated node(s):** `ADR 0001 Offline Chart.js`, `ADR 0002 Merkle Audit & SHA256`, `ADR 0003 RBAC Admin Field Transition`, `ADR 0004 Offline-First PWA Storage`, `manifest.json (Admin PWA)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 190 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Os` connect `Subsystem Community 13` to `Subsystem Community 34`, `Offline Storage & IndexedDB Subsystem`, `Application Shell & UI Controls`, `Subsystem Community 21`, `Subsystem Community 24`, `Subsystem Community 27`, `Subsystem Community 29`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `ADR 0001 Offline Chart.js`, `ADR 0002 Merkle Audit & SHA256`, `ADR 0003 RBAC Admin Field Transition` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Offline Storage & IndexedDB Subsystem` be split into smaller, more focused modules?**
  _Cohesion score 0.051685393258426963 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `Subsystem Community 1` to `Offline Storage & IndexedDB Subsystem`, `Subsystem Community 5`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `Subsystem Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06260406260406261 - nodes in this community are weakly interconnected._
- **Why does `i` connect `Subsystem Community 4` to `Offline Storage & IndexedDB Subsystem`, `Subsystem Community 5`, `Subsystem Community 37`, `Subsystem Community 7`, `Subsystem Community 14`, `Subsystem Community 16`, `Subsystem Community 23`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `Offline Storage & IndexedDB Subsystem` be split into smaller, more focused modules?**
  _Cohesion score 0.08304853041695147 - nodes in this community are weakly interconnected._