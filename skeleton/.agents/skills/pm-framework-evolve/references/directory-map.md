# easyAI 目录结构映射

> 本文档是框架知识库的一部分，供 AI 在框架自迭代时参考。

## 文件分类

- 🦴 **骨架文件**：安装时通过 skeleton 同步到用户项目
- 🏃 **运行时文件**：使用过程中由 AI 动态生成
- 🔧 **开发专属**：仅存在于框架开发工作区，不同步到用户项目

---

## `.agents/` — AI 角色层

### `rules/` — 规则注入

| 文件 | 分类 | 职责 |
|------|------|------|
| `project-identity.md` | 🦴 | 项目身份声明、框架地图、约束分层 |
| `anti-hallucination.md` | 🦴 | 反幻觉约束、检索优先级 |
| `coding-standards.md` | 🦴 | 编码规范 |
| `framework-dev-mode.md` | 🔧 | 框架开发模式（不同步到 skeleton） |

### `workflows/` — 角色入口

| 文件 | 分类 | 职责 |
|------|------|------|
| `pm.md` | 🦴 | PM 角色入口（`/pm` 触发） |
| `worker.md` | 🦴 | Worker 角色入口（`/worker` 触发） |
| `publish.md` | 🔧 | 发布工作流（不同步到 skeleton） |

### `skills/` — 能力模块

所有 Skill 目录均为 🦴 骨架文件：

```text
skills/
├── common-session-close/    # 会话收尾
├── common-spec-update/      # 规范更新
├── pm-brainstorm/           # 需求发散
├── pm-framework-evolve/     # 框架自迭代（含 references/ resources/ changelog/）
├── pm-session-start/        # 会话启动
├── pm-task-planning/        # 任务规划
├── pm-task-review/          # 任务验收
├── worker-check/            # 执行者自检
├── worker-debug/            # 系统性调试
└── worker-implement/        # 执行者实现
```

---

## `.trellis/` — 数据持久层

| 路径 | 分类 | 职责 |
|------|------|------|
| `config/config.yaml` | 🦴 | 框架配置 |
| `spec/` | 🦴 + 🏃 | 项目规范（骨架 + 运行时扩展） |
| `tasks/` | 🏃 | 任务文件（AI 动态创建） |
| `tasks/archive/` | 🏃 | 已归档任务 |
| `workspace/journal.md` | 🏃 | 会话日志 |

---

## `.docs/` — 用户文档空间

| 路径 | 分类 | 职责 |
|------|------|------|
| `README.md` | 🦴 | 文档空间说明 |
| `requirements/` | 🦴 + 🏃 | 需求文档 |
| `design/` | 🦴 + 🏃 | 设计文档 |
| `guides/` | 🦴 + 🏃 | 使用指南 |
| `notes/` | 🦴 + 🏃 | 临时文档 |
| `archive/` | 🦴 + 🏃 | 归档 |

---

## `packages/mcp-server/` — 可编程层

| 路径 | 分类 | 职责 |
|------|------|------|
| `src/index.ts` | 🔧 | MCP Server 入口（TypeScript 源码） |
| `src/tools/` | 🔧 | 14+ 个 MCP Tool 实现 |
| `src/resources/` | 🔧 | 5 个 MCP Resource 实现 |
| `src/utils/` | 🔧 | 工具函数 |

> 用户项目中通过 `easyAI-dev-latest/lib/server/` 获得编译后的 JavaScript 版本。
