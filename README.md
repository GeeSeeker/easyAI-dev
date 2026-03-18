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

```text
请帮我安装 easyAI 框架。
安装指南：https://raw.githubusercontent.com/GeeSeeker/easyAI-dev/main/README_AI.md
请读取这份指南，按步骤自动完成配置。
```

AI 会自动完成 MCP 配置 + 项目初始化，还会引导你选装增强 MCP（Context7 文档检索 + ContextWeaver 代码语义搜索 + Exa 互联网搜索）。**这就是 easyAI 的哲学** — 连安装都不需要你亲自动手。

### 2. 启动 PM

```text
输入 /actor-pm 启动项目经理
```

**首次启动？** AI 会自动检测到你是新用户，引导你完成项目配置（开发者信息、AI 审查团队、编码规范等），同时带你体验一次完整的开发流程 — **初始化就是教程，教程就是初始化**。

### 3. 完整使用流程

```text
/actor-pm                       ← 启动 PM
  │
  ├─ 描述你的需求                ← 你是客户，只管提需求
  ├─ PM 苏格拉底式提问            ← 帮你澄清需求
  ├─ PM 生成设计文档              ← 你审批
  ├─ PM 拆分约束集任务            ← 你审批
  │
  ├─ /actor-worker T001          ← 新会话，Worker 自动编码（TDD）
  │   ├─ 先写测试 → 再写实现
  │   ├─ 三标记自检（lint + test + manual）
  │   └─ 提交验收
  │
  ├─ PM 三阶段验收               ← 规范合规 → 代码质量 → 文档沉淀
  ├─ 你确认交付 ✅
  │
  ├─ "收工"                      ← ⭐ 每次结束工作必做
  │   ├─ 写入 journal 日志        │  持久化记忆，下次自动恢复
  │   ├─ Git 自动提交             │  保存所有变更
  │   └─ 输出恢复指引             │  下次续接有上下文
  │
  └─ "进度归档"                  ← ⭐ 阶段性里程碑完成时
      ├─ 清理过期文档
      ├─ 归档已完成任务
      └─ 生成里程碑总结
```

> **收工**和**进度归档**是 easyAI 跨会话记忆的关键。不收工 = 下次 AI 可能丢失本次工作上下文。

---

## 🏗️ 为什么 easyAI 不同？

市面上的 AI 编码工具大多是「给 AI 一堆工具，让它自由发挥」。easyAI 的理念完全不同：

> **给 AI 建一个完整的身体 — 有骨骼、有肌肉、有神经系统。**

### 🧠 AI 不只有工具，还有身体

| 人体部件 | 对应框架组件                        | 作用                                              |
| -------- | ----------------------------------- | ------------------------------------------------- |
| 骨骼     | `.trellis/`（数据层）               | 支撑结构：任务、日志、规范、配置                  |
| 肌肉     | `.agents/skills/`（18 个 Skills）   | 专业能力：需求分析、TDD 编码、代码审查、调试…     |
| 神经系统 | `.agents/graph/`（20 节点知识图谱） | 自我感知：AI 知道自己有什么能力、改一处会影响哪里 |
| 血管系统 | Rules + Evidence Gate               | 质量保障：反幻觉、TDD 铁律、验收闸门自动运转      |
| 大脑     | AI 本身                             | 思考和决策，驱动身体的各个部件协作                |

传统 AI 工具：AI 有大脑但没有身体，每次都从零开始。
easyAI：AI 拥有完整身体，**启动即就位、跨会话不失忆、质量自动保障**。

### 📐 底层架构：极简但强大

easyAI 的架构只有三个目录 + 一个协议，却支撑了完整的企业级开发流程：

```text
.agents/     ← AI 的能力（Rules + Skills + Workflows + Graph）
.trellis/    ← 项目的数据（tasks + journal + spec + config）
.docs/       ← 人的意图（notes + design + refs + archive）
MCP Server   ← 桥梁（23 个工具 + 6 个数据源，连接 IDE 和框架）
```

**为什么强大？**

1. **纯文本，无数据库** — 所有数据都是 Markdown/YAML/JSON，Git 原生版本控制，任何编辑器都能看
2. **Manifest 驱动升级** — 升级时只替换「你没改过的框架文件」，永不覆盖你的数据和自定义
3. **MCP roots 零配置** — 切换项目时 IDE 自动告诉 MCP Server 当前在哪，不需要改任何配置
4. **渐进式披露** — 知识图谱三层加载（一屏概览 → 域内详情 → 节点依赖），AI 按需加载、不浪费 Token

---

## 🛡️ 五层质量保障

easyAI 不依赖「AI 碰巧写对了」，而是用五层机制**系统性保障**代码质量：

| 层  | 何时生效 | 机制                                                                 | 谁负责          |
| --- | -------- | -------------------------------------------------------------------- | --------------- |
| 1️⃣  | 编码时   | **反幻觉** — 第三方 API 必须查文档，禁止凭记忆编码                   | Rules（硬约束） |
| 2️⃣  | 编码时   | **TDD 铁律** — 先写失败测试，再写实现，周期循环                      | Worker Skill    |
| 3️⃣  | 提交前   | **ABCDE 外部审查** — 高风险任务由 1-3 个独立 AI 交叉审核             | PM + 外部 CLI   |
| 4️⃣  | 提交时   | **Evidence Gate** — lint_PASS + test_PASS + manual_PASS 三标记全通过 | MCP 硬约束      |
| 5️⃣  | 验收时   | **PM 三阶段验收** — 规范合规 → 代码质量 → 文档沉淀                   | PM              |

> 这五层是**系统机制，不是口头约定**。即使 AI 想偷懒，MCP 层的 Evidence Gate 也会强制拦截。

---

## 🤖 多 AI 协作：ABCDE 分级审查

easyAI 不只用一个 AI — 它可以调动多个独立 AI 做代码审查，就像请不同专长的同事 review 你的代码：

| 等级 | 影响范围            | 外部审核     | 示例场景                         |
| ---- | ------------------- | ------------ | -------------------------------- |
| ⚫ A | 核心架构 / 不可逆   | 3 个 AI 全审 | 数据库 schema 变更、认证系统重写 |
| 🔴 B | 跨模块 / 用户可感知 | 2 个 AI 审核 | 新增 API 端点、UI 流程变更       |
| 🟡 C | 单模块 / 内部逻辑   | 1 个 AI 审核 | 工具函数重构、内部算法优化       |
| 🟢 D | 低风险 / 配置       | PM 自审      | 配置文件修改、测试补充           |
| — E  | 文档 / 格式         | 免审         | README 更新、注释补充            |

可配置的外部 AI：**Codex CLI**（代码执行验证）、**Claude Code**（架构分析）、**Gemini CLI**（前端审查）。

---

## 🔧 MCP 深度集成

easyAI 通过 **MCP 协议**（Model Context Protocol）与 IDE 深度集成：

**23 个工具**：任务 CRUD（6）、子任务 DAG（2）、日志搜索（2）、Git Worktree 并行开发（4）、质量控制（5）、框架管理（3）、项目状态（1）

**6 个数据源**：项目状态、任务详情、日志历史、规范文件、配置信息、框架版本

**自动检测**：MCP Server 通过 roots 协议自动获取 IDE 工作区路径，切换项目**零配置**（v4.2.5+）。

---

## 📊 框架规模

```text
18 个 Skills       ← PM/Worker 的专业能力模块
 8 条 Rules         ← 反幻觉、编码规范等硬约束
 4 个 Workflows     ← PM / Worker / 评估 / 发布入口
23 个 MCP Tools     ← 任务管理、日志、质量控制
 6 个 MCP Resources ← 状态、规范、日志数据源
20 个 Graph Nodes   ← 5 层知识图谱（框架的神经系统）
```

---

## 📁 项目结构

安装 easyAI 后，你的项目会多出以下目录：

```text
your-project/
├── .agents/            ← AI 的能力
│   ├── rules/          │  8 条行为规则（反幻觉、编码规范等）
│   ├── workflows/      │  4 个工作流入口
│   ├── skills/         │  18 个能力模块
│   └── graph/          │  20 节点知识图谱
├── .trellis/           ← 项目的数据
│   ├── config/         │  框架配置（config.yaml + permissions.yaml）
│   ├── spec/           │  项目编码规范
│   ├── tasks/          │  任务管理（含 archive/）
│   └── workspace/      │  开发者记忆（journal + 语义地图）
├── .docs/              ← 人的意图
│   ├── notes/          │  记事本（用户 + PM 各一份）
│   ├── design/         │  设计文档
│   ├── refs/           │  参考资料
│   └── archive/        │  文档归档
└── ...                 ← 你的项目代码
```

> **三个目录各司其职**：`.agents/` 管 AI 的能力、`.trellis/` 管项目的数据、`.docs/` 管人的意图。简单清晰，无数据库依赖。

---

## 📚 教程文档

| 教程                                    | 适合谁           | 内容                                        |
| --------------------------------------- | ---------------- | ------------------------------------------- |
| [🚀 快速上手](docs/getting-started.md)  | 完全新手         | 从安装到交付第一个需求的完整指南            |
| [🧠 核心概念](docs/core-concepts.md)    | 想深入了解的用户 | 五层架构、角色系统、质量保障、知识图谱      |
| [📋 工作流实战](docs/workflow-guide.md) | 日常使用参考     | PM/Worker 操作手册、收工归档、配置定制、FAQ |

---

## 🛠️ CLI 命令

```bash
npx @geeseeker/easyai-dev init [dir]     # 初始化项目（新项目/已有项目）
npx @geeseeker/easyai-dev check [dir]    # 检查框架完整性
npx @geeseeker/easyai-dev update [dir]   # 智能升级（保留用户数据）
npx @geeseeker/easyai-dev serve          # 启动 MCP Server
```

---

## 🙏 致谢

easyAI 的诞生离不开以下开源项目和技术的启发：

| 项目                                                                                                                    | 致谢                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [Trellis](https://github.com/montasaurus/trellis)                                                                       | easyAI 的任务管理和 Skills 系统最初从 Trellis 学习并发展而来，Trellis 的规范驱动开发理念深刻影响了 easyAI 的架构设计 |
| [Antigravity IDE](https://antigravity.google/)                                                                          | Google DeepMind 打造的 AI 原生 IDE，提供了 MCP 支持和 Agents 基础能力                                                |
| [Model Context Protocol](https://modelcontextprotocol.io/)                                                              | Anthropic 提出的 AI-工具通信标准，easyAI 的 23 个工具和 6 个数据源都基于 MCP 实现                                    |
| [Context7](https://context7.com) / [ContextWeaver](https://github.com/nicobailon/contextweaver) / [Exa](https://exa.ai) | 增强 MCP 生态 — 文档检索、代码语义搜索、互联网搜索                                                                   |

---

## 📄 许可证

[MIT](LICENSE) | [更新日志](CHANGELOG.md)

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/GeeSeeker">GeeSeeker</a></sub>
</p>
