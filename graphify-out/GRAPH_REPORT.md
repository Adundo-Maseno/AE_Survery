# Graph Report - AE_Survery  (2026-11-19)

## Corpus Check
- 22 files · ~130,277 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1255 nodes · 3022 edges · 53 communities (46 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f98100ca`
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
- Os
- C
- se
- cs
- db.js
- ae
- Ks
- Da
- je
- downloadBlob
- de
- pa
- handleGlobalKeydown
- _calculateBarValuePixels
- .getParsed
- P
- On
- manifest.json
- z
- Key Highlights & Capabilities
- escapeHtml
- .parse
- builder.js
- Fs
- qa
- collector.js
- i18n.js
- t
- adr/README.md
- t
- draw
- .isHorizontal
- qrcode.js
- updateElements
- draw
- closePersonnelModals
- Qi
- closeAssignTaskModal
- boot

## God Nodes (most connected - your core abstractions)
1. `render()` - 98 edges
2. `AESurveyStore` - 85 edges
3. `zs` - 73 edges
4. `i` - 71 edges
5. `Os` - 58 edges
6. `showToast()` - 56 edges
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

## Communities (53 total, 7 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.07
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 1 - "zs"
Cohesion: 0.06
Nodes (12): buildTicks(), d(), determineDataLimits(), Es(), He(), ia(), Is(), L() (+4 more)

### Community 2 - "field-app.js"
Cohesion: 0.07
Nodes (89): addRepeatRow(), applyPendingCloudSurveyUpdate(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading() (+81 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (33): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset() (+25 more)

### Community 4 - "i"
Cohesion: 0.07
Nodes (11): Ce(), ea(), fs(), i, k(), oa(), Qs(), ra() (+3 more)

### Community 5 - "e"
Cohesion: 0.10
Nodes (13): at(), dt(), e, Et(), Fa, getCenterPoint(), It(), lt() (+5 more)

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (50): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion(), dismissSyncError(), duplicateQuestion() (+42 more)

### Community 7 - "A"
Cohesion: 0.21
Nodes (13): A(), afterDatasetsUpdate(), be(), get(), H(), j(), me(), N() (+5 more)

### Community 8 - "showToast"
Cohesion: 0.06
Nodes (32): addQuestionToActivePage(), addSurveyPage(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), copyText(), createBlankSurvey() (+24 more)

### Community 9 - "$n"
Cohesion: 0.13
Nodes (10): afterInit(), Fn(), hn(), initialize(), jn(), ln(), $n, rn() (+2 more)

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (68): auditDataQuality(), betaInc(), chiSquarePValue(), chiSquareTest(), cleanQuestionTitle(), cohensD(), destroyCharts(), exportExcelWorkbook() (+60 more)

### Community 11 - "en"
Cohesion: 0.07
Nodes (12): configure(), en, r(), _generate(), _getTimestampsForTable(), getValueForPixel(), init(), ja (+4 more)

### Community 14 - "C"
Cohesion: 0.18
Nodes (11): beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), inRange(), kn(), pt(), ut(), vn() (+3 more)

### Community 15 - "se"
Cohesion: 0.22
Nodes (7): ee(), ie(), jt(), ke(), Le(), se(), Xt()

### Community 16 - "cs"
Cohesion: 0.07
Nodes (12): Ae(), as(), bs, ds(), gs, Ji, ki(), ns() (+4 more)

### Community 17 - "db.js"
Cohesion: 0.11
Nodes (22): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), computeSyncFallbackHash(), constantTimeCompare() (+14 more)

### Community 18 - "ae"
Cohesion: 0.09
Nodes (14): ae, te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS, cleanAnswersForSwSync(), idbDeleteMany(), idbGetByKey(), idbPutMany() (+6 more)

### Community 19 - "Ks"
Cohesion: 0.13
Nodes (5): Bs(), Gs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.13
Nodes (4): Da, mn(), xn(), yn

### Community 21 - "je"
Cohesion: 0.25
Nodes (8): ei(), Fe(), Ge(), je(), Qe(), ti(), Ye(), ze()

### Community 22 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 23 - "de"
Cohesion: 0.15
Nodes (9): cs(), de(), _e(), hs(), numeric(), St(), Ue(), us() (+1 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.17
Nodes (15): cancelKioskPinPrompt(), closeAssignTeamModal(), closeSyncSettingsModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal(), openSyncSettingsModal(), renderModals() (+7 more)

### Community 26 - "_calculateBarValuePixels"
Cohesion: 0.33
Nodes (3): _calculateBarValuePixels(), _s(), ys()

### Community 27 - ".getParsed"
Cohesion: 0.23
Nodes (5): da(), ma, parseArrayData(), parsePrimitiveData(), resolveDataElementOptions()

### Community 28 - "P"
Cohesion: 0.18
Nodes (8): _calculateBarIndexPixels(), _getStackCount(), _getStackIndex(), _getStacks(), label(), P(), stop(), Vs

### Community 29 - "On"
Cohesion: 0.22
Nodes (4): An(), Ci(), Di(), On

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

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

### Community 36 - "Fs"
Cohesion: 0.14
Nodes (9): apply(), color(), constructor(), describe(), Fs, i(), ne(), oe() (+1 more)

### Community 37 - "qa"
Cohesion: 0.16
Nodes (4): generateLabels(), I(), qa, ya()

### Community 38 - "collector.js"
Cohesion: 0.33
Nodes (9): initRunnerForSurvey(), isLegacyHardcodedDefault(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner() (+1 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 40 - "t"
Cohesion: 0.25
Nodes (8): ct(), getLabelAndValue(), ka(), Ma(), pn(), ua(), v(), wa()

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "t"
Cohesion: 0.20
Nodes (10): bn(), bt(), buildLookupTable(), getDecimalForValue(), initOffsets(), _notify(), Qa(), sn() (+2 more)

### Community 43 - "draw"
Cohesion: 0.10
Nodes (22): Ai(), ca(), fi(), ft(), getMaxOverflow(), Gi(), gt(), hi() (+14 more)

### Community 44 - ".isHorizontal"
Cohesion: 0.36
Nodes (3): Ln, _refresh(), start()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 46 - "updateElements"
Cohesion: 0.25
Nodes (6): addElements(), _getRuler(), Ui(), _update(), updateElements(), wt()

### Community 47 - "draw"
Cohesion: 0.11
Nodes (15): Aa(), C(), draw(), g(), getPixelForTick(), getPixelForValue(), Ha(), ht() (+7 more)

### Community 48 - "closePersonnelModals"
Cohesion: 0.67
Nodes (3): closePersonnelModals(), savePersonnel(), saveResetPin()

### Community 53 - "boot"
Cohesion: 0.24
Nodes (10): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), handleCloudDataUpdated(), isUserActivelyEditingOrInModal(), mirrorSyncSettingsToIdb(), promptInstall() (+2 more)

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 210 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zs` connect `zs` to `en`, `chart.umd.min.js`, `draw`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.07083667468591286 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `chart.umd.min.js`, `draw`, `se`, `draw`, `cs`, `Ks`, `de`, `P`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.059921710328214396 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `.parse`, `chart.umd.min.js`, `.getDataset`, `updateElements`, `pa`, `_calculateBarValuePixels`, `.getParsed`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0713064713064713 - nodes in this community are weakly interconnected._