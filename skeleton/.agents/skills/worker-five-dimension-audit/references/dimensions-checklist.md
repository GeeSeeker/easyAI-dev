# Five-Dimension Checklist Reference

Adapt to each module — not every item applies to every module. Items marked with ★ are high-yield (historically found the most bugs).

---

## Dimension A: Business Logic Closure

### Cross-Platform Consistency
- [ ] Feature X — Backend ✓/✗ | Web ✓/✗ | Mobile ✓/✗ (fill for each feature)
- [ ] Same data shown on web and mobile — are values identical?
- [ ] Business rules (validation, state transitions, calculations) — consistent across layers?

### Feature Completeness
- [ ] ★ Every feature in design docs / PRD — actually implemented end-to-end?
- [ ] ★ State machine transitions — all edges covered? (pending→approved→rejected→cancelled)
- [ ] ★ Side effects of state changes — triggered correctly? (approval passes → update attendance record; only if record exists → else create it)
- [ ] Scheduled tasks — produce same results as manual triggers?
- [ ] Self-referential prevention — self-approval, self-assignment, circular parent references?

### Data Calculation Accuracy
- [ ] ★ Aggregation denominators — correct formula? (people × workingDays, NOT record count)
- [ ] ★ Date calculations — skip non-working days? Handle cross-midnight correctly?
- [ ] Status code semantics — same value same meaning across all tables?

> 📌 示例（Java/Spring Boot）：
> Cross-day time: `Duration.between(LocalTime, LocalTime)` returns negative for cross-midnight; threshold at -720 min (not < 0) separates "arrived early" from "crossed midnight"

### Single vs Batch Consistency ★
- [ ] Does every single-item operation have a batch equivalent? Do both have identical:
  - Validation rules?
  - Security checks?
  - Side effects (audit log, cache invalidation, token cleanup)?
  - Error handling?

> 📌 示例（Java/Spring Boot）：
> `changeStatus(id)` vs `batchUpdateStatus(ids)` — both must clean refresh tokens, set `employee_disabled` key, etc.

---

## Dimension B: Data Flow Integrity

### Backend → Frontend
- [ ] ★ Every field in API response — actually used by frontend? List unused fields
- [ ] ★ Field name mapping — `employeeId` vs `id`, `records` vs `list` vs `data`?
- [ ] ★ API returns DTO (NOT raw Entity) — no internal fields exposed (`version`, `deleted`, `password`, internal IDs, OAuth tokens, biometric IDs)
- [ ] Pagination response — frontend correctly extracts the right wrapper?

### Frontend → Backend
- [ ] Every form field — included in request payload?
- [ ] ★ Null/empty handling — user clears a field → frontend sends null → backend ORM accepts?

> 📌 示例（Java/Spring Boot + MyBatis-Plus）：
> NOT_NULL strategy skips null! Use `@TableField(updateStrategy = FieldStrategy.ALWAYS)` or `LambdaUpdateWrapper.set()`

- [ ] Pagination params — `current`/`size` or `pageNum`/`pageSize`? Match backend expectation

### CRUD Lifecycle
- [ ] After Create/Edit/Delete — list refreshes?
- [ ] Optimistic locking — concurrent edits? (version field / CAS `WHERE action=0`)
- [ ] ★ After status change — dependent data refreshes? (e.g., approval passed → daily attendance updates → dashboard reflects change)

---

## Dimension C: Boundary, Exception & Security

### Empty States
- [ ] Zero records — friendly empty state (not blank/broken)?
- [ ] Search returns nothing — clear message?
- [ ] New system with no data — dashboard shows zeros, not errors?

### Input Validation
- [ ] ★ Required fields — validated on BOTH frontend AND backend?
- [ ] Numeric ranges — validated (latitude [-90,90], radius [50,50000])?
- [ ] String limits — frontend maxlength + backend validation annotation
- [ ] Date logic — end ≥ start? Future dates blocked where inappropriate?
- [ ] Uniqueness — duplicate phone/email/code detected before insert?
- [ ] Regex — format validation for codes, identifiers?

> 📌 示例（Java/Spring Boot）：
> String limits: `@Size(max=50)` + frontend maxlength

### Concurrent Operations
- [ ] ★ Double-submit — button disabled + backend idempotency?
- [ ] ★ Race condition — two approvers simultaneously? (CAS: `WHERE action=0`, update 0 rows → abort)
- [ ] Batch + single running simultaneously?

### Extreme Input
- [ ] Very long text — truncated or overflow?
- [ ] Special characters — HTML/SQL injection prevented?
- [ ] Large dataset — LIMIT clause? (cap unbounded page sizes)

### Security Audit ★★★

#### Annotation Scan (run for EVERY Controller)

> 📌 示例（Java/Spring Boot）：以下为 Spring Security + Jackson 注解审查项，其他框架请替换为对应的安全/验证/序列化注解。

- [ ] ★ Authorization annotation — present on every admin endpoint? Build a permission × controller coverage matrix
- [ ] ★ Request validation annotation — present on every request body parameter? Missing validation → all constraint annotations silently ignored
- [ ] ★ Serialization exclusion annotation — on sensitive Entity fields (password, OAuth tokens, internal IDs, biometric data)?
- [ ] Transaction boundary — external HTTP calls inside transaction? (holds DB connection; consider alternative patterns)

#### Security Config / Public Routes
- [ ] ★ Public route configuration scope — list ALL public paths; does any expose data that should require auth?
- [ ] Verify EVERY public API path — should these really be unauthenticated?
- [ ] CORS configuration — is it overly permissive (allow *)?

#### Authentication Lifecycle
- [ ] ★ Token blacklist resilience — what happens when cache/store is down? Blacklisted token becomes valid?
- [ ] ★ Access token after status change — user disabled/departed → is the access token still valid?
- [ ] Token refresh — does it return updated permissions? (Role changed between refreshes)
- [ ] Token claim type safety — numeric type handling (Integer vs Long casting)

#### Audit Log Coverage
- [ ] ★ Build coverage matrix: every write endpoint (POST/PUT/DELETE) × audit log call present?
- [ ] Export/download endpoints — also need audit logging (data exfiltration risk)
- [ ] Both single and batch operation paths — both log?

#### Privilege Escalation
- [ ] ★ Can a role modify its OWN permissions?
- [ ] Protected entities — cannot delete/modify system-critical records?
- [ ] Protected roles — cannot delete/modify admin roles or their permissions

#### Data Exposure
- [ ] API returns raw Entity instead of DTO → exposes internal fields
- [ ] List endpoints returning password hashes, tokens, internal IDs
- [ ] Error messages revealing stack traces, SQL, internal paths

---

## Dimension D: UX Feedback Completeness

### Loading States
- [ ] ★ Every async operation — has loading indicator?
- [ ] Page initial load — skeleton/spinner, NOT stale fallback data?
- [ ] Form submit — button shows loading + disabled to prevent duplicate
- [ ] Pull-to-refresh or refresh button

### Success/Error Feedback
- [ ] Create/Edit/Delete — toast confirming action?
- [ ] API error — user-friendly message (not raw error code)?
- [ ] Network failure — retry suggestion or offline indicator?
- [ ] Partial success (batch) — show which succeeded, which failed?

### Destructive Action Protection
- [ ] ★ Delete — confirmation dialog with item name?
- [ ] ★ Status change (disable/terminate) — second confirmation with risk warning?
- [ ] Batch destructive — confirmation showing affected count?

### Navigation & Flow
- [ ] After success — redirect to appropriate page?
- [ ] Deep link / parameter passing — pre-fill form fields from navigation params?
- [ ] Back button — returns to expected state?

---

## Dimension E: Platform Adaptation

### Mobile Adaptation

> 📌 示例（微信小程序 / uni-app）：以下为微信小程序平台的典型坑点，其他移动平台请参考对应的布局/滚动/权限约束。

- [ ] ★ Native input component — explicit height setting (padding alone won't work)
- [ ] ★ Scrollable container — native scroll component with explicit pixel height (flex:1 may be broken)
- [ ] ★ Viewport height — use system API to get correct window height (100vh may include status bar)
- [ ] ★ Fixed positioning — may be unreliable in WebView; use absolute + parent relative
- [ ] Dynamic imports — may not be supported; use static imports
- [ ] Popup/modal height — dynamic calculation for screen sizes
- [ ] Camera/GPS permission denied — graceful handling (not error)

### Web (Dark Theme)
- [ ] ★ Hardcoded colors → CSS variables (`var(--bg-card)`)
- [ ] Map/chart popups — themed (not bright white on dark)
- [ ] Font size ≥ 13px badges, ≥ 14px body
- [ ] Contrast ratio sufficient for muted text
- [ ] Third-party components styled consistently

### CSS Compatibility
- [ ] `border-image` + `border-radius` — known conflict; use `::before`
- [ ] `background-clip: text` — fragile; prefer solid `color`
- [ ] `overflow-y: auto` on mobile — may not work; use native scroll component

### Cross-Verification Matrices ★
When a feature spans multiple layers (permission, routing, UI visibility), build a matrix:

```
| Permission Code | DB Seed | Auth Annotation | Web Sidebar | Web Route Guard | Mobile Nav | Mobile Page Guard |
|----------------|:-------:|:--------------:|:-----------:|:--------------:|:----------:|:-----------------:|
| PERM_employee  | ✓       | ✓              | ✓           | ✓              | ✓          | ✗ MISSING         |
```

Also build matrices for:
- Token lifecycle × session invalidation scenarios
- Degradation scenarios (cache/store down × each operation → expected behavior)
- Single vs batch operations × security checks
