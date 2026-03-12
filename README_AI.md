# AI 安装指南

> **本文档供 AI 阅读。** 人类用户无需手动操作，AI 会按以下步骤自动执行。

## 前置条件

- Antigravity IDE 已安装
- Node.js >= 18 已安装
- Git 已安装

---

## S0：状态探测（断点续接）

收到安装请求后，按顺序检测当前状态，跳过已完成的步骤：

```
1. 检查 easyai-mcp-server 是否已在 IDE 中配置
   → 已配置且可调用 → 跳过 S1
2. 检查目标项目是否已初始化（.agents/ 和 .trellis/ 存在）
   → 已初始化 → 跳过 S2
3. 全部就绪 → 进入 S3
```

---

## S1：全局安装 — 配置 MCP Server（仅需一次）

easyAI 的 MCP Server 已打包在 npm 包中，无需本地编译。

### 步骤

1. **生成 MCP 配置 JSON**：

```json
{
  "easyai-mcp-server": {
    "command": "npx",
    "args": ["-y", "@geeseeker/easyai-dev", "serve"]
  }
}
```

2. **引导用户操作**：

告知用户：

```
请将以下 MCP 配置添加到 Antigravity IDE 的 MCP 设置中：

{
  "easyai-mcp-server": {
    "command": "npx",
    "args": ["-y", "@geeseeker/easyai-dev", "serve"]
  }
}

添加完成后，请重启 Antigravity IDE，然后告诉我已重启。
```

3. **等待用户确认重启** — 这是一个**必须的断点**，MCP 配置修改后需要重启 IDE 才能生效。

4. **验证 MCP 连接**：用户确认重启后，尝试调用任意 easyai MCP 工具（如 `project_status`）验证连接。
   - 如果调用失败，协助用户排查 MCP 配置。
   - 如果没有 easyai MCP 工具可用，说明配置尚未生效，需要再次检查配置和重启。

---

## S2：项目安装 — 初始化框架

在目标项目目录中执行：

```bash
npx @geeseeker/easyai-dev init .
```

此命令会：
- 复制 `.agents/`（规则 + 工作流 + Skills）
- 复制 `.trellis/`（配置 + 规范骨架）
- 创建 `.docs/`（空文档子文件夹）
- 创建 `.gitignore`（或合并到已有的）
- 生成 `.easyai-version` 版本清单

如果用户要在已有项目中安装，命令相同。脚本会自动检测并进入集成模式（不覆盖已有的 README.md 和 .gitignore）。

---

## S3：验证

```bash
npx @geeseeker/easyai-dev check .
```

确认所有必需目录和文件都已就位。

---

## S4：安装完成

告知用户：

```
✅ easyAI 3.0 安装完成！

已配置：
- 1 个 MCP Server — easyai-mcp-server
- 框架骨架 — .agents/ + .trellis/ + .docs/

使用方式：
1. 在 Antigravity IDE 中打开此项目
2. 输入 /pm 启动项目经理
3. 和 PM 对话，描述你的需求即可！
```

---

## 故障排查

### MCP Server 无法启动

```bash
# 检查 Node.js 版本
node --version  # 需要 >= 18

# 手动测试 MCP Server
npx @geeseeker/easyai-dev serve
# 正常情况下会输出 "easyAI MCP Server v0.1.0 started" 到 stderr
```

### 框架完整性检查失败

```bash
# 重新初始化（需先删除现有框架目录）
rm -rf .agents/ .trellis/ .docs/ .easyai-version
npx @geeseeker/easyai-dev init .
```

### 更新框架

```bash
npx @geeseeker/easyai-dev update .
# 只更新 .agents/ 和 .trellis/spec/，不影响用户数据
```
