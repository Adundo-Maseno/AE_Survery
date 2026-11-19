# Graph Report - AE_Survery  (2026-11-19)

## Corpus Check
- 22 files · ~131,172 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1257 nodes · 3032 edges · 52 communities (43 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `39acb78f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AESurveyStore
- zs
- field-app.js
- chart.umd.min.js
- i
- e
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
- bs
- db.js
- ae
- Ks
- Da
- de
- downloadBlob
- gs
- pa
- handleGlobalKeydown
- _calculateBarValuePixels
- .getParsed
- P
- On
- manifest.json
- Ji
- Key Highlights & Capabilities
- escapeHtml
- .parse
- builder.js
- .update
- qa
- collector.js
- i18n.js
- je
- adr/README.md
- t
- draw
- O
- qrcode.js
- _calculateBarIndexPixels
- closePersonnelModals
- Qi
- closeAssignTaskModal
- boot

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

## Communities (52 total, 9 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.07
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 1 - "zs"
Cohesion: 0.06
Nodes (10): buildTicks(), ct(), d(), Es(), L(), parse(), Rs(), Si() (+2 more)

### Community 2 - "field-app.js"
Cohesion: 0.07
Nodes (89): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading() (+81 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (38): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset() (+30 more)

### Community 4 - "i"
Cohesion: 0.06
Nodes (13): Ce(), ea(), fs(), i, ia(), k(), oa(), Qs() (+5 more)

### Community 5 - "e"
Cohesion: 0.29
Nodes (5): at(), e, getCenterPoint(), nt(), tooltipPosition()

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (50): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion(), dismissSyncError(), duplicateQuestion() (+42 more)

### Community 7 - "A"
Cohesion: 0.11
Nodes (17): A(), afterDatasetsUpdate(), apply(), be(), constructor(), describe(), Fs, get() (+9 more)

### Community 8 - "showToast"
Cohesion: 0.06
Nodes (32): addQuestionToActivePage(), addSurveyPage(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), copyText(), createBlankSurvey() (+24 more)

### Community 9 - "$n"
Cohesion: 0.15
Nodes (7): afterInit(), Di(), draw(), $n, Nn(), wi(), ze()

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (68): auditDataQuality(), betaInc(), chiSquarePValue(), chiSquareTest(), cleanQuestionTitle(), cohensD(), destroyCharts(), exportExcelWorkbook() (+60 more)

### Community 11 - "en"
Cohesion: 0.05
Nodes (20): configure(), determineDataLimits(), en, r(), g(), _generate(), getPixelForTick(), getPixelForValue() (+12 more)

### Community 14 - "C"
Cohesion: 0.14
Nodes (15): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), kn(), mi() (+7 more)

### Community 15 - "ae"
Cohesion: 0.08
Nodes (16): ae, color(), ee(), Et(), ie(), i(), It(), jt() (+8 more)

### Community 17 - "db.js"
Cohesion: 0.11
Nodes (22): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), computeSyncFallbackHash(), constantTimeCompare() (+14 more)

### Community 18 - "ae"
Cohesion: 0.20
Nodes (12): ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany(), idbReadAll(), isGoogleAppsScriptHost() (+4 more)

### Community 19 - "Ks"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.13
Nodes (4): Da, mn(), xn(), yn

### Community 21 - "de"
Cohesion: 0.18
Nodes (9): de(), _e(), ei(), Gs(), ke(), numeric(), ti(), Ue() (+1 more)

### Community 22 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 23 - "gs"
Cohesion: 0.14
Nodes (11): Ae(), as(), cs(), ds(), gs, hs(), ns(), os() (+3 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.17
Nodes (15): cancelKioskPinPrompt(), closeAssignTeamModal(), closeSyncSettingsModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal(), openSyncSettingsModal(), renderModals() (+7 more)

### Community 26 - "_calculateBarValuePixels"
Cohesion: 0.24
Nodes (4): _calculateBarValuePixels(), _s(), updateElements(), ys()

### Community 27 - ".getParsed"
Cohesion: 0.19
Nodes (6): da(), getLabelAndValue(), ma, parseArrayData(), parsePrimitiveData(), resolveDataElementOptions()

### Community 28 - "P"
Cohesion: 0.10
Nodes (9): dt(), Fa, label(), lt(), P(), rt(), stop(), Vs (+1 more)

### Community 29 - "On"
Cohesion: 0.18
Nodes (6): An(), Ci(), Fe(), On, _refresh(), start()

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

### Community 31 - "Ji"
Cohesion: 0.15
Nodes (4): Ji, ki(), qi(), Xi()

### Community 32 - "Key Highlights & Capabilities"
Cohesion: 0.18
Nodes (10): 1. Operations Management Portal (`index.html`), 2. Standalone Mobile Field PWA (`field.html`), 3. Cryptographic Integrity & Agronomic Anomaly Detection, 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`), A. Deploying Google Apps Script (`Code.gs`), AE Survey — Enterprise Offline-First Field & Cloud Survey Platform, B. Personnel Access Roster & RBAC Roles, File Directory Reference (+2 more)

### Community 33 - "escapeHtml"
Cohesion: 0.29
Nodes (10): escapeAttr(), escapeHtml(), escapeJs(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderHeaderBar(), renderLoginPortal() (+2 more)

### Community 34 - ".parse"
Cohesion: 0.14
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 35 - "builder.js"
Cohesion: 0.27
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - ".update"
Cohesion: 0.31
Nodes (3): Fn(), jn(), x()

### Community 38 - "collector.js"
Cohesion: 0.33
Nodes (9): initRunnerForSurvey(), isLegacyHardcodedDefault(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner() (+1 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "t"
Cohesion: 0.11
Nodes (20): Ai(), bn(), bt(), buildLookupTable(), ft(), getDecimalForValue(), initOffsets(), inRange() (+12 more)

### Community 43 - "draw"
Cohesion: 0.10
Nodes (20): addElements(), ca(), getMaxOverflow(), Gi(), gt(), hi(), ii(), c() (+12 more)

### Community 44 - "O"
Cohesion: 0.24
Nodes (8): He(), I(), Is(), Ln, O(), ua(), ya(), z()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 46 - "_calculateBarIndexPixels"
Cohesion: 0.40
Nodes (6): _calculateBarIndexPixels(), _getRuler(), _getStackCount(), _getStackIndex(), _getStacks(), wt()

### Community 48 - "closePersonnelModals"
Cohesion: 0.67
Nodes (3): closePersonnelModals(), savePersonnel(), saveResetPin()

### Community 53 - "boot"
Cohesion: 0.22
Nodes (11): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), handleCloudDataUpdated(), isUserActivelyEditingOrInModal(), mirrorSyncSettingsToIdb(), promptInstall() (+3 more)

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 210 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zs` connect `zs` to `en`, `chart.umd.min.js`, `O`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.07079414838035528 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `.parse`, `chart.umd.min.js`, `.getDataset`, `pa`, `_calculateBarValuePixels`, `.getParsed`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.06350877192982456 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `chart.umd.min.js`, `en`, `draw`, `de`, `gs`, `P`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0713064713064713 - nodes in this community are weakly interconnected._