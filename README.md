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

### 核心特性

| 特性                 | 说明                                                 |
| -------------------- | ---------------------------------------------------- |
| 🎯 **角色驱动**      | PM 管需求和验收，Worker 管编码和测试                 |
| 📋 **任务管理**      | 完整的任务生命周期：创建 → 分配 → 执行 → 验收 → 归档 |
| 🧠 **记忆系统**      | journal 日志 + Artifacts 沉淀，跨会话不丢失上下文    |
| 🛡️ **反幻觉**        | 第三方 API 必须查文档，禁止凭记忆编码                |
| ✅ **TDD 铁律**      | 所有新功能必须先写测试，Worker 无法跳过              |
| 🕸️ **知识图谱**      | 20 节点特性树，AI 自感知框架全貌，精准迭代           |
| 🤖 **外部 CLI 审查** | ABCDE 分级闸门，高风险任务由多个 AI 独立审核         |
| 🔧 **MCP 深度集成**  | 23 个工具 + 6 个数据源，通过 MCP 协议与 IDE 深度集成 |

---

## 🧬 设计哲学：框架即人体

> **easyAI 框架 = 人体。AI = 大脑。** Skills/Workflows/Trellis = 身体部件。**知识图谱 = 神经系统 + 血管系统。**

我们不只是给 AI 一堆工具 — 我们让 AI 拥有一个**有自我感知能力的身体**：

| 目标         | 含义                                        | 比喻                     |
| ------------ | ------------------------------------------- | ------------------------ |
| **自我感知** | AI 随时知道框架拥有什么能力，不需要用户提醒 | 感知到身体各部位的存在   |
| **自主协调** | 面对任务，AI 自动识别需要调动哪些模块配合   | 跑步时手脚自动协调       |
| **精准迭代** | 增加新能力时，AI 知道跨模块需要修改哪些文件 | 知道血液要输送到哪些肌肉 |

框架采用**五层生长架构**，从基础设施向上生长到用户体验，底层变化自动向上传播影响。

→ [**深入了解架构设计** →](docs/core-concepts.md)

---

## 🚀 快速安装

> **前置要求**：[Antigravity IDE](https://antigravity.google/) + [Node.js](https://nodejs.org/) >= 18

### 方式一：让 AI 帮你安装（推荐 👈）

复制以下文字，粘贴到 Antigravity 对话框中：

```
请帮我安装 easyAI 框架。
安装指南：https://raw.githubusercontent.com/GeeSeeker/easyAI-dev/main/README_AI.md
请读取这份指南，按步骤自动完成配置。
```

AI 会自动完成 MCP 配置 + 项目初始化，还会引导你选装增强 MCP（Context7 文档检索 + ContextWeaver 代码语义搜索 + Exa 互联网搜索）。**这就是 easyAI 的哲学** — 连安装都不需要你亲自动手。

### 方式二：命令行安装

```bash
# 新项目
npx @geeseeker/easyai-dev init my-project

# 已有项目
cd your-project
npx @geeseeker/easyai-dev init .
```

然后在 Antigravity 的 MCP 设置中添加（`~/.gemini/antigravity/mcp_config.json`）：

```json
{
  "easyai-mcp-server": {
    "command": "npx",
    "args": ["-y", "@geeseeker/easyai-dev", "serve"],
    "env": {
      "EASYAI_PROJECT_ROOT": "/你的项目的绝对路径"
    }
  }
}
```

> ⚠️ `EASYAI_PROJECT_ROOT` 必须设置为项目根目录的**绝对路径**。切换项目时需同步更新此路径。

重启 IDE，完成。

---

## 🎮 使用

```
1. 打开 Antigravity IDE
2. 输入 /actor-pm 启动项目经理
3. 和 PM 对话，描述你的需求
4. 等待交付 🎉
```

### 完整流程示例

```
你：我需要一个用户登录功能
         ↓
PM：苏格拉底式提问，澄清需求细节
         ↓
PM：生成设计文档，请你审批
         ↓
PM：拆分为约束集任务，分配给 Worker
         ↓
Worker（独立会话）：TDD 编码 → 自检验证 → 提交
         ↓
PM：三阶段验收（规范合规 → 代码质量 → 文档沉淀）
         ↓
你：确认验收，功能交付 ✅
```

---

## 📁 项目结构

安装 easyAI 后，你的项目会多出以下目录：

```
your-project/
├── .agents/            ← AI 角色层
│   ├── rules/          │  8 条行为规则（反幻觉、编码规范等）
│   ├── workflows/      │  4 个工作流（PM / Worker / 评估 / 轻量修复）
│   ├── skills/         │  17 个能力模块（需求发散、TDD 编码、验收审查等）
│   └── graph/          │  20 节点知识图谱（框架自感知的神经系统）
├── .trellis/           ← 数据持久层
│   ├── config/         │  框架配置（config.yaml）
│   ├── spec/           │  项目规范（前端/后端/通用）
│   ├── tasks/          │  任务管理（生命周期追踪）
│   └── workspace/      │  开发者记忆（journal 日志）
├── .docs/              ← 意图与蓝图空间
│   ├── notes/          │  草稿场区
│   ├── refs/           │  外部参考资料库
│   ├── design/         │  架构与规划中心
│   └── archive/        │  文档归档
└── ...                 ← 你的项目代码
```

---

## 📚 教程文档

| 教程                                    | 适合谁           | 内容                                   |
| --------------------------------------- | ---------------- | -------------------------------------- |
| [🚀 快速上手](docs/getting-started.md)  | 完全新手         | 从安装到交付第一个需求的完整指南       |
| [🧠 核心概念](docs/core-concepts.md)    | 想深入了解的用户 | 五层架构、角色系统、质量保障、知识图谱 |
| [📋 工作流实战](docs/workflow-guide.md) | 日常使用参考     | PM/Worker 操作手册、配置定制、FAQ      |

---

## 🛠️ CLI 命令

```bash
npx @geeseeker/easyai-dev init [dir]     # 初始化项目
npx @geeseeker/easyai-dev check [dir]    # 检查框架完整性
npx @geeseeker/easyai-dev update [dir]   # 更新框架版本
npx @geeseeker/easyai-dev serve          # 启动 MCP Server
```

---

## 📄 许可证

[MIT](LICENSE) | [更新日志](CHANGELOG.md)

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/GeeSeeker">GeeSeeker</a></sub>
</p>
