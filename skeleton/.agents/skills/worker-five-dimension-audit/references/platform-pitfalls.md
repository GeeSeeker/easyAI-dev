# Platform-Specific Pitfalls

> [EXAMPLE] 本文档内容为特定技术栈（微信小程序 + Vue/Web + Java/Spring Boot）的平台适配示例。
> 使用本 Skill 时，请根据实际项目技术栈替换或补充对应的平台坑点。

Known issues that pass in development but fail on real devices or specific environments.

---

## WeChat Mini-Program

### Layout & Scrolling

| Pitfall | Wrong | Correct |
|---------|-------|---------|
| `<input>` is a native component | `padding` to set height | Explicit `height: 80rpx; padding: 0 24rpx` |
| `<scroll-view>` is the only scrollable component | `<view>` + `overflow-y: auto` | `<scroll-view scroll-y>` with explicit pixel height |
| `<scroll-view>` doesn't support flex | `flex: 1; height: 0` | Calculate pixel height dynamically |
| `100vh` includes status bar | `height: 100vh` | `uni.getSystemInfoSync().windowHeight` |
| `position: fixed` unreliable in WebView | `position: fixed; bottom: 0` | `position: absolute` + parent `relative` |

### Height Calculation Pattern
```javascript
const sysInfo = uni.getSystemInfoSync()
const windowHeight = sysInfo.windowHeight
const ratio = sysInfo.screenWidth / 750  // rpx → px

const headerH = 88 * ratio
const footerH = 100 * ratio
const safeBottom = sysInfo.safeAreaInsets?.bottom || 0
const bodyHeight = windowHeight - headerH - footerH - safeBottom
// Set as scroll-view's style.height in px
```

### JavaScript Compatibility

| Pitfall | Wrong | Correct |
|---------|-------|---------|
| Dynamic `import()` | `await import('./util')` | `import { fn } from './util'` (static) |
| Optional chaining in templates | `{{ obj?.prop }}` | `{{ obj && obj.prop }}` or computed |
| Canvas API deprecated | `uni.createCanvasContext` | `<canvas type="2d">` + `getContext('2d')` |

### Permissions & Native APIs
- **Camera denied**: Show "go to settings" prompt, not error
- **GPS unavailable**: Show "location unavailable" with fallback UI
- **Subscription message denied**: Fail silently, never show error to user

---

## Web Frontend (Dark Theme)

### Color System
```css
/* WRONG: hardcoded */
.card { background: #FFFFFF; color: #333; border: 1px solid #E5E5E5; }

/* CORRECT: CSS variables */
.card { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); }
```

### Common Violations

| Location | Issue | Fix |
|----------|-------|-----|
| Map InfoWindow / popup HTML | Inline light colors | CSS variables in inline styles |
| Chart libraries (ECharts etc.) | Default light palette | Configure theme object |
| Status badges | Hardcoded backgrounds | Theme-aware classes |
| Hover/active states | Invisible on dark | Contrast ratio ≥ 3:1 |

### Typography Minimums

| Element | Minimum | Why |
|---------|---------|-----|
| Badge / label | 13px | Readability at small sizes |
| Body / controls | 14px | Accessibility standard |
| Secondary text | 13px | Must still be legible |

### Contrast for Muted Colors
- `--text-muted`: ≥ #8E8E98 (not #717171)
- `--text-tertiary`: ≥ #A0A0AA (not #8B8B94)
- `--border-light`: ≥ #4A4A52 (not #333339)

---

## CSS Compatibility

| Combination | Issue | Workaround |
|------------|-------|------------|
| `border-image` + `border-radius` | radius ignored | `::before` pseudo-element + `overflow: hidden` |
| `background-clip: text` + `text-fill-color: transparent` | Fragile cross-browser | Prefer solid `color` |
| `overflow-y: auto` in mobile WebView | Scroll broken on real devices | Use native `<scroll-view>` |

### Safe Patterns
- Prefer `min-height` over `height` for growable containers
- Use `calc()` for dynamic layouts
- Test `type="number"` vs `inputmode="numeric"` on mobile keyboards

---

## Backend (Java / Spring Boot)

### MyBatis-Plus ORM ★

| Pitfall | Why It Breaks | Fix |
|---------|-------------|-----|
| NOT_NULL strategy ignores null | `entity.setField(null); updateById()` → field unchanged | `@TableField(updateStrategy = FieldStrategy.ALWAYS)` or `LambdaUpdateWrapper.set()` |
| FieldStrategy not propagated | One nullable field fixed with ALWAYS, but 3 other nullable fields in same Entity still use NOT_NULL | **Scan ALL nullable fields** in Entity when fixing one |
| `BeanUtils.copyProperties` skips name mismatch | `id` → `employeeId` won't copy | Manual `setEmployeeId(entity.getId())` |
| MySQL reserved word `year_month` | Query fails | Always backtick: `` `year_month` `` |
| `.in()` with empty collection | SQL error: `IN ()` | Guard: `if (!ids.isEmpty())` |
| CAS update + full updateById | `updateById` overwrites CAS-managed field | Set CAS fields to `null` before `updateById` |

### Spring Security ★

| Pitfall | Why It's Critical | Audit Action |
|---------|-----------------|-------------|
| `SecurityConfig.permitAll` too broad | `/api/common/**` exposes org structure | List ALL permitAll paths; verify each should be public |
| Missing `@PreAuthorize` | Endpoint accessible to any authenticated user | Build permission × endpoint matrix |
| Missing `@Valid` | All `@NotNull/@Size/@Pattern` silently ignored | Scan every `@RequestBody` parameter |
| Missing `@JsonIgnore` | Password hash, wxOpenid in API response | Check every Entity returned by API |

### JWT / Session ★

| Pitfall | Why It's Critical | Fix |
|---------|-----------------|-----|
| Token blacklist fails when Redis down | `safeHasKey()` returns false → blacklisted token valid | Add local blacklist (ConcurrentHashMap) as fallback |
| Access token valid after disable/depart | Refresh token deleted but access token still works | Add `employee_disabled:{id}` Redis key; check in filter |
| Refresh doesn't update permissions | Frontend keeps old permissions after role change | Return permissions/roleCode in refresh response |
| JWT claim Integer vs Long | Small numbers stored as Integer; `get("gen", Long.class)` throws | `((Number) val).longValue()` |
| Gen key without TTL | Redis key grows forever | Set TTL > max token lifetime |

### Transaction ★

| Pitfall | Why It Breaks | Fix |
|---------|-------------|-----|
| HTTP inside `@Transactional` | Slow HTTP holds DB connection for entire duration | Use `TransactionTemplate` — commit first, then HTTP |
| `throw` inside combined logic | Exception aborts ALL subsequent code including needed side effects | if-skip pattern: `if (!blocked) { doA(); } doB();` |
| Audit log after throw | `auditLogService.log()` after `throw` → never reached | Log before throw, or use finally block |

### Degradation Scenario Audit ★

For any feature depending on Redis/external APIs, build a degradation table:

| Scenario | Expected Behavior | Verified? |
|----------|------------------|:---------:|
| Redis down + login | Gen stays 0, login OK, gen check skipped | |
| Redis down + logout | Local blacklist used | |
| Redis recovery | New gen written, old tokens rejected | |
| External API timeout in @Transactional | DB connection held for timeout duration | |
| External API returns error | Graceful fallback, no silent data loss | |

Trace EVERY `redisUtil.safeXxx()` / `try-catch-return-default` in the codebase to build this table.
