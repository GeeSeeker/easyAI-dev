# IDE 适配指南

> 本指南帮助非原生 IDE（如 VS Code + Cline、Cursor 等）的用户正确配置 easyAI 框架。
> 如果你使用 Windsurf（Antigravity 原生 IDE），框架已自动识别，无需额外配置。

---

## easyAI 是什么

easyAI 是一个 AI 辅助开发框架，让用户以"纯客户"的视角进行软件开发 — 你只需提需求、审批方案、验收结果。框架由三部分组成：

1. **`.agents/`** — AI 角色层（Rules / Workflows / Skills）
2. **`.trellis/`** — 数据持久层（规范 / 任务 / 日志 / 配置）
3. **MCP Server** — 可编程层（通过 npm 包 `@geeseeker/easyai-dev` 安装）

---

## 支持的 IDE

| IDE                | 支持级别 | 说明                                         |
| ------------------ | -------- | -------------------------------------------- |
| Windsurf           | ✅ 原生  | 自动识别 `.agents/`，无需配置                |
| VS Code + Cline    | 🔧 手动  | 需配置 MCP Server 和指向 `.agents/`          |
| VS Code + Continue | 🔧 手动  | 需配置 MCP Server                            |
| Cursor             | 🔧 手动  | 需配置 MCP Server，规则文件放 `.cursorrules` |
| 其他 AI IDE        | 🔧 手动  | 参考通用配置步骤                             |

---

## 配置步骤

### 1. 安装 MCP Server

easyAI 的 MCP Server 通过 npm 全局安装：

```bash
npm install -g @geeseeker/easyai-dev
```

安装后，MCP Server 入口为 `easyai-mcp-server`（可通过 `npx @geeseeker/easyai-dev` 启动）。

### 2. 配置 MCP 连接

在你的 IDE 的 MCP 配置文件中添加：

```json
{
  "mcpServers": {
    "easyai-mcp-server": {
      "command": "npx",
      "args": ["-y", "@geeseeker/easyai-dev"]
    }
  }
}
```

**配置文件位置因 IDE 而异**：

- **VS Code + Cline**: `.vscode/mcp.json` 或 Cline 扩展设置
- **Cursor**: `.cursor/mcp.json`
- **其他**: 参考对应 IDE 的 MCP 文档

### 3. 让 AI 识别框架文件

easyAI 的角色系统依赖 `.agents/` 目录：

```
.agents/
├── rules/       ← 始终注入的规则（反幻觉、编码规范等）
├── workflows/   ← 角色入口（/pm、/worker）
└── skills/      ← 能力模块（按角色激活）
```

**Windsurf** 自动识别这些文件。其他 IDE 需要：

- 确保 AI 能读取 `.agents/` 目录
- 将 `.agents/rules/` 下的规则文件注入为系统提示（或等效机制）
- 将 `.agents/workflows/` 下的文件配置为可触发的命令

### 4. 验证安装

运行以下命令验证框架完整性：

```bash
# 如果 MCP 已连接，AI 可调用：
# framework_check() — 检查框架文件完整性
# project_status() — 获取项目状态

# 手动检查：
ls .agents/rules/ .agents/workflows/ .agents/skills/ .trellis/config/
```

---

## 常见问题

### Q: MCP Server 无法启动？

检查 Node.js 版本（需 18+）：

```bash
node -v
```

### Q: AI 不识别 /pm 或 /worker 命令？

确保 `.agents/workflows/pm.md` 和 `worker.md` 已正确配置为 IDE 的 Workflow 或自定义命令。

### Q: 规则文件没有被注入？

检查 `.agents/rules/` 下的文件是否存在。这些文件需要被 IDE 识别为"始终加载"的上下文。

### Q: 如何升级框架？

```bash
npm update -g @geeseeker/easyai-dev
```

升级后，AI 可调用 `framework_update()` 来同步最新的骨架文件。
