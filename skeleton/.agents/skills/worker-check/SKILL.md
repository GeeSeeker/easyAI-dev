---
name: worker-check
description: "[Worker] 自检验证 — worker-implement 完成后激活。产出验证报告（verification_report）。"
produces: verification_report
requires: code_with_tests
---

# 执行者自检 & 验证标记

## 适用场景

Worker 完成所有编码工作后，提交验收前，**必须**执行本 Skill。

## Iron Law

```
没有新鲜验证证据，不准声称完成
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

如果你没有在本轮消息中运行过验证命令，你就不能声称它通过了。

## Gate 函数

```
在声称任何状态或表达满意之前：

1. 识别：什么命令能证明这个声明？
2. 运行：执行完整命令（新鲜的、完整的）
3. 阅读：完整输出 + 检查退出码 + 数失败数
4. 验证：输出是否确认了声明？
   - 如果否：报告实际状态 + 证据
   - 如果是：带证据声明结果
5. 然后才能：做出声明

跳过任何步骤 = 欺骗，不是验证
```

## 三标记验证流程

### 步骤 1：Lint 验证

```bash
# 运行 lint 检查
npm run lint    # 或项目实际的 lint 命令
```

- 粘贴 **完整** 终端输出到 verification.md
- 根据输出标记：`LINT_PASS ✅`、`LINT_FAIL ❌` 或 `LINT_NA ⚠️`（附说明）
- 如果失败：修复后重新运行，直到通过

### 步骤 2：测试验证

```bash
# 运行所有测试
npm test        # 或项目实际的测试命令
```

- 粘贴 **完整** 终端输出到 verification.md
- 根据输出标记：`TEST_PASS ✅`、`TEST_FAIL ❌` 或 `TEST_NA ⚠️`（附说明）
- 确认：0 failures, 0 errors
- 如果失败：修复后重新运行，直到通过

### 步骤 3：手动验证

手动验证产出是否满足约束集中的验收标准：

- 逐条对照 task.md 中的验收标准
- 描述每条标准的验证方式和结果
- 标记：`MANUAL_PASS ✅`、`MANUAL_FAIL ❌` 或 `MANUAL_NA ⚠️`（附说明）

## 生成 verification.md

将以上三步结果写入 `dev/verification.md`：

```markdown
# 验证报告

## 任务信息

- 任务 ID：{task_id}
- 验证时间：{timestamp}
- 验证者：Worker

## Lint 验证

### 命令

{实际运行的命令}

### 输出

{完整终端输出}

### 标记

LINT_PASS ✅

## 测试验证

### 命令

{实际运行的命令}

### 输出

{完整终端输出}

### 标记

TEST_PASS ✅

## 手动验证

### 验收标准检查

| #   | 验收标准 | 验证方式 | 结果 |
| --- | -------- | -------- | ---- |
| 1   | {标准1}  | {方式}   | ✅   |
| 2   | {标准2}  | {方式}   | ✅   |

### 标记

MANUAL_PASS ✅

## 执行过程中发现的问题

| #   | 问题描述 | 影响范围 | 处理方式                                       |
| --- | -------- | -------- | ---------------------------------------------- |
| 1   | {问题1}  | {影响}   | {处理方式：已修复 / 已记录待后续处理 / 无影响} |

（无问题则填写「无」）

## 标记汇总

- LINT_PASS ✅
- TEST_PASS ✅
- MANUAL_PASS ✅
```

### 不适用示例

如果某验证类别不适用，使用 `_NA` 标记并附说明：

```markdown
## Lint 验证

### 命令

（无命令）

### 输出

项目未配置 lint 工具。

### 标记

LINT_NA ⚠️ — 项目未配置 lint 工具
```

## Red Flags — 立即停下

| 信号                                     | 含义                      |
| ---------------------------------------- | ------------------------- |
| 使用 "should"、"probably"、"seems to"    | 没有运行验证              |
| 在验证前说 "Great!"、"Done!"、"Perfect!" | 没有证据的满足感          |
| "lint 通过了所以应该没问题"              | lint ≠ 测试 ≠ 手动验证    |
| "我很自信"                               | 信心 ≠ 证据               |
| "之前运行过了"                           | 之前 ≠ 现在，必须重新运行 |
| "部分检查够了"                           | 部分证明不了什么          |

## 不适用场景

当某验证类别确实不适用时，使用 `_NA` 标记（而非 `_PASS`）：

- **项目无 lint 配置**：声明 `LINT_NA`，附说明「项目未配置 lint 工具」
- **项目无测试框架**：声明 `TEST_NA`，附说明「项目未配置测试框架」
- **手动验证不可行**：声明 `MANUAL_NA`，附说明原因及替代验证方案

> ⚠️ `_NA` 标记需 PM 在验收阶段确认合理性。不可用 `_NA` 替代实际验证。

Evidence Gate 接受 `_PASS` 和 `_NA`，拒绝 `_FAIL` 和缺失标记。

**无论是否使用 `_NA` 标记，`verification.md` 必须始终生成。**

## 步骤 3.5：产出完整性检查（HARD-GATE）

> OPT-003：确保产出文件齐全，Git commit 前强制校验。

**必须检查以下文件均已生成，否则不得进入 Step 4 Git 提交：**

| 文件                  | 检查方式       | 缺失时                    |
| --------------------- | -------------- | ------------------------- |
| `dev/verification.md` | 管道 `test -f` | 补生成（Step 1-3 未完成） |
| `dev/report.md`       | 管道 `test -f` | 补生成（见 Step 3.6）     |

## 步骤 3.6：生成完成报告

> OPT-001：补充 Worker Workflow 要求的 `dev/report.md`。

将任务执行摘要写入 `dev/report.md`：

```markdown
# 任务报告

## 任务信息

- 任务 ID：{task_id}
- 完成时间：{timestamp}
- 执行者：Worker

## 变更摘要

| 文件    | 变更类型       | 说明       |
| ------- | -------------- | ---------- |
| {file1} | 新建/修改/删除 | {变更说明} |

## 约束集执行情况

| 约束 | 状态  | 说明                 |
| ---- | ----- | -------------------- |
| C1   | ✅/❌ | {如何满足或为何偏离} |

## 验证标记引用

详见 `dev/verification.md`
```

## 步骤 4：Git 自动提交

验证全部通过后，自动提交任务产物：

> **Worktree 场景**：
>
> - 若任务使用了 worktree（Step 3.5 已检测），所有 Git 操作（status、add、commit）在 **worktree 目录**中执行
> - Worker 的 commit 发生在 worktree 分支上，不影响主仓库
> - PM 验收通过后会通过 `worktree_merge` 将变更合并回基础分支
> - Allowlist 规则照常应用，scope 路径相对于 worktree 根目录

1. 执行 `git status --porcelain` 确认有变更
2. 变更文件清单输出（可见性）
3. **Allowlist 范围确定**：
   - 优先使用约束集中的 `file_scope`（若存在）
   - 加上任务目录下所有文件（`.trellis/tasks/T{id}-*/`）
   - 加上 `dev/verification.md`、`dev/report.md`
   - scope 外的变更文件 → 列出并警告，不自动包含
4. 执行 `git add -- "<file1>" "<file2>" ... && git commit -m "{type}(T{id}): {title}"`

**commit type 判定（带 fallback）：**

- 任务描述含「新增/添加/实现」→ `feat`
- 任务描述含「修复/Bug/修正」→ `fix`
- 任务描述含「重构/优化/清理」→ `refactor`
- 任务描述含「文档/说明」→ `docs`
- **Fallback**：关键词混合或不明确时 → `task`（如 `task(T003): 用户认证模块`）

**约束：**

- Worker 只 commit，不 push、不 merge
- 无变更时跳过
- 路径必须用双引号包裹（支持中文/空格路径）

## PATEOAS 导航

验证完成后输出：

```markdown
### 下一步行动

1. [ ] 确认 dev/verification.md 已生成且三标记全部 \_PASS 或 \_NA（附说明）
2. [ ] 自动执行 Git commit（若检测到变更）
3. [ ] 调用 `task_transition({ task_id, new_status: "under_review" })` 提交验收
4. [ ] 激活 `common-session-close` Skill 完成会话收尾
5. [ ] 告知用户回 PM 会话验收

### 状态快照

- 当前角色：Worker
- 当前阶段：CHECK
- 标记状态：LINT*{status} | TEST*{status} | MANUAL\_{status}
- Git 提交：{已提交 hash / 无变更 / 未提交}
- 验证文件：dev/verification.md {已生成/未生成}
```

## 触发测试用例

### TC-01: 三标记全部通过

- **场景**: Worker 完成编码，lint/test/manual 全部通过
- **输入**: 执行 `worker-check` Skill
- **期望行为**:
  1. 步骤 1-3 依次执行，三标记均为 `_PASS`
  2. 步骤 3.5 产出完整性检查通过（verification.md + report.md 均存在）
  3. 步骤 3.6 生成 report.md
  4. 步骤 4 Git 自动提交
- **验证方法**: 检查 `dev/verification.md` 和 `dev/report.md` 均已生成，Git commit 成功

### TC-02: 产出文件缺失时阻断

- **场景**: Worker 跳过了 report.md 生成
- **输入**: `dev/verification.md` 存在但 `dev/report.md` 不存在
- **期望行为**: 步骤 3.5 产出完整性检查失败 → 阻断 Git commit → 补生成 report.md
- **验证方法**: 检查是否触发了 HARD-GATE，要求补生成缺失文件
