# ADR-0002: Client-Side Merkle Audit Trail & Anti-Tamper Cryptographic Seals

**Date**: 2026-10-28  
**Status**: accepted  
**Deciders**: Agri Experience Security & Field Data Operations  

## Context

Field survey data collection for smallholder agriculture informs commercial seed distribution, yield verification, and research subsidies. In offline field collection, data resides on enumerator tablets for hours or days before synchronizing with Google Sheets.

Without cryptographic controls, offline records in IndexedDB or localStorage could be altered before sync, or fraudulent interview data could be submitted undetected.

## Decision

We implement a client-side **Cryptographic Anti-Tamper Seal** (SHA-256 hash using the Web Crypto API) coupled with a sequential **Merkle Tree Audit Trail** that chains each collected record to its predecessor.

## Consequences

### Positive
- **Tamper Evidence**: Any alteration to a submitted record's answers, coordinates, or timestamps invalidates its SHA-256 seal immediately.
- **Audit Lineage**: The Merkle chain guarantees chronological integrity and detects deleted or reordered records.
- **Offline Self-Containment**: Relies on browser-native `crypto.subtle` with zero third-party cryptographic dependencies.
- **Supervisor Verification**: Field Supervisors can verify record pristine status directly on the device prior to sync approval.

### Risks & Mitigations
- *Risk*: Symmetric hashing alone does not provide mathematical non-repudiation if the client code is modified.
- *Mitigation*: The supervisor workflow requires a PIN verification step, and Google Apps Script validates the Merkle hash chain on batch ingestion.

