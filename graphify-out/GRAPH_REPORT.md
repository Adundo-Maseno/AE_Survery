# Graph Report - AE_Survery  (2026-11-11)

## Corpus Check
- 22 files · ~110,983 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1195 nodes · 2844 edges · 54 communities (43 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6e8de82b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AESurveyStore
- zs
- field-app.js
- chart.umd.min.js
- i
- ja
- app.js
- cs
- showToast
- $n
- analytics.js
- en
- .getDataset
- Os
- mn
- e
- A
- qa
- ae
- Ks
- Da
- .parse
- ._computeLabelItems
- db.js
- pa
- handleGlobalKeydown
- m
- .getParsed
- Ji
- t
- manifest.json
- On
- Key Highlights & Capabilities
- escapeHtml
- Ye
- builder.js
- Fs
- O
- collector.js
- i18n.js
- .initialize
- adr/README.md
- downloadBlob
- _calculateBarValuePixels
- updateElements
- qrcode.js
- .getContext
- draw
- z
- Qi
- .getLabels
- boot
- wi

## God Nodes (most connected - your core abstractions)
1. `render()` - 90 edges
2. `zs` - 73 edges
3. `i` - 71 edges
4. `AESurveyStore` - 68 edges
5. `Os` - 58 edges
6. `showToast()` - 50 edges
7. `render()` - 40 edges
8. `$n` - 28 edges
9. `showToast()` - 26 edges
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

## Communities (54 total, 11 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.08
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 2 - "field-app.js"
Cohesion: 0.08
Nodes (80): addRepeatRow(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading(), clearGPS() (+72 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (35): add(), addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset() (+27 more)

### Community 4 - "i"
Cohesion: 0.06
Nodes (11): Ce(), ea(), fs(), i, k(), ra(), sa(), stop() (+3 more)

### Community 5 - "ja"
Cohesion: 0.10
Nodes (7): configure(), getPixelForTick(), getPixelForValue(), getValueForPixel(), ja, mt(), Va

### Community 6 - "app.js"
Cohesion: 0.09
Nodes (45): addQuestionOption(), closeAssignTaskModal(), deleteQuestion(), deleteSurveyPage(), dismissSyncError(), duplicateQuestion(), findQuestionContext(), initTeamAnimations() (+37 more)

### Community 7 - "cs"
Cohesion: 0.24
Nodes (8): as(), cs(), ds(), hs(), ns(), os(), St(), us()

### Community 8 - "showToast"
Cohesion: 0.06
Nodes (33): addQuestionToActivePage(), addSurveyPage(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), closePersonnelModals(), copyText() (+25 more)

### Community 9 - "$n"
Cohesion: 0.13
Nodes (10): afterInit(), Fn(), hn(), initialize(), jn(), ln(), $n, rn() (+2 more)

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (64): auditDataQuality(), betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), destroyCharts(), exportExcelWorkbook(), exportQuestionCsv() (+56 more)

### Community 11 - "en"
Cohesion: 0.14
Nodes (7): en, r(), _generate(), _getTimestampsForTable(), Ja(), tn(), vt()

### Community 12 - ".getDataset"
Cohesion: 0.24
Nodes (3): addElements(), Ui(), _update()

### Community 14 - "mn"
Cohesion: 0.17
Nodes (10): beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), kn(), mn(), vn(), v(), wn() (+2 more)

### Community 15 - "e"
Cohesion: 0.10
Nodes (13): at(), de(), dt(), _e(), e, Fa, getCenterPoint(), lt() (+5 more)

### Community 16 - "A"
Cohesion: 0.21
Nodes (13): A(), afterDatasetsUpdate(), be(), get(), H(), j(), me(), N() (+5 more)

### Community 17 - "qa"
Cohesion: 0.16
Nodes (3): label(), P(), qa

### Community 18 - "ae"
Cohesion: 0.07
Nodes (16): ae, ee(), Et(), ie(), It(), jt(), ke(), Le() (+8 more)

### Community 19 - "Ks"
Cohesion: 0.13
Nodes (5): Bs(), Gs(), js(), Ks, Xs()

### Community 21 - ".parse"
Cohesion: 0.22
Nodes (4): ks(), Ps(), ws(), yt()

### Community 22 - "._computeLabelItems"
Cohesion: 0.17
Nodes (3): Es(), L(), Rs()

### Community 23 - "db.js"
Cohesion: 0.12
Nodes (21): AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), computeSyncFallbackHash(), constantTimeCompare(), getCurrentUser() (+13 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.17
Nodes (15): cancelKioskPinPrompt(), closeAssignTeamModal(), closeSyncSettingsModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal(), openSyncSettingsModal(), renderModals() (+7 more)

### Community 26 - "m"
Cohesion: 0.09
Nodes (22): ca(), da(), fi(), getMaxOverflow(), Gi(), gt(), hi(), ii() (+14 more)

### Community 28 - "Ji"
Cohesion: 0.08
Nodes (8): Ae(), bs, gs, Ji, ki(), qi(), Xi(), xs

### Community 29 - "t"
Cohesion: 0.09
Nodes (23): Ai(), bn(), bt(), buildLookupTable(), Fe(), ft(), Ge(), getDecimalForValue() (+15 more)

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

### Community 32 - "Key Highlights & Capabilities"
Cohesion: 0.18
Nodes (10): 1. Operations Management Portal (`index.html`), 2. Standalone Mobile Field PWA (`field.html`), 3. Cryptographic Integrity & Agronomic Anomaly Detection, 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`), A. Deploying Google Apps Script (`Code.gs`), AE Survey — Enterprise Offline-First Field & Cloud Survey Platform, B. Personnel Access Roster & RBAC Roles, File Directory Reference (+2 more)

### Community 33 - "escapeHtml"
Cohesion: 0.31
Nodes (9): escapeAttr(), escapeHtml(), escapeJs(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderLoginPortal(), renderSurveyRow() (+1 more)

### Community 34 - "Ye"
Cohesion: 0.67
Nodes (3): ei(), ti(), Ye()

### Community 35 - "builder.js"
Cohesion: 0.27
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - "Fs"
Cohesion: 0.14
Nodes (9): apply(), color(), constructor(), describe(), Fs, i(), ne(), oe() (+1 more)

### Community 37 - "O"
Cohesion: 0.18
Nodes (9): generateLabels(), He(), I(), Is(), Ln, O(), _refresh(), start() (+1 more)

### Community 38 - "collector.js"
Cohesion: 0.33
Nodes (9): initRunnerForSurvey(), isLegacyHardcodedDefault(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner() (+1 more)

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
Nodes (3): f(), _s(), ys()

### Community 44 - "updateElements"
Cohesion: 0.19
Nodes (11): _calculateBarIndexPixels(), _calculateBarValuePixels(), ct(), getLabelAndValue(), _getRuler(), _getStackCount(), _getStackIndex(), _getStacks() (+3 more)

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 47 - "draw"
Cohesion: 0.17
Nodes (12): Aa(), C(), draw(), g(), Ha(), ht(), Na(), ot() (+4 more)

### Community 48 - "z"
Cohesion: 0.29
Nodes (6): Ci(), Di(), je(), Nn(), Qe(), z()

### Community 50 - ".getLabels"
Cohesion: 0.18
Nodes (4): buildTicks(), determineDataLimits(), ia(), init()

### Community 53 - "boot"
Cohesion: 0.29
Nodes (8): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), promptInstall(), renderHeaderBar(), saveAndSyncSurvey(), triggerGoogleSheetsSync()

## Knowledge Gaps
- **5 isolated node(s):** `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js`, `ADR 0002 Merkle Audit & SHA256`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 207 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `i` connect `i` to `chart.umd.min.js`, `cs`, `draw`, `qa`, `ae`, `Ks`, `m`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.084472049689441 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `chart.umd.min.js`, `ja`, `O`, `en`, `.getContext`, `.getLabels`, `._computeLabelItems`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.12878787878787878 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `chart.umd.min.js`, `.initialize`, `_calculateBarValuePixels`, `.getDataset`, `updateElements`, `.parse`, `pa`, `.getParsed`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08209876543209876 - nodes in this community are weakly interconnected._