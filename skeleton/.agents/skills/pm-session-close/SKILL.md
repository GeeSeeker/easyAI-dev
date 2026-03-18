---
name: pm-session-close
description: "[PM] 会话收尾 — 触发：用户说「收工」或会话即将结束。排除：Worker 角色（用 worker-session-close）。产出：journal 日志 + Git 提交 + 恢复指引。"
produces: journal_entry
requires: null
---

# PM 会话收尾

## 适用场景

**仅 PM 角色**在会话结束前执行本 Skill。Worker 角色使用 `worker-session-close`。

## 触发条件

- 用户明确表示「**收工**」（或等价表达，如"结束"、"下班"等）
- 用户明确表示本次会话结束
- 上下文预算接近阈值，需要新开会话

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

### Step 3：更新任务执行记录

如果本会话涉及具体任务，调用 MCP Tool `task_append_log()`：

```
task_append_log({
  task_id: "T001",
  entry: "完成了 xxx，剩余 yyy 待处理"
})
```

### Step 4：知识沉淀检查（含分类触发）

> 本质：在会话收尾时充当"最后一道提醒"，确保面向用户的有价值内容不会随会话消散。
> 参照规范：`spec://general/knowledge-categories` 定义 6 种知识分类及触发规则。

#### 4a. 知识分类自检

按 `spec://general/knowledge-categories` 自检清单逐项检查：

1. **本会话是否做出了架构/技术选型决策？** → 触发 `ADR`：按 `spec://general/adr-template` 创建决策记录
2. **本会话是否产出了可复用的操作流程？** → 触发 `GUIDE`：沉淀到 `.docs/design/features/`
3. **本会话是否解决了非显而易见的 Bug？** → 触发 `FIX`：沉淀到 `.docs/notes/`
4. **本会话是否研究了外部技术并有价值摘要？** → 触发 `REF`：沉淀到 `.docs/notes/`
5. **有无短期有效的备忘需要记录？** → 触发 `NOTE`：沉淀到 `.docs/notes/`
6. **本会话是否遇到 MCP/CLI 已知问题？** → 更新 `spec://guides/known-issues`（参照 F44 已知问题库条目模板）
7. **本会话是否产出了超过 100 行的长文档？** → 主动执行文档简化流程（参照 `spec://guides/doc-simplify`）：
   - 按 `doc-simplify` 规范创建简化版文件到 `.docs/design/features/{原文件名}-简化版.md`
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

   | Artifacts 类型           | 分类    | 默认沉淀目标                     |
   | ------------------------ | ------- | -------------------------------- |
   | `walkthrough.md`         | `GUIDE` | `.docs/design/features/`         |
   | `other`（分析报告等）    | `REF`   | `.docs/notes/`                   |
   | 架构/技术决策            | `ADR`   | `.docs/design/decisions/`        |
   | Bug 修复过程/根因分析    | `FIX`   | `.docs/notes/`                   |
   | 短期备忘/待办            | `NOTE`  | `.docs/notes/`                   |
   | `implementation_plan.md` | —       | 跳过（`pm-brainstorm` 已处理）   |
   | `task.md`                | —       | 跳过（`.trellis/tasks/` 已持久） |

4. **用户确认后执行**
   - 用户确认需要沉淀 → 提炼内容并写入目标路径（ADR 使用模板）
   - 用户确认无需沉淀 → 跳过
   - 若写入失败 → 记录错误但继续收工流程

### Step 4.5：关联文档状态同步

> 确保会话中完成的任务所关联的设计文档状态被同步更新，防止文档状态与实际进度脱节。
> 标记规范遵循 `pm-milestone-archive`：`[DONE]` = 设计已完工（文件名加前缀，保留原位），`[OBSOLETE]` = 设计已废弃（移至 `archive/`）。

#### 设计文档标准状态字段

设计文档应在头部 blockquote 元数据中包含可见的 `**状态**` 字段。本 Step 和 `pm-milestone-archive` 统一识别和更新此字段。

**识别规则**（按优先级）：

1. blockquote 中的 `> **状态**：xxx` — 首选，用户可见
2. HTML 注释 `<!-- status: xxx -->` — 辅助标记，供程序化扫描

**标准状态值**：

| 状态值                     | 含义                                           | 何时标记               |
| -------------------------- | ---------------------------------------------- | ---------------------- |
| `草稿` / `待确认` / 自定义 | 设计中                                         | 文档创建时             |
| `✅ 已实现`                | 所有关联任务 completed                         | session-close Step 4.5 |
| `⚠️ 部分实现`              | 部分任务 completed，其余仍 pending/in_progress | session-close Step 4.5 |
| `❌ 已废弃`                | 关联任务 cancelled                             | session-close Step 4.5 |

1. **扫描本会话触及的任务**
   - 从 Step 2 写入的 journal entry 的 `tasks_touched` 字段获取本会话涉及的任务 ID 列表
   - 若无 `tasks_touched` → 跳过本步骤

2. **提取任务关联的设计文档**
   - 对每个任务 ID，调用 `task_get()` 读取任务详情
   - 在任务的 `description`、`file_scope` 和 task.md 正文中搜索 `.docs/design/` 路径引用
   - 收集所有被引用的设计文档路径（去重）
   - 若无关联文档 → 跳过本步骤

3. **检测文档状态变更需求**
   - 对每个关联的设计文档，检查其 `> **状态**：` 字段当前值
   - 若已含 `已实现` 或 `已废弃` → 跳过该文档
   - 若未标记 → 根据关联任务的状态判断：

   | 任务状态                          | 操作                                     |
   | --------------------------------- | ---------------------------------------- |
   | `completed` / `archived`          | 检查该文档的**所有**关联任务是否都已完成 |
   | `cancelled`                       | 提示用户是否需要标记文档为 `[OBSOLETE]`  |
   | 其他（`in_progress` / `pending`） | 不操作                                   |

4. **向用户展示建议**（仅建议，不自动执行）

   ```markdown
   ## 设计文档状态同步建议

   以下设计文档的关联任务已发生状态变更：

   | 文档       | 关联任务 | 任务状态  | 建议操作        |
   | ---------- | -------- | --------- | --------------- |
   | {文档路径} | {任务ID} | completed | 标记 [DONE]     |
   | {文档路径} | {任务ID} | cancelled | 标记 [OBSOLETE] |

   是否需要执行上述操作？（可逐项确认）
   ```

5. **用户确认后执行**（双重更新）
   - 用户确认标记 `[DONE]`：
     1. 更新 `> **状态**：` 行为 `> **状态**：✅ 已实现（{关联任务ID} completed, {日期}）`
     2. 添加或更新 `<!-- status: DONE -->` HTML 注释（便于程序化扫描）
   - 用户确认标记 `[OBSOLETE]`：
     1. 更新 `> **状态**：` 行为 `> **状态**：❌ 已废弃（{原因}, {日期}）`
     2. 添加或更新 `<!-- status: OBSOLETE -->` HTML 注释
   - 用户拒绝 → 跳过

> **注意**：本步骤仅做状态标注（更新可见状态字段 + HTML 注释），不执行文件重命名或移动操作。文件重命名（加 `[DONE]` 前缀）和归档操作统一由 `pm-milestone-archive` 在里程碑归档时处理。

### Step 4.6：Rules 合规回顾

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

### Step 4.7：Skill 使用审计

> 事后审计 — 回顾本会话中所有 Skill 的激活情况，写入 journal 以供追溯。

1. 回顾本会话输出，收集所有 `[Skill: xxx]` 激活标记
2. 统计每个 Skill 的激活次数，整理为表格：

   | Skill 名 | 激活次数 |
   | -------- | -------- |
   | {name}   | {count}  |

3. 调用 `journal_append()` 写入审计条目：
   ```yaml
   tags: ["SKILL_AUDIT"]
   content: "## [SKILL_AUDIT] 本次会话 Skill 使用记录\n\n| Skill 名 | 激活次数 |\n| -------- | -------- |\n| {name} | {count} |\n...\n\n总计激活 {n} 个 Skill，共 {total} 次。"
   ```
4. **无 Skill 激活** → 仍写入审计条目，content 标注「本次会话未使用任何 Skill」

### Step 4.8：记事本整理

> 每次收工时自动检查并整理记事本，确保格式规范、内容有序。

#### 4.8a. 说明区完整性检查（仅 user-记事本）

1. 读取 `.docs/notes/user-记事本.md`
2. 检查是否包含说明区（以 `> **处理模式**：` 开头的 blockquote）
3. **缺失或不完整** → 按记事本模板自动补全说明区（保留用户已有的处理模式值）
4. **处理模式值不为 `跳过处理` / `询问用户` / `自动处理` 之一** → 不改，保留用户原文

> ⚠️ 说明区中的处理模式值是用户自行设定的，AI 不可修改。仅在说明区缺失时按模板补全（默认值 `询问用户`）。

#### 4.8b. 记事本内容整理

1. **读取处理模式**（user-记事本从说明区获取，pm-记事本固定为 `自动处理`）

2. **按处理模式执行**：

   | 模式       | 行为                                                             |
   | ---------- | ---------------------------------------------------------------- |
   | `跳过处理` | 不做任何操作                                                     |
   | `询问用户` | 问用户「是否需要帮你整理记事本？」→ 用户同意后按自动处理逻辑执行 |
   | `自动处理` | 直接执行整理（见下方步骤）                                       |

3. **整理步骤**（`自动处理` 或用户同意后）：
   - 扫描本会话已完成的工作，对照记事本「待办」区中的条目
   - **AI 确定已完成的条目** → 从「待办」移到「完成」，加 ~~删除线~~ 和 **已完成** 标记
   - **AI 不确定是否完成的条目** → 询问用户确认
   - 重新编号：待办区从 1 开始连续编号，完成区从 1 开始连续编号
   - 「长期」区不动

4. **pm-记事本** 执行相同的整理步骤（固定自动处理，无需询问）

> **四分区结构**：记事本分为「说明」（仅 user）、「长期」、「待办」、「完成」四区。AI 只处理「待办」和「完成」。

### Step 5：`.tmp/` 清理

1. 检测项目下 `.tmp/` 目录是否存在且非空
2. 若非空 → 列出文件清单，向用户提供选项：
   - 「是否需要我为你一键清理这些临时文件？」
   - 用户确认清理 → 执行清理（若某些文件被锁定，优雅跳过并列出残留）
   - 用户拒绝 → 跳过
3. 若为空或不存在 → 跳过

### Step 5.5：`.gitkeep` 清理

> 框架初始化时用 `.gitkeep` 保持空目录进入 Git。当目录已有实际内容后，`.gitkeep` 不再必要。

1. 扫描以下目录下的所有 `.gitkeep` 文件：
   - `.trellis/`（递归）
   - `.docs/`（递归）
2. 对每个找到的 `.gitkeep`，检查**同级目录**是否包含除 `.gitkeep` 以外的其他文件或子目录
3. **同级目录有其他内容** → 删除该 `.gitkeep`（已不需要）
4. **同级目录为空**（仅 `.gitkeep`）→ 保留（仍需要它来维持目录结构）
5. 静默执行，无需询问用户。删除结果在 Step 6 Git 提交中自然体现

> 此步骤为静默清理，不打断收工流程。

### Step 6：Git 自动提交

> 本步骤在所有文件变更操作（journal、task log、artifacts 沉淀）完成后执行，确保 commit 捕获最终状态。

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
   - `.docs/notes/user-记事本.md` 和 `.docs/notes/pm-记事本.md`（Step 4.8 记事本整理）
   - scope 外的变更 → 列出并询问用户是否包含

5. **敏感文件过滤**（辅助防线）— 扫描允许列表内的文件：
   - 若发现 `.pem`, `.env`, `.key`, `.secret` 后缀 → 警告并排除

6. 执行提交（路径必须用双引号包裹，防止中文/空格路径问题）：

```bash
git add -- "<file1>" "<file2>" ...
git commit -m "{message}"
```

**Commit message 规则：**

| 场景                    | 格式                        | 示例                                     |
| ----------------------- | --------------------------- | ---------------------------------------- |
| PM 收工                 | `session: {摘要}`           | `session: 需求澄清 + T001/T002 任务拆分` |
| PM 收工（涉及特定任务） | `session(T{id}...): {摘要}` | `session(T001, T002): 验收 + 需求澄清`   |

### Step 7：Push 确认

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
- {✅ 已推送到远程 / ⚠️ 未推送（{n} 个本地提交）}

### Git 状态快照

- 当前分支：{branch}
- 最后提交：{hash} ({message})
- 同步状态：{本地领先远程 n 个提交 / 已同步 / 无远程}

### 硬约束检查

- [x] Journal 日志 ✅
- [x] 恢复指引 ✅（本消息即是）
- [x] Git 变更已处理 ✅
- [x] Rules 合规 {✅ 无违规 / ⚠️ 有违规（见 journal `[RULE_BREACH]` 条目）}
- [x] Skill 审计 {✅ 已记录（见 journal `[SKILL_AUDIT]` 条目） / ⚠️ 审计写入失败}

### PATEOAS 导航

#### 下一步行动

1. [ ] 新开会话，执行 `/actor-pm` 恢复 PM 上下文
2. [ ] 或执行 `/actor-worker {task_id}` 继续具体任务
3. [ ] 新会话将读取 `trellis://journal/latest` Resource 自动恢复状态

#### 状态快照

- 当前角色：PM
- 当前 Skill: pm-session-close
- 当前阶段：SESSION_CLOSE
- 已沉淀：Journal ✅ | 任务记录 ✅ | .docs/ {✅/⚠️}
- 遗留事项：{有/无} — {具体内容}
```

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

### TC-01: 正常 PM 收工流程

- **场景**: PM 完成工作后
- **输入**: 用户说「收工」
- **期望行为**:
  1. 汇总会话工作（Step 1）
  2. 写入 journal（Step 2）
  3. 执行知识沉淀检查（Step 4）
  4. Git 提交（Step 6）+ Push 确认（Step 7）
  5. 输出恢复指引（Step 8）
- **验证方法**: 检查 journal 是否写入、Git 是否提交、恢复指引是否包含硬约束检查项

### TC-02: 无变更时的 PM 收工

- **场景**: 会话中只进行了查询，未修改任何文件
- **输入**: 用户说「收工」
- **期望行为**: 跳过 Git 提交，仍然写入 journal 和输出恢复指引
- **验证方法**: 检查提交步骤显示"工作区已干净"

### TC-03: Skill 使用审计

- **场景**: 会话中激活了多个 Skill（如 pm-session-start → pm-brainstorm → pm-session-close）
- **输入**: 用户说「收工」
- **期望行为**: Step 4.7 写入 `[SKILL_AUDIT]` 条目 → 恢复指引显示 `✅ Skill 审计已记录`
- **验证方法**: 检查 journal 是否包含 `[SKILL_AUDIT]` 标记
