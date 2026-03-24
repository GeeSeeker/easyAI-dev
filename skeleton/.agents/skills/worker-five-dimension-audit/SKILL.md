---
name: worker-five-dimension-audit
description: |
  [Worker] 五维深度审计 — 对全栈 Web/Mobile 应用进行跨平台、按模块的代码审计，覆盖 5 个维度：(A) 业务逻辑闭合、(B) 数据流完整性、(C) 边界与异常处理、(D) UX 反馈完整性、(E) 平台适配。触发：用户要求"审计"、"深度审查"、"五维检查"或"跨平台验证"某模块或功能；PM 在约束集中明确要求全量审计。排除：增量自检（使用 worker-check）。
produces: audit_report
requires: task_with_constraints
---

# Five-Dimension Deep Audit (五维深度审计)

A systematic code audit methodology that goes beyond "API works, page renders" to find business logic flaws, data flow breaks, security holes, missing UX feedback, and platform-specific pitfalls.

## Quick Start

When the user says "audit my project" or "audit module X":

1. **If no module scope specified** → run Module Discovery first (see below)
2. **If module specified** → jump to Audit Execution Loop
3. **If verifying fixes** → jump to Phase 2 in the loop
4. **If reviewing incremental changes** → produce a PATCH report

## Module Discovery (Run Once Per Project)

Before auditing, decompose the project into auditable modules:

### Step 1: Controller Inventory
Scan the backend for ALL controllers. For each, record:
```
| Controller | HTTP Methods | Service Layer | Web Page | Mobile Page |
|-----------|-------------|--------------|---------|-------------|
| EmployeeController | 12 endpoints | EmployeeService | MemberManagement.vue | admin-member/index.vue |
```

### Step 2: Group by Business Domain
Group controllers into modules by business function (not by file location):
- Punch + attendance record + daily report → "Attendance" module
- Application + approval + approval flow → "Approval" module

### Step 3: Assign Priority
Score each module: `Risk = Core importance × Complexity × Historical bug rate`

| Priority | Criteria | Example |
|:--------:|----------|---------:|
| P0 | Core function, high complexity, known bugs, multi-system crossover | Clock-in (GPS + face + shift + fence) |
| P1 | Complex CRUD, state machines, 5+ batch operations | Employee management (status flow, bulk ops) |
| P2 | Aggregation/reporting, data accuracy critical | Dashboard, report export |
| P3 | Config pages, rarely changed | System parameters, geofence settings |

## The 5 Dimensions

| Dim | Name | Key Question |
|-----|------|-------------|
| **A** | Business Logic Closure | Do all platforms implement the same rules? Does it work end-to-end as designed? |
| **B** | Data Flow Integrity | Backend field → frontend binding → user visible: any break? Request params all processed? |
| **C** | Boundary & Exception | Empty data, auth, validation, concurrent ops, **security vulnerabilities**? |
| **D** | UX Feedback Completeness | Loading, toast, confirmation dialog, anti-duplicate? |
| **E** | Platform Adaptation | Mobile quirks, dark theme, CSS compat, responsive? |

Detailed checklist: [references/dimensions-checklist.md](references/dimensions-checklist.md)

## Severity Grading

| Level | Definition | Response |
|:-----:|-----------|----------|
| **P0** | Feature completely broken, data corruption, security breach, page crash | Fix immediately |
| **P1** | Works but wrong results, critical interaction missing, data leakage | Fix same day |
| **P2** | Incomplete display, missing UX feedback, non-core defect | Fix this week |
| **P3** | Improvement suggestion, code style, performance optimization | Schedule later |

## Audit Execution Loop

**Critical rule**: Audit and fix one priority tier at a time. Fix ALL P0/P1 issues in the current module before moving to the next.

```
FOR each priority tier (P0 → P1 → P2 → P3):
  FOR each module in this tier:
    ┌─ Phase 1: AUDIT ─────────────────────────────┐
    │ 1. Establish baseline (design docs / PRD)     │
    │ 2. Read backend (Controller + Service)        │
    │    → Annotation scan (framework-specific)     │
    │    → Security config / public route review    │
    │    → Audit log coverage on write endpoints    │
    │    → Token lifecycle completeness             │
    │ 3. Read web frontend                          │
    │ 4. Read mobile frontend                       │
    │ 5. Cross-compare (backend vs frontend,        │
    │    web vs mobile, single vs batch ops)         │
    │ 6. Check all 5 dimensions (use checklist)     │
    │ 7. Self-review round (re-read own findings,   │
    │    verify no false positives, check for        │
    │    missed issues in already-read code)         │
    │ 8. Output report (Template 1)                 │
    │                                               │
    │ → For each P0/P1 finding:                     │
    │   Mark [AUDIT_FINDING: P0] or                 │
    │   [AUDIT_FINDING: P1] in report               │
    └───────────────────────────────────────────────┘
           ↓ Fix P0/P1 issues
    ┌─ Phase 2: VERIFY ────────────────────────────┐
    │ 1. Read fixed code at exact line/method       │
    │ 2. Build global caller inventory for          │
    │    each modified method                       │
    │ 3. Check each caller for regression           │
    │ 4. Check single-op vs batch-op consistency    │
    │ 5. Check ORM strategy propagation on entity   │
    │ 6. Record: CONFIRMED / REGRESSION /           │
    │    MISSED_PATH / FALSE_POSITIVE               │
    │ 7. Track CHAIN-N derived issues               │
    │ 8. Output verification report (Template 3)    │
    └───────────────────────────────────────────────┘
           ↓ If incremental changes to already-audited module
    ┌─ Phase 3: PATCH ─────────────────────────────┐
    │ Triggers:                                     │
    │  • Bug fix modifies already-audited module    │
    │  • Feature added to already-audited module    │
    │  • Cross-cutting fix spans multiple modules   │
    │ Output PATCH report (Template 2)              │
    │ Naming: M{N}-PATCH, M{N}-PATCH2, M{N}-PATCH3 │
    │ Use M{new}-PATCH for cross-cutting concerns   │
    └───────────────────────────────────────────────┘
  END FOR
  → Fix P2-level issues in bulk for this tier
END FOR
→ Address P3-level issues in iteration planning
→ Update living summary document (Template 4) after each module/PATCH
```

## Task System Integration

### Audit Finding Tags

在审计报告中，每个 P0/P1 级别的发现必须标注以下标签，便于任务系统追踪：

- `[AUDIT_FINDING: P0]` — 系统崩溃/数据腐败/安全漏洞
- `[AUDIT_FINDING: P1]` — 结果错误/关键交互缺失

### Worker-Check衔接

审计任务完成后，仍需走标准的 `worker-check` 三标记流程：

1. **LINT_PASS** — 审计报告格式校验（Markdown 结构完整、模板字段齐全）
2. **TEST_PASS** — 如果审计过程中修复了代码，需通过相关测试
3. **MANUAL_PASS** — 审计覆盖度确认（所有模块已审计、无遗漏维度）

> 审计 Skill 产出的是审计报告，不是代码变更。即便如此，三标记流程确保产出质量一致。

## Report Archiving

### 归档规范

当审计报告过时（例如模块已重构、项目已迭代到新版本），遵循以下归档流程：

1. 将过时报告文件名添加 `[OBSOLETE]` 前缀
2. 移入 `.docs/audit/archive/` 目录
3. 在 `issue-summary.md` 中标注对应模块的归档状态

示例：
```
.docs/audit/M1_Attendance.md
→ .docs/audit/archive/[OBSOLETE] M1_Attendance.md
```

> 归档约定遵循框架 `artifact-pipeline` 图谱节点定义的 `[OBSOLETE]` 前缀标准。

## Not-Need-Fix Decision Framework

~15% of issues will be "not-need-fix". Record specific reasoning for each. Valid categories:

| Category | Example | How to Write |
|----------|---------|-------------|
| **Design intent** | status=0 dead code path — "submitApplication 直接设1, 是设计意图" | Explain the design rationale |
| **Already fixed** | pageSize=9999 — "实际代码 pageSize=50（已修复过）" | Reference the prior fix |
| **Product roadmap** | Half-day leave, leave type config — "属于产品迭代需求" | Distinguish bug from feature request |
| **Acceptable at scale** | Full-table load for 100 employees — "数据量可控" | State the scale assumption |
| **Risk > benefit** | Refactoring @Transactional with HTTP — "需要saga模式，复杂度不匹配P3级" | Quantify the refactor cost |
| **Covered by other mechanism** | Delete dept with employees — "设计上先检查子部门，强制自底向上" | Reference the existing guard |

Mark as ⚪ in reports. ALWAYS include reasoning — bare "not needed" is not acceptable.

## Report Output

### Output Directory

All reports output to `.docs/audit/`. Structure by module subdirectories:

```
.docs/audit/
├── M1_ModuleName/
│   ├── M1_ModuleName.md              ← Template 1: Full module report
│   ├── M1-PATCH_ChangeDesc.md        ← Template 2: Incremental report
│   ├── M1-PATCH2_ChangeDesc.md
│   └── fix-verification_date.md      ← Template 3: Call-chain tracing
├── M2_ModuleName/
│   └── ...
├── issue-summary.md                  ← Template 4: Living summary (root level)
├── call-chain-data.md                ← Global caller inventory (persistent)
└── archive/                          ← Obsolete reports
    └── [OBSOLETE] M1_Attendance.md
```

**File naming rules**:
- Module reports: `M{N}_{ModuleName}.md` — N is the module number, name in PascalCase or short Chinese
- PATCH reports: `M{N}-PATCH{K}_{ShortDesc}.md` — K omitted for first patch
- Fix verification: `fix-verification_{YYYY-MM-DD}.md` — one per verification session
- Living summary: `issue-summary.md` — single file, updated after every audit/fix

### Templates

Use templates in [references/report-templates.md](references/report-templates.md):
- **Template 1**: Full module audit report
- **Template 2**: PATCH (incremental) report
- **Template 3**: Fix verification (call-chain tracing) report
- **Template 4**: Living summary across all modules

Issue writing standards: [references/report-templates.md](references/report-templates.md) § Issue Writing Standards

## Key References

- **Dimension checklists**: [references/dimensions-checklist.md](references/dimensions-checklist.md)
- **Call-chain verification**: [references/call-chain-verification.md](references/call-chain-verification.md)
- **Platform pitfalls**: [references/platform-pitfalls.md](references/platform-pitfalls.md)
- **Report templates & writing standards**: [references/report-templates.md](references/report-templates.md)

## Core Principles

1. **Read before judging** — Always read the actual code; never assume from API docs alone
2. **Cross-platform comparison** — Same data displayed on web and mobile must match
3. **Single vs batch consistency** — If an operation exists in both single and batch forms, verify both have identical security/validation/side-effects
4. **Trace the full call chain** — A fix to one method may break 15 callers in 7 files
5. **Fix introduces fix** — Every fix is a potential regression; always do Phase 2
6. **Not-need-fix is valid** — Mark with reasoning using the framework above; 15% is normal
7. **Severity determines priority** — P0/P1 fix immediately, P2 this week, P3 schedule; never mix
8. **Self-review is mandatory** — Re-read your own findings before finalizing; real audits found P1-level bugs in Round 2 that Round 1 missed
9. **Living summary** — Maintain one summary document updated after every audit/PATCH/fix
