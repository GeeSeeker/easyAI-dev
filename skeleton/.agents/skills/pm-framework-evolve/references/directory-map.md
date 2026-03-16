# easyAI 目录结构映射

> 本文档是框架知识库的一部分，供 AI 在框架自迭代时参考。

## 文件分类

- 🦴 **骨架文件**：安装时通过 skeleton 同步到用户项目
- 🏃 **运行时文件**：使用过程中由 AI 动态生成
- 🔧 **开发专属**：仅存在于框架开发工作区，不同步到用户项目

---

## `.agents/` — AI 角色层

### `rules/` — 规则注入

| 文件                    | 分类 | 职责                              |
| ----------------------- | ---- | --------------------------------- |
| `project-identity.md`   | 🦴   | 项目身份声明、框架地图、约束分层  |
| `anti-hallucination.md` | 🦴   | 反幻觉约束、检索优先级            |
| `coding-standards.md`   | 🦴   | 编码规范                          |
| `framework-dev-mode.md` | 🔧   | 框架开发模式（不同步到 skeleton） |

### `workflows/` — 角色入口

| 文件         | 分类 | 职责                              |
| ------------ | ---- | --------------------------------- |
| `pm.md`      | 🦴   | PM 角色入口（`/pm` 触发）         |
| `worker.md`  | 🦴   | Worker 角色入口（`/worker` 触发） |
| `publish.md` | 🔧   | 发布工作流（不同步到 skeleton）   |

### `skills/` — 能力模块

所有 Skill 目录均为 🦴 骨架文件（10 个）：

```text
skills/
├── pm-session-start/        # 会话启动
├── pm-brainstorm/           # 需求发散
├── pm-task-planning/        # 任务规划
├── pm-task-review/          # 任务验收
├── pm-framework-evolve/     # 框架自迭代（含 references/ resources/ changelog/）
├── worker-implement/        # 执行者实现
├── worker-check/            # 执行者自检
├── worker-debug/            # 系统性调试
├── common-session-close/    # 会话收尾
└── common-spec-update/      # 规范更新
```

---

## `.trellis/` — 数据持久层

| 路径                       | 分类    | 职责                              |
| -------------------------- | ------- | --------------------------------- |
| `config/config.yaml`       | 🦴      | 框架配置                          |
| `config/context-budget.md` | 🦴      | 上下文预算配置                    |
| `spec/`                    | 🦴 + 🏃 | 项目规范（骨架预设 + 运行时扩展） |
| `spec/spec-schema.json`    | 🦴      | 规范文件 JSON Schema              |
| `spec/frontend/`           | 🦴 + 🏃 | 前端规范                          |
| `spec/backend/`            | 🦴 + 🏃 | 后端规范                          |
| `spec/guides/`             | 🦴 + 🏃 | 指南类规范                        |
| `spec/general/`            | 🦴 + 🏃 | 通用规范（命名约定、Git 流程等）  |
| `tasks/`                   | 🏃      | 任务文件（AI 动态创建）           |
| `tasks/archive/`           | 🏃      | 已归档任务                        |
| `workspace/journal.md`     | 🏃      | 会话日志                          |

---

## 项目根目录文件

| 文件             | 分类 | 职责                                            |
| ---------------- | ---- | ----------------------------------------------- |
| `.directory-map` | 🦴   | 用户自定义目录映射（用途声明，AI 据此定位文件） |

---

## `.docs/` — 用户文档空间

| 路径            | 分类    | 信息方向  | 职责         |
| --------------- | ------- | --------- | ------------ |
| `README.md`     | 🦴      | —         | 文档空间说明 |
| `requirements/` | 🦴 + 🏃 | 用户 → AI | 需求文档     |
| `design/`       | 🦴 + 🏃 | AI ↔ 用户 | 设计文档     |
| `guides/`       | 🦴 + 🏃 | AI → 用户 | 使用指南     |
| `notes/`        | 🦴 + 🏃 | 用户 ↔ AI | 临时文档     |
| `archive/`      | 🦴 + 🏃 | —         | 文档归档     |

---

## MCP Server — 可编程层

> 源码位于 `packages/mcp-server/`（🔧 开发专属）。用户通过 npm 包 `@geeseeker/easyai-dev` 获得编译后的 JavaScript 版本。

| 路径             | 内容                          |
| ---------------- | ----------------------------- |
| `src/index.ts`   | MCP Server 入口               |
| `src/tools/`     | 16 个文件，注册 23 个 Tools   |
| `src/resources/` | 5 个文件，注册 6 个 Resources |
| `src/utils/`     | 8 个工具函数模块              |

`src/utils/` 完整清单：

| 文件                 | 职责                                        |
| -------------------- | ------------------------------------------- |
| `task-utils.ts`      | 任务路径定位、TASKS_ROOT/ARCHIVE_ROOT       |
| `config-loader.ts`   | 轻量 YAML 解析，读取 config.yaml，缓存+降级 |
| `capability-gate.ts` | 角色权限矩阵、受限工具校验、Git ref 防注入  |
| `journal-utils.ts`   | Journal 读写、分页、多用户目录扫描          |
| `git-utils.ts`       | Git 状态查询、commit 历史                   |
| `status-utils.ts`    | 项目状态聚合（Git + 任务 + 日志）           |
| `hash-utils.ts`      | SHA-256 哈希计算（Manifest 驱动升级）       |
| `uri-utils.ts`       | URI 解析辅助函数                            |
