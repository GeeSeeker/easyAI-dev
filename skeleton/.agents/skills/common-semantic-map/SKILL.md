---
name: common-semantic-map
description: "[Common] 项目语义地图 — 触发：pm-session-start 检测到缺失地图或用户手动刷新。排除：日常 session-close 自动刷新。产出：semantic-map.json + semantic-map-view.md 双文件。"
produces: semantic_map
requires: null
---

# 项目语义地图（Semantic Map）

## 适用场景

为 AI 提供项目的自上而下架构路由导航。通过骨架提取（Skeleton Heuristics）自动扫描项目目录，生成结构化语义地图，消除"战争迷雾"。

**触发方式**：

1. `pm-session-start` 检测到缺失 `.trellis/workspace/semantic-map.json` → 提示用户确认后触发
2. 用户手动调用 `/generate-map` 指令 → 全量重建

**不触发**：日常 `session-close` 不自动全刷，最大限度控制 Token 成本。

## 架构概述

```text
Scanner (文件树遍历鉴别)
    ↓ 过滤后的骨架文件列表
Abstractor (模型提炼语义描述)
    ↓ 带语义描述的结构化数据
Writer (双规写入)
    ↓
├── .trellis/workspace/semantic-map.json  ← 结构化真实源
└── .docs/semantic-map-view.md            ← 易读表层视图
```

## 执行步骤

### Step 1: Scanner — 文件树遍历与骨架鉴别

> Scanner 负责遍历项目目录，按启发式规则筛选骨架文件，过滤边缘内容。

#### 1.1 遍历范围

扫描项目根目录下的所有层级目录，遵守以下过滤规则：

**排除目录**（硬编码黑名单，不扫描）：

```
node_modules/
.git/
dist/
build/
coverage/
.next/
.nuxt/
__pycache__/
.venv/
venv/
.trellis/
.agents/
.docs/
.tmp/
.test/
```

**排除文件**（不生成独立节点）：

```
*.lock
*.map
*.min.js
*.min.css
*.d.ts（声明文件，仅计数）
```

> 额外过滤：读取项目根目录 `.gitignore`，将其规则叠加到排除列表。

#### 1.2 骨架文件识别

对每个目录，按以下优先级提取**骨架文件**：

| 优先级 | 类型      | 匹配模式                                                              |
| ------ | --------- | --------------------------------------------------------------------- |
| P0     | 入口文件  | `main.*`, `index.*`, `app.*`, `server.*`                              |
| P1     | 自述文件  | `README.md`, `README.*`                                               |
| P2     | 配置文件  | `.env`, `.env.*`, `*config.*`, `tsconfig.*`, `package.json`           |
| P3     | 路由/接口 | `router.*`, `routes.*`, `api.*`, `schema.*`, `types.*`, `interface.*` |
| P4     | 核心模块  | `service.*`, `controller.*`, `model.*`, `middleware.*`                |

**骨架文件**生成独立的语义描述节点。

#### 1.3 边缘文件聚合

不属于骨架文件的"普通文件"（业务组件、单元测试、样式表等），**不生成独立节点**，仅在其**父目录节点**中做数量聚合统计：

```json
{
  "path": "src/components/",
  "description": "...",
  "skeleton_files": [...],
  "aggregated": {
    "total_files": 23,
    "by_extension": { ".tsx": 15, ".css": 5, ".test.tsx": 3 }
  }
}
```

#### 1.4 Scanner 输出

Scanner 产出一个中间数据结构：**扫描清单**（Scan Manifest），包含：

- 所有目录节点（含路径、子目录数、聚合统计）
- 每个目录下识别到的骨架文件列表（含路径、匹配优先级）

### Step 2: Abstractor — 语义描述提炼

> Abstractor 负责为每个目录节点和骨架文件生成精练的语义描述。

#### 2.1 描述生成策略

对 Scanner 产出的扫描清单，逐项生成语义描述：

**目录节点**：

- 读取目录下的骨架文件内容（README 优先、入口文件次之）
- 结合文件名规律和目录名，生成 **1-2 句话**的业务职责描述
- 示例：`"src/auth/" → "用户认证模块 — 包含登录、注册、JWT Token 管理的完整鉴权体系"`

**骨架文件**：

- 读取文件头 50 行（或全文，若文件 ≤ 50 行）
- 提炼 **1 句话**的功能描述
- 示例：`"src/auth/router.ts" → "认证路由表 — 定义 /login, /register, /refresh 三个端点"`

#### 2.2 批量处理

- 将扫描清单分批处理（每批 ≤ 20 个项目），避免单次上下文过长
- 优先处理浅层目录（depth ≤ 2），再处理深层目录

#### 2.3 描述质量约束

- 每条描述不超过 100 字符
- 使用中文描述
- 禁止"该文件用于…"等冗余前缀，直接陈述职责
- 禁止描述实现细节（如"使用了 Express 框架"），聚焦于业务语义

### Step 3: Writer — 双规写入

> Writer 负责将 Abstractor 的产出同时写入结构化 JSON 和人读 Markdown。

#### 3.1 JSON 底座（结构化真实源）

写入路径：`.trellis/workspace/semantic-map.json`

```json
{
  "version": "1.0",
  "generated_at": "2026-03-19T00:00:00+08:00",
  "project_root": "/absolute/path/to/project",
  "tree": [
    {
      "path": "src/",
      "type": "directory",
      "description": "应用源代码根目录",
      "depth": 0,
      "children": [
        {
          "path": "src/auth/",
          "type": "directory",
          "description": "用户认证模块 — 登录、注册、JWT Token 管理",
          "depth": 1,
          "skeleton_files": [
            {
              "path": "src/auth/index.ts",
              "priority": "P0",
              "description": "认证模块入口 — 导出所有认证服务和中间件"
            },
            {
              "path": "src/auth/router.ts",
              "priority": "P3",
              "description": "认证路由表 — /login, /register, /refresh 端点"
            }
          ],
          "aggregated": {
            "total_files": 8,
            "by_extension": { ".ts": 5, ".test.ts": 3 }
          },
          "children": []
        }
      ],
      "skeleton_files": [
        {
          "path": "src/index.ts",
          "priority": "P0",
          "description": "应用入口 — 初始化 Express 服务器并挂载路由"
        }
      ],
      "aggregated": {
        "total_files": 2,
        "by_extension": { ".ts": 2 }
      }
    }
  ]
}
```

#### 3.2 Markdown 视图（易读表层）

写入路径：`.docs/semantic-map-view.md`

```markdown
# 项目语义地图

> 自动生成于 {timestamp}，如需刷新请调用 `/generate-map`

## 目录结构

### src/

应用源代码根目录

**骨架文件**：

- `src/index.ts` [P0] — 应用入口，初始化服务器并挂载路由

---

#### src/auth/

用户认证模块 — 登录、注册、JWT Token 管理

**骨架文件**：

- `src/auth/index.ts` [P0] — 认证模块入口，导出认证服务和中间件
- `src/auth/router.ts` [P3] — 认证路由表，/login, /register, /refresh 端点

**其他文件**：8 个（.ts: 5, .test.ts: 3）
```

#### 3.3 写入原子性

- JSON 和 Markdown 必须**同步写入**，禁止只写一个
- 写入前备份旧文件（若存在），写入失败时回滚

### Step 4: 手动刷新入口

当用户调用 `/generate-map` 时：

1. 读取现有 `semantic-map.json`（若存在）
2. 执行完整的 Scanner → Abstractor → Writer 流程
3. **完全覆盖**现有文件（全量重建，非增量）
4. 输出刷新报告：

```
✅ 语义地图已重建
- 扫描目录：{n} 个
- 骨架文件：{n} 个
- 过滤文件：{n} 个
- 生成时间：{timestamp}
```

## 异常处理

- **项目目录为空**：生成空地图（仅根节点），提示「项目似乎还没有源代码文件」
- **骨架文件过多（> 200）**：警告用户并建议优化项目结构或调整扫描规则
- **文件读取失败**：跳过该文件，在报告中标注 `[READ_FAILED: path]`

## 注意事项

- **作用边界**：本 Skill 提供项目层级的架构路由导航（"这个目录是干什么的"），不提供代码块级的深度 RAG（该能力由 ContextWeaver MCP 负责）
- **Token 成本**：骨架提取模式仅处理关键文件，大幅降低 Token 消耗
- **与 .directory-map 的关系**：语义地图是 `.directory-map` 的自动化增强替代品（`.directory-map` 仍可用于用户手工声明特殊目录用途）

## 触发测试用例

### TC-01: 首次生成（干净工程）

- **场景**: 项目首次使用，`.trellis/workspace/semantic-map.json` 不存在
- **输入**: `pm-session-start` 检测到缺失并由用户确认触发
- **期望行为**:
  1. Scanner 遍历项目、筛选骨架文件
  2. Abstractor 生成中文语义描述
  3. Writer 同步写入 JSON + MD 双文件
  4. JSON 中目录与骨干文件被正确提取
  5. MD 视图包含可读的架构导航
- **验证方法**: 检查双文件是否存在、JSON 结构是否合法、MD 中是否包含语义描述

### TC-02: 边界抑制生效

- **场景**: 项目含大量非骨干文件（如 100+ 组件文件、50+ 测试文件）
- **输入**: 正常扫描流程
- **期望行为**:
  1. 非骨干文件被父节点合并计数，不生成独立语义描述节点
  2. JSON 中 `aggregated` 字段正确统计文件数量和扩展名
  3. 无冗余扫描（骨架文件数量远小于总文件数）
- **验证方法**: 检查 JSON 中是否无单测文件的独立节点、aggregated 计数是否正确

### TC-03: 手动刷新覆盖

- **场景**: 已有旧地图，用户调用 `/generate-map`
- **输入**: `/generate-map`
- **期望行为**:
  1. 完整重新扫描项目
  2. 旧文件被完全覆盖（非增量合并）
  3. 输出刷新报告（含目录/文件/过滤统计）
- **验证方法**: 检查文件时间戳更新、生成报告包含统计信息

### TC-04: .gitignore 规则叠加

- **场景**: 项目 `.gitignore` 中包含自定义排除规则
- **输入**: `.gitignore` 含 `temp/`, `*.log`
- **期望行为**: Scanner 额外排除 `temp/` 目录和 `.log` 文件
- **验证方法**: 检查扫描结果中不包含被 .gitignore 排除的文件
