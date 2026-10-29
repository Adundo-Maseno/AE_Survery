# AE Survey — Enterprise Product Specification (`PRODUCT.md`)

## 1. Product Overview
**AE Survey** is an enterprise-grade, offline-first survey and agricultural field enumeration platform designed specifically for **Agri Experience Limited**. It delivers an intuitive 4-stage survey workflow (**Dashboard → Design Survey → Collect Responses → Analyze Results**) with resilient rural field execution (Service Worker PWA, IndexedDB v4, and cryptographic audit seals) backed by a zero-cost, serverless **Google Sheets + Google Apps Script (`Code.gs`)** cloud database.

---

## 2. Target Roles & Operational Personas

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OPERATIONAL ROLES & TIERS                             │
├─────────────────────┬───────────────────────────┬───────────────────────────────┤
│ Role                │ Primary Personas          │ Core Workspaces & Actions     │
├─────────────────────┼───────────────────────────┼───────────────────────────────┤
│ HQ Operations Admin │ • Program Directors       │ • Survey Builder & Logic      │
│                     │ • Senior Data Analysts    │ • Staff Enrollment & PINs     │
│                     │ • M&E Managers            │ • Cloud Sync Configuration    │
│                     │                           │ • Merkle Audit Trail Review   │
├─────────────────────┼───────────────────────────┼───────────────────────────────┤
│ Regional Supervisor │ • Cluster Coordinators    │ • Regional Hub Oversight      │
│                     │ • Agronomy Supervisors    │ • Speeder & Outlier Auditing  │
│                     │ • Field Managers          │ • Verification Sign-Off       │
│                     │                           │ • Export to Excel / CSV       │
├─────────────────────┼───────────────────────────┼───────────────────────────────┤
│ Field Enumerator    │ • Extension Officers      │ • Mobile Field PWA            │
│                     │ • Retail Stockist Auditors│ • Offline Plot Capture        │
│                     │ • Farmer Interviewers     │ • Audio Memos & Barcodes      │
│                     │                           │ • Multi-variety Seed Rosters  │
└─────────────────────┴───────────────────────────┴───────────────────────────────┘
```

---

## 3. Architecture & Functional Modules

### A. Operations Portal (`index.html` & `js/app.js`)
- **Active Session Gate (`AESession`):** Enforces 4-digit PIN authentication before granting access to operations data.
- **Workflow Stages:**
  1. **Portfolio Overview:** Regional quotas across 6 Kenyan counties (Nakuru, Machakos, Meru, Kakamega, Uasin Gishu, Kitui), live outbox sync status, and drought-tolerant hybrid maize yield benchmarking.
  2. **Survey Builder:** 15 advanced question types with real-time text piping helper dropdowns (`{{question_id}}`), conditional skip routing, multi-page sections, and responsive tablet/mobile viewports.
  3. **Field Kiosk & Collect:** Web link generation, 300dpi QR code rendering for posters and tablet handouts, air-gapped JSON bundle packaging, and kiosk runner.
  4. **Analytics Studio:** Continuous yield binning, question-by-question response bars, NPS gauges (`-100` to `+100`), Likert matrix breakdown, Chi-Square cross-tabs, geospatial GPS map, and individual respondent inspector.
  5. **Personnel & Field Roster:** Team enrollment, 4-digit PIN provisioning, and activity metrics.

### B. Mobile Field Collector (`field.html` & `js/field-app.js`)
- **Installable PWA:** Full service worker caching (`sw.js`), Web App Manifest, home screen installation for Android and iOS Safari.
- **High-Contrast Sunlight Mode:** Monochromatic high-visibility theme for outdoor enumeration in intense African sunlight.
- **Advanced Field Telemetry:**
  - **Cascading Dropdowns:** 3-tier Kenya administrative hierarchy (County → Sub-County → Ward).
  - **Optical Barcode Scanner:** Camera viewfinder simulation with KEPHIS seed lot verification regex (`KEPHIS-XXXXXXXX`).
  - **Audio Recording Notes:** Web `MediaRecorder` API capturing farmer verbal memos with live duration tickers and IndexedDB blob offloading.
  - **Repeat Groups:** Dynamic sub-table rosters for multi-variety seed stock and inventory audits.
- **Multi-Language Engine (`AEI18n`):** Full real-time switching between English, Kiswahili, and French.

### C. Data Integrity, Quality & Storage (`js/db.js`)
- **IndexedDB v4 Storage:** Dedicated `mediaBlobs` object store eliminating the 5MB mobile `localStorage` ceiling for photos and audio recordings.
- **Cryptographic Tamper-Proofing:** SHA-256 seal calculation (`AEIntegrityEngine`) and Merkle audit trail (`AESupervisorAuditEngine`).
- **Automated Anomaly Detection:** Real-time flagging of speeder interviews (<45s or <2.5s/q), yield anomalies (>45 bags/acre or <0.5 bags/acre), and GPS accuracy drift (>30m).
- **Supervisor Review Lifecycle:** Transitions records through `pending_review` → `approved`, `flagged`, or `rejected` with supervisor ID stamping.

### D. Serverless Cloud Engine (`Code.gs`)
- **Google Sheets Database:** Auto-provisions and formats `Surveys`, `Responses`, `Collectors`, `SyncLog`, `Personnel`, and per-survey dedicated tabs (`Resp_<Title>_<ID>`).
- **Google Drive Media Storage:** Automatically saves photos and audio blobs into `AE_Survey_Field_Media` folder in Google Drive, inserting permanent Drive download links into the sheet.
- **Backend Role Authorization:** `isCallerAdmin_` verifies caller identity for schema and staff modifications.
- **Defenses & Guardrails:** Formula injection neutralization (CWE-1236), 5MB payload limit, and sliding-window rate limiting.
