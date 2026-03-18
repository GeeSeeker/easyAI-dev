# AI 安装指南

> **本文档供 AI 阅读。** 人类用户无需手动操作，AI 会按以下步骤自动执行。

## 前置条件

- Antigravity IDE 已安装（https://antigravity.google/）
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

1. **定位 MCP 配置文件**：

   Antigravity IDE 的 MCP 配置文件路径为：

   ```
   ~/.gemini/antigravity/mcp_config.json
   ```

   > 如果 AI 无法确认该路径是否正确（例如 IDE 版本更新导致路径变化），应先访问 Antigravity 官方文档确认：https://antigravity.google/docs/mcp

2. **读取现有配置**：

   读取 `~/.gemini/antigravity/mcp_config.json` 文件。如果不存在，创建一个空的配置骨架：

   ```json
   {
     "mcpServers": {}
   }
   ```

3. **注入 easyAI MCP Server 配置**：

   向用户展示将要添加的配置内容，**请求用户确认**后再写入。

   **关键**：必须包含 `EASYAI_PROJECT_ROOT` 环境变量，指向用户项目的绝对路径。
   MCP Server 通过 `npx` 运行时，进程的工作目录不在项目内，需要此环境变量才能定位项目。

   ```
   我将在 Antigravity MCP 配置文件中添加 easyAI MCP Server：

   配置文件：~/.gemini/antigravity/mcp_config.json

   新增条目：
   "easyai-mcp-server": {
     "command": "npx",
     "args": ["-y", "@geeseeker/easyai-dev", "serve"],
     "env": {
       "EASYAI_PROJECT_ROOT": "<用户项目的绝对路径>"
     }
   }

   是否确认添加？
   ```

   > **`EASYAI_PROJECT_ROOT` 必须是项目根目录的绝对路径**（包含 `.trellis/` 的目录）。
   > 例如：`/home/user/projects/my-app` 或 `/Users/user/projects/my-app`。

4. **用户确认后，写入配置**：

   将 `easyai-mcp-server` 条目添加到 `mcpServers` 对象中（保留已有的其他 MCP Server 配置不变）。

5. **请求用户重启 IDE**：

   ```
   ✅ MCP 配置已写入。

   请重启 Antigravity IDE 以使配置生效。
   重启完成后，请告诉我已重启。
   ```

   > 这是一个**必须的断点**，MCP 配置修改后需要重启 IDE 才能生效。

6. **验证 MCP 连接**：

   用户确认重启后，按以下顺序验证：

   a. 尝试读取 MCP 资源 `trellis://status`

   b. **如果成功** → 包含 `git`、`tasks`、`journal` 字段 → MCP 工作正常，进入 S2

   c. **如果报错「无法找到项目根目录」** → 按以下步骤自修复：
   1. 读取 `~/.gemini/antigravity/mcp_config.json`
   2. 检查 `easyai-mcp-server` 条目是否包含 `env.EASYAI_PROJECT_ROOT`
   3. 如果缺失，添加 `"env": { "EASYAI_PROJECT_ROOT": "<项目绝对路径>" }`
   4. 如果已有但路径错误，修正为正确的项目根目录路径
   5. 告知用户需要再次重启 IDE

   d. **如果没有 easyai MCP 工具可用** → 配置尚未生效，检查配置文件并重启

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
✅ easyAI 安装完成！

已配置：
- 1 个 MCP Server — easyai-mcp-server
- 框架骨架 — .agents/ + .trellis/ + .docs/

使用方式：
1. 在 Antigravity IDE 中打开此项目
2. 输入 /actor-pm 启动项目经理
3. 和 PM 对话，描述你的需求即可！
```

---

## 故障排查

AI 遇到 MCP 相关报错时，应**先自行诊断和修复**，不要将底层错误暴露给用户。

### 「无法找到项目根目录」

**这是最常见的问题**。MCP Server 需要知道项目根目录才能工作。

**诊断**：错误信息中会包含 `cwd(...)` 和 `__dirname(...)` 两个路径，表示它在这两条路径上都没找到 `.trellis` 目录。

**自动修复步骤**（AI 应自行执行，无需用户介入）：

1. 读取 `~/.gemini/antigravity/mcp_config.json`
2. 找到 `easyai-mcp-server` 条目
3. 检查是否包含 `env.EASYAI_PROJECT_ROOT`
4. 如果缺失或路径错误 → 修正为当前项目根目录（包含 `.trellis/` 的目录）的绝对路径：
   ```json
   "easyai-mcp-server": {
     "command": "npx",
     "args": ["-y", "@geeseeker/easyai-dev", "serve"],
     "env": {
       "EASYAI_PROJECT_ROOT": "/绝对路径/到/项目根"
     }
   }
   ```
5. 告知用户「MCP 配置已自动修复，请重启 IDE」
6. 用户重启后，再次验证

**根因说明**：MCP Server 检测项目根的优先级为：

1. `EASYAI_PROJECT_ROOT` 环境变量（推荐，最可靠）
2. `process.cwd()` 向上遍历查找 `.trellis`（IDE 工作目录在项目内时有效）
3. `__dirname` 向上遍历（MCP Server 安装在项目 `node_modules` 内时有效）

通过 `npx -y` 运行时，cwd 和 `__dirname` 通常都在项目外，因此**必须设置环境变量**。

### MCP Server 无法启动

```bash
# 检查 Node.js 版本
node --version  # 需要 >= 18

# 手动测试 MCP Server
npx @geeseeker/easyai-dev serve
# 正常情况下会输出 "easyAI MCP Server started" 到 stderr
```

### MCP 配置文件路径不确定

如果默认路径 `~/.gemini/antigravity/mcp_config.json` 不正确，可尝试：

```bash
# 搜索可能的配置文件
find ~/.gemini -name "mcp_config*" -o -name "*mcp*.json" 2>/dev/null
```

如仍无法找到，访问 Antigravity 官方文档获取最新路径信息：https://antigravity.google/docs/mcp

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

### 切换项目

如果用户切换到不同项目，需要更新 MCP 配置中的 `EASYAI_PROJECT_ROOT`：

1. 修改 `~/.gemini/antigravity/mcp_config.json` 中的路径
2. 重启 IDE
