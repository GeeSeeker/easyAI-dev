# easyAI 框架特性树

> 五层架构，从基础设施向上生长到用户体验。

## Layer 0 · 基础设施层（foundation/）

框架运行的底层基石 — MCP 通信、配置加载、文件持久化、版本控制、升级机制。

| 节点                                                   | 描述                                                    |
| ------------------------------------------------------ | ------------------------------------------------------- |
| [mcp-transport](foundation/mcp-transport.md)           | MCP Server 传输层 — stdio 通信、工具注册、资源注册      |
| [config-system](foundation/config-system.md)           | 配置加载与降级 — config.yaml 解析、缓存、默认值回退     |
| [file-persistence](foundation/file-persistence.md)     | 文件系统持久化 — .trellis/ 和 .agents/ 的目录约定与读写 |
| [git-integration](foundation/git-integration.md)       | Git 集成 — 状态查询、提交历史、Worktree 隔离            |
| [manifest-mechanism](foundation/manifest-mechanism.md) | Manifest 驱动升级 — SHA-256 哈希、智能合并、冲突检测    |

## Layer 1 · 数据层（data-layer/）

结构化数据的组织与存储 — 任务、规范、日志、配置的持久化格式。

| 节点                                                 | 描述                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| [task-storage](data-layer/task-storage.md)           | 任务数据存储 — 目录结构、task.md 格式、frontmatter 规范    |
| [spec-system](data-layer/spec-system.md)             | 规范体系存储 — 四分类目录、spec-schema.json 校验、URI 寻址 |
| [journal-system](data-layer/journal-system.md)       | 工作记忆存储 — journal 日志格式、自动分页、多用户隔离      |
| [config-management](data-layer/config-management.md) | 配置数据管理 — config.yaml 结构定义、各段落职责            |

## Layer 2 · 能力层（capability/）

框架核心业务能力 — 任务全生命周期、质量保障、上下文管理、知识管理、框架治理。

| 节点                                                       | 描述                                             |
| ---------------------------------------------------------- | ------------------------------------------------ |
| [task-management](capability/task-management.md)           | 任务全生命周期管理 — 状态机、验收门、子任务 DAG  |
| [quality-control](capability/quality-control.md)           | 质量控制 — TDD 流程、自检验证、Evidence Gate     |
| [context-management](capability/context-management.md)     | 上下文管理 — Token 预算、阶段冻结、context.jsonl |
| [knowledge-management](capability/knowledge-management.md) | 知识管理 — 框架知识库、references/、图谱自身     |
| [framework-governance](capability/framework-governance.md) | 框架治理 — 约束分层、规范演进、Manifest 升级     |

## Layer 3 · 角色系统层（role-system/）

角色工作流编排 — PM 和 Worker 的完整工作链路。

| 节点                                              | 描述                                               |
| ------------------------------------------------- | -------------------------------------------------- |
| [pm-workflow](role-system/pm-workflow.md)         | PM 工作流 — 会话启动、需求发散、任务规划、验收审批 |
| [worker-workflow](role-system/worker-workflow.md) | Worker 工作流 — 任务读取、TDD 编码、自检提交       |

## Layer 4 · 用户体验层（user-experience/）

用户可感知的交付闭环 — 需求到成果的完整体验。

| 节点                                                            | 描述                                            |
| --------------------------------------------------------------- | ----------------------------------------------- |
| [requirement-delivery](user-experience/requirement-delivery.md) | 需求交付闭环 — 从用户提需求到验收成果的完整流程 |
| [session-management](user-experience/session-management.md)     | 会话管理 — 会话启动恢复、跨会话记忆、会话收尾   |
| [artifact-pipeline](user-experience/artifact-pipeline.md)       | 文档沉淀管道 — Artifacts → .docs/ 的持久化流转  |
