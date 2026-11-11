# ADR-0004: Offline-First PWA, Service Worker Cache & IndexedDB Outbox Engine

**Date**: 2026-10-28  
**Status**: accepted  
**Deciders**: Agri Experience Mobile Architecture & Field Infrastructure  

## Context

Field survey data collection occurs predominantly in rural areas with erratic or non-existent mobile cellular coverage (e.g., Eastern Semi-Arid zones, Rift Valley rural wards). Enumerators cannot depend on live network connections during interviews.

## Decision

We implement a complete offline-first Progressive Web App (PWA) architecture:
1. **Service Worker (`sw.js`)**: Employs a cache-first application shell strategy, precaching all core markup, styling, fonts, icons, vendor scripts (including `chart.umd.min.js`), and offline survey definitions under versioned caches.
2. **IndexedDB Local Storage (`ae_survey_enterprise_idb`)**: Serves as the primary operational database across 7 stores (`surveys`, `collectors`, `responses`, `syncQueue`, `syncLogs`, `personnel`, `mediaBlobs`).
3. **Outbox Synchronization Queue (`syncQueue`)**: Responses, survey edits, collector updates, personnel changes, and deletions are queued in `syncQueue` with idempotent operation keys. When connectivity is detected or manually triggered, `syncWithGoogleSheets` pushes role-scoped batched records via CORS `POST` to the Google Apps Script Web App endpoint (`Code.gs`), updating records to `synced` upon acknowledgement.

## Consequences

### Positive
- Fully operational without internet connectivity for days at a time.
- Zero data loss during unexpected battery drain or browser tab closure.
- Deterministic synchronization with Google Sheets backend.
- High-visibility outbox queue counters in both Studio and Field App headers.

