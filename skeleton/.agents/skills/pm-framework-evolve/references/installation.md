# easyAI 安装指南

> 本文档是框架知识库的一部分，供 AI 在框架自迭代时参考。

## 安装方式

### 方式 1：npx 脚手架（推荐）

```bash
# 新项目
npx @geeseeker/easyai-dev init

# 已有项目（不覆盖 README.md，合并 .gitignore）
npx @geeseeker/easyai-dev init
```

### 方式 2：MCP 全局安装

配置 AI IDE 的 MCP Server 后，AI 可通过 `framework_init` tool 自动安装：

```json
{
  "mcpServers": {
    "easyai-dev": {
      "command": "npx",
      "args": ["-y", "@geeseeker/easyai-dev", "serve"],
      "env": {
        "EASYAI_PROJECT_ROOT": "/path/to/project"
      }
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
│   ├── config/        # config.yaml
│   ├── spec/          # 项目规范
│   ├── tasks/         # 任务目录
│   └── workspace/     # journal
├── .docs/             # 用户文档空间（5 个子文件夹）
└── .easyai-version    # 版本标记文件
```

## 版本管理

- **版本标记**：`.easyai-version` 文件记录当前安装版本
- **检查更新**：`npx @geeseeker/easyai-dev check` 或 MCP `framework_check` tool
- **执行更新**：`npx @geeseeker/easyai-dev update` 或 MCP `framework_update` tool
- **备份机制**：更新前自动备份被修改的文件

## npm 包信息

- 包名：`@geeseeker/easyai-dev`
- 仓库：https://github.com/GeeSeeker/easyAI-dev
