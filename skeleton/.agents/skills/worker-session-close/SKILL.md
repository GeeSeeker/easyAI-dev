---
name: worker-session-close
description: "[Worker] 会话收尾 — 触发：worker-check 完成后自动衔接，或中途暂停时手动触发。排除：PM 用 pm-session-close。产出：日志 + Git 提交。"
produces: journal_entry
requires: null
---

# Worker 会话收尾

## 适用场景

**仅 Worker 角色**使用。PM 角色使用 `pm-session-close`。

## 触发方式（双通道）

| 通道         | 触发条件                                                | 说明             |
| ------------ | ------------------------------------------------------- | ---------------- |
| **自动触发** | `worker-check` Step 4（Git 提交任务产物）完成后自动衔接 | 正常完成任务场景 |
| **手动触发** | Worker 中途暂停，用户说"收工"                           | 未完成任务场景   |

> 正常完成任务时，用户**无需**说"收工"。`worker-check` 会自动衔接本 Skill。
> 仅在 Worker 中途暂停（如上下文预算耗尽、用户主动中断）时才需手动触发。

## 执行步骤

### Step 1：汇总本会话工作

梳理本次会话中完成的所有工作：

- 修改了哪些文件
- 完成了哪些约束集条目
- 遇到了哪些问题及解决方案
- 做出了哪些关键决策（应极少，Worker 不做架构决策）

### Step 2：写入 Journal 日志

调用 MCP Tool `journal_append()`：

```
journal_append({
  date: "当天日期",
  tags: ["T{id}", "相关标签"],
  content: "## Session: {工作主题}\n\n### 完成内容\n- ...\n\n### 关键决策\n- ...",
  tasks_touched: ["T{id}"]
})
```

**自动触发时**（正常完成）：

- tags 含任务 ID，不含 `wip`
- content 侧重完成了什么

**手动触发时**（中途暂停）：

- tags 含任务 ID + `wip`
- content 侧重完成了什么 + 还剩什么

### Step 3：Rules 合规回顾

> 长对话防护 — 回顾 `always_on` Rules 是否在本会话中被完整遵守。

1. 扫描 `.agents/rules/` 目录，读取 YAML frontmatter 筛选 `trigger: always_on` 的 Rules 文件
2. 对每条发现的 Rule，自检本会话是否有违反其核心约束的操作
3. **有违规** → 调用 `journal_append()` 追加 `[RULE_BREACH]` 条目
4. **无违规** → 在恢复指引中标记 `✅ Rules 合规`

### Step 3.5：图谱一致性检查（仅报警）

> 检查本会话中修改的框架文件是否与图谱节点 `files` 引用一致。

1. 执行 `git diff --name-only` 获取本会话变更的文件列表
   - **无 diff 时自动跳过**此步骤
2. 筛选匹配 `.agents/`、`.trellis/spec/`、`.trellis/config/`、`packages/` 的文件
3. 与图谱节点（`.agents/graph/` 下所有节点文件）的 `files` 字段交叉比对
4. 发现不一致时输出报警（**仅报警，不阻塞收工**）：
   - 格式：`⚠️ 图谱过期：{节点名} 引用的 {文件路径} 已变更，建议更新节点`

### Step 4：Skill 使用审计

> 事后审计 — 回顾本会话中所有 Skill 的激活情况，写入 journal 以供追溯。

1. 回顾本会话输出，收集所有 `[Skill: xxx]` 激活标记
2. 统计每个 Skill 的激活次数，整理为表格
3. 调用 `journal_append()` 写入 `[SKILL_AUDIT]` 审计条目
4. **无 Skill 激活** → 仍写入审计条目，标注「本次会话未使用任何 Skill」

### Step 5：Git 提交元数据

> 提交 journal + task log 等元数据。任务产物代码已由 `worker-check` Step 4 提交。

**Worktree 场景备注**：

- journal / task log 写入始终在**主仓库**执行（MCP 数据层绑定主仓根目录）
- session-close 的 Git commit 在主仓提交元数据，不影响 worktree 分支

**流程：**

1. 检测 Git 仓库状态（异常时跳过 commit，不阻塞收工）
2. 执行 `git status --porcelain` 检测变更
3. **Allowlist 过滤** — 仅提交：
   - `.trellis/workspace/**/journal*.md`
   - `.trellis/tasks/{当前任务目录}/task.md`
4. **敏感文件过滤** — `.pem`, `.env`, `.key`, `.secret` → 警告并排除
5. 执行提交：

```bash
git add -- "<file1>" "<file2>" ...
git commit -m "{message}"
```

**Commit message 规则：**

| 场景                 | 格式                          | 示例                         |
| -------------------- | ----------------------------- | ---------------------------- |
| 正常完成（自动触发） | `session(T{id}): worker 收尾` | `session(T003): worker 收尾` |
| 中途暂停（手动触发） | `wip(T{id}): {进度}`          | `wip(T003): 完成 2/5 功能点` |

> **约束**：Worker 只 commit，不 push、不 merge。

### Step 6：角色分支 — 完成动作

> 本步骤根据 Worker 角色和触发方式执行不同的完成动作。

```text
if (自动触发 — 正常完成) {
  if (独立执行者 || 组长) {
    → task_transition({ task_id, new_status: "under_review" })
    → 告知用户：「任务已提交验收，请回 PM 会话执行 /pm 进行验收」
  }
  if (组员) {
    → 不执行 task_transition（组员无权提交主任务验收）
    → 更新子任务文件状态：status: completed
    → task_append_log() 记录完成
    → 告知用户：「子任务 {sid} 已完成，请回组长会话通知组长」
  }
} else {
  // 手动触发 — 中途暂停
  → 不执行 task_transition（任务未完成）
  → task_append_log() 记录进度
  → 告知用户：「进度已保存，下次通过 /worker {task_id} 继续」
}
```

### Step 7：恢复指引输出

```markdown
## 本次 Worker 会话已收尾

### 已沉淀

- {✅ Git 已提交 `{hash}` / ⚠️ 工作区已干净 / ❌ Git 提交失败}
- ✅ Journal 日志已写入
- {✅ 任务已提交验收 / ⚠️ 进度已保存（中途暂停） / ✅ 子任务已标记完成}

### 硬约束检查

- [x] Journal 日志 ✅
- [x] 恢复指引 ✅（本消息即是）
- [x] Git 变更已处理 ✅
- [x] Rules 合规 {✅ 无违规 / ⚠️ 有违规}
- [x] Skill 审计 {✅ 已记录 / ⚠️ 写入失败}

### PATEOAS 导航

#### 下一步行动

1. [ ] 回 PM 会话执行 `/pm` 进行验收
2. [ ] 或新开会话 `/worker {task_id}` 继续未完成的工作

#### 状态快照

- 当前角色：Worker（{独立执行者 / 组长 / 组员}）
- 当前 Skill: worker-session-close
- 当前阶段：SESSION_CLOSE
- 任务状态：{已提交验收 / 中途暂停 / 子任务已完成}
```

## 双提交模型

> `worker-check` 和 `worker-session-close` 各自的 commit 职责不同，是刻意的两次提交。

| 提交点                        | 包含内容                                    | Commit Message                                        |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `worker-check` Step 4         | 任务产物代码 + 测试 + `dev/verification.md` | `{type}(T{id}): {title}`                              |
| `worker-session-close` Step 5 | Journal + task log 元数据                   | `session(T{id}): worker 收尾` 或 `wip(T{id}): {进度}` |

## 硬约束

- **未记日志不可收工** — 必须至少写入一条 journal 条目
- **未输出恢复指引不可收工** — Step 7 必须执行
- **Worker 不做知识沉淀** — 知识沉淀由 PM 在验收阶段（`pm-task-review` Stage 3）处理
- **Worker 不 push** — 仅 commit，远程操作由 PM 负责

## 触发测试用例

### TC-01: 独立执行者正常完成（自动触发）

- **场景**: Worker 独立完成任务，worker-check 三标记全部 PASS
- **输入**: `worker-check` 完成后自动衔接
- **期望行为**:
  1. 汇总 + journal + Rules 回顾 + Skill 审计（Step 1-4）
  2. Git 提交元数据（Step 5）
  3. `task_transition` → `under_review`（Step 6 独立执行者分支）
  4. 恢复指引显示「任务已提交验收，请回 PM 会话」
- **验证方法**: 检查 journal、Git commit、task status 均已更新

### TC-02: 组员正常完成（自动触发）

- **场景**: 团队模式组员完成自己的子任务
- **输入**: `worker-check` 完成后自动衔接
- **期望行为**:
  1. Step 1-5 共享步骤正常执行
  2. Step 6 走组员分支：不执行 task_transition，更新子任务状态
  3. 恢复指引显示「请回组长会话通知组长」
- **验证方法**: 检查 task_transition 未被调用，子任务状态已更新

### TC-03: Worker 中途暂停（手动触发）

- **场景**: Worker 执行中途上下文预算耗尽
- **输入**: 用户说「收工」
- **期望行为**:
  1. Step 1-5 正常执行，journal tags 含 `wip`
  2. Step 5 commit message 使用 `wip(T{id})` 格式
  3. Step 6 中途暂停分支：不执行 task_transition，记录进度
  4. 恢复指引显示「下次通过 /worker {task_id} 继续」
- **验证方法**: 检查 journal tags 含 wip，commit message 格式正确
