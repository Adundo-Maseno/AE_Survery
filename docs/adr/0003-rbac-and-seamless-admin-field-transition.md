# ADR-0003: Role-Based Access Control (RBAC) & Superuser Field Audit Transition

**Date**: 2026-10-28  
**Status**: accepted  
**Deciders**: Agri Experience Security Architecture & Operations  

## Context

AE Survey serves three distinct user classes:
1. **Admins** (HQ Directors, Lead Agronomists): Full survey schema creation, role management, Google Sheets endpoint configuration, and data exports.
2. **Field Supervisors**: Multi-tablet field oversight, enumerator shift pacing, record approval/rejection, and quota monitoring.
3. **Enumerators**: Farmer interviews, offline plot data collection, GPS capture, and outbox synchronization.

Previously, when an Admin navigated from the Operations Studio to the Field App (`field.html`), the system forced a redundant PIN prompt or defaulted to an anonymous enumerator session, causing workflow friction and breaking audit continuity.

## Decision

We formalized a 3-tier Role-Based Access Control (RBAC) system in `js/db.js` (`AESession`):
1. **Persistent Role Capabilities**: Enforces granular permissions (`canDesign`, `canManageUsers`, `canSyncSheets`, `canReviewResponses`, `canCollectData`).
2. **Superuser Field Transition**: When an authenticated Admin opens `field.html`, the Field App recognizes the Admin identity, renders an `HQ Admin` audit badge, bypasses redundant PIN challenges, and tags any submitted pilot records with `ADMIN_PILOT_AUDIT` metadata.
3. **Tablet Handover Protocol**: Provides an explicit "Handover Tablet to Enumerator" action that purges Admin session credentials and locks the device into restricted Enumerator mode before handing the device to field personnel.

## Consequences

### Positive
- Strict separation of duties between survey designers and field interviewers.
- Zero credential friction for Admins testing live field surveys.
- Transparent audit trail distinguishing production farmer records from HQ pilot tests.
- Secure device delegation workflow preventing unauthorized Admin studio access from field devices.

