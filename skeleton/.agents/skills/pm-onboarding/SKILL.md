---
name: pm-onboarding
description: "[PM] 新项目引导 — 触发：pm-session-start 检测到新项目（developer.name 为空 + 无 journal + 无 tasks）。排除：已初始化的项目。产出：完整配置 + 首个任务 + 归档闭环。提供引导模式（分步讲解）和快速模式（一键完成）。"
produces: project_config, first_task
requires: null
---

# PM 新项目引导（Onboarding Tutorial）

## 适用场景

当 `pm-session-start` Step 0 检测到新项目（三条件同时满足：`developer.name` 为空 + `.trellis/workspace/` 无 journal + `.trellis/tasks/` 无任务目录）时，自动激活本 Skill。

## 模式选择

pm-session-start 会在检测到新项目时询问用户：

- 用户选择**引导模式** → 执行下方完整 10 步流程（每步讲解）
- 用户选择**快速模式** → 跳转到「快速模式」章节（AI 自动完成）

---

## 引导模式（10 步完整流程）

> 核心理念：**初始化就是教程，教程就是初始化** — 没有假操作，每一步都是真实工作。

### Step 1: 填写开发者信息

**做的真实工作**：填写 `config.yaml` 的 `developer.name`。

**讲解内容**：

```
👤 首先，告诉我你的名字。
这个名字用于：
- 工作区文件夹命名（.trellis/workspace/{你的名字}/）
- 日志归属（journal 记录谁在什么时候做了什么）
- Git 提交关联

请输入你的名字：
```

**执行**：用户回答后，AI 修改 `config.yaml` 的 `developer.name` 字段，并创建 `.trellis/workspace/{name}/journal.md`。

### Step 2: 配置外部 AI 助手

**做的真实工作**：配置 `config.yaml` 的 `external_cli` 和 `team.roster`。

**讲解内容**：

```
🤖 easyAI 支持调用外部 AI 做代码审查，形成"多 AI 交叉审核"的质量保障体系。
这就像请几位不同专长的同事帮你 review 代码。

可用的外部 AI 助手：
1. Codex CLI — 擅长后端逻辑、安全检查、代码执行验证
2. Claude Code — 擅长代码审查、架构分析、多文件关联分析
3. Gemini CLI — 擅长前端审查、模式一致性、多模态能力

easyAI 会根据任务重要性自动决定是否调用外部审查：
- A 级（影响核心）→ 3 个外部 AI 全部审核
- B 级（跨模块）→ 2 个审核
- C 级（单模块）→ 1 个审核
- D/E 级（低风险）→ 不需要外部审核

你安装了哪些？（没安装可以直接跳过，以后随时添加）
```

**执行**：根据用户回答，AI 更新 `external_cli` 数组和 `team.roster`。跳过则保持空数组。

### Step 3: 设定项目核心规范

**做的真实工作**：配置 `config.yaml` 的 `core_rules`。

**讲解内容**：

```
📏 核心规范是 AI 在你的项目中必须遵守的「铁律」。
AI 在编码、审查时会强制遵循这些规范，保证代码质量始终如一。

举一些例子：
- "禁止使用 any 类型（TypeScript）"
- "所有 API 必须有单元测试"
- "CSS 使用 BEM 命名规范"
- "每个函数不超过 50 行"

告诉我你的项目规范，或者先跳过，随时在 config.yaml 中添加。
```

**执行**：根据用户回答，AI 更新 `core_rules` 数组。

### Step 4: 选择交互级别

**做的真实工作**：配置 `config.yaml` 的 `user_level`。

**讲解内容**：

```
📊 你希望 AI 以什么详细程度和你沟通？

- 新手（novice）— AI 详细解释每一步，适合编程初学者
- 中级（intermediate）— AI 适度引导，给出关键信息（默认）
- 专家（expert）— AI 精简输出，只给结论

你可以随时在 config.yaml 中修改。选哪个？
```

**执行**：AI 更新 `user_level` 字段。

### Step 5: 生成语义地图

**做的真实工作**：激活 `common-semantic-map` Skill，生成 `semantic-map.json` + `semantic-map-view.md`。

**讲解内容**：

```
🗺️ 语义地图是 AI 理解你项目结构的"地图"。
它扫描项目目录，识别每个文件夹和关键文件的用途，
帮助 AI 快速定位代码、避免在错误的地方写文件。

正在生成...
```

**执行**：调用 `common-semantic-map` Skill。如果项目为空（刚 init），生成的语义地图会比较简单，但随着项目发展可以随时刷新。

### Step 6: 用户记事本体验

**做的真实工作**：引导用户在 `user-记事本.md` 写入一条内容。

**讲解内容**：

```
📝 easyAI 有一个"记事本"系统，分为用户记事本和 PM 记事本。

用户记事本（.docs/notes/user-记事本.md）有四个分区：
- 💡 想法区 — 随时记录灵感
- 📋 待办区 — 还没具体化的事项
- ❓ 疑问区 — 需要 AI 帮忙研究的问题
- 📎 参考区 — 有用的链接和资料

AI 会在启动时读取你的记事本，自动处理里面的内容。

现在试试：在「待办区」写一条 "完成框架初始化配置"。
（直接告诉我内容，我帮你写入）
```

**执行**：AI 将用户的内容写入 `user-记事本.md` 的待办区。

### Step 7: PM 记事本体验

**做的真实工作**：PM 在 `pm-记事本.md` 写入一条备忘。

**讲解内容**：

```
📝 PM 也有自己的记事本（.docs/notes/pm-记事本.md）。
PM 在工作中发现的问题、后续线索会记在这里。

和用户记事本的区别：
- 用户记事本 → 你写的，AI 来处理
- PM 记事本 → AI 写的，作为跨会话记忆

现在我（PM）记一条备忘：
"✅ 新项目初始化完成，配置已填写。下次启动时检查 semanticmap 是否需要刷新。"
```

**执行**：AI 写入 `pm-记事本.md` 待办区。

### Step 8: 创建首个任务

**做的真实工作**：通过 MCP `task_create` 创建一个真实任务。

**讲解内容**：

```
📋 easyAI 用「约束集任务」管理开发工作。
每个任务包含：
- 标题和描述（做什么）
- 验收标准（怎么算完成）
- 文件范围（改哪些文件）
- ABCDE 等级（影响范围多大）

任务有生命周期：pending → in_progress → under_review → completed → archived

现在我来创建项目的第一个真实任务：
"创建项目 README.md"

Worker 编码时会自动参考 .trellis/spec/ 下的规范文件。
目前规范目录是空的，你可以随时往里面添加编码规范（比如前端规范、API 规范等），
AI 在编码和审查时会自动遵守这些规范。
```

**执行**：调用 `task_create`，创建一个 E 级任务（文档类），描述是基于用户在前几步中提供的项目信息，生成一份结构清晰的项目 README.md（包含项目名称、简介、技术栈、安装方式等）。

> 如果项目是全新的（无代码），README 以骨架形式创建（标题 + 占位区块），Worker 标注 `[TDD-EXEMPT]`。

### Step 9: Worker 执行演示

**做的真实工作**：提示用户切换到 Worker 角色执行任务。

**讲解内容**：

```
🔧 任务创建好了！在 easyAI 中，执行任务需要切换到 Worker 角色。
就像公司里 PM 负责规划、开发者负责编码一样。

请输入以下命令来启动 Worker：
/actor-worker {task_id}

Worker 会自动：
1. 读取任务约束集
2. 编写代码（遵循 TDD — 先写测试再写实现）
3. 自检验证（三标记：lint_PASS / test_PASS / manual_PASS）
4. 提交验收

👉 试试看！执行完后回到 PM 角色验收。
```

**执行**：输出 PATEOAS 导航，引导用户执行 `/actor-worker {task_id}`。**此步 onboarding 暂停**，等用户在另一个会话中完成 Worker 执行后回来。

### Step 10: 收工 + 归档演示

**做的真实工作**：PM 验收任务 → 收工 → 进度归档。

> 此步在用户完成 Worker 执行、PM 验收后自然衔接。

**讲解内容**（在 PM 验收完成后）：

```
🎉 任务已完成！最后来体验一下 easyAI 的收工流程。

收工包含：
- 写入 journal 日志（记录这次会话做了什么）
- Git 提交（保存所有变更）
- 生成恢复指引（下次会话如何续接）

执行收工后，可以进一步做进度归档：
- 清理过期文档
- 归档已完成任务
- 生成里程碑总结

这标志着一个完整开发周期的结束。

收工和归档，分别在以下时机使用：
- 收工 → 每次结束工作时
- 归档 → 阶段性里程碑完成时（如版本发布、大功能上线）
```

**执行**：引导用户说「收工」→ 触发 `pm-session-close`。然后引导用户说「进度归档」→ 触发 `pm-milestone-archive`。

---

## 快速模式

> 跳过所有讲解，AI 自动完成初始化。

### 执行流程

1. **读取 Git config 获取用户名**：`git config user.name`，写入 `developer.name`
2. **external_cli 保持空**（用户可后续配置）
3. **core_rules 保持空**（用户可后续配置）
4. **user_level 保持 intermediate**
5. **生成语义地图**
6. **创建 workspace 目录**
7. **输出功能速查表**

### 功能速查表

快速模式完成后，输出以下速查表：

```markdown
## easyAI 功能速查表

| 命令                      | 作用             | 使用场景                     |
| ------------------------- | ---------------- | ---------------------------- |
| `/actor-pm`               | 启动 PM 角色     | 需求讨论、任务管理、验收审批 |
| `/actor-worker {task_id}` | 启动 Worker 角色 | 按任务约束集编码             |
| 收工                      | 会话收尾         | 每次结束工作时               |
| 进度归档                  | 里程碑归档       | 阶段性成果完成时             |

| 文件/目录                     | 用途                               |
| ----------------------------- | ---------------------------------- |
| `.trellis/config/config.yaml` | 框架配置（开发者信息、规范、团队） |
| `.docs/notes/user-记事本.md`  | 你的想法/待办/疑问/参考            |
| `.docs/notes/pm-记事本.md`    | AI 的跨会话工作记忆                |
| `.docs/design/`               | 需求设计文档                       |
| `.trellis/tasks/`             | 任务管理                           |

配置详情请查看 `config.yaml` 中的注释。
准备就绪！输入你的第一个需求开始开发。
```

---

## 与 pm-session-start 的衔接

本 Skill 由 `pm-session-start` Step 0 触发：

```
pm-session-start Step 0 检测 →
  新项目（三条件）→ 询问用户 →
    "Y" → 激活 pm-onboarding（引导模式）
    "N" / "跳过" → 激活 pm-onboarding（快速模式）
  非新项目 → 正常 session-start 流程
```

**onboarding 完成后**，PM 状态自然进入正常工作模式，用户可以继续 `/actor-pm` 进行日常开发。

---

## 触发测试用例

### TC-01: 引导模式完整流程

- **场景**: 全新项目，developer.name 为空，无 journal，无 tasks
- **输入**: `/actor-pm` → 选择引导模式
- **期望行为**: 按 Step 1-8 顺序执行，每步有讲解
- **验证方法**: config.yaml 各字段已填写，semantic-map 已生成，首个任务已创建

### TC-02: 快速模式

- **场景**: 同 TC-01
- **输入**: `/actor-pm` → 选择跳过引导
- **期望行为**: AI 自动完成所有初始化，输出功能速查表
- **验证方法**: developer.name 已从 git config 读取，速查表已输出

### TC-03: 非新项目不触发

- **场景**: developer.name 已填写，有 journal 文件
- **输入**: `/actor-pm`
- **期望行为**: 正常 session-start 流程，不触发 onboarding
- **验证方法**: 无 onboarding 输出，直接输出状态快照
