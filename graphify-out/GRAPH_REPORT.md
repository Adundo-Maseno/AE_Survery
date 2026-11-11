# Graph Report - AE_Survery  (2026-11-11)

## Corpus Check
- 22 files · ~107,714 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1192 nodes · 2804 edges · 50 communities (39 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9226589d`
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
- $n
- analytics.js
- .notifyPlugins
- .getDataset
- Os
- wi
- t
- A
- .update
- ae
- Ks
- Da
- .parse
- db.js
- de
- pa
- handleGlobalKeydown
- m
- .getParsed
- Ji
- sn
- manifest.json
- Vs
- Key Highlights & Capabilities
- escapeHtml
- P
- builder.js
- Fs
- .buildOrUpdateControllers
- collector.js
- i18n.js
- .initialize
- adr/README.md
- downloadBlob
- _calculateBarValuePixels
- updateElements
- qrcode.js
- .constructor
- closePersonnelModals
- Qi

## God Nodes (most connected - your core abstractions)
1. `render()` - 86 edges
2. `zs` - 73 edges
3. `i` - 71 edges
4. `AESurveyStore` - 68 edges
5. `Os` - 58 edges
6. `showToast()` - 50 edges
7. `render()` - 40 edges
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

## Communities (50 total, 11 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.08
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 1 - "zs"
Cohesion: 0.06
Nodes (12): buildTicks(), d(), determineDataLimits(), Es(), g(), ia(), L(), Le() (+4 more)

### Community 2 - "field-app.js"
Cohesion: 0.08
Nodes (80): addRepeatRow(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading(), clearGPS() (+72 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.03
Nodes (39): add(), addControllers(), addPlugins(), addScales(), afterInit(), beforeLayout(), Bi(), cn() (+31 more)

### Community 5 - "en"
Cohesion: 0.06
Nodes (15): configure(), en, r(), _generate(), getPixelForTick(), getPixelForValue(), _getTimestampsForTable(), getValueForPixel() (+7 more)

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (43): addQuestionOption(), addSurveyPage(), closeAssignTaskModal(), deleteQuestion(), deleteSurveyPage(), dismissSyncError(), duplicateQuestion(), findQuestionContext() (+35 more)

### Community 7 - "Ji"
Cohesion: 0.11
Nodes (13): Ae(), as(), cs(), de(), ds(), gs, hs(), ns() (+5 more)

### Community 8 - "showToast"
Cohesion: 0.07
Nodes (30): addQuestionToActivePage(), approveSingleResponse(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), copyText(), createBlankSurvey() (+22 more)

### Community 9 - "$n"
Cohesion: 0.05
Nodes (20): An(), Ci(), Di(), draw(), Fn(), He(), I(), Is() (+12 more)

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (64): auditDataQuality(), betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), destroyCharts(), exportExcelWorkbook(), exportQuestionCsv() (+56 more)

### Community 14 - "wi"
Cohesion: 0.13
Nodes (16): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), kn(), mi() (+8 more)

### Community 15 - "t"
Cohesion: 0.12
Nodes (14): bt(), e, Fe(), Ge(), getCenterPoint(), inRange(), _notify(), pt() (+6 more)

### Community 16 - "A"
Cohesion: 0.13
Nodes (19): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+11 more)

### Community 17 - ".update"
Cohesion: 0.22
Nodes (3): k(), Qs(), ra()

### Community 18 - "ae"
Cohesion: 0.11
Nodes (6): ae, ee(), ie(), te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS

### Community 19 - "Ks"
Cohesion: 0.13
Nodes (4): Bs(), js(), Ks, Xs()

### Community 21 - ".parse"
Cohesion: 0.15
Nodes (5): ks(), Ms(), Ps(), ws(), yt()

### Community 22 - "db.js"
Cohesion: 0.12
Nodes (20): AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), constantTimeCompare(), getCurrentUser(), getLockState() (+12 more)

### Community 23 - "de"
Cohesion: 0.15
Nodes (9): Et(), It(), jt(), ke(), rt(), se(), Tt(), Xt() (+1 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.17
Nodes (15): cancelKioskPinPrompt(), closeAssignTeamModal(), closeSyncSettingsModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal(), openSyncSettingsModal(), renderModals() (+7 more)

### Community 26 - "m"
Cohesion: 0.11
Nodes (19): Ai(), ca(), ft(), getMaxOverflow(), Gi(), gt(), hi(), ii() (+11 more)

### Community 27 - ".getParsed"
Cohesion: 0.21
Nodes (5): da(), ma, parseArrayData(), parsePrimitiveData(), resolveDataElementOptions()

### Community 28 - "Ji"
Cohesion: 0.10
Nodes (6): bs, Ji, ki(), qi(), Xi(), xs

### Community 29 - "sn"
Cohesion: 0.15
Nodes (13): bn(), buildLookupTable(), ct(), getDecimalForValue(), getLabelAndValue(), initOffsets(), ka(), Ma() (+5 more)

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

### Community 32 - "Key Highlights & Capabilities"
Cohesion: 0.18
Nodes (10): 1. Operations Management Portal (`index.html`), 2. Standalone Mobile Field PWA (`field.html`), 3. Cryptographic Integrity & Agronomic Anomaly Detection, 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`), A. Deploying Google Apps Script (`Code.gs`), AE Survey — Enterprise Offline-First Field & Cloud Survey Platform, B. Personnel Access Roster & RBAC Roles, File Directory Reference (+2 more)

### Community 33 - "escapeHtml"
Cohesion: 0.18
Nodes (15): boot(), escapeAttr(), escapeHtml(), escapeJs(), getCurrentUser(), getOverviewSurveyMetric(), promptInstall(), renderDashboard() (+7 more)

### Community 34 - "P"
Cohesion: 0.10
Nodes (16): at(), _calculateBarIndexPixels(), dt(), Fa, _getRuler(), _getStackCount(), _getStackIndex(), _getStacks() (+8 more)

### Community 35 - "builder.js"
Cohesion: 0.27
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - "Fs"
Cohesion: 0.10
Nodes (15): apply(), be(), color(), constructor(), describe(), Fs, get(), i() (+7 more)

### Community 38 - "collector.js"
Cohesion: 0.33
Nodes (7): initRunnerForSurvey(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner()

### Community 39 - "i18n.js"
Cohesion: 0.36
Nodes (7): autoTranslateSurvey(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translatePhrase(), translateTerm()

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 43 - "_calculateBarValuePixels"
Cohesion: 0.33
Nodes (3): _calculateBarValuePixels(), _s(), ys()

### Community 44 - "updateElements"
Cohesion: 0.33
Nodes (4): addElements(), Ui(), _update(), updateElements()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 46 - ".constructor"
Cohesion: 0.40
Nodes (4): ea(), fs(), sa(), xe()

### Community 48 - "closePersonnelModals"
Cohesion: 0.67
Nodes (3): closePersonnelModals(), savePersonnel(), saveResetPin()

## Knowledge Gaps
- **5 isolated node(s):** `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js`, `ADR 0002 Merkle Audit & SHA256`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 211 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `i` connect `i` to `P`, `chart.umd.min.js`, `.buildOrUpdateControllers`, `Ji`, `.notifyPlugins`, `.constructor`, `A`, `.update`, `Ks`, `de`, `m`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.07991718426501035 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `chart.umd.min.js`, `.initialize`, `_calculateBarValuePixels`, `.getDataset`, `updateElements`, `.parse`, `pa`, `.getParsed`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.06101914962674456 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `$n`, `chart.umd.min.js`, `en`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08117283950617284 - nodes in this community are weakly interconnected._