# Security Specification: Khanqah Darul Falah Firestore Rules

## Phase 0: Data Invariants
1. **Default-Deny Baseline**: Every path defaults to `false` unless explicitly matched.
2. **Admin Schedule Integrity (`/khanqahSchedule/official`)**: Only verified Admins (`email_verified == true` AND in trusted list or `/admins/{uid}`) may create or update the official Jamaat schedule; list scraping is disabled.
3. **Zero-PII Device Deduplication (`/appDevices/{deviceId}`)**: Device records contain zero PII (no email, phone, IP, name, or geolocation). Document ID must strictly match `deviceId` (`^[a-zA-Z0-9_\-]+$`, length 16–64), `list` queries are forbidden to prevent scraping, and state flags (`installed`, `apkDownloaded`) are monotonically latched (`false -> true`, never `true -> false`).
4. **Bounded Atomic Counter Integrity (`/appStats/summary`)**: Only document ID `'summary'` exists. Counters (`totalInstalledDevices`, `totalPwaInstalls`, `totalApkClicks`, `totalWebUsers`) are non-negative integers that can increment by at most `+1` per valid atomic batch paired with a `/appDevices/{deviceId}` write (`existsAfter`), preventing arbitrary inflation or resets unless performed by a verified Admin.
5. **Strict Timestamps & Field Allowlists**: All writes require `updatedAt == request.time` (`createdAt == request.time` on create), strict `hasAll` + `hasOnly` field validation, and bounded string lengths.

## Dirty Dozen Adversarial Payloads (Must All Yield PERMISSION_DENIED)
1. **Shadow Field Injection on Schedule**: Adding `isVerified: true` to `/khanqahSchedule/official` update -> Rejected by `hasOnly`.
2. **Unverified Email Admin Spoof**: Token has admin email with `email_verified: false` -> Rejected by `isVerifiedUser()`.
3. **Collection List Scraping on `/appDevices`**: Calling `getDocs(collection(db, 'appDevices'))` as a non-admin -> Rejected by `allow list: if false`.
4. **Collection List Scraping on `/khanqahSchedule`**: Calling `getDocs(collection(db, 'khanqahSchedule'))` -> Rejected by `allow list: if false`.
5. **Invalid Device ID Poisoning**: Creating `/appDevices/short` or `/appDevices/../../../evil` or 1KB ID -> Rejected by `isValidDeviceId()`.
6. **Device ID Mismatch**: Creating `/appDevices/dev_1234567890123456` with `data.deviceId == 'other_id_12345678'` -> Rejected by `incoming().deviceId == deviceId`.
7. **Counter Inflation Attack**: Updating `/appStats/summary` with `totalInstalledDevices: existing + 5000` -> Rejected by `+1` step invariant.
8. **Counter Reset Attack**: Updating `/appStats/summary` with `totalInstalledDevices: 0` -> Rejected by monotonic `>= existing()` rule.
9. **Orphan Counter Bump**: Updating `/appStats/summary` with zero fields incremented (`delta == 0`) or fake timestamp -> Rejected by `request.time` and at-least-one-increment check.
10. **PII / Shadow Field on `/appDevices`**: Creating `/appDevices/{id}` with extra field `email: 'test@example.com'` -> Rejected by `hasOnly`.
11. **Device Latch Reversal**: Updating `/appDevices/{id}` from `installed: true` back to `installed: false` -> Rejected by monotonic latch rule.
12. **Deletion Attack**: Attempting `deleteDoc` on `/appStats/summary`, `/appDevices/{id}`, or `/khanqahSchedule/official` -> Rejected by `allow delete: if false`.
