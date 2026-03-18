<p align="center">
  <h1 align="center">🤖 easyAI-Dev</h1>
  <p align="center">
    <strong>让用户以纯客户的视角进行软件开发</strong><br>
    你只需提需求、审批方案、验收结果。AI 团队搞定一切。
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/@geeseeker/easyai-dev"><img src="https://img.shields.io/npm/v/@geeseeker/easyai-dev?color=blue&label=npm" alt="npm version"></a>
    <a href="https://github.com/GeeSeeker/easyAI-dev/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"></a>
    <a href="https://antigravity.google/"><img src="https://img.shields.io/badge/IDE-Antigravity-purple" alt="Antigravity"></a>
  </p>
</p>

---

## 💡 这是什么？

easyAI 是一个为 [Antigravity IDE](https://antigravity.google/) 打造的 **AI 协作开发框架**。

它在 IDE 中组建 **PM（项目经理）** + **Worker（执行者）** 双角色 AI 团队，覆盖从需求分析到代码交付的完整开发流程。你不需要写代码、不需要了解技术细节 — 只需和 PM 对话。

### 适合谁？

| ✅ 适合                      | ❌ 不适合                     |
| ---------------------------- | ----------------------------- |
| 有想法但不想写代码的人       | 追求极致手动控制的资深开发者  |
| 编程初学者 + 个人开发者      | 不使用 Antigravity IDE 的用户 |
| 希望 AI 全流程管理开发的团队 | 只需要代码补全的轻量用户      |

---

## ⚡ 5 分钟快速体验

> **前置要求**：[Antigravity IDE](https://antigravity.google/) + [Node.js](https://nodejs.org/) >= 18 + Git

### 1. 安装（让 AI 帮你）

复制以下文字，粘贴到 Antigravity 对话框中：

```
请帮我安装 easyAI 框架。
安装指南：https://raw.githubusercontent.com/GeeSeeker/easyAI-dev/main/README_AI.md
请读取这份指南，按步骤自动完成配置。
```

AI 会自动完成 MCP 配置 + 项目初始化，还会引导你选装增强 MCP（Context7 文档检索 + ContextWeaver 代码语义搜索 + Exa 互联网搜索）。**这就是 easyAI 的哲学** — 连安装都不需要你亲自动手。

### 2. 启动 PM

```
输入 /actor-pm 启动项目经理
```

**首次启动？** AI 会自动检测到你是新用户，引导你完成项目配置（开发者信息、AI 审查团队、编码规范等），同时带你体验一次完整的开发流程 — **初始化就是教程，教程就是初始化**。

### 3. 描述你的需求

```
你：我需要一个用户登录功能
        ↓
PM：提问澄清需求 → 生成设计文档 → 你审批
        ↓
PM：拆分约束集任务 → Worker 自动编码（TDD）
        ↓
PM：三阶段验收 → 你确认交付 ✅
```

---

## 🏗️ 核心能力一览

### 🎯 双角色 AI 团队

| 角色       | 职责                                             | 触发方式                  |
| ---------- | ------------------------------------------------ | ------------------------- |
| **PM**     | 需求沟通、设计评审、任务拆分、验收审批、会话记忆 | `/actor-pm`               |
| **Worker** | 按约束集编码、TDD 铁律、自检验证、Evidence Gate  | `/actor-worker {task_id}` |

> PM 和 Worker 像公司里的产品经理和开发者 — PM 负责「做什么」，Worker 负责「怎么做」。

### 📋 任务生命周期

```
创建（pending）→ 执行（in_progress）→ 提交验收（under_review）
    → 通过（completed）→ 归档（archived）
    → 打回（rejected）→ 重新执行
```

每个任务包含**约束集**（描述 + 验收标准 + 文件范围 + ABCDE 等级），Worker 必须严格按约束执行。

### 🛡️ 五层质量保障

| 层  | 机制               | 说明                                              |
| --- | ------------------ | ------------------------------------------------- |
| 1️⃣  | **反幻觉**         | 第三方 API 必须查文档，禁止凭记忆编码             |
| 2️⃣  | **TDD 铁律**       | 先写测试再写实现，Worker 无法跳过                 |
| 3️⃣  | **ABCDE 外部审查** | 高风险任务由多个独立 AI 交叉审核                  |
| 4️⃣  | **Evidence Gate**  | 提交验收时三标记必须全部 PASS（lint/test/manual） |
| 5️⃣  | **PM 三阶段验收**  | 规范合规 → 代码质量 → 文档沉淀                    |

### 🧠 跨会话记忆系统

- **Journal 日志** — 每次收工自动记录做了什么、遗留什么
- **PM 记事本** — AI 的工作记忆，跨会话保持连贯
- **用户记事本** — 你的想法/待办/疑问，AI 主动处理
- **语义地图** — AI 扫描项目结构，消除"战争迷雾"

### 🕸️ 知识图谱驱动

20 个节点的特性树，覆盖 5 层架构。AI 在修改框架时，先查图谱了解全貌和依赖关系，**精准迭代、不盲改**。

### 🤖 多 AI 协作

通过 ABCDE 分级体系，自动决定是否调用外部 AI（Codex CLI / Claude Code / Gemini CLI）做独立审查：

| 等级 | 影响范围              | 外部审核数   |
| ---- | --------------------- | ------------ |
| ⚫ A | 核心架构 / 不可逆变更 | 3 个         |
| 🔴 B | 跨模块 / 用户可感知   | 2 个         |
| 🟡 C | 单模块 / 内部逻辑     | 1 个         |
| 🟢 D | 低风险 / 配置         | 0（PM 自审） |
| — E  | 文档 / 格式           | 0（免审）    |

---

## 🔧 MCP 深度集成

easyAI 通过 **MCP 协议**（Model Context Protocol）与 IDE 深度集成，提供 **23 个工具 + 6 个数据源**：

| 类别     | 工具                                                                            | 用途              |
| -------- | ------------------------------------------------------------------------------- | ----------------- |
| 任务管理 | task_create, task_list, task_get, task_transition, task_cancel, task_append_log | 完整任务 CRUD     |
| 子任务   | subtask_create, subtask_dependency_graph                                        | DAG 依赖管理      |
| 日志     | journal_append, journal_search                                                  | 跨会话记忆        |
| 并行开发 | worktree_create, worktree_merge, worktree_cleanup, worktree_list                | Git Worktree 隔离 |
| 质量     | context_generate, context_budget, spec_validate, plan_validate, conflict_check  | AI 辅助质量控制   |
| 框架     | framework_init, framework_check, framework_update                               | 安装/检查/升级    |
| 状态     | project_status                                                                  | 项目全景概览      |

MCP Server **自动检测 IDE 工作区**（通过 MCP roots 协议），切换项目零配置。

---

## 📊 框架规模

```
18 个 Skills（能力模块）    ← PM/Worker 的专业技能
 8 条 Rules（行为规则）      ← 反幻觉、编码规范等硬约束
 4 个 Workflows（工作流）    ← PM/Worker/评估/修复入口
23 个 MCP Tools（工具）      ← 任务管理、日志、质量控制
 6 个 MCP Resources（数据源）← 状态、规范、日志
20 个 Knowledge Graph Nodes  ← 框架自感知的神经系统
```

---

## 📁 项目结构

安装 easyAI 后，你的项目会多出以下目录：

```
your-project/
├── .agents/            ← AI 角色层
│   ├── rules/          │  8 条行为规则（反幻觉、编码规范等）
│   ├── workflows/      │  4 个工作流（PM / Worker / 评估 / 轻量修复）
│   ├── skills/         │  18 个能力模块（需求发散、TDD 编码、验收审查等）
│   └── graph/          │  20 节点知识图谱（框架自感知的神经系统）
├── .trellis/           ← 数据持久层
│   ├── config/         │  框架配置（config.yaml + permissions.yaml）
│   ├── spec/           │  项目规范（前端/后端/通用）
│   ├── tasks/          │  任务管理（生命周期追踪）
│   └── workspace/      │  开发者记忆（journal 日志 + 语义地图）
├── .docs/              ← 意图与蓝图空间
│   ├── notes/          │  记事本（用户/PM 各一份）
│   ├── design/         │  架构与规划中心
│   ├── refs/           │  外部参考资料库
│   └── archive/        │  文档归档
└── ...                 ← 你的项目代码
```

---

## 🛠️ CLI 命令

```bash
npx @geeseeker/easyai-dev init [dir]     # 初始化项目（新项目/已有项目）
npx @geeseeker/easyai-dev check [dir]    # 检查框架完整性
npx @geeseeker/easyai-dev update [dir]   # 智能升级（保留用户配置和数据）
npx @geeseeker/easyai-dev serve          # 启动 MCP Server
```

---

## 🧬 设计哲学：框架即人体

> **easyAI 框架 = 人体。AI = 大脑。** Skills/Workflows/Trellis = 身体部件。**知识图谱 = 神经系统。**

| 目标         | 含义                                        | 比喻                     |
| ------------ | ------------------------------------------- | ------------------------ |
| **自我感知** | AI 随时知道框架拥有什么能力，不需要用户提醒 | 感知到身体各部位的存在   |
| **自主协调** | 面对任务，AI 自动识别需要调动哪些模块配合   | 跑步时手脚自动协调       |
| **精准迭代** | 增加新能力时，AI 知道跨模块需要修改哪些文件 | 知道血液要输送到哪些肌肉 |

框架采用**五层生长架构**，从基础设施向上生长到用户体验：

```
Layer 5: 用户体验（需求交付、会话管理、文档流水线）
Layer 4: 角色系统（PM 工作流、Worker 工作流）
Layer 3: 能力层（18 Skills + 知识图谱）
Layer 2: 数据层（任务、日志、规范、配置）
Layer 1: 基础设施（MCP 传输、Git 集成、文件持久化、Manifest）
```

---

## 📄 许可证

[MIT](LICENSE) | [更新日志](CHANGELOG.md)

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/GeeSeeker">GeeSeeker</a></sub>
</p>
