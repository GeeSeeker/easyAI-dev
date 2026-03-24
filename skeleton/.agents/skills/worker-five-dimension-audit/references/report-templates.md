# Report Templates & Issue Writing Standards

## Output Directory & File Naming

All reports go into `.docs/audit/`, organized by module subdirectories. File naming:

| Report Type | File Name Pattern | Example |
|------------|------------------|---------:|
| Full module audit | `M{N}_{ModuleName}.md` | `M1_Attendance.md` |
| PATCH (1st) | `M{N}-PATCH_{Desc}.md` | `M1-PATCH_ClockInUX.md` |
| PATCH (2nd+) | `M{N}-PATCH{K}_{Desc}.md` | `M1-PATCH2_TimezoneFixup.md` |
| Cross-cutting PATCH | `M{new}-PATCH_{Desc}.md` | `M9-PATCH_PermissionFullChain.md` |
| Fix verification | `fix-verification_{date}.md` | `fix-verification_2026-03-04.md` |
| Call-chain data | `call-chain-data.md` | (single persistent file) |
| Living summary | `issue-summary.md` | (single file, keep updating) |

---

## Issue Writing Standards (Apply to ALL Templates)

### Mandatory Fields by Severity

| Field | P0 | P1 | P2 | P3 |
|-------|:-:|:-:|:-:|:-:|
| Position (exact file + line) | ✓ | ✓ | ✓ | Optional |
| Dimension (A/B/C/D/E) | ✓ | ✓ | ✓ | ✓ |
| Description (mechanism-first) | ✓ | ✓ | ✓ | ✓ |
| Impact (user-visible consequence) | ✓ | ✓ | ✓ | Optional |
| Fix (concrete code-level change) | ✓ | ✓ | ✓ | Suggestion |

### Writing Rules

1. **Position** — Always include exact file path + line number. Even for P2/P3 issues.
   - Good: `PunchService.java` line 91-97
   - Bad: `PunchService`

2. **Description: Mechanism-first** — Start with WHAT the code does wrong technically, then explain WHY that's a problem.
   - Good: "只检查 `punchEnabled`，不检查 `employee.getStatus()`。status=2(离职) 的员工若 `punchEnabled=1` 仍可打卡"
   - Bad: "离职员工可以打卡"

3. **Impact: User-visible** — Describe what the end user experiences, not what the code does.
   - Good: "请假员工当天无打卡记录会收到'缺卡提醒'通知"
   - Bad: "hasApplicationForDate() 未被调用"

4. **Fix: Concrete code** — Specify the actual change, not vague guidance.
   - Good: "在 punchEnabled 检查后增加 `if (employee.getStatus() != 1) throw PUNCH_NOT_ENABLED`"
   - Bad: "应该检查员工状态"

5. **Bug derivation (for P0/P1 level)** — Step-by-step walkthrough with concrete values:
   ```
   班次 22:00-06:00, 员工 21:30 打卡:
   Duration.between(22:00, 21:30) = -30 min
   isCrossDay = true, minutes < 0 → +1440
   结果: 1410 min = 23.5 小时 → 判定迟到 1380 分钟!
   实际: 提前 30 分钟到, 迟到 0 分钟
   ```

### Status Icons Convention

| Icon | Meaning |
|:----:|---------:|
| ✅ | Fixed and verified |
| ⚪ | Not-need-fix (must include reasoning) |
| ⚠ | Partial / known limitation |
| ✗ | Issue exists, unfixed |

### Not-Need-Fix Documentation

When marking ⚪, MUST include specific reasoning. Templates:

```markdown
| P2-4 | {title} | {file} | {type} | ⚪ 不需修复：{reason} |
```

Categories of valid reasoning:
- "设计意图"：{explain the design rationale}
- "已修复过"：{reference the prior fix ID}
- "属于产品迭代需求，非当前Bug"
- "当前规模可接受（{N}级数据量），优化需引入{X}"
- "改动风险大于收益：需{refactor scope}，当前{why acceptable}"
- "已有其他机制覆盖：{mechanism name}"

---

## Template 1: Full Module Audit Report

```markdown
# M{N} {Module Name} — Five-Dimension Deep Audit Report

> Audit date: YYYY-MM-DD
> Severity: P0=Feature broken | P1=Wrong result/critical miss | P2=Incomplete display/UX miss | P3=Optimization
> Scope: {Controller → Service → Web page → Mobile page mapping}

---

## Module Scope

| Layer | Files |
|-------|-------|
| Backend Controller | `{path}` ({N} endpoints) |
| Backend Service | `{path}` |
| Web Frontend | `{path}` |
| Mobile Frontend | `{path}` |

## Audit Overview

| Dimension | P0 | P1 | P2 | P3 | Total |
|-----------|:-:|:-:|:-:|:-:|:-----:|
| A Business Logic   | 0 | 0 | 0 | 0 | 0 |
| B Data Flow        | 0 | 0 | 0 | 0 | 0 |
| C Boundary & Security | 0 | 0 | 0 | 0 | 0 |
| D UX Feedback      | 0 | 0 | 0 | 0 | 0 |
| E Platform Adapt   | 0 | 0 | 0 | 0 | 0 |
| **Total**          | **0** | **0** | **0** | **0** | **0** |

---

## P0-Level Issues [AUDIT_FINDING: P0]

### P0-1 {Title}
- **Position**: `{file_path}` line {N}
- **Dimension**: {A/B/C/D/E} {name}
- **Description**: {mechanism-first: what the code does wrong, then why}
- **Impact**: {user-visible consequence}
- **Bug Derivation**: {step-by-step with concrete values}
- **Fix**: {concrete code change}

---

## P1-Level Issues (Fix same day) [AUDIT_FINDING: P1]

### P1-1 {Title}
- **Position**: `{file_path}` line {N}
- **Dimension**: {dimension}
- **Description**: {mechanism-first}
- **Impact**: {user-visible}
- **Fix**: {concrete}

---

## P2-Level Issues (Fix this week)

### P2-1 {Title}
- **Position**: `{file_path}` line {N}
- **Dimension**: {dimension}
- **Description**: {mechanism-first}
- **Impact**: {user-visible}
- **Fix**: {concrete}

---

## P3-Level Issues (Schedule later)

### P3-1 {Title}
- **Position**: `{file_path}` (line optional)
- **Description**: {observation}
- **Suggestion**: {recommendation}

---

## Security Audit Results

### Annotation Coverage

| Controller | Auth Annotation | Validation on params | Serialization exclusion | Audit log |
|-----------|:------------:|:---------------:|:--------------------:|:---------:|
| {Name}Controller | ✓/{N} endpoints | ✓/{N} params | ✓ | ✓/{N} writes |

### Public Route Review
{List all public paths and whether they should really be public}

---

## Checklist Summary

### A. Business Logic Closure

| Check Item | Backend | Web | Mobile | Result |
|-----------|:------:|:---:|:------:|:------:|
| {Feature 1} | ✓ | ✓ | ✓ | ✅ |
| {Feature 2} | ✓ | ✗ | ✓ | **P2-3** |

### B. Data Flow Integrity

| Check Item | Result |
|-----------|:------:|
| {field usage} | ✅ / ✗ {ref} |

### C. Boundary & Security

| Check Item | Result |
|-----------|:------:|
| {check item} | ✅ / ✗ {ref} |

### D. UX Feedback

| Check Item | Result |
|-----------|:------:|
| {check item} | ✅ / ✗ {ref} |

### E. Platform Adaptation

| Check Item | Result |
|-----------|:------:|
| {check item} | ✅ / ✗ {ref} |

---

## Next Steps

1. Immediately fix P0-level: {list}
2. Same day fix P1-level: {list}
3. This week fix P2-level (in order)
4. Schedule P3-level into iteration plan
```

---

## Template 2: PATCH Report (Incremental)

Naming convention:
- `M{N}-PATCH` → first patch to module N
- `M{N}-PATCH2` → second patch to module N
- `M{new_number}-PATCH` → new module number for cross-cutting concerns (e.g., M9-PATCH for permission system spanning M3+M7)

```markdown
# M{N}-PATCH{K} {Change Description} — Five-Dimension Deep Audit Report

> Audit date: YYYY-MM-DD
> Scope: {explicit boundary statement: which files, which changes, which features}
> Severity: P0=Feature broken | P1=Wrong result/critical miss | P2=Incomplete display/UX miss | P3=Optimization

---

## Audit Overview

| Dimension | P0 | P1 | P2 | P3 | Total |
|-----------|:-:|:-:|:-:|:-:|:-----:|
| ... |

> ✅ {list of issues fixed on same day}

---

## {P0/P1/P2/P3-Level Issues}

{Same format as Template 1 — mechanism-first description, user-visible impact, concrete fix}

---

## Chain Integrity Verification

### Chain 1: {data flow name}
| Node | Data | Status |
|------|------|--------|
| {step} | {data passing} | ✅ |

### Chain 2: {entry points for same operation}
| Entry Point | Params | Status |
|------------|--------|--------|
| {entry} | {params} | ✅ |

---

## Cross-Verification Matrix (if applicable)

{Permission matrix, lifecycle matrix, or degradation matrix as needed}

---

## Modified Files (MANDATORY)

| File | Change Type | Description |
|------|-----------|-------------|
| `{path}` | New/Modified/Deleted | {what changed} |

---

## Conclusion

{N files, ~M lines. X issues found (Y severity). Fixed items and remaining items.}
```

---

## Template 3: Fix Verification Report (Call-Chain)

```markdown
# Fix Verification — Call-Chain Tracing

> Date: YYYY-MM-DD
> Scope: {list of fixes being verified}

## Verification Results

| Fix Item | Verification | Risk | Key Code Location |
|----------|:-----------:|:----:|-------------------|
| {M1-P0-1 desc} | ✅ CONFIRMED | — | file.java L91-97 |
| {M4-P1-1 desc} | ❌ REGRESSION | High | ShiftUtil.java L50-58 |
| {M3-P1-1 desc} | ⚠ MISSED_PATH | Low | 6 callers bypass; functional fields only |

## Global Caller Inventory (for key modified methods)

### {methodName}() — {N} callers across {M} files
| Caller | File | Inputs | Affected by Fix? |
|--------|------|--------|:---------------:|
| {caller1} | {file} | {typical input} | ✓ Verified |
| {caller2} | {file} | {typical input} | ✗ REGRESSION |

## Regressions Found

### {Fix ID}: {Description}

#### Problem Code
`{file}` line {N}:
{code snippet}

#### Bug Derivation (concrete values)
{step-by-step with real numbers showing the regression}

#### Root Cause
{Why the fix broke this path}

#### Fix
{Corrected code}

#### Impact Scope
{All affected callers}

## Chain-Derived Issues

| CHAIN-N | Origin Fix | Module | Severity | Description |
|---------|-----------|--------|:--------:|-------------|
| CHAIN-1 | M3-P2-6 | M3 | P2 | batchUpdateStatus missed same Redis key logic as changeStatus |

## Missed Paths (Low Risk)

### {Fix ID}: {Description}
{Paths that bypass; why acceptable}

## Confirmed Fixes
| Fix | Key Verification Point |
|-----|----------------------|
| {M1-P1-1} | {code location + what was checked} |
```

---

## Template 4: Living Summary (Updated After Every Audit/PATCH)

```markdown
# Five-Dimension Deep Audit — Issue Summary

> Last updated: YYYY-MM-DD | Modules: M1~M{N}
> Fix stats: P0 {n}/{n} | P1 {n}/{n} | P2 {n}/{n} | P3 {n}/{n}
> Chain fixes: {n}/{n}

---

## Statistics

| Level | Total | Fixed | Not-needed | Remaining |
|-------|:-----:|:-----:|:----------:|:---------:|
| P0    | 0     | 0     | 0          | 0         |
| P1    | 0     | 0     | 0          | 0         |
| P2    | 0     | 0     | 0          | 0         |
| P3    | 0     | 0     | 0          | 0         |
| Chain | 0     | 0     | 0          | 0         |
| **Total** | **0** | **0** | **0** | **0** |

## By Module

### M1 {Name} ({N} issues) ✅ All processed

| # | Issue | Position | Dimension | Status |
|---|-------|----------|-----------|:------:|
| P0-1 | {title} | {file} | {dim} | ✅ / ⚪ reason |

{Repeat per module, including PATCH findings}

## Fix Priority Recommendation

### Priority 1: Security & Data Correctness (This week)
| Issue | Impact | Effort |
|-------|--------|--------|

### Priority 2: Business Logic Accuracy (This week)
| Issue | Impact | Effort |
|-------|--------|--------|

### Priority 3: Performance & Memory (Next week)
| Issue | Impact | Effort |
|-------|--------|--------|

### Priority 4: UX & Platform Adaptation (Schedule)
{Remaining items}
```

---

## Degradation Scenario Table Template

Use when auditing features that depend on infrastructure (Redis, external APIs, etc.):

```markdown
## Degradation Verification

| Scenario | Expected Behavior | Actual | Status |
|----------|------------------|--------|:------:|
| Cache down + user login | Session created, cache check skipped | {actual} | ✅ |
| Cache down + user logout | Local blacklist used | {actual} | ✅ |
| Cache recovery after outage | New generation written, old tokens rejected | {actual} | ✅ |
| External API timeout in transaction | DB connection held for timeout duration | {actual} | ⚠ |
```
