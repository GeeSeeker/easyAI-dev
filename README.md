<p align="center">
  <h1 align="center">🤖 easyAI-Dev</h1>
  <p align="center">
    <strong>让用户以纯客户的视角进行软件开发</strong><br>
    用户只需提需求、审批方案、验收结果。
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

### 核心特性

| 特性            | 说明                                                 |
| --------------- | ---------------------------------------------------- |
| 🎯 **角色驱动** | PM 管需求和验收，Worker 管编码和测试                 |
| 📋 **任务管理** | 完整的任务生命周期：创建 → 分配 → 执行 → 验收 → 归档 |
| 🧠 **记忆系统** | journal 日志 + Artifacts 沉淀，跨会话不丢失上下文    |
| 🛡️ **反幻觉**   | 第三方 API 必须查文档，禁止凭记忆编码                |
| ✅ **TDD 铁律** | 所有新功能必须先写测试，Worker 无法跳过              |
| 🔧 **MCP 集成** | 22 个工具 + 6 个数据源，通过 MCP 协议与 IDE 深度集成 |

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

AI 会自动完成 MCP 配置 + 项目初始化。**这就是 easyAI 的哲学** — 连安装都不需要你亲自动手。

### 方式二：命令行安装

```bash
# 新项目
npx @geeseeker/easyai-dev init my-project

# 已有项目
cd your-project
npx @geeseeker/easyai-dev init .
```

然后在 Antigravity 的 MCP 设置中添加：

```json
{
  "easyai-mcp-server": {
    "command": "npx",
    "args": ["-y", "@geeseeker/easyai-dev", "serve"]
  }
}
```

重启 IDE，完成。

---

## 🎮 使用

```
1. 打开 Antigravity IDE
2. 输入 /pm 启动项目经理
3. 和 PM 对话，描述你的需求
4. 等待交付 🎉
```

---

## 📁 项目结构

安装 easyAI 后，你的项目会多出以下目录：

```
your-project/
├── .agents/            ← AI 角色层
│   ├── rules/          │  3 条始终生效的规则
│   ├── workflows/      │  PM + Worker 工作流
│   └── skills/         │  10+ 个能力模块
├── .trellis/           ← 数据持久层
│   ├── config/         │  框架配置
│   ├── spec/           │  项目规范
│   ├── tasks/          │  任务管理
│   └── workspace/      │  开发者记忆（journal）
├── .docs/              ← 用户文档空间
│   ├── requirements/   │  需求文档
│   ├── design/         │  设计方案
│   ├── guides/         │  使用指南
│   ├── notes/          │  临时笔记
│   └── archive/        │  文档归档
└── ...                 ← 你的项目代码
```

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
