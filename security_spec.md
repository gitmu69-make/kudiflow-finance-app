# Security Specification for KudiFlow

## Data Invariants
1. A transaction must have a `userId` that matches the authenticated user.
2. A transaction `amount` must be a positive number.
3. `timestamp` must be the server time.
4. `type` must be either 'sale' or 'expense'.
5. User profiles can only be created/modified by the owner.

## The "Dirty Dozen" Payloads (Expected to be DENIED)
1. **Identity Spoofing**: Creating a transaction for another user's `userId`.
2. **Invalid Amount**: Negative transaction amount.
3. **Type Poisoning**: `type` set to 'refund' (not in enum).
4. **Timestamp Manipulation**: Providing a backdated client timestamp instead of `request.time`.
5. **Unauthorized Profile Read**: User A trying to read User B's profile.
6. **Malicious Transaction Update**: User A trying to update User B's transaction.
7. **Phantom Field**: Adding an `isAdmin: true` field to a transaction.
8. **Resource Exhaustion**: Sending a 2KB note (max should be smaller).
9. **ID Injection**: Using a 500-character document ID.
10. **State Flip**: Changing the `userId` of an existing transaction (orphan write).
11. **Guest Privilege Escalation**: Guest user trying to access a collection they don't own (if rules were loose).
12. **Blanket Query**: Authenticated user trying to list ALL transactions without a where clause (rules must enforce query filters).

## Test Runner
I will create `firestore.rules.test.ts` to verify these protections.
