---
name: worker-check
description: 执行者自检与验证标记 — 完成编码后的强制验证流程。生成 dev/verification.md，每个验证类别必须为 _PASS 或 _NA（附说明）。在 worker-implement 完成后由 Worker 激活。
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

## PATEOAS 导航

验证完成后输出：

```markdown
### 下一步行动

1. [ ] 确认 dev/verification.md 已生成且三标记全部 _PASS 或 _NA（附说明）
2. [ ] 调用 `task_transition({ task_id, new_status: "under_review" })` 提交验收
3. [ ] 激活 `common-session-close` Skill 完成会话收尾
4. [ ] 告知用户回 PM 会话验收

### 状态快照

- 当前角色：Worker
- 当前阶段：CHECK
- 标记状态：LINT*{status} | TEST*{status} | MANUAL_{status}
- 验证文件：dev/verification.md {已生成/未生成}
```
