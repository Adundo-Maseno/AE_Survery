# Graph Report - AE_Survery  (2026-11-11)

## Corpus Check
- 22 files · ~105,068 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1189 nodes · 2784 edges · 52 communities (43 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62166238`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AESurveyStore
- zs
- field-app.js
- chart.umd.min.js
- i
- en
- app.js
- Ji
- showToast
- On
- analytics.js
- e
- $n
- Os
- wi
- t
- A
- qa
- ae
- Ks
- Da
- .getDataset
- db.js
- de
- pa
- handleGlobalKeydown
- draw
- .getParsed
- bs
- Fa
- manifest.json
- z
- Key Highlights & Capabilities
- escapeHtml
- updateElements
- builder.js
- Fs
- cs
- collector.js
- i18n.js
- .isHorizontal
- adr/README.md
- downloadBlob
- _calculateBarValuePixels
- _update
- qrcode.js
- ua
- Vs
- closePersonnelModals
- Qi
- closeAssignTaskModal

## God Nodes (most connected - your core abstractions)
1. `render()` - 86 edges
2. `zs` - 73 edges
3. `i` - 71 edges
4. `AESurveyStore` - 66 edges
5. `Os` - 58 edges
6. `showToast()` - 50 edges
7. `render()` - 39 edges
8. `$n` - 28 edges
9. `d()` - 25 edges
10. `showToast()` - 25 edges

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
Cohesion: 0.08
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 1 - "zs"
Cohesion: 0.06
Nodes (13): buildTicks(), d(), determineDataLimits(), Es(), g(), ia(), Is(), L() (+5 more)

### Community 2 - "field-app.js"
Cohesion: 0.08
Nodes (79): addRepeatRow(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading(), clearGPS() (+71 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (32): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset() (+24 more)

### Community 4 - "i"
Cohesion: 0.06
Nodes (12): Ce(), ea(), fs(), i, k(), oa(), Qs(), ra() (+4 more)

### Community 5 - "en"
Cohesion: 0.06
Nodes (15): configure(), en, r(), _generate(), getPixelForTick(), getPixelForValue(), _getTimestampsForTable(), getValueForPixel() (+7 more)

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (41): addQuestionOption(), addSurveyPage(), deleteQuestion(), deleteSurveyPage(), dismissSyncError(), duplicateQuestion(), findQuestionContext(), initTeamAnimations() (+33 more)

### Community 7 - "Ji"
Cohesion: 0.13
Nodes (3): Ae(), gs, Ji

### Community 8 - "showToast"
Cohesion: 0.07
Nodes (30): addQuestionToActivePage(), approveSingleResponse(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), copyText(), createBlankSurvey() (+22 more)

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (64): auditDataQuality(), betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), destroyCharts(), exportExcelWorkbook(), exportQuestionCsv() (+56 more)

### Community 11 - "e"
Cohesion: 0.15
Nodes (8): e, Et(), getCenterPoint(), It(), rt(), tooltipPosition(), Tt(), za()

### Community 12 - "$n"
Cohesion: 0.14
Nodes (9): afterInit(), Fn(), hn(), initialize(), jn(), ln(), $n, rn() (+1 more)

### Community 14 - "wi"
Cohesion: 0.11
Nodes (18): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), inRange(), mi() (+10 more)

### Community 15 - "t"
Cohesion: 0.20
Nodes (10): bn(), bt(), buildLookupTable(), getDecimalForValue(), initOffsets(), _notify(), Qa(), sn() (+2 more)

### Community 16 - "A"
Cohesion: 0.10
Nodes (23): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+15 more)

### Community 17 - "qa"
Cohesion: 0.14
Nodes (4): He(), label(), P(), qa

### Community 18 - "ae"
Cohesion: 0.11
Nodes (6): ae, ee(), ie(), te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS

### Community 19 - "Ks"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 21 - ".getDataset"
Cohesion: 0.16
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 22 - "db.js"
Cohesion: 0.12
Nodes (20): AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), constantTimeCompare(), getCurrentUser(), getLockState() (+12 more)

### Community 23 - "de"
Cohesion: 0.18
Nodes (7): de(), jt(), ke(), numeric(), se(), ve(), Xt()

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.17
Nodes (15): cancelKioskPinPrompt(), closeAssignTeamModal(), closeSyncSettingsModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal(), openSyncSettingsModal(), renderModals() (+7 more)

### Community 26 - "draw"
Cohesion: 0.09
Nodes (25): Ai(), ca(), draw(), Fe(), ft(), Ge(), getMaxOverflow(), Gi() (+17 more)

### Community 27 - ".getParsed"
Cohesion: 0.21
Nodes (5): da(), ma, parseArrayData(), parsePrimitiveData(), resolveDataElementOptions()

### Community 29 - "Fa"
Cohesion: 0.15
Nodes (8): at(), dt(), Fa, Ha(), ht(), lt(), Na(), nt()

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

### Community 31 - "z"
Cohesion: 0.24
Nodes (7): Ci(), Di(), generateLabels(), I(), Nn(), ya(), z()

### Community 32 - "Key Highlights & Capabilities"
Cohesion: 0.18
Nodes (10): 1. Operations Management Portal (`index.html`), 2. Standalone Mobile Field PWA (`field.html`), 3. Cryptographic Integrity & Agronomic Anomaly Detection, 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`), A. Deploying Google Apps Script (`Code.gs`), AE Survey — Enterprise Offline-First Field & Cloud Survey Platform, B. Personnel Access Roster & RBAC Roles, File Directory Reference (+2 more)

### Community 33 - "escapeHtml"
Cohesion: 0.20
Nodes (14): boot(), escapeAttr(), escapeHtml(), getCurrentUser(), getOverviewSurveyMetric(), promptInstall(), renderDashboard(), renderEnumeratorPortal() (+6 more)

### Community 34 - "updateElements"
Cohesion: 0.27
Nodes (7): _calculateBarIndexPixels(), _getRuler(), _getStackCount(), _getStackIndex(), _getStacks(), updateElements(), wt()

### Community 35 - "builder.js"
Cohesion: 0.27
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - "Fs"
Cohesion: 0.10
Nodes (15): apply(), be(), color(), constructor(), describe(), Fs, get(), i() (+7 more)

### Community 37 - "cs"
Cohesion: 0.24
Nodes (8): as(), cs(), ds(), hs(), ns(), os(), St(), us()

### Community 38 - "collector.js"
Cohesion: 0.33
Nodes (7): initRunnerForSurvey(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner()

### Community 39 - "i18n.js"
Cohesion: 0.36
Nodes (7): autoTranslateSurvey(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translatePhrase(), translateTerm()

### Community 40 - ".isHorizontal"
Cohesion: 0.36
Nodes (3): Ln, _refresh(), start()

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 43 - "_calculateBarValuePixels"
Cohesion: 0.33
Nodes (3): _calculateBarValuePixels(), _s(), ys()

### Community 44 - "_update"
Cohesion: 0.29
Nodes (3): addElements(), Ui(), _update()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 46 - "ua"
Cohesion: 0.25
Nodes (8): ct(), getLabelAndValue(), ka(), Ma(), pn(), ua(), v(), wa()

### Community 48 - "closePersonnelModals"
Cohesion: 0.67
Nodes (3): closePersonnelModals(), savePersonnel(), saveResetPin()

## Knowledge Gaps
- **5 isolated node(s):** `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js`, `ADR 0002 Merkle Audit & SHA256`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Os` connect `Os` to `updateElements`, `chart.umd.min.js`, `_calculateBarValuePixels`, `_update`, `.getDataset`, `pa`, `.getParsed`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.07769973661106233 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `chart.umd.min.js`, `en`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.0595679012345679 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `chart.umd.min.js`, `cs`, `A`, `qa`, `de`, `draw`, `Fa`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08227848101265822 - nodes in this community are weakly interconnected._