# Graph Report - AE_Survery  (2026-11-11)

## Corpus Check
- 22 files · ~121,624 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1208 nodes · 2874 edges · 53 communities (44 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `345aa4f5`
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
- Fa
- de
- db.js
- ae
- Ks
- Da
- Ji
- la
- se
- pa
- handleGlobalKeydown
- _update
- .getParsed
- bs
- P
- manifest.json
- sw.js
- Key Highlights & Capabilities
- escapeHtml
- .parse
- builder.js
- Fs
- Tt
- collector.js
- i18n.js
- t
- adr/README.md
- downloadBlob
- m
- Ye
- qrcode.js
- updateElements
- Vs
- Qi
- closePersonnelModals
- closeAssignTaskModal
- boot

## God Nodes (most connected - your core abstractions)
1. `render()` - 92 edges
2. `zs` - 73 edges
3. `i` - 71 edges
4. `AESurveyStore` - 70 edges
5. `Os` - 58 edges
6. `showToast()` - 51 edges
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

## Communities (53 total, 9 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.08
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 1 - "zs"
Cohesion: 0.06
Nodes (13): buildTicks(), d(), determineDataLimits(), Es(), g(), He(), ia(), L() (+5 more)

### Community 2 - "field-app.js"
Cohesion: 0.08
Nodes (81): addRepeatRow(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading(), clearGPS() (+73 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.03
Nodes (35): addControllers(), addPlugins(), addScales(), beforeLayout(), Bi(), cn(), dataset(), destroy() (+27 more)

### Community 4 - "i"
Cohesion: 0.07
Nodes (7): Ce(), ea(), i, k(), ra(), ta(), W()

### Community 5 - "e"
Cohesion: 0.33
Nodes (3): e, rt(), za()

### Community 6 - "app.js"
Cohesion: 0.09
Nodes (45): addQuestionOption(), deleteQuestion(), deleteSurveyPage(), dismissSyncError(), duplicateQuestion(), findQuestionContext(), initTeamAnimations(), launchCollectorRunner() (+37 more)

### Community 7 - "A"
Cohesion: 0.21
Nodes (13): A(), afterDatasetsUpdate(), be(), get(), H(), j(), me(), N() (+5 more)

### Community 8 - "showToast"
Cohesion: 0.06
Nodes (31): addQuestionToActivePage(), addSurveyPage(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), copyText(), createBlankSurvey() (+23 more)

### Community 9 - "$n"
Cohesion: 0.05
Nodes (24): afterInit(), An(), Ci(), Di(), draw(), Fe(), Fn(), Ge() (+16 more)

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (66): auditDataQuality(), betaInc(), chiSquarePValue(), chiSquareTest(), cohensD(), destroyCharts(), exportExcelWorkbook(), exportQuestionCsv() (+58 more)

### Community 11 - "en"
Cohesion: 0.06
Nodes (15): configure(), en, r(), _generate(), _getTimestampsForTable(), getValueForPixel(), Ha(), ht() (+7 more)

### Community 12 - ".getDataset"
Cohesion: 0.19
Nodes (3): initialize(), Ms(), Ss()

### Community 14 - "C"
Cohesion: 0.12
Nodes (15): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), getPixelForTick(), getPixelForValue(), mt() (+7 more)

### Community 15 - "Fa"
Cohesion: 0.21
Nodes (5): at(), dt(), Fa, lt(), nt()

### Community 16 - "de"
Cohesion: 0.09
Nodes (15): Ae(), as(), cs(), de(), ds(), _e(), gs, hs() (+7 more)

### Community 17 - "db.js"
Cohesion: 0.12
Nodes (22): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), computeSyncFallbackHash(), constantTimeCompare() (+14 more)

### Community 19 - "Ks"
Cohesion: 0.13
Nodes (5): Bs(), Gs(), js(), Ks, Xs()

### Community 20 - "Da"
Cohesion: 0.12
Nodes (5): Da, kn(), mn(), xn(), yn

### Community 21 - "Ji"
Cohesion: 0.15
Nodes (4): Ji, ki(), qi(), Xi()

### Community 22 - "la"
Cohesion: 0.20
Nodes (10): add(), diff(), endOf(), format(), formats(), _getAnims(), has(), la() (+2 more)

### Community 23 - "se"
Cohesion: 0.22
Nodes (7): ee(), ie(), jt(), ke(), Le(), se(), Xt()

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.36
Nodes (8): cancelKioskPinPrompt(), handleGlobalKeydown(), nextRunnerPage(), scrollToFirstInvalidQuestion(), setRunnerAnswer(), submitRunnerResponse(), toggleNewCollectorForm(), validateRunnerPage()

### Community 26 - "_update"
Cohesion: 0.14
Nodes (13): addElements(), fi(), getMaxOverflow(), gt(), hi(), li(), mi(), nearest() (+5 more)

### Community 27 - ".getParsed"
Cohesion: 0.24
Nodes (4): _getRuler(), ma, resolveDataElementOptions(), wt()

### Community 29 - "P"
Cohesion: 0.28
Nodes (6): _calculateBarIndexPixels(), _getStackCount(), _getStackIndex(), _getStacks(), label(), P()

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

### Community 32 - "Key Highlights & Capabilities"
Cohesion: 0.18
Nodes (10): 1. Operations Management Portal (`index.html`), 2. Standalone Mobile Field PWA (`field.html`), 3. Cryptographic Integrity & Agronomic Anomaly Detection, 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`), A. Deploying Google Apps Script (`Code.gs`), AE Survey — Enterprise Offline-First Field & Cloud Survey Platform, B. Personnel Access Roster & RBAC Roles, File Directory Reference (+2 more)

### Community 33 - "escapeHtml"
Cohesion: 0.16
Nodes (16): closeAssignTeamModal(), closeSyncSettingsModal(), escapeAttr(), escapeHtml(), escapeJs(), getOverviewSurveyMetric(), openAssignTeamModal(), openSyncSettingsModal() (+8 more)

### Community 34 - ".parse"
Cohesion: 0.15
Nodes (4): ks(), Ps(), ws(), yt()

### Community 35 - "builder.js"
Cohesion: 0.27
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - "Fs"
Cohesion: 0.14
Nodes (9): apply(), color(), constructor(), describe(), Fs, i(), ne(), oe() (+1 more)

### Community 37 - "Tt"
Cohesion: 0.40
Nodes (3): Et(), It(), Tt()

### Community 38 - "collector.js"
Cohesion: 0.33
Nodes (9): initRunnerForSurvey(), isLegacyHardcodedDefault(), renderAirGapManager(), renderCollectorsManager(), renderCollectStage(), renderRespondentInputControl(), renderRespondentQuestion(), renderSurveyRunner() (+1 more)

### Community 39 - "i18n.js"
Cohesion: 0.29
Nodes (10): autoTranslateSurvey(), autoTranslateSurveyAsync(), getCanonicalEnglishAnswer(), getLanguage(), localizeSurvey(), t(), translateCompoundPhrase(), translatePhrase() (+2 more)

### Community 40 - "t"
Cohesion: 0.10
Nodes (20): Ai(), bn(), bt(), buildLookupTable(), ft(), getDecimalForValue(), initOffsets(), inRange() (+12 more)

### Community 41 - "adr/README.md"
Cohesion: 0.14
Nodes (14): field.html (PWA Collector Shell), index.html (Admin Studio Shell), manifest.json (Admin PWA), manifest-collector.json (Field PWA), sw.js (Service Worker v3.43), Code.gs (Google Apps Script Backend), ADR 0001 Offline Chart.js, ADR 0002 Merkle Audit & SHA256 (+6 more)

### Community 42 - "downloadBlob"
Cohesion: 0.29
Nodes (7): computeCanonicalDigest(), downloadBlob(), downloadStandaloneFieldApp(), exportResponsesPackJSON(), exportSurveyResponsesCSV(), exportSurveySchemaJSON(), importJSONPackFile()

### Community 43 - "m"
Cohesion: 0.16
Nodes (13): ca(), da(), Gi(), ii(), c(), m(), f(), parseArrayData() (+5 more)

### Community 44 - "Ye"
Cohesion: 0.67
Nodes (3): ei(), ti(), Ye()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 46 - "updateElements"
Cohesion: 0.19
Nodes (7): _calculateBarValuePixels(), ct(), getLabelAndValue(), _s(), ua(), updateElements(), ys()

### Community 50 - "closePersonnelModals"
Cohesion: 0.67
Nodes (3): closePersonnelModals(), savePersonnel(), saveResetPin()

### Community 53 - "boot"
Cohesion: 0.29
Nodes (8): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), promptInstall(), renderHeaderBar(), saveAndSyncSurvey(), triggerGoogleSheetsSync()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 208 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zs` connect `zs` to `en`, `chart.umd.min.js`, `C`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.08176838810641628 - nodes in this community are weakly interconnected._
- **Why does `Os` connect `Os` to `.parse`, `chart.umd.min.js`, `.getDataset`, `updateElements`, `pa`, `.getParsed`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.05586741512964448 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `chart.umd.min.js`, `en`, `m`, `de`, `Ks`, `se`, `P`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08069858476362542 - nodes in this community are weakly interconnected._