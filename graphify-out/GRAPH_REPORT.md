# Graph Report - AE_Survery  (2026-11-19)

## Corpus Check
- 22 files · ~123,188 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1214 nodes · 2893 edges · 51 communities (43 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a0ac100`
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
- .getLabels
- cs
- db.js
- ae
- Ks
- Da
- Ji
- ja
- de
- pa
- handleGlobalKeydown
- .update
- .getParsed
- bs
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
- P
- Qi
- boot

## God Nodes (most connected - your core abstractions)
1. `render()` - 96 edges
2. `zs` - 73 edges
3. `i` - 71 edges
4. `AESurveyStore` - 70 edges
5. `Os` - 58 edges
6. `showToast()` - 55 edges
7. `render()` - 40 edges
8. `$n` - 28 edges
9. `showToast()` - 27 edges
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

## Communities (51 total, 8 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.08
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 1 - "zs"
Cohesion: 0.10
Nodes (6): Es(), L(), Le(), Rs(), zs, e()

### Community 2 - "field-app.js"
Cohesion: 0.08
Nodes (81): addRepeatRow(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading(), clearGPS() (+73 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (37): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset() (+29 more)

### Community 4 - "i"
Cohesion: 0.07
Nodes (9): Ce(), ea(), fs(), i, k(), ra(), sa(), ta() (+1 more)

### Community 5 - "e"
Cohesion: 0.10
Nodes (15): at(), dt(), e, Et(), getCenterPoint(), Ha(), ht(), It() (+7 more)

### Community 6 - "app.js"
Cohesion: 0.05
Nodes (49): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion(), dismissSyncError(), duplicateQuestion() (+41 more)

### Community 7 - "A"
Cohesion: 0.13
Nodes (19): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+11 more)

### Community 8 - "showToast"
Cohesion: 0.09
Nodes (43): addQuestionToActivePage(), addSurveyPage(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), closeAssignTaskModal(), closePersonnelModals() (+35 more)

### Community 9 - "$n"
Cohesion: 0.17
Nodes (6): afterInit(), Fn(), jn(), $n, W(), x()

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (66): auditDataQuality(), betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), destroyCharts(), exportExcelWorkbook(), exportQuestionCsv() (+58 more)

### Community 11 - "en"
Cohesion: 0.13
Nodes (7): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 12 - ".getDataset"
Cohesion: 0.18
Nodes (3): initialize(), Ms(), Ss()

### Community 14 - "C"
Cohesion: 0.13
Nodes (16): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), kn(), mi() (+8 more)

### Community 15 - ".getLabels"
Cohesion: 0.20
Nodes (5): buildTicks(), determineDataLimits(), g(), ia(), init()

### Community 16 - "cs"
Cohesion: 0.14
Nodes (11): Ae(), as(), cs(), ds(), gs, hs(), ns(), os() (+3 more)

### Community 17 - "db.js"
Cohesion: 0.11
Nodes (22): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), computeSyncFallbackHash(), constantTimeCompare() (+14 more)

### Community 18 - "ae"
Cohesion: 0.11
Nodes (6): ae, ee(), ie(), te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS

### Community 19 - "Ks"
Cohesion: 0.14
Nodes (4): Bs(), js(), Ks, Xs()

### Community 21 - "Ji"
Cohesion: 0.15
Nodes (4): Ji, ki(), qi(), Xi()

### Community 22 - "ja"
Cohesion: 0.10
Nodes (7): configure(), getPixelForTick(), getPixelForValue(), getValueForPixel(), ja, mt(), Va

### Community 23 - "de"
Cohesion: 0.22
Nodes (6): de(), jt(), ke(), numeric(), se(), Xt()

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.17
Nodes (15): cancelKioskPinPrompt(), closeAssignTeamModal(), closeSyncSettingsModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal(), openSyncSettingsModal(), renderModals() (+7 more)

### Community 27 - ".getParsed"
Cohesion: 0.21
Nodes (5): da(), ma, parseArrayData(), parsePrimitiveData(), resolveDataElementOptions()

### Community 29 - "On"
Cohesion: 0.21
Nodes (5): An(), Ci(), Di(), He(), On

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

### Community 31 - "z"
Cohesion: 0.16
Nodes (9): draw(), generateLabels(), I(), Is(), Nn(), size(), wi(), ya() (+1 more)

### Community 32 - "Key Highlights & Capabilities"
Cohesion: 0.18
Nodes (10): 1. Operations Management Portal (`index.html`), 2. Standalone Mobile Field PWA (`field.html`), 3. Cryptographic Integrity & Agronomic Anomaly Detection, 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`), A. Deploying Google Apps Script (`Code.gs`), AE Survey — Enterprise Offline-First Field & Cloud Survey Platform, B. Personnel Access Roster & RBAC Roles, File Directory Reference (+2 more)

### Community 33 - "escapeHtml"
Cohesion: 0.31
Nodes (9): escapeAttr(), escapeHtml(), escapeJs(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderLoginPortal(), renderSurveyRow() (+1 more)

### Community 34 - ".parse"
Cohesion: 0.15
Nodes (4): ks(), Ps(), ws(), yt()

### Community 35 - "builder.js"
Cohesion: 0.27
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - "Fs"
Cohesion: 0.10
Nodes (15): apply(), be(), color(), constructor(), describe(), Fs, get(), i() (+7 more)

### Community 38 - "collector.js"
Cohesion: 0.33
Nodes (9): initRunnerForSurvey(), isLegacyHardcodedDefault(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner() (+1 more)

### Community 39 - "i18n.js"
Cohesion: 0.31
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 40 - "t"
Cohesion: 0.17
Nodes (13): Ai(), ct(), ft(), getLabelAndValue(), inRange(), ka(), Ma(), pn() (+5 more)

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "t"
Cohesion: 0.15
Nodes (13): bn(), bt(), buildLookupTable(), Fe(), Ge(), getDecimalForValue(), initOffsets(), _notify() (+5 more)

### Community 43 - "draw"
Cohesion: 0.10
Nodes (20): addElements(), ca(), getMaxOverflow(), Gi(), gt(), hi(), ii(), c() (+12 more)

### Community 44 - ".isHorizontal"
Cohesion: 0.36
Nodes (3): Ln, _refresh(), start()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 46 - "updateElements"
Cohesion: 0.20
Nodes (6): _calculateBarValuePixels(), _getRuler(), _s(), updateElements(), wt(), ys()

### Community 47 - "P"
Cohesion: 0.12
Nodes (9): _calculateBarIndexPixels(), Fa, _getStackCount(), _getStackIndex(), _getStacks(), label(), P(), stop() (+1 more)

### Community 53 - "boot"
Cohesion: 0.29
Nodes (8): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), promptInstall(), renderHeaderBar(), saveAndSyncSurvey(), triggerGoogleSheetsSync()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 210 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zs` connect `zs` to `chart.umd.min.js`, `en`, `.getLabels`, `ja`, `.update`, `z`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.08176838810641628 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `chart.umd.min.js`, `e`, `A`, `draw`, `P`, `cs`, `de`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.10144927536231885 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `.parse`, `chart.umd.min.js`, `.getDataset`, `updateElements`, `pa`, `.getParsed`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07904789891272407 - nodes in this community are weakly interconnected._