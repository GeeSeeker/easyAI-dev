---
name: common-session-close
description: "[Common] 会话收尾 — 用户表示收工时自主激活。产出日志条目 + Git 提交。"
produces: journal_entry
requires: null
---

# 会话收尾 & 日志沉淀

## 适用场景

任何角色（PM / Worker）在会话结束前，必须执行本 Skill 完成收尾动作。

## 触发条件

- 用户明确表示「**收工**」（或等价表达，如"结束"、"下班"等）
- 用户明确表示本次会话结束
- 上下文预算接近阈值，需要新开会话
- 任务执行完成，准备提交验收

## 执行步骤

### Step 1：汇总本会话工作

梳理本次会话中完成的所有工作：

- 修改了哪些文件
- 完成了哪些任务/子任务步骤
- 做出了哪些关键决策
- 遇到了哪些问题及解决方案

### Step 2：写入 Journal 日志

调用 MCP Tool `journal_append()`：

```
journal_append({
  date: "当天日期",
  tags: ["相关标签", "任务ID"],
  content: "## Session: {工作主题}\n\n### 完成内容\n- ...\n\n### 关键决策\n- ..."
})
```

> **注意**：Journal 仅记录回顾性内容（做了什么、为什么这样做）。
> 如有明确的未完成工作，应通过任务系统（`task_create` / `task_append_log`）追踪，而非写在 journal 中。

```

### Step 3：更新任务执行记录

如果本会话涉及具体任务，调用 MCP Tool `task_append_log()`：

```

task_append_log({
task_id: "T001",
entry: "完成了 xxx，剩余 yyy 待处理"
})

````

### Step 4：知识沉淀检查（含分类触发）

> 本质：在会话收尾时充当"最后一道提醒"，确保面向用户的有价值内容不会随会话消散。
> 参照规范：`spec://general/knowledge-categories` 定义 6 种知识分类及触发规则。

#### 4a. 知识分类自检

按 `spec://general/knowledge-categories` 自检清单逐项检查：

1. **本会话是否做出了架构/技术选型决策？** → 触发 `ADR`：按 `spec://general/adr-template` 创建决策记录
2. **本会话是否产出了可复用的操作流程？** → 触发 `GUIDE`：沉淀到 `.docs/guides/`
3. **本会话是否解决了非显而易见的 Bug？** → 触发 `FIX`：沉淀到 `.docs/notes/`
4. **本会话是否研究了外部技术并有价值摘要？** → 触发 `REF`：沉淀到 `.docs/notes/`
5. **有无短期有效的备忘需要记录？** → 触发 `NOTE`：沉淀到 `.docs/notes/`
6. **本会话是否遇到 MCP/CLI 已知问题？** → 更新 `spec://guides/known-issues`（参照 F44 已知问题库条目模板）
7. **本会话是否产出了超过 100 行的长文档？** → 主动执行文档简化流程（参照 `spec://guides/doc-simplify`）：
   - 按 `doc-simplify` 规范创建简化版文件到 `.docs/guides/{原文件名}-简化版.md`
   - 在源文档顶部添加 `<!-- simplified: 路径 -->` 双向链接
   - 在简化版顶部添加 `<!-- source: 路径 -->` 双向链接
   - 向用户确认是否保留简化版（用户可拒绝）

> `SPEC` 类沉淀由 `common-spec-update` 独立处理，不在本清单中。

#### 4b. Artifacts 扫描

> **防重复**：若本会话中 `pm-task-review` Stage 3 已执行过沉淀，仅对 Stage 3 未覆盖的非任务性内容执行检查。

1. **扫描本会话 Artifacts**
   - 检查本会话创建的所有 Artifacts
   - 识别面向用户的内容（排除 `task.md` 等过程性文件）

2. **快速路径**：4a 无触发 + 无候选 Artifacts → 自动跳过，不询问用户

3. **有候选时**列出分类标注的清单（路由按 `spec://general/knowledge-categories` 默认路径）：

   | Artifacts 类型           | 分类    | 默认沉淀目标                    |
   | ------------------------ | ------- | ------------------------------- |
   | `walkthrough.md`         | `GUIDE` | `.docs/guides/`                 |
   | `other`（分析报告等）    | `REF`   | `.docs/notes/`                  |
   | 架构/技术决策            | `ADR`   | `.docs/design/decisions/`       |
   | Bug 修复过程/根因分析    | `FIX`   | `.docs/notes/`                  |
   | 短期备忘/待办            | `NOTE`  | `.docs/notes/`                  |
   | `implementation_plan.md` | —       | 跳过（`pm-brainstorm` 已处理）  |
   | `task.md`                | —       | 跳过（`.trellis/tasks/` 已持久） |

4. **用户确认后执行**
   - 用户确认需要沉淀 → 提炼内容并写入目标路径（ADR 使用模板）
   - 用户确认无需沉淀 → 跳过
   - 若写入失败 → 记录错误但继续收工流程

### Step 4.5：Rules 合规回顾

> 长对话防护 — 回顾 `always_on` Rules 是否在本会话中被完整遵守。

1. 扫描 `.agents/rules/` 目录，读取 YAML frontmatter 筛选 `trigger: always_on` 的 Rules 文件
2. 对每条发现的 Rule，自检本会话是否有违反其核心约束的操作：
   - 例：`anti-hallucination.md` → 是否有未查文档就使用的第三方 API？
   - 例：`project-identity.md` → 是否在框架体系内工作？
   - 例：`framework-dev-mode.md`（若存在）→ 是否遵循三层版本流转？
   - 对每条 Rule 提取出最核心的约束并逐一确认
3. **有违规** → 调用 `journal_append()` 追加一条独立条目：
   ```yaml
   tags: ["RULE_BREACH", "{违规的 Rule 文件名}"]
   content: "## [RULE_BREACH] {Rule 名}\n\n### 违规描述\n{具体操作}\n\n### 纠正措施\n{已采取或建议的纠正}"
   ```
4. **无违规** → 在恢复指引的硬约束检查中标记 `✅ Rules 合规`

> 此步骤为事后回顾，无法撤销已发生的操作，但能为后续会话提供审计线索和改进依据。

### Step 5：`.tmp/` 清理

1. 检测项目下 `.tmp/` 目录是否存在且非空
2. 若非空 → 列出文件清单，向用户提供选项：
   - 「是否需要我为你一键清理这些临时文件？」
   - 用户确认清理 → 执行清理（若某些文件被锁定，优雅跳过并列出残留）
   - 用户拒绝 → 跳过
3. 若为空或不存在 → 跳过

### Step 6：Git 自动提交

> 本步骤在所有文件变更操作（journal、task log、artifacts 沉淀）完成后执行，确保 commit 捕获最终状态。

> **Worktree 场景备注**：
>
> - Session-close 的 journal / task log 写入始终在**主仓库**执行（MCP 数据层绑定主仓根目录）
> - 如果 Worker 在 worktree 中工作，session-close 的 Git commit 仍然在主仓提交元数据
> - 这是设计意图：元数据属于项目级别，不随任务分支走
> - Worktree 分支上的代码变更由 `worker-check` 单独提交

**流程：**

1. 检测 Git 仓库状态：
   - 非 Git 仓库 → 跳过所有 Git 操作，提示用户
   - Detached HEAD / rebase 进行中 → 跳过 commit，警告用户
   - Index 冲突 → 跳过 commit，建议用户 `git stash` 或手动解决

2. 执行 `git status --porcelain` 检测变更：
   - 无变更 → 跳过，记录「工作区已干净」
   - 有变更 → 继续

3. 列出变更文件清单（可见性）

4. **Allowlist 过滤**（主安全机制）— 仅提交以下允许范围内的文件：
   - `.trellis/workspace/**/journal*.md`（journal 日志）
   - `.trellis/tasks/{当前任务目录}/task.md`（任务记录）
   - 被 Step 4 确认沉淀的 `.docs/` 文件
   - scope 外的变更 → 列出并询问用户是否包含

5. **敏感文件过滤**（辅助防线）— 扫描允许列表内的文件：
   - 若发现 `.pem`, `.env`, `.key`, `.secret` 后缀 → 警告并排除

6. 执行提交（路径必须用双引号包裹，防止中文/空格路径问题）：

```bash
git add -- "<file1>" "<file2>" ...
git commit -m "{message}"
````

**Commit message 规则：**

| 场景                      | 格式                        | 示例                                     |
| ------------------------- | --------------------------- | ---------------------------------------- |
| PM 收工                   | `session: {摘要}`           | `session: 需求澄清 + T001/T002 任务拆分` |
| PM 收工（涉及特定任务）   | `session(T{id}...): {摘要}` | `session(T001, T002): 验收 + 需求澄清`   |
| Worker 收工（未完成任务） | `wip(T{id}): {进度}`        | `wip(T003): 完成 2/5 功能点`             |
| session-close 元数据提交  | `session: {摘要}`           | `session: journal + task log 更新`       |

### Step 7：PM 专属 — Push 确认

> 仅 PM 角色执行此步骤。Worker 跳过。

1. 检测当前分支是否有 upstream：

```bash
git rev-parse --abbrev-ref @{upstream} 2>/dev/null
```

2. 若无 upstream（worktree 新建分支等场景）→ 跳过 push 检测

3. 若有 upstream → 检测未推送 commit 数：

```bash
git rev-list --count @{upstream}..HEAD
```

4. 有未推送 commit → 询问用户：「有 {n} 个未推送的提交，是否推送到远程？」
   - 用户确认 → 执行 `git push`
   - 用户拒绝 → 跳过
   - push 失败（网络/远程拒绝）→ 告知用户「已提交但未推送」

5. 无未推送 commit → 跳过

### Step 8：恢复指引输出

向用户输出收尾报告和 PATEOAS 导航：

```markdown
## 本次会话已收尾

### 已沉淀

- {✅ Git 已提交 `{hash}` / ⚠️ 工作区已干净 / ❌ Git 提交失败（原因）}
- ✅ Journal 日志已写入
- ✅ 任务记录已更新
- {✅ 文档已沉淀到 `.docs/` / ⚠️ 无需沉淀}
- {✅ `.tmp/` 已清理 / ⚠️ `.tmp/` 有残留 / ⚠️ 无临时文件}
- {✅ 已推送到远程 / ⚠️ 未推送（{n} 个本地提交） / — 非 PM 角色}

### Git 状态快照

- 当前分支：{branch}
- 最后提交：{hash} ({message})
- 同步状态：{本地领先远程 n 个提交 / 已同步 / 无远程}

### 硬约束检查

- [x] Journal 日志 ✅
- [x] 恢复指引 ✅（本消息即是）
- [x] Git 变更已处理 ✅
- [x] Rules 合规 {✅ 无违规 / ⚠️ 有违规（见 journal `[RULE_BREACH]` 条目）}

### PATEOAS 导航

#### 下一步行动

1. [ ] 新开会话，执行 `/pm` 恢复 PM 上下文
2. [ ] 或执行 `/worker {task_id}` 继续具体任务
3. [ ] 新会话将读取 `trellis://journal/latest` Resource 自动恢复状态

#### 状态快照

- 当前角色：{PM / Worker}
- 当前阶段：SESSION_CLOSE
- 已沉淀：Journal ✅ | 任务记录 ✅ | .docs/ {✅/⚠️}
- 遗留事项：{有/无} — {具体内容}
```

## 角色分支逻辑

```
收工流程 {
  Step 1-4.5: 所有角色通用（含 4.5 Rules 合规回顾）
  Step 5-6: 所有角色通用
  Step 7: if (当前角色 == PM && 有 upstream && 有未推送 commit) { 询问 push }
  Step 8: 所有角色通用（硬约束）
}
```

## 双提交模型

> `worker-check` 和 `common-session-close` 各自的 commit 职责不同，是刻意的两次提交。

| 提交点                 | 提交者   | 包含内容                                    | Commit Message                            |
| ---------------------- | -------- | ------------------------------------------- | ----------------------------------------- |
| `worker-check` 完成后  | Worker   | 任务产物代码 + 测试 + `dev/verification.md` | `{type}(T{id}): {title}`                  |
| `common-session-close` | 任意角色 | Journal + task log + `.docs/` 沉淀 + 元数据 | `session: {摘要}` 或 `wip(T{id}): {进度}` |

- **Worker 场景**：两个独立 commit（任务产物 + 会话元数据）
- **PM 场景**：一个 commit（session-close 统一提交）
- **空提交处理**：无变更时静默跳过

## Git 异常处理

| 异常场景                          | 处理方式                                     |
| --------------------------------- | -------------------------------------------- |
| 无变更（工作区干净）              | 跳过 commit，在恢复指引中记录                |
| `git commit` 失败（hook 拒绝）    | 记录错误，告知用户手动处理，继续收工         |
| 非 Git 仓库                       | 跳过所有 Git 操作，提示用户 `git init`       |
| Detached HEAD / rebase 进行中     | 跳过 commit，警告用户先完成当前 Git 操作     |
| `git push` 失败（网络/远程拒绝）  | 告知用户「已提交但未推送」，记录在恢复指引中 |
| 敏感文件检测（辅助防线）          | 排除这些文件，仅提交 allowlist 内安全文件    |
| 当前分支无 upstream               | 跳过 push 检测，在恢复指引中记录             |
| scope 外变更（非 allowlist 文件） | 列出文件，询问用户是否包含在本次提交中       |
| Index 冲突（用户并行手动修改）    | 跳过 commit，建议用户 `git stash` 或手动解决 |

## 硬约束

- **未记日志不可收工** — 必须至少写入一条 journal 条目
- **未输出恢复指引不可收工** — Step 8 必须执行
- **Git 变更必须被处理** — 有变更时必须尝试提交；提交失败时记录错误并告知用户，但不阻塞收工流程
- 如果 `journal_append()` 失败，手动将日志内容告知用户，请用户协助保存

## 触发测试用例

### TC-01: 正常收工流程

- **场景**: PM 完成工作后
- **输入**: 用户说「收工」
- **期望行为**:
  1. 汇总会话工作（Step 1）
  2. 写入 journal（Step 2）
  3. 执行知识沉淀检查（Step 4，含 F44 已知问题检查和 F48 长文档检查）
  4. Git 提交（Step 6）
  5. 输出恢复指引（Step 8）
- **验证方法**: 检查 journal 是否写入、Git 是否提交、恢复指引是否包含硬约束检查项

### TC-02: 无变更时的收工

- **场景**: 会话中只进行了查询，未修改任何文件
- **输入**: 用户说「收工」
- **期望行为**: 跳过 Git 提交，仍然写入 journal 和输出恢复指引
- **验证方法**: 检查提交步骤显示"工作区已干净"

### TC-03: MCP/CLI 问题触发已知问题库更新

- **场景**: 会话中遇到了 Gemini CLI 429 限流
- **输入**: 用户说「收工」
- **期望行为**: Step 4 知识分类自检中触发 F44 检查项 → 建议更新 `spec://guides/known-issues`
- **验证方法**: 检查收尾流程是否提示更新已知问题库

### TC-04: Rules 合规回顾

- **场景**: 长对话会话中 AI 误修改了受保护的文件
- **输入**: 用户说「收工」
- **期望行为**: Step 4.5 自检发现违规 → journal 中标记 `[RULE_BREACH]` → 恢复指引中显示 `⚠️ 有违规`
- **验证方法**: 检查 journal 是否包含 `[RULE_BREACH]` 标记，恢复指引硬约束检查中 Rules 合规是否标注违规
