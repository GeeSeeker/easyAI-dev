# easyAI

> **让用户以纯客户的视角进行软件开发** — 用户只需提需求、审批方案、验收结果。

easyAI 是一个为 [Antigravity IDE](https://antigravity.dev) 打造的 AI 协作框架。它在 IDE 中组建 PM + Worker 两个 AI 角色，覆盖从需求分析到代码交付的完整开发流程。

## 安装

### 方式一：让 AI 帮你安装（推荐）

复制以下文字，粘贴到 Antigravity IDE 的对话框中：

```
请帮我安装 easyAI 框架。
安装指南在这里：https://raw.githubusercontent.com/GeeSeeker/easyAI-dev/main/README_AI.md
请读取这份指南，按步骤自动完成配置。
```

AI 会自动完成 MCP 配置和项目初始化。

### 方式二：命令行安装

```bash
# 初始化新项目
npx @geeseeker/easyai-dev init my-project

# 或集成到已有项目
cd existing-project
npx @geeseeker/easyai-dev init .
```

然后在 Antigravity IDE 中配置 MCP Server：

```json
{
  "easyai-mcp-server": {
    "command": "npx",
    "args": ["-y", "@geeseeker/easyai-dev", "serve"]
  }
}
```

## 使用

1. 在 Antigravity IDE 中打开项目
2. 输入 `/pm` 启动项目经理
3. 向 PM 描述你的需求，开始开发！

## 框架结构

```
你的项目/
├── .agents/        ← AI 角色层（规则、工作流、Skills）
├── .trellis/       ← 数据持久层（配置、规范、任务、日志）
├── .docs/          ← 用户文档空间
└── ...             ← 你的项目代码
```

## CLI 命令

```bash
npx @geeseeker/easyai-dev init [dir]     # 初始化项目
npx @geeseeker/easyai-dev check [dir]    # 检查框架完整性
npx @geeseeker/easyai-dev update [dir]   # 更新框架
npx @geeseeker/easyai-dev serve          # 启动 MCP Server
```

## 许可证

MIT
