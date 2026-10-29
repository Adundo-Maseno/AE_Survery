# AE Survey — Enterprise Offline-First Field & Cloud Survey Platform

> Production-ready agricultural field enumeration and survey management suite designed for **Agri Experience Limited**, backed by **Google Sheets** and **Google Apps Script (`Code.gs`)**.

---

## Key Highlights & Capabilities

### 1. Operations Management Portal (`index.html`)
- **Role-Based Authentication (RBAC):** Gated access with 4-digit PIN authentication. Three distinct roles: **HQ Operations Admin**, **Regional Supervisor**, and **Field Enumerator**.
- **Survey Builder:** 15 question types including cascading administrative dropdowns, optical barcode verification, audio voice memos, repeat inventory groups, and dynamic text piping (`{{question_id}}`).
- **Conditional Skip & Branching Logic:** Multi-page section breaks with real-time answer-dependent jump conditions.
- **Analytics & Cross-Tabulation:** Continuous yield binning, Cramér's V / Chi-Square cross-tab analysis, Likert matrix breakdown, and NPS score gauge (`-100` to `+100`).
- **Personnel & Roster Management:** Staff enrollment, regional cluster assignments, and security PIN management.

### 2. Standalone Mobile Field PWA (`field.html`)
- **100% Offline Resilience:** Operates with zero cellular connection via Service Worker (`sw.js`) and IndexedDB v4.
- **Installable PWA:** One-click home screen installation on Android and iOS Safari.
- **Field Ergonomics:** High-contrast Sunlight Mode, shift quota counters, satellite GPS plot tagging, and offline outbox sync queue.
- **Multi-Language Support:** Instant real-time UI switching across English, Kiswahili, and French.
- **Enumerator PIN Challenge:** Requires 4-digit security PIN to switch profiles, preventing identity spoofing in the field.

### 3. Cryptographic Integrity & Agronomic Anomaly Detection
- **SHA-256 Tamper-Proof Seals:** Every plot interview response receives a deterministic cryptographic seal verifying pristine state.
- **Merkle Audit Trail:** Chained supervisory audit nodes track every verification action and supervisor sign-off.
- **Automated Data Quality Flags:** Flags speeder pacing (<45s), agronomic yield outliers (>45 bags/acre or <0.5 bags/acre), and GPS accuracy drift (>30m).

### 4. Serverless Google Sheets & Google Drive Backend (`Code.gs`)
- **Auto-Provisioned Sheets:** Provisions `Surveys`, `Responses`, `Collectors`, `SyncLog`, `Personnel`, and per-survey dedicated response tabs (`Resp_<Title>_<ID>`).
- **Google Drive Binary Offload:** Automatically routes photos and audio notes directly to `AE_Survey_Field_Media` on Google Drive, eliminating the 32,000-character cell limit.
- **Enterprise Defenses:** Formula injection neutralization (CWE-1236), 5MB payload limit, rate limiting, and caller role verification.

---

## Quick Start & Deployment Guide

### A. Deploying Google Apps Script (`Code.gs`)
1. Create a new Google Sheet at [sheets.new](https://sheets.new).
2. Open **Extensions → Apps Script**.
3. Replace all code in the editor with the contents of [`Code.gs`](./Code.gs) and save (`Ctrl+S`).
4. Click **Deploy → New deployment**:
   - **Type:** `Web app`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` *(permits offline field tablets to sync)*
5. Copy the generated Web App URL (`https://script.google.com/macros/s/.../exec`).
6. In the app, open **Sheets Endpoint** and paste the URL.

### B. Personnel Access Roster & RBAC Roles

| Account ID | Staff Member | Role | Hub / Cluster | Authentication Method |
| :--- | :--- | :--- | :--- | :--- |
| **`ADM-01`** | **Dr. John Mutua** | HQ Operations Admin | Nairobi HQ | Privately provisioned by HQ Admin |
| **`ADM-02`** | **Sarah Ndung'u** | HQ Operations Admin | Nairobi HQ | Privately provisioned by HQ Admin |
| **`SUP-01`** | **Peter Kamau** | Regional Supervisor | Nakuru / Rift Valley | Privately provisioned by HQ Admin |
| **`SUP-02`** | **Eunice Achieng** | Regional Supervisor | Bungoma / Western Hub | Privately provisioned by HQ Admin |
| **`ENUM-04`**| **Grace Wanjiku** | Field Enumerator | Nakuru County | Privately provisioned by HQ Admin |
| **`ENUM-07`**| **Samuel Ochieng** | Field Enumerator | Bungoma County | Privately provisioned by HQ Admin |

---

## File Directory Reference

```
AE_Survey/
├── index.html                  # Operations & Admin Studio Shell
├── field.html                  # Dedicated Mobile Field Collector (PWA)
├── sw.js                       # Unified Offline Service Worker Cache Engine
├── manifest.json               # Operations Studio Web App Manifest
├── manifest-collector.json     # Mobile Field Collector Web App Manifest
├── Code.gs                     # Google Apps Script & Google Drive Backend
├── PRODUCT.md                  # Comprehensive Product Architecture Specification
├── DESIGN.md                   # Visual Tokens & Framed-Sheet Design System
└── js/
    ├── db.js                   # IndexedDB v4, AESession, QA Rules, Integrity Engine
    ├── app.js                  # Main Operations Studio Controller & RBAC Views
    ├── field-app.js            # Field Collector Controller, Viewfinder, Audio Memos
    ├── builder.js              # Questionnaire Designer & Dynamic Text Piping
    ├── collector.js            # Collectors, Kiosk Runner & QR Generator
    ├── analytics.js            # Cross-tabs, NPS Gauges, Yield Binning & Maps
    ├── i18n.js                 # Multi-Language Engine (English, Swahili, French)
    └── qrcode.js               # Offline QR Matrix Generator
```
