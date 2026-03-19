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

   MCP Server 支持 **roots 协议自动检测**（v4.2.5+），会自动从 IDE 获取当前工作区路径，
   因此 `EASYAI_PROJECT_ROOT` 环境变量是**可选的后备方案**，通常不需要手动设置。

   ```
   我将在 Antigravity MCP 配置文件中添加 easyAI MCP Server：

   配置文件：~/.gemini/antigravity/mcp_config.json

   新增条目：
   "easyai-mcp-server": {
     "command": "npx",
     "args": ["-y", "@geeseeker/easyai-dev", "serve"]
   }

   是否确认添加？
   ```

   > MCP Server 会自动检测 IDE 当前打开的项目。切换项目时无需修改配置。
   > 如果自动检测失败（极少数情况），可添加 `"env": { "EASYAI_PROJECT_ROOT": "<绝对路径>" }` 作为后备。

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

   a. 检查当前可用的 MCP 工具列表中是否包含 `framework_init` 或 `project_status` 等 easyai 工具

   b. **如果成功** → MCP 工作正常，进入 S2 开始初始化框架

   c. **如果没有 easyai MCP 工具可用** → 配置尚未生效，检查配置文件并重启

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
✅ easyAI 基础安装完成！

已配置：
- 1 个 MCP Server — easyai-mcp-server
- 框架骨架 — .agents/ + .trellis/ + .docs/

接下来可以选装增强 MCP（提升检索和分析能力），或直接开始使用。
```

然后自动进入 S5（增强 MCP 选装）。

---

## S5：增强 MCP 选装（可选）

> 增强 MCP 是**全局级插件**，安装一次即可在所有项目中使用。可在 S4 完成后引导用户选装，也可以随时在后续会话中触发。

完成 S4 后，向用户展示增强 MCP 菜单：

```
🎉 easyAI 基础安装已完成！

easyAI 还支持 3 个增强 MCP，可大幅提升 AI 的检索和分析能力：

1. 📚 Context7 — 获取最新第三方库官方文档（免费，无需安装）
2. 🔍 ContextWeaver — 本地代码语义搜索（免费，需注册硅基流动）
3. 🌐 Exa — 互联网语义搜索引擎（需注册 Exa）

是否现在安装？可选择全部安装，或逐个选择。
```

用户同意后，按以下顺序逐一安装。用户跳过的项直接跳过，不再追问。

### S5.1：Context7 — 第三方库文档检索

**功能**：查询任意第三方库的最新官方文档和代码示例，避免 AI 使用过时 API。

**安装步骤**：

1. **无需本地安装**（远程 MCP 服务）

2. **获取 API Key**（可选但推荐）：

   访问 [Context7 官网](https://context7.com) 注册获取免费 API Key。
   无 API Key 也可使用，但有速率限制。

3. **写入 MCP 配置**：

   在 `~/.gemini/antigravity/mcp_config.json` 的 `mcpServers` 中添加：
   - **有 API Key**：

     ```json
     "context7": {
       "type": "remote",
       "serverURL": "https://mcp.context7.com/mcp",
       "headers": {
         "CONTEXT7_API_KEY": "<用户的 API Key>"
       },
       "enabled": true
     }
     ```

   - **无 API Key**：
     ```json
     "context7": {
       "type": "remote",
       "serverURL": "https://mcp.context7.com/mcp",
       "enabled": true
     }
     ```

4. **验证**：需要重启 IDE 后验证。可记录待 S5 全部完成后统一重启验证。

### S5.2：ContextWeaver — 本地代码语义搜索

**功能**：在项目代码中进行语义级搜索（Embedding + Rerank），理解代码含义而非仅匹配关键词。

**前置条件**：需要硅基流动（SiliconFlow）的免费 API Key，用于调用 Embedding 和 Reranker 模型。

**安装步骤**：

1. **引导注册硅基流动**：

   ```
   ContextWeaver 需要硅基流动的 API Key（完全免费）。

   请访问以下链接注册（或登录已有账号）：
   👉 https://cloud.siliconflow.cn/i/UuyBH9t8

   注册后，在控制台的「API 密钥」页面创建一个新密钥，然后把密钥告诉我。
   ```

   > 等待用户提供 API Key 后再继续。

2. **安装 ContextWeaver**：

   ```bash
   npm install -g @hsingjui/contextweaver
   ```

3. **创建配置文件** `~/.contextweaver/.env`：

   ```bash
   mkdir -p ~/.contextweaver
   ```

   写入以下内容（将 `<API_KEY>` 替换为用户提供的硅基流动 API Key）：

   ```env
   # ContextWeaver 配置

   # Embedding API - 硅基流动
   EMBEDDINGS_API_KEY=<API_KEY>
   EMBEDDINGS_BASE_URL=https://api.siliconflow.cn/v1/embeddings
   EMBEDDINGS_MODEL=Qwen/Qwen3-Embedding-8B
   EMBEDDINGS_MAX_CONCURRENCY=10
   EMBEDDINGS_DIMENSIONS=1024

   # Reranker - 硅基流动
   RERANK_API_KEY=<API_KEY>
   RERANK_BASE_URL=https://api.siliconflow.cn/v1/rerank
   RERANK_MODEL=Qwen/Qwen3-Reranker-8B
   RERANK_TOP_N=20
   ```

   > Embedding 和 Reranker 使用相同的 API Key。

4. **写入 MCP 配置**：

   在 `~/.gemini/antigravity/mcp_config.json` 的 `mcpServers` 中添加：

   ```json
   "contextweaver": {
     "command": "contextweaver",
     "args": ["mcp"]
   }
   ```

5. **验证**：记录待统一重启后验证。

### S5.3：Exa — 互联网语义搜索

**功能**：让 AI 具备互联网搜索能力，查找博客、社区讨论、最新动态等泛化信息。

**前置条件**：需要 Exa 官方 API Key。

**安装步骤**：

1. **引导获取 Exa API Key**：

   ```
   Exa 是一个 AI 原生的互联网搜索引擎。

   请访问以下链接注册并获取 API Key：
   👉 https://dashboard.exa.ai/api-keys

   获取到 API Key 后，请告诉我。
   ```

   > 等待用户提供 API Key 后再继续。

2. **无需本地安装**（远程 MCP 服务）

3. **写入 MCP 配置**：

   在 `~/.gemini/antigravity/mcp_config.json` 的 `mcpServers` 中添加（替换 `<YOUR_EXA_API_KEY>`）：

   ```json
   "exa": {
     "type": "remote",
     "serverURL": "https://mcp.exa.ai/mcp?exaApiKey=<YOUR_EXA_API_KEY>",
     "enabled": true
   }
   ```

4. **验证**：记录待统一重启后验证。

### S5.4：安装后配置

完成上述增强 MCP 安装后，执行以下收尾步骤：

1. **写入检索优先级规则**：

   检查用户的全局规则文件 `~/.gemini/GEMINI.md`：
   - 文件不存在 → 创建文件，写入以下内容
   - 文件已存在但不包含「检索优先级」相关内容（关键词：`Context7`） → 追加以下内容
   - 文件已存在且已包含 → 跳过

   ```markdown
   ## 检索优先级

   - **事实校验与检索（反幻觉）**：
     对非语言内置的第三方库，**严禁依赖底层记忆，必须以最新检索为准**。
     - **检索优先级**：`Context7`（首选官方文档）→ `Exa`（联网语义搜索）→ `GitHub`（开源社区实践）
     - **代码检索**：语义搜索 → `ContextWeaver`；精确关键词 → `grep_search`
     - **联网搜索**：官方文档 → `Context7`；泛化信息 → `Exa`；通用兜底 → `search_web`
   ```

2. **请求用户重启 IDE**：

   ```
   ✅ 增强 MCP 安装完成！

   已配置：
   - 📚 Context7 — 第三方库文档检索
   - 🔍 ContextWeaver — 本地代码语义搜索
   - 🌐 Exa — 互联网语义搜索
   （仅列出用户实际安装的项）

   检索优先级规则已写入全局配置。

   请重启 Antigravity IDE 以使所有增强 MCP 生效。
   重启完成后，请告诉我已重启。
   ```

3. **验证增强 MCP**：

   用户确认重启后，逐一验证已安装的增强 MCP：
   - **Context7**：调用 `mcp_context7_resolve-library-id` 查询任意库（如 `react`）
   - **ContextWeaver**：调用 `mcp_contextweaver_codebase-retrieval` 搜索当前项目
   - **Exa**：调用 `mcp_exa_exa_search` 搜索任意关键词

   全部通过则确认安装成功。任何一项失败则协助排查。

---

## 故障排查

AI 遇到 MCP 相关报错时，应**先自行诊断和修复**，不要将底层错误暴露给用户。

### 「无法找到项目根目录」

MCP Server 的项目根目录检测优先级为（v4.2.5+）：

1. **MCP roots 协议**（最高优先级）— IDE 自动提供当前工作区路径，零配置
2. `EASYAI_PROJECT_ROOT` 环境变量 — 用户手动指定的罕见后备方案
3. `process.cwd()` 向上遍历查找 `.trellis`
4. `__dirname` 向上遍历

**诊断**：错误信息中会包含各策略的尝试结果。此报错通常是因为项目尚未初始化（未执行 init）。

**排查建议**：

1. 首先确认当前项目是否已执行 `npx @geeseeker/easyai-dev init .`（即 `.trellis/` 目录是否存在）。对于一个全新的环境，如果没有先进行 init 就强行尝试读取项目内部的资源（如 `trellis://status` 等记录信息），肯定会触发此“找不到项目根”的错误。
2. 仅当确认项目确已初始化完整，但由于特殊原因自动检测依然完全失效时，才可以在 MCP 配置中极其罕见地添加环境变量作为后备：
   ```json
   "easyai-mcp-server": {
     "command": "npx",
     "args": ["-y", "@geeseeker/easyai-dev", "serve"],
     "env": {
       "EASYAI_PROJECT_ROOT": "/绝对路径/到/项目根"
     }
   }
   ```

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

**v4.2.5+**：MCP Server 自动检测 IDE 当前打开的项目（通过 MCP roots 协议），切换项目**无需修改任何配置**。

如果自动检测不工作，可在 MCP 配置中手动设置 `EASYAI_PROJECT_ROOT` 为新项目的绝对路径，然后重启 IDE。
