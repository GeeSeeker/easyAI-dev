# easyAI 安装指南

> 本文档是框架知识库的一部分，供 AI 在框架自迭代时参考。

## 安装方式

### 方式 1：让 AI 帮你安装（推荐）

复制以下文字到 Antigravity 对话框：

```
请帮我安装 easyAI 框架。
安装指南：https://raw.githubusercontent.com/GeeSeeker/easyAI-dev/main/README_AI.md
请读取这份指南，按步骤自动完成配置。
```

### 方式 2：命令行安装

```bash
# 新项目
npx @geeseeker/easyai-dev init my-project

# 已有项目（不覆盖 README.md，合并 .gitignore）
cd your-project
npx @geeseeker/easyai-dev init .
```

然后在 Antigravity IDE 的 MCP 设置中添加：

```json
{
  "easyai-mcp-server": {
    "command": "npx",
    "args": ["-y", "@geeseeker/easyai-dev", "serve"],
    "env": {
      "EASYAI_PROJECT_ROOT": "/path/to/your/project"
    }
  }
}
```

## 安装后结构

```text
project/
├── .agents/           # AI 角色层
│   ├── rules/         # 规则文件（3 个）
│   ├── workflows/     # PM + Worker 入口
│   └── skills/        # 10 个能力模块
├── .trellis/          # 数据持久层
│   ├── config/        # config.yaml + context-budget.md
│   ├── spec/          # 项目规范
│   ├── tasks/         # 任务目录
│   └── workspace/     # journal
├── .docs/             # 用户文档空间（5 个子文件夹）
├── .easyai-version    # 版本标记文件
└── .easyai-manifest.json  # 框架文件清单（用于智能升级）
```

## 版本管理

- **版本标记**：`.easyai-version` 文件记录当前安装版本
- **检查更新**：`npx @geeseeker/easyai-dev check` 或 MCP `framework_check` tool
- **执行更新**：`npx @geeseeker/easyai-dev update` 或 MCP `framework_update` tool
- **智能合并**：Manifest 驱动 — 只更新框架文件，保护用户自定义内容（自定义 Skills/Rules/Workflows 不被覆盖）
- **冲突处理**：用户修改过的框架文件生成 `.new` 冲突文件，由用户手动合并

## npm 包信息

- 包名：`@geeseeker/easyai-dev`
- 仓库：https://github.com/GeeSeeker/easyAI-dev
