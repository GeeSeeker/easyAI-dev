---
name: pm-framework-evolve
description: PM 框架自迭代 — 框架百科查询、安全迭代、迭代记录、知识库自更新。PM 需要修改框架核心文件或查询框架知识时激活。
---

# PM 框架自迭代

## 适用场景

PM 角色在以下场景**必须**激活本 Skill：

1. **查询框架知识**（最常用）：需要了解框架架构、功能、文件职责时 → 走「只读查询路径」
2. **修改框架文件**：需要修改 `.agents/`、`.trellis/spec/`、`.trellis/config/` 时 → 走「迭代路径」
3. **查看迭代历史**：需要了解框架修改记录时 → 读取 `changelog/`

> **实时性内容**（如最新 Issues、Release 历史）应由 AI 实时访问 GitHub 仓库获取，不写死在文件中。

---

## 快速参考索引

> **用途**：回答简单事实问题时直接查阅此表，无需加载 references/ 文件。

### 框架组件统计

<!-- 本节由 /publish 流程自动同步，请勿手动修改 -->
<!-- last_synced: 2026-03-16 -->

| 组件          | 数量 | 列表                                                                                                                                                                           |
| ------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Skills        | 10   | pm-session-start, pm-brainstorm, pm-task-planning, pm-task-review, pm-framework-evolve, worker-implement, worker-check, worker-debug, common-session-close, common-spec-update |
| Workflows     | 2+1  | pm.md, worker.md（🦴骨架）+ publish.md（🔧开发专属）                                                                                                                           |
| Rules         | 3+1  | project-identity.md, anti-hallucination.md, coding-standards.md（🦴骨架）+ framework-dev-mode.md（🔧开发专属）                                                                 |
| MCP Tools     | 23   | 详见 `references/features.md` → "MCP Tools" 章节                                                                                                                               |
| MCP Resources | 6    | trellis://status, trellis://journal/latest, trellis://spec/{c}/{n}, spec://{c}/{n}, trellis://tasks/{id}/context, trellis://tasks/{id}/subtasks/{sid}/context                  |

### 关键路径速查

| 需要了解…       | 答案                                                      |
| --------------- | --------------------------------------------------------- |
| PM 角色入口     | `/pm` → `.agents/workflows/pm.md`                         |
| Worker 角色入口 | `/worker T001` → `.agents/workflows/worker.md`            |
| 项目规范目录    | `.trellis/spec/`（backend / frontend / guides / general） |
| 任务数据目录    | `.trellis/tasks/`                                         |
| 日志系统        | `.trellis/workspace/journal.md`                           |
| 框架配置        | `.trellis/config/config.yaml`                             |
| MCP Server 源码 | `packages/mcp-server/src/`(🔧开发专属)                    |
| npm 包名        | `@geeseeker/easyai-dev`                                   |
| GitHub 仓库     | https://github.com/GeeSeeker/easyAI-dev                   |

---

## 查询路由

> **用途**：需要深入了解某个主题时，按此表定位到具体 references 文件，避免全量加载。

| 问题类型                               | 读取文件           | 文件行数 |
| -------------------------------------- | ------------------ | -------- |
| 设计理念、四层架构、约束分层、记忆体系 | `architecture.md`  | ~155行   |
| Skill/Tool/Resource 的详细描述和关联   | `features.md`      | ~171行   |
| 文件位置、目录结构、骨架/运行时分类    | `directory-map.md` | ~89行    |
| 安装方式、版本管理、仓库信息           | `installation.md`  | ~90行    |

---

## 只读查询路径

当 AI 仅需**查询**框架知识（不修改任何文件）时：

1. 先查「快速参考索引」，能直接回答则**到此结束**
2. 索引不够 → 按「查询路由」表读取对应的 references 文件
3. 回答用户问题，**不执行任何后续步骤**

> 只读查询不需要走迭代流程（Step 0-6），不需要记录 changelog，不需要用户确认门。

---

## 知识库（references/）

框架的结构化知识，修改框架前**必须先查阅**：

| 文件               | 内容                                                           |
| ------------------ | -------------------------------------------------------------- |
| `architecture.md`  | 设计理念、四层架构、约束分层、角色系统、文档沉淀管道、升级机制 |
| `features.md`      | Skills、Workflows、Rules、MCP Tools、MCP Resources、关联关系图 |
| `directory-map.md` | 完整目录清单，🦴骨架/🏃运行时/🔧开发专属分类                   |
| `installation.md`  | 安装方式、版本管理、仓库信息、Manifest 智能合并                |

## 管控范围

以下 **框架核心目录** 的修改必须通过本 Skill 管控：

- `.agents/rules/` — 规则文件
- `.agents/workflows/` — 角色入口
- `.agents/skills/` — 能力模块
- `.trellis/spec/` — 项目规范（也可通过 `common-spec-update` Skill 处理）
- `.trellis/config/` — 框架配置

> `.trellis/tasks/` 和 `.trellis/workspace/` 属于运行时数据，不受本 Skill 管控。
>
> **开发工作区注意**：在 `easyAI-dev/` 中，实际修改在 `playground/` 进行，记录用 `.trellis/`。详见 `framework-dev-mode.md` rule。

---

## 迭代路径

当 AI 需要**修改**框架文件时，执行以下流程：

### Step 0：知识加载（前置）

在开始任何框架变更前：

1. 读取 `references/` 理解当前框架结构和设计理念
2. 读取 `changelog/index.md` 了解已有的迭代历史
3. 基于知识判断本次变更的合理性

### Step 1：变更清单

列出所有将要修改的文件及变更类型：

```markdown
| 文件                        | 变更类型 | 变更摘要      |
| --------------------------- | -------- | ------------- |
| .agents/rules/xxx.md        | 修改     | 增加 xxx 约束 |
| .agents/skills/yyy/SKILL.md | 新建     | yyy 能力模块  |
```

> **Skill 回归测试检查**（F65）：若变更目标包含 Skill（`.agents/skills/` 下的 SKILL.md），
> **必须先更新**该 Skill 的 `## 触发测试用例` 章节，再执行修改。
> 参照 `spec://guides/skill-regression` 的触发测试用例模板。

### Step 2：影响范围分析

评估直接影响（变更文件数、变更类型）和间接影响（关联角色、关联 Skills、约束层级），给出风险等级：

- **低**：仅新增能力，不影响现有行为
- **中**：修改已有文件，可能影响角色行为
- **高**：修改 Rules 或核心 Workflow，影响所有会话

### Step 3：用户确认门

将变更清单和影响报告呈现给用户，**等待明确确认后才执行**。用户拒绝则记录原因到 journal，放弃变更。

### Step 4：执行变更 + 验证

- 逐步执行文件修改，每步完成后验证完整性
- 如涉及 MCP Server 代码，确保 `npm run build` 通过

### Step 5：记录迭代

1. 按 `resources/changelog-entry-template.md` 模板生成迭代记录
2. 保存到 `changelog/YYYY-MM-DD_{slug}.md`
3. 更新 `changelog/index.md` 索引
4. 通过 `journal_append()` 记录变更日志

### Step 6：知识库自更新

迭代完成后，检查 `references/` 中是否有文件需要更新：

- 新增/删除了 Skill → 更新 `features.md`
- 新增/删除了 Rule → 更新 `features.md`
- 修改了目录结构 → 更新 `directory-map.md`
- 修改了安装功能 → 更新 `installation.md`
- 修改了架构设计 → 更新 `architecture.md`

> **自更新边界**：只更新事实性描述，不改变知识库的结构和格式。

---

## 迭代分类标签

| 标签     | 定义                                   | 示例                                |
| -------- | -------------------------------------- | ----------------------------------- |
| `新增`   | 添加框架原本没有的全新功能             | 新增一个 Skill、新增一个 MCP Tool   |
| `优化`   | 改善现有功能，不改变功能边界           | 优化 Skill 的流程步骤、改善错误提示 |
| `修复`   | 修正现有功能的 Bug 或文档错误          | 修复 tool 参数校验遗漏              |
| `修改`   | 调整现有功能的行为或配置，在设计走廊内 | 修改约束层级顺序、修改默认配置值    |
| `魔改`   | **超出设计意图**的深度改造             | 重写角色系统、替换 MCP 传输协议     |
| `实验性` | 试探性修改，可能会被撤销               | 试验新的上下文管理策略              |

> **修改 vs 魔改判断标准**：问"这个修改是否改变了框架对其他组件的**契约**？" 不改变契约 = 修改，改变契约 = 魔改。

---

## 硬约束

- **必须经用户确认门**：禁止绕过确认直接修改框架文件
- **必须留 journal 记录**：每次框架变更（成功或拒绝）都必须记录
- **不可批量盲改**：每个文件的变更理由必须明确，禁止"顺便改一下"
- **遇到不确定的框架修改决策时，应暂停并与用户沟通**

## 触发测试用例

### TC-01: 只读查询不走迭代流程

- **场景**: PM 需要查询框架某个 Skill 的职责
- **输入**: 「pm-brainstorm 这个 Skill 是干什么的？」
- **期望行为**: 查询快速参考索引或 references/ 后直接回答，不执行 Step 0-6
- **验证方法**: 检查是否跳过了变更清单、影响分析、用户确认等步骤

### TC-02: 修改 Skill 时触发回归测试检查

- **场景**: PM 需要修改 `worker-implement` Skill
- **输入**: 修改 `.agents/skills/worker-implement/SKILL.md`
- **期望行为**: Step 1 变更清单中标注 Skill 变更 → 触发 F65 回归测试检查 → 要求先更新该 Skill 的 `## 触发测试用例`
- **验证方法**: 检查 Step 1 是否包含 Skill 回归测试提醒

### TC-03: 非 Skill 文件修改不触发回归测试检查

- **场景**: PM 需要修改 `.trellis/config/config.yaml`
- **输入**: 修改配置文件
- **期望行为**: Step 1 变更清单中不触发 F65 回归测试检查（因为不是 Skill 文件）
- **验证方法**: 检查 Step 1 是否跳过了 Skill 回归测试提醒
