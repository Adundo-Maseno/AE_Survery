# Graph Report - AE_Survery  (2026-11-19)

## Corpus Check
- 22 files · ~125,017 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .gs 1)

## Summary
- 1218 nodes · 2911 edges · 55 communities (43 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `324133b0`
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
- .notifyPlugins
- cs
- db.js
- ae
- Ks
- Da
- .update
- e
- de
- pa
- handleGlobalKeydown
- _calculateBarValuePixels
- .getParsed
- _update
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
- Fa
- .buildOrUpdateControllers
- Qi
- .constructor
- I
- boot
- setRunnerAnswerSilent

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

## Communities (55 total, 12 thin omitted)

### Community 0 - "AESurveyStore"
Cohesion: 0.08
Nodes (3): AESurveyStore, getInitialPersonnelSeed(), getInitialSeedData()

### Community 1 - "zs"
Cohesion: 0.07
Nodes (10): buildTicks(), d(), Es(), ia(), Is(), L(), Le(), Rs() (+2 more)

### Community 2 - "field-app.js"
Cohesion: 0.08
Nodes (82): addRepeatRow(), attachCanvasSignatureListeners(), boot(), captureGPS(), clearAudioRecording(), clearBarcode(), clearCascading(), clearGPS() (+74 more)

### Community 3 - "chart.umd.min.js"
Cohesion: 0.04
Nodes (30): add(), addControllers(), addPlugins(), addScales(), Bi(), dataset(), destroy(), diff() (+22 more)

### Community 5 - "e"
Cohesion: 0.15
Nodes (8): e, Et(), getCenterPoint(), It(), rt(), tooltipPosition(), Tt(), za()

### Community 6 - "app.js"
Cohesion: 0.05
Nodes (48): addQuestionOption(), appendQuestionAfter(), appendSubQuestion(), deleteQuestion(), deleteSurveyPage(), detachSubQuestion(), dismissSyncError(), duplicateQuestion() (+40 more)

### Community 7 - "A"
Cohesion: 0.12
Nodes (20): A(), afterDatasetsUpdate(), _e(), ei(), Gs(), H(), j(), je() (+12 more)

### Community 8 - "showToast"
Cohesion: 0.09
Nodes (43): addQuestionToActivePage(), addSurveyPage(), archiveSurveyConfirm(), autoTranslateSurvey(), captureFieldGPS(), clearSyncErrorAndUseSimulator(), closeAssignTaskModal(), closePersonnelModals() (+35 more)

### Community 9 - "$n"
Cohesion: 0.16
Nodes (6): afterInit(), Fn(), initialize(), jn(), $n, x()

### Community 10 - "analytics.js"
Cohesion: 0.05
Nodes (68): auditDataQuality(), betaInc(), chiSquarePValue(), chiSquareTest(), cleanQuestionTitle(), cohensD(), destroyCharts(), exportExcelWorkbook() (+60 more)

### Community 11 - "en"
Cohesion: 0.05
Nodes (17): configure(), determineDataLimits(), en, r(), g(), _generate(), getPixelForTick(), getPixelForValue() (+9 more)

### Community 14 - "C"
Cohesion: 0.11
Nodes (18): Aa(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), C(), fi(), inRange(), mi() (+10 more)

### Community 16 - "cs"
Cohesion: 0.10
Nodes (7): Ae(), as(), ds(), gs, Ji, ns(), os()

### Community 17 - "db.js"
Cohesion: 0.11
Nodes (22): RFC-6962, AE_DEFAULT_GAS_CONFIG, AE_STORAGE_KEYS, buildRecordDigestPayload(), canonicalStringify(), computeRecordHash(), computeSyncFallbackHash(), constantTimeCompare() (+14 more)

### Community 18 - "ae"
Cohesion: 0.12
Nodes (4): ae, te(), ALLOWED_CDN_HOSTS, APP_SHELL_ASSETS

### Community 19 - "Ks"
Cohesion: 0.13
Nodes (4): Bs(), js(), Ks, Xs()

### Community 21 - ".update"
Cohesion: 0.24
Nodes (3): k(), Qs(), ra()

### Community 22 - "e"
Cohesion: 0.22
Nodes (9): beforeLayout(), cn(), da(), hn(), ln(), parseArrayData(), parsePrimitiveData(), rn() (+1 more)

### Community 23 - "de"
Cohesion: 0.11
Nodes (13): cs(), de(), ee(), hs(), ie(), jt(), ke(), numeric() (+5 more)

### Community 25 - "handleGlobalKeydown"
Cohesion: 0.17
Nodes (15): cancelKioskPinPrompt(), closeAssignTeamModal(), closeSyncSettingsModal(), handleGlobalKeydown(), nextRunnerPage(), openAssignTeamModal(), openSyncSettingsModal(), renderModals() (+7 more)

### Community 26 - "_calculateBarValuePixels"
Cohesion: 0.33
Nodes (3): _calculateBarValuePixels(), _s(), ys()

### Community 28 - "_update"
Cohesion: 0.11
Nodes (10): addElements(), bs, ki(), qi(), stop(), Ui(), _update(), Vs (+2 more)

### Community 30 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, display_override, icons, id, name (+7 more)

### Community 31 - "z"
Cohesion: 0.38
Nodes (4): Ci(), Di(), Nn(), z()

### Community 32 - "Key Highlights & Capabilities"
Cohesion: 0.18
Nodes (10): 1. Operations Management Portal (`index.html`), 2. Standalone Mobile Field PWA (`field.html`), 3. Cryptographic Integrity & Agronomic Anomaly Detection, 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`), A. Deploying Google Apps Script (`Code.gs`), AE Survey — Enterprise Offline-First Field & Cloud Survey Platform, B. Personnel Access Roster & RBAC Roles, File Directory Reference (+2 more)

### Community 33 - "escapeHtml"
Cohesion: 0.31
Nodes (9): escapeAttr(), escapeHtml(), escapeJs(), getOverviewSurveyMetric(), renderDashboard(), renderEnumeratorPortal(), renderLoginPortal(), renderSurveyRow() (+1 more)

### Community 34 - ".parse"
Cohesion: 0.16
Nodes (6): ks(), Ms(), Ps(), Ss(), ws(), yt()

### Community 35 - "builder.js"
Cohesion: 0.27
Nodes (9): QUESTION_TYPES_CATALOG, renderBuilder(), renderLiveSimulator(), renderQuestionBankSidebar(), renderQuestionEditorCard(), renderQuestionTypeConfig(), renderSimulatedQuestionInput(), renderThemeSidebar() (+1 more)

### Community 36 - "Fs"
Cohesion: 0.10
Nodes (15): apply(), be(), color(), constructor(), describe(), Fs, get(), i() (+7 more)

### Community 37 - "qa"
Cohesion: 0.14
Nodes (4): He(), label(), P(), qa

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
Cohesion: 0.09
Nodes (25): Ai(), ca(), draw(), Fe(), ft(), Ge(), getMaxOverflow(), Gi() (+17 more)

### Community 44 - ".isHorizontal"
Cohesion: 0.36
Nodes (3): Ln, _refresh(), start()

### Community 45 - "qrcode.js"
Cohesion: 0.38
Nodes (3): drawToCanvas(), generate(), QRCode()

### Community 46 - "updateElements"
Cohesion: 0.27
Nodes (7): _calculateBarIndexPixels(), _getRuler(), _getStackCount(), _getStackIndex(), _getStacks(), updateElements(), wt()

### Community 47 - "Fa"
Cohesion: 0.16
Nodes (8): at(), dt(), Fa, Ha(), ht(), lt(), Na(), nt()

### Community 50 - ".constructor"
Cohesion: 0.40
Nodes (4): ea(), fs(), sa(), xe()

### Community 52 - "I"
Cohesion: 0.50
Nodes (3): generateLabels(), I(), ya()

### Community 53 - "boot"
Cohesion: 0.29
Nodes (8): approveSingleResponse(), boot(), flagSingleResponse(), getCurrentUser(), promptInstall(), renderHeaderBar(), saveAndSyncSurvey(), triggerGoogleSheetsSync()

## Knowledge Gaps
- **6 isolated node(s):** `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)`, `Code.gs (Google Apps Script Backend)`, `ADR 0001 Offline Chart.js` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 210 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Os` connect `Os` to `.parse`, `chart.umd.min.js`, `.getDataset`, `updateElements`, `pa`, `_calculateBarValuePixels`, `.getParsed`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `RFC-6962`, `manifest.json (Admin PWA)`, `manifest-collector.json (Field PWA)` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AESurveyStore` be split into smaller, more focused modules?**
  _Cohesion score 0.08176838810641628 - nodes in this community are weakly interconnected._
- **Why does `zs` connect `zs` to `en`, `chart.umd.min.js`, `e`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `zs` be split into smaller, more focused modules?**
  _Cohesion score 0.06627175120325805 - nodes in this community are weakly interconnected._
- **Why does `i` connect `i` to `chart.umd.min.js`, `qa`, `A`, `draw`, `.notifyPlugins`, `.buildOrUpdateControllers`, `Fa`, `.constructor`, `Ks`, `cs`, `.update`, `de`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `field-app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07773952954675846 - nodes in this community are weakly interconnected._