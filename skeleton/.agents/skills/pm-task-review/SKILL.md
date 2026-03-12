---
name: pm-task-review
description: PM 任务验收 — 三阶段验收流程（Stage 1 Spec 合规 → Stage 2 代码质量 → Stage 3 Artifacts 沉淀）。PM 审查执行者完成的任务时激活。
---

# PM 任务验收（三阶段）

## 适用场景

PM 审查执行者提交验收的任务时，**必须**激活本 Skill。

## 验收原则

- **三阶段不可颠倒**：必须先 Spec 合规，再代码质量，最后 Artifacts 沉淀
- **Stage 1 不过不进 Stage 2**：节省审查时间，避免在不合规产出上花费精力
- **公正客观**：基于证据而非印象

## Stage 1：Spec 合规审查

### 检查清单

1. **读取任务约束集**
   - 调用 `task_get({ task_id })` 获取 task.md
   - 逐条列出验收标准

2. **检查验证标记完整性**
   - 读取 `dev/verification.md`
   - 确认每个验证类别为 `_PASS` 或 `_NA`（附说明）：
     - `LINT_PASS ✅` / `LINT_NA ⚠️`（附说明）
     - `TEST_PASS ✅` / `TEST_NA ⚠️`（附说明）
     - `MANUAL_PASS ✅` / `MANUAL_NA ⚠️`（附说明）
   - **不接受 `_FAIL` 或缺失标记 → 直接打回**
   - **PM 必须验证每个 `_NA` 标记是否有合理说明**

3. **逐条验收标准对照**

   | #   | 验收标准 | 对应产出        | 结果  |
   | --- | -------- | --------------- | ----- |
   | 1   | {标准1}  | {对应代码/文件} | ✅/❌ |
   | 2   | {标准2}  | {对应代码/文件} | ✅/❌ |

4. **约束集遵守度**
   - 执行者是否只做了约束集要求的事？
   - 是否存在范围蔓延（做了约束集之外的事）？
   - 是否存在遗漏（约束集要求但未做的事）？

### Stage 1 判定

- **全部通过** → 进入 Stage 2
- **任何项不通过** → 打回，附带具体不合规项和修复建议
  - 调用 `task_transition({ task_id, new_status: "rejected", role: "pm" })`
  - 在 task.md 追加打回原因

## Stage 2：代码质量审查

### 检查清单

1. **代码风格一致性**
   - 命名约定是否遵循 `coding-standards.md`？
   - 缩进、格式是否统一？

2. **架构一致性**
   - 新代码是否与项目架构保持一致？
   - 模块划分是否合理？
   - 依赖方向是否正确？

3. **边界情况处理**
   - 空值 / 异常输入是否处理？
   - 错误信息是否有意义？
   - 并发 / 竞态条件是否考虑？

4. **可维护性**
   - 代码是否易理解？
   - 是否有适当注释？
   - 是否有重复代码可提取？

5. **外部 CLI 独立审查（可选）**
   - 如果任务复杂度高，可调用外部 CLI（Codex / Claude Code）做独立审查
   - 外部 CLI 产出写入 `cli/` 目录
   - 综合各方意见形成最终判断

### Stage 2 判定

- **全部通过** → 进入 Stage 3（Artifacts 沉淀）
- **存在问题** → 打回并附带具体改进建议
  - 问题分级：Critical（必须修复）/ Important（建议修复）/ Minor（可后续优化）
  - 调用 `task_transition({ task_id, new_status: "rejected", role: "pm" })`

### PM Push Back 权利

如果审查者认为执行者的判断有疑问，PM 有权 Push Back：

1. **技术论证**：提供理由说明为何当前实现不够好
2. **证据支撑**：展示代码/测试证明替代方案可行
3. **请求澄清**：要求执行者解释具体设计决策

执行者收到 Push Back 后：
1. 理解审查者的技术关切
2. 如审查者正确 → 接受建议并修改
3. 如坚持原方案 → 提供完整技术论证（非"我觉得没问题"）

## Stage 3：Artifacts 沉淀

> 本质：PM 作为"策展人"，将 Worker 会话产生的面向用户的 Artifacts 沉淀到 `.docs/`（持久文档空间）。

### 执行步骤

1. **扫描 Worker Artifacts**
   - 检查 Worker 会话产生的 Artifacts（特别是 `walkthrough.md`）
   - 识别面向用户的内容（排除 `task.md` 等过程性文件）

2. **判断沉淀价值**
   - 内容是否对用户有持续参考价值？
   - 沉淀目标判断：

   | Artifacts 类型 | 沉淀目标 | 判断依据 |
   |----------------|----------|----------|
   | `walkthrough.md` | `.docs/notes/`（临时参考）或 `.docs/guides/`（永久指南） | 是否有长期复用价值 |
   | `other`（分析报告等） | `.docs/notes/` 或 `.docs/design/` | 内容属于设计还是参考 |
   | `task.md` | 不沉淀 | `.trellis/tasks/` 已持久化 |
   | `implementation_plan.md` | 不沉淀 | `pm-brainstorm` Step 6 已负责 |

3. **向用户确认**
   - 列出候选沉淀内容，说明建议的目标路径
   - **用户确认后**才执行沉淀（不自动沉淀）

4. **执行沉淀**
   - 提炼内容（去除过程性细节，保留用户关心的结论和指导）
   - 写入目标路径
   - 向用户说明沉淀了什么、沉淀到了哪里

5. **标记任务完成**
   - 调用 `task_transition({ task_id, new_status: "completed", role: "pm" })`

### Stage 3 判定

- **有内容沉淀** → 确认沉淀完成后标记 `completed`
- **无需沉淀** → 直接标记 `completed`

## 验收结果输出

```markdown
## 验收报告

### 任务信息

- 任务 ID：{task_id}
- 审查时间：{timestamp}
- 审查者：PM

### Stage 1: Spec 合规 — {PASS/FAIL}

{逐条结果}

### Stage 2: 代码质量 — {PASS/FAIL}

{审查发现}

### Stage 3: Artifacts 沉淀 — {已沉淀/无需沉淀}

{沉淀内容及目标路径，或无需沉淀的原因}

### 最终判定：{通过 / 打回}

{如果打回，列出具体修改要求}
```

## PATEOAS 导航

```markdown
### 下一步行动

1. [ ] 如果通过 → 确认 Artifacts 是否需要沉淀到 `.docs/`
2. [ ] 如果通过 → 调用 `task_transition({ task_id, new_status: "completed", role: "pm" })` 标记完成
3. [ ] 如果通过 → 确认是否需要归档（`task_transition({ task_id, new_status: "archived", role: "pm" })`）
4. [ ] 如果打回 → 在 task.md 追加打回原因和修复建议
5. [ ] 如果打回 → 通知用户开新会话执行 `/worker {task_id}` 继续修复

### 状态快照

- 当前角色：PM
- 当前阶段：REVIEW
- Stage 1: {PASS/FAIL}
- Stage 2: {PASS/FAIL/未进入}
- Stage 3: {已沉淀/无需沉淀/未进入}
- 最终判定：{通过/打回/审查中}
```
