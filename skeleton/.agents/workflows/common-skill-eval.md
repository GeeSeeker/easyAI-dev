---
description: Skill 评估工作流 — 在开发/规划类请求前强制执行，评估并激活所需的 Skills
---

# Skill 评估工作流

> 本 Workflow 由 `skill-eval-guard` Rule 强制触发。目的是解决 AI"不读 Skill 就干活"的问题。

## 执行步骤

### Step 1：输出 Skill 激活评估卡

逐个评估以下 12 个 Skill，判断是否与当前请求相关。输出格式如下：

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

| 等级  | 定义                      | CLI 审核要求  |
| ----- | ------------------------- | ------------- |
| **A** | 影响框架核心 / 不可逆变更 | 3 个 CLI 审核 |
| **B** | 跨模块 / 用户可感知的功能 | 2 个 CLI 审核 |
| **C** | 单模块 / 内部逻辑变更     | 1 个 CLI 审核 |
| **D** | 低风险 / 测试 / 配置      | 可选          |
| **E** | 文档 / 注释 / 格式        | 不需要        |

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

以下是所有可用 Skill 及其触发条件，用于 Step 1 的快速评估：

### PM 角色 Skills

| Skill                 | 触发条件                         |
| --------------------- | -------------------------------- |
| `pm-session-start`    | `/pm` 触发后由角色 Workflow 激活 |
| `pm-brainstorm`       | 用户提出新需求时                 |
| `pm-task-planning`    | 设计文档确认后，需要创建任务时   |
| `pm-task-review`      | Worker 提交验收时                |
| `pm-framework-evolve` | 查询框架知识或修改核心文件时     |
| `pm-session-close`    | PM 说"收工"时                    |

### Worker 角色 Skills

| Skill                  | 触发条件                                  |
| ---------------------- | ----------------------------------------- |
| `worker-implement`     | Worker 开始实现任务时                     |
| `worker-check`         | worker-implement 完成后                   |
| `worker-debug`         | Bug、测试失败或意外行为时                 |
| `worker-lead`          | 团队执行模式下，Worker 升级为组长时       |
| `worker-session-close` | worker-check 完成后，或 Worker 中途暂停时 |

### 通用 Skills

| Skill                | 触发条件                     |
| -------------------- | ---------------------------- |
| `common-spec-update` | 需要更新 `.trellis/spec/` 时 |
