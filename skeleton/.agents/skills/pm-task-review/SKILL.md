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
- **参照规范**：`spec://guides/review-standards` 定义风险分级、报告格式、循环修复规则

## Pre-Review：审查准备

在进入 Stage 1 之前，**必须**完成以下准备：

### 0. 阻塞文件扫描（F32）

扫描 `.trellis/tasks/{task_id}/blockers/` 目录：

- **无 blockers 目录或目录为空** → 继续 Step 1
- **存在未回复的 blocker**（有 `{NN}-{role}-question.md` 但无对应 `{NN}-pm-reply.md`）→ **必须先回复**：
  1. 阅读 blocker 内容，做出决策
  2. 创建 `{NN}-pm-reply.md`（使用与 question **相同编号**），包含以下内容：
     - PM 决策：{具体决策内容}
     - 原因：{做出此决策的理由}
     - Worker 下一步：{Worker 收到回复后应执行的动作}
  3. 通过 `task_append_log()` 记录 `📋 回复 blocker: blockers/{NN}-pm-reply.md`
  4. 所有 blocker 已回复后，继续验收流程

### 1. 确定审核类型

根据任务性质选择：架构审核 / 代码审核 / 文档审核 / 混合审核（详见 `spec://guides/review-standards` §一）

### 2. 风险分级（F39 联动）

**优先读取** task.md 中的 `## 路由配置` 段（由 `pm-task-planning` Step 4.5 写入）：

- 存在路由配置 → 直接采用其中的风险等级和审查策略
- 无路由配置（向后兼容）→ 根据 `file_scope` 和任务性质手动评估风险等级（🟢低 / 🟡中 / 🔴高 / ⚫极高）

低风险任务 Stage 2 可简化为快速检查。

### 3. 循环计数检查（HG-7）

读取 task.md `## 执行记录` 中当前 Stage 的打回条目数（格式：`🔴 Stage {N} 打回第 {M} 次`）。若同一 Stage 已打回 3 次 → **强制升级**：任务保持 `rejected`，PM 与用户协商（PM 直接修复 / 重新拆分 / 降低标准 / 取消），并在验收报告中附加「循环分析」（为什么反复失败？约束集不清晰还是执行能力不足？）。

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

5. **项目规范合规性**
   - 通过 `spec://{category}/{name}` 读取任务涉及领域的项目规范
   - 检查代码是否遵循规范中定义的标准（命名约定、API 格式、错误处理等）
   - 如果 `spec/` 中无对应规范 → 标记为 `[SPEC_GAP]`，不阻断验收
   - **Spec 违规一律为 Critical** — 不分严重程度，直接打回
   - 如果 Worker 报告了 `[SPEC_GAP]`，在验收后提议通过 `common-spec-update` 补充规范
   - **反溯及原则**：如 PM 在任务执行期间更新了 spec，不得用新 spec 推翻 Worker 基于旧 spec 的实现。需重新规划任务。

### Stage 1 判定

- **全部通过** → 进入 Stage 2
- **任何项不通过** → 打回，附带具体不合规项和修复建议
  - 通过 `task_append_log()` 记录 `🔴 Stage 1 打回第 {M} 次：{原因}`
  - 调用 `task_transition({ task_id, new_status: "rejected", role: "pm" })`

## Stage 2：代码质量审查

### 检查清单

根据 Pre-Review 中确定的**审核类型**，使用对应检查项（详见 `spec://guides/review-standards` §一）：

- **架构审核**：接口边界、依赖方向、模块职责、架构一致性
- **代码审核**：代码风格、边界处理、错误信息、可维护性、测试覆盖
- **文档审核**：与源码一致性、术语准确性、示例可运行性、结构清晰度
- **混合审核**：各部分分别套用，**风险等级取各部分最高值**

根据 **风险等级**执行强制动作（与 `config.yaml` routing 配置对齐）：

- 🟢 **低风险**（`pm_self_review`）：PM 自审，只查 Critical 级问题，跳过代码风格/命名细节
- 🟡 **中风险**（`single_cli_review`）：PM 审查 + **必须** 1 个外部 CLI 独立审查
- 🔴 **高风险**（`dual_cli_review`）：PM 审查 + **必须** 2 个外部 CLI 并行独立审查
- ⚫ **极高风险**（`dual_cli_plus_internal`）：PM 独立验证关键路径 + **必须** 2 个外部 CLI 并行独立审查

> 以下为通用补充检查项，根据审核类型按需选用（文档审核可跳过）：

1. **边界情况处理**（适用于代码/架构审核）
   - 空值 / 异常输入是否处理？
   - 错误信息是否有意义？
   - 并发 / 竞态条件是否考虑？

2. **可维护性**（适用于代码/架构审核）
   - 代码是否易理解？
   - 是否有适当注释？
   - 是否有重复代码可提取？

3. **外部 CLI 独立审查**（F39 联动）
   - 审查者选择：参考 task.md `## 路由配置` 中的推荐审查者
   - 无路由配置时降级：🔴 高风险以上必须至少 1 个外部 CLI
   - 外部 CLI 产出写入 `cli/` 目录
   - 综合各方意见形成最终判断

### Stage 2 判定

- **全部通过** → 进入 Stage 3（Artifacts 沉淀）
- **存在问题** → 按 `spec://guides/review-standards` §三 标准分级：
  - 🔴 `[C]` Critical — 必须修复才能通过
  - 🟡 `[W]` Warning — 建议修复，可附条件通过
  - 🟢 `[I]` Info — 记录即可，不阻断
- **存在任何 Critical** → 打回
- **仅有 Warning** → PM 判断：附条件通过或打回
- **打回时**：通过 `task_append_log()` 记录 `🔴 Stage {N} 打回第 {M} 次：{原因}`
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

> 本质：PM 作为"策展人"，将 Worker 会话产生的面向用户的 Artifacts 沉淀到 `.docs/`（持久文档空间），并向用户输出「人话版」完成简报。

### 执行步骤

1. **扫描 Worker Artifacts**
   - 检查 Worker 会话产生的 Artifacts（特别是 `walkthrough.md`）
   - 识别面向用户的内容（排除 `task.md` 等过程性文件）

2. **按知识分类判断沉淀目标**
   - 参照 `spec://general/knowledge-categories` 进行分类（路由按默认路径）：

   | Artifacts 类型           | 知识分类 | 默认沉淀目标                     |
   | ------------------------ | -------- | -------------------------------- |
   | `walkthrough.md`         | `GUIDE`  | `.docs/guides/`                  |
   | `other`（分析报告等）    | `REF`    | `.docs/notes/`                   |
   | 含架构/技术决策          | `ADR`    | `.docs/design/decisions/`        |
   | Bug 修复过程/根因分析    | `FIX`    | `.docs/notes/`                   |
   | 短期备忘/待办            | `NOTE`   | `.docs/notes/`                   |
   | `task.md`                | —        | 跳过（`.trellis/tasks/` 已持久） |
   | `implementation_plan.md` | —        | 跳过（`pm-brainstorm` 已处理）   |

3. **向用户确认**
   - 列出候选沉淀内容，说明建议的目标路径
   - **用户确认后**才执行沉淀（不自动沉淀）

4. **执行沉淀**
   - 提炼内容（去除过程性细节，保留用户关心的结论和指导）
   - 写入目标路径
   - 向用户说明沉淀了什么、沉淀到了哪里

5. **向用户输出完成简报**（人话版）

   ```markdown
   ## 任务完成简报

   ### 一句话概括

   {用非技术语言描述任务完成了什么，用户能获得什么价值}

   ### 做了什么

   - {变更 1：对用户的影响}
   - {变更 2：对用户的影响}

   ### 注意事项

   - {用户需要知道的限制、注意点或后续建议，如无则省略}
   ```

   > 简报面向**用户**，避免技术术语。目的是让用户不看代码就能理解任务成果。

6. **标记任务完成**
   - 调用 `task_transition({ task_id, new_status: "completed", role: "pm" })`

### Stage 3 判定

- **有内容沉淀** → 确认沉淀完成后进入 Worktree 闭环检查
- **无需沉淀** → 直接进入 Worktree 闭环检查

## Worktree 闭环（条件步骤）

> 仅当任务使用了 worktree 时执行。检查方式：调用 `worktree_list()` 或查看 task 执行记录中的 `[worktree]` 标记。

### 步骤 1：Worktree 状态检查

- 调用 `worktree_list({ role: "pm" })` 查看任务关联 worktree 的状态
- 若该任务无关联 worktree → **跳过本步骤，直接标记 `completed`**
- 若 `is_dirty: true` → 提醒用户 worktree 有未提交变更，建议先处理

### 步骤 2：合并

- 从 task 执行记录获取 `base_branch` 作为默认 target
- 向用户确认目标分支
- 调用 `worktree_merge({ task_id, target_branch, role: "pm" })`
- 若冲突 → 展示冲突文件列表（工具返回 `conflict_files`），暂停。向用户提供选项：
  1. 手动解决冲突后重试
  2. 打回任务让 Worker 解决

### 步骤 3：清理

- 合并成功后 → 调用 `worktree_cleanup({ task_id, delete_branch: true, role: "pm" })`
- 确认清理完成
- 标记 `task_transition({ task_id, new_status: "completed", role: "pm" })`

## 验收结果输出

```markdown
## 验收报告

### 任务信息

- 任务 ID：{task_id}
- 审查时间：{timestamp}
- 审查者：PM
- 审核类型：{架构 / 代码 / 文档 / 混合}
- 风险等级：{🟢低 / 🟡中 / 🔴高 / ⚫极高}
- 打回次数：{rejection_count}

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
