# Call-Chain Verification Methodology

Post-fix verification that traces every caller of modified code to detect regressions, missed paths, and cross-module dependencies.

## When to Enter Phase 2

Enter Phase 2 **immediately after fixing P0/P1 issues for one module** — NOT after all modules are done. The loop is:
```
Audit M1 → Fix M1 P0/P1 → VERIFY M1 fixes → Audit M2 → Fix M2 P0/P1 → VERIFY M2 fixes → ...
```

If Phase 2 finds regressions, fix them and re-verify (second-pass verification) before proceeding.

## Why This Matters

A single method may have 15+ callers across 7 files. A fix that works for the reported path can break others. Real examples:

- `employeeService.updateById()` — 15+ callers across 7 files. Adding status check broke approval flows
- `ShiftUtil.minutesFromShiftStart()` — 3 callers. Cross-midnight fix broke early-arrival detection
- `RoleController.update()` — Using `throw` to block name changes blocked permission updates downstream
- `changeStatus()` — Fixed to add Redis key, but `batchUpdateStatus()` (same operation, batch form) was missed

## Verification Process

### Step 1: Identify the Fix Scope

For each fix, document:
- **Modified method(s)**: Exact method signature changed
- **Modified behavior**: What the method does differently now
- **Preconditions changed**: New checks, validations, early returns added
- **New side effects**: Cache invalidation, Redis keys, notifications added

### Step 2: Build Global Caller Inventory ★

Search the ENTIRE codebase for ALL callers. Document as a table:

```markdown
### {methodName}() — {N} callers across {M} files

| # | Caller Method | File | Line | Input Pattern | Affected? |
|---|--------------|------|------|--------------|:---------:|
| 1 | punch() | PunchService.java | 91 | employee with status 1-3 | ✓ Verified |
| 2 | registerFace() | PunchService.java | 200 | always status=1 | — N/A |
| 3 | checkConsecutiveMiss() | AttendanceScheduler.java | 150 | punchEnabled=0 | ⚠ Check |
```

Search strategy:
```
Grep for: methodName(
Also check: interface/abstract method implementations
Also check: reflection-based calls, dynamic dispatch
Include: Controllers, Services, Scheduled tasks, Event listeners
```

For each caller, answer these 3 questions:
1. Does this caller pass inputs that the fix handles correctly?
2. Does this caller depend on the OLD behavior?
3. Could this caller trigger the fix's new code path unintentionally?

### Step 3: Check Single vs Batch Consistency ★

If the fixed method has both a single-item and a batch form (very common), verify BOTH paths have the same fix applied:

| Operation | Single Path | Batch Path | Same Fix? |
|-----------|-----------|-----------|:---------:|
| changeStatus | `changeStatus()` — ✅ adds Redis key | `batchUpdateStatus()` — ✗ MISSING | **REGRESSION** |
| togglePunch | `togglePunchEnabled()` — ✅ 3 security checks | `batchTogglePunch()` — ✗ only 1 check | **REGRESSION** |

### Step 4: Check FieldStrategy Propagation ★

If the fix adds `@TableField(updateStrategy = FieldStrategy.ALWAYS)` to one field, scan ALL nullable fields in the same Entity for consistency:

```markdown
### Employee Entity — Nullable Fields Strategy Check

| Field | Can be null? | Current Strategy | Needs ALWAYS? |
|-------|:-----------:|:---------------:|:-------------:|
| leaderId | ✓ (clear leader) | ALWAYS ✅ | — |
| shiftId | ✓ (inherit dept) | ALWAYS ✅ | — |
| punchDisabledAt | ✓ (re-enable) | NOT_NULL ✗ | YES → REGRESSION |
```

### Step 5: Regression Detection Patterns

#### Pattern 1: Early Return / Throw Blocks Downstream Code
```java
// BAD: throw blocks side effects that MUST run
if (isProtected(role)) throw new BizException("cannot modify");
role.setName(request.getName());     // never reached for protected
roleService.updateById(role);        // never reached
saveRolePermissions(id, perms);      // never reached — THIS WAS NEEDED!

// GOOD: if-skip pattern — skip name change, continue to permissions
if (!isProtected(role)) {
    role.setName(request.getName());
    roleService.updateById(role);
}
saveRolePermissions(id, perms);      // always runs
```

#### Pattern 2: Threshold Too Broad / Too Narrow
```java
// BAD: catches valid negatives (-30 = arrived 30min early)
if (minutes < 0 && isCrossDay) minutes += 1440;

// GOOD: only catches cross-midnight (< -720 = half day)
if (minutes < -720 && isCrossDay) minutes += 1440;
```

Derive with concrete values:
```
21:30 arrive for 22:00 shift → Duration = -30 → NOT < -720 → keeps -30 → early ✓
01:00 arrive for 22:00 shift → Duration = -1260 → IS < -720 → +1440 = 180 → late 3h ✓
```

#### Pattern 3: ORM Strategy Mismatch
```java
// entity.setField(null) + updateById → field NOT updated (NOT_NULL skips null)
// Fix: @TableField(updateStrategy = FieldStrategy.ALWAYS)
//   OR: LambdaUpdateWrapper.set(Entity::getField, null)
```

#### Pattern 4: Fix Creates N+1 Query
```java
// BAD: fix adds service call inside loop
for (record : records) {
    Shift shift = shiftService.getById(record.getShiftId());  // N+1!
}

// GOOD: pre-load into map
Map<Long, Shift> cache = shiftService.listByIds(shiftIds)
    .stream().collect(toMap(Shift::getId, s -> s));
for (record : records) {
    Shift shift = cache.get(record.getShiftId());  // O(1)
}
```

#### Pattern 5: CAS Update + Full Update Conflict
```java
// CAS: wrapper.eq(retryCount, current).set(retryCount, current+1)
// Then updateById with stale retryCount → REVERTS the CAS value!
// Fix: entity.setRetryCount(null) before updateById (NOT_NULL skips it)
```

#### Pattern 6: Missing Multi-Level Check
```java
// Fix checks levels 1 and 2, but misses level 3:
// Level 1: personal shift → isShiftActive(shift) ✓
// Level 2: department shift → isShiftActive(shift) ✓
// Level 3: system default shift → isShiftActive(shift) ✗ MISSED!
```

### Step 6: Document Results

| Result | Meaning | Action |
|--------|---------|--------|
| **CONFIRMED** | Fix correct, all callers verified | None |
| **REGRESSION** | Fix introduced new bug | Immediate fix + re-verify |
| **MISSED_PATH** | Some callers bypass the fix | Assess risk; fix if high |
| **FALSE_POSITIVE** | Original issue was not actually a bug | Document reasoning |

### Step 7: Track CHAIN-N Cross-Module Issues

Fixes often reveal issues in ADJACENT code. These are first-class issues tracked as CHAIN-N:

```markdown
| CHAIN-N | Origin | Target Module | Severity | Description |
|---------|--------|:------------:|:--------:|-------------|
| CHAIN-1 | M3-P2-6 fix | M3 | P2 | batchUpdateStatus missed Redis employee_disabled key |
| CHAIN-2 | M4-P2-2 fix | M4 | P2 | resolveShift 3rd level (system default) missed active check |
| CHAIN-3 | M5-P2-3 fix | M5 | P2 | shiftService.getById() in loop → N+1 query |
```

CHAIN items must be:
1. Added to the relevant module's issue list
2. Fixed with the same quality standard
3. Verified with their own caller inventory
4. Included in the living summary document

### Step 8: Second-Pass Verification

After fixing regressions and CHAIN issues, do ONE MORE verification pass:
1. Re-read all fixes from this round (original + regression fixes + CHAIN fixes)
2. Check if regression fixes introduced their own regressions
3. Only proceed to next module when all items are CONFIRMED

This catches the scenario where "fixing the fix" introduces yet another bug — observed in real audits (M4-P1-1 → regression → fix → CONFIRMED on second pass).
