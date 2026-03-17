---
description: Skill 评估工作流 — 在开发/规划类请求前强制执行，评估并激活所需的 Skills
---

# Skill 评估工作流

> 本 Workflow 由 `skill-eval-guard` Rule 强制触发。目的是解决 AI"不读 Skill 就干活"的问题。

## 执行步骤

### Step 1：输出 Skill 激活评估卡

#### 1a. 图谱辅助定位（框架相关请求时执行）

如果请求涉及框架功能（`.agents/`、`.trellis/spec/`、`packages/`），先读取 `.agents/graph/_index.md` 定位涉及的特性域，再读取 `role-system/pm-workflow.md` 或 `worker-workflow.md` 的 `skill_chain` 字段，辅助判断哪些 Skill 与该特性域相关。

> 非框架请求跳过此步，直接进入 1b。

#### 1b. 逐 Skill 评估

逐个评估以下 13 个 Skill，判断是否与当前请求相关。输出格式如下：

```markdown
> **🔧 Skill 激活评估卡**
>
> | Skill            | 需要？ | 理由                       |
> | ---------------- | ------ | -------------------------- |
> | pm-session-start | ✅ 是  | 会话刚启动，需恢复项目状态 |
> | pm-brainstorm    | ❌ 否  | 不涉及需求发散             |
> | ...              | ...    | ...                        |
```

### Step 2：拉取需要的 Skill（Level 2）

对评估卡中标记为"✅ 是"的 Skill，**必须**使用 `view_file` 工具读取对应的 `SKILL.md` 全文，然后遵循其中的步骤执行。

**禁止**凭记忆执行 Skill 内容，必须实际拉取并阅读。

### Step 3：自评 ABCDE 工作重要性等级

无论当前角色是 PM 还是 Worker，在产出离散产出物时，**必须**自评 ABCDE 等级：

| 等级  | 定义                      | CLI 审核要求  | 对应风险分级 |
| ----- | ------------------------- | ------------- | ------------ |
| **A** | 影响框架核心 / 不可逆变更 | 3 个 CLI 审核 | ⚫ critical  |
| **B** | 跨模块 / 用户可感知的功能 | 2 个 CLI 审核 | 🔴 high      |
| **C** | 单模块 / 内部逻辑变更     | 1 个 CLI 审核 | 🟡 medium    |
| **D** | 低风险 / 测试 / 配置      | 可选          | 🟢 low       |
| **E** | 文档 / 注释 / 格式        | 不需要        | —            |

> **映射说明**：ABCDE 是**执行角色自评**（工作重要性），🟢🟡🔴⚫ 是 **PM 任务路由评级**（风险等级）。两套体系一一对应，消除分裂。

- A/B 级必须在日志中记录分级理由
- 多 CLI 审核时，选择**不同的 CLI**以确保视角多样性

输出格式：

```markdown
> **📊 工作分级：C 级** — 单模块内部逻辑变更，需 1 个 CLI 审核
```

### Step 4：开始正式工作

评估和分级完成后，按照拉取到的 Skill 指引开始执行任务。

---

## Skill 速查清单（Level 1 触发条件）

以下是所有可用 Skill 及其触发/排除条件，用于 Step 1 的快速评估：

### PM 角色 Skills

| Skill                  | 触发条件                                               | 排除条件                                  |
| ---------------------- | ------------------------------------------------------ | ----------------------------------------- |
| `pm-session-start`     | `/actor-pm` 命令启动新会话                             | 会话已启动或 Worker 角色                  |
| `pm-brainstorm`        | 用户提出新功能需求或变更请求                           | 已有设计文档且用户未要求修改              |
| `pm-task-planning`     | 设计文档已确认，需创建执行任务                         | 设计未持久化到 `.docs/design/`            |
| `pm-task-review`       | 任务状态为 `under_review`                              | 任务未提交验收或仍在执行中                |
| `pm-framework-evolve`  | 查询框架架构或修改 `.agents/`、`.trellis/spec/config/` | Worker 角色                               |
| `pm-milestone-archive` | 用户主动要求「进度归档」或里程碑结束时                 | 日常单次会话收工（用 `pm-session-close`） |
| `pm-session-close`     | 用户说「收工」或会话即将结束                           | Worker 角色（用 `worker-session-close`）  |

### Worker 角色 Skills

| Skill                  | 触发条件                                        | 排除条件                                |
| ---------------------- | ----------------------------------------------- | --------------------------------------- |
| `worker-implement`     | Worker 接到任务开始从零编码                     | 修复已有代码的 Bug（用 `worker-debug`） |
| `worker-check`         | `worker-implement` 编码完成，提交验收前         | 编码尚未完成时不激活                    |
| `worker-debug`         | 已有代码出现 Bug、测试失败或意外行为            | 新功能从零编码（用 `worker-implement`） |
| `worker-lead`          | Worker 以组长角色执行团队任务                   | 独立执行模式或组员角色不激活            |
| `worker-session-close` | `worker-check` 完成后自动衔接，或中途暂停时触发 | PM 角色（用 `pm-session-close`）        |

### 通用 Skills

| Skill                | 触发条件                                 | 排除条件                                 |
| -------------------- | ---------------------------------------- | ---------------------------------------- |
| `common-spec-update` | 新建或修改 `.trellis/spec/` 下的规范文件 | 运行时数据变更（`tasks/`、`workspace/`） |
