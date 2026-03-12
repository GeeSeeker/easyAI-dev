---
name: pm-task-review
description: PM 任务验收 — 双阶段验收流程（Stage 1 Spec 合规 → Stage 2 代码质量）。PM 审查执行者完成的任务时激活。
---

# PM 任务验收（双阶段）

## 适用场景

PM 审查执行者提交验收的任务时，**必须**激活本 Skill。

## 验收原则

- **双阶段不可颠倒**：必须先 Spec 合规，再代码质量
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

- **全部通过** → 验收通过
  - 调用 `task_transition({ task_id, new_status: "completed", role: "pm" })`
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

### 最终判定：{通过 / 打回}

{如果打回，列出具体修改要求}
```

## PATEOAS 导航

```markdown
### 下一步行动

1. [ ] 如果通过 → 调用 `task_transition({ task_id, new_status: "completed", role: "pm" })` 标记完成
2. [ ] 如果通过 → 确认是否需要归档（`task_transition({ task_id, new_status: "archived", role: "pm" })`）
3. [ ] 如果打回 → 在 task.md 追加打回原因和修复建议
4. [ ] 如果打回 → 通知用户开新会话执行 `/worker {task_id}` 继续修复

### 状态快照

- 当前角色：PM
- 当前阶段：REVIEW
- Stage 1: {PASS/FAIL}
- Stage 2: {PASS/FAIL/未进入}
- 最终判定：{通过/打回/审查中}
```
