# OCEAN SYSTEM — Firestore Security Specification & Red Team Audit (`security_spec.md`)

## 1. Master Source of Truth & Data Invariants

1. **Identity & Verification Invariant**: Every read and write operation across `/stateBatches/{batchId}` and `/surveys/{surveyId}` requires a signed-in user with `request.auth.token.email_verified == true`.
2. **Strict Ownership Isolation (Zero Blanket Reads)**: Each researcher/account only reads, lists, creates, or deletes records where `ownerId == request.auth.uid`. Blanket `allow list: if isSignedIn();` is strictly forbidden.
3. **Relational Consistency Invariant**: Every `/surveys/{surveyId}` document must either have `batchId == 'MANUAL'` (single survey capture) or reference an existing `/stateBatches/{batchId}` document whose `ownerId == request.auth.uid`.
4. **Temporal Integrity & Immutability**: `createdAt` must strictly equal `request.time` on creation (`serverTimestamp()`). Both `/stateBatches` (`status == 'completed'`) and `/surveys` are immutable audit records (updates are locked; corrections occur by deleting an erroneous batch/record owned by `request.auth.uid` and re-importing).
5. **Volumetric & Shadow-Field Guards**: Every document ID is guarded with `isValidId()` (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars) on single-document operations (`get`, `create`, `update`, `delete`), and every payload enforces `keys().hasAll(...) && keys().hasOnly(...)` plus strict string/map/list `.size()` bounds.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Unauthenticated Write**: `auth = null`, creating `/stateBatches/batch_01` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email_verified: false } }`, creating `/surveys/s_01` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: `auth.uid = 'u1'`, payload sets `ownerId: 'u2'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection ("Ghost Key")**: Valid `/stateBatches/batch_01` payload + `isAdmin: true` -> `PERMISSION_DENIED` (`hasOnly` rejection).
5. **Forged Client Timestamp**: Payload sets `createdAt: Timestamp.fromMillis(1700000000000)` instead of `request.time` -> `PERMISSION_DENIED`.
6. **ID Poisoning Attack**: Document ID contains spaces/slashes or 500 characters -> `PERMISSION_DENIED` (`isValidId` guard).
7. **Orphaned Batch Reference**: Creating `/surveys/s_01` with `batchId: 'non_existent_batch'` -> `PERMISSION_DENIED` (`exists` + `get().data.ownerId` check).
8. **Cross-Tenant Batch Hijack**: User `u1` creates `/surveys/s_01` referencing `batchId` owned by `u2` -> `PERMISSION_DENIED`.
9. **Terminal State Mutation**: Attempting `update` on `/stateBatches/batch_01` where `status == 'completed'` -> `PERMISSION_DENIED`.
10. **Survey Tampering Update**: Attempting `update` on `/surveys/s_01` to alter `folio` or `ownerId` -> `PERMISSION_DENIED`.
11. **Unfiltered List Scraping**: User `u1` executes `collection(db, 'surveys')` without `where('ownerId', '==', 'u1')` -> `PERMISSION_DENIED` (`resource.data.ownerId == request.auth.uid`).
12. **Denial-of-Wallet Oversized String/Array**: Payload injects a 10,000-char `entidad` string or 50-item `p11_preocupaciones_top3` array -> `PERMISSION_DENIED`.

## 3. Red Team Conflict Report

- **Collection `/stateBatches/{batchId}`**:
  - *Shadow Update Test*: PASS (`allow update: if false;` — terminal state `'completed'` locked on creation, and `create` enforces `hasAll` + `hasOnly`).
  - *Email Spoofing Test*: PASS (`isVerifiedUser()` checks `request.auth.token.email_verified == true`).
  - *PII Blanket Test*: PASS (No PII stored; strict `resource.data.ownerId == request.auth.uid` on `get` and `list`).
  - *Query Trust Test*: PASS (`allow list` enforces `resource.data.ownerId == request.auth.uid` with zero `get()`/`exists()` calls).
- **Collection `/surveys/{surveyId}`**:
  - *Identity Spoofing*: PASS (`incoming().ownerId == request.auth.uid`).
  - *Orphaned Write*: PASS (`batchId == 'MANUAL'` or verified existing `/stateBatches/$(incoming().batchId)` owned by caller).
  - *Resource/Value Poisoning*: PASS (`isValidOrusSurvey(incoming())` validates all nested block maps, string bounds, and array `.size()` limits).
