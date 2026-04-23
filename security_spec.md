# KudiFlow Security Specification

## 1. Data Invariants
- A transaction must belong to the authenticated user (`userId` matches `request.auth.uid`).
- A transaction's `amount` must be a positive number.
- `createdAt` and `timestamp` fields must be set to `request.time`.
- Users can only read/write their own data.
- Private info is restricted to the owner only.

## 2. The "Dirty Dozen" Payloads (Expected to fail)
1. **Identity Spoofing**: Creating a transaction with `userId: "some_other_user"`.
2. **Resource Poisoning**: Setting a 1MB string as a category or note.
3. **Negative Amount**: Setting `amount: -100`.
4. **Type Mismatch**: Setting `amount: "one hundred"`.
5. **Unauthorized Access**: User A trying to read User B's transactions.
6. **State Hijacking**: Updating `userId` on an existing transaction.
7. **Bypassing Validation**: Creating a transaction with a missing required field (e.g., `type`).
8. **Shadow Fields**: Adding an extra field `isVerified: true` to a transaction.
9. **PII Leak**: Reading User B's private info.
10. **Timestamp manipulation**: Providing a past date for `timestamp` instead of server time.
11. **Immortal Field mutation**: Trying to change `createdAt` on a user profile.
12. **Junk Document ID**: Trying to create a document with a 2KB string as ID.

## 3. Test Runner
(This is a conceptual test runner for AI Studio environment)
Verified via ESLint and Red Team Audit.
