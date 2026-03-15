# Changelog

所有版本的重要变更记录。格式基于 [Keep a Changelog](https://keepachangelog.com/)。

## [3.3.5] - 2026-03-15

### 新增

- **config.yaml 运行时联动** — 新增 `config-loader` 模块，MCP Server 中的硬编码配置值改为从 `.trellis/config/config.yaml` 动态读取
  - `context-budget.ts`：阈值(0.6/0.8) 和阶段预算 (phaseBudget) 可配置
  - `journal-utils.ts`：`maxLinesPerFile` 可配置
  - `task-utils.ts`：任务/归档路径可配置
  - config.yaml 不存在时优雅降级到默认值
- config.yaml 新增 `context.phaseBudget` 段（plan/implement/check/debug 各阶段 token 预算）

## [3.3.4] - 2026-03-15

### 修复

- **Journal 用户目录读取 BUG** — `trellis://journal/latest` Resource 之前硬编码读取 `workspace/default/`，导致写入 `workspace/{user}/` 的最新日志无法被新会话读取。修复后扫描所有用户目录，合并排序返回真正最新的条目。

## [3.3.3] - 2026-03-15

### 优化

- **config.yaml 扩展** — 新增 `framework.version`、`user_level`（自适应交互）、`max_subtasks`、`auto_downgrade` 声明性字段；未实现的 MCP 功能标注 TODO
- **spec/general/ 分类** — 新增通用规范目录（命名约定、Git 流程等），config.yaml 同步更新
- `quick-start.md` 链接修复 — 指向正确的 `requirements/` 路径
- `directory-map.md` 新增 spec 子目录明细（frontend/backend/guides/general）

## [3.3.2] - 2026-03-15

### 优化

- **pm-framework-evolve 深度优化** — SKILL.md 重构：新增快速参考索引（简单事实问题无需加载 references）、查询路由表（按问题类型映射文件）、双路径分流（只读查询 vs 写入迭代）
- `github-info.md` 合并到 `installation.md`（5 references 文件 → 4 个）
- `features.md` 新增同步日期标记 `<!-- last_synced -->` + 目录导航
- `/publish` 工作流 Step 0 新增数量同步流程（自动统计 Tool/Skill/Resource 数量）

## [3.3.1] - 2026-03-14

### 清理

- 移除 9 个冗余 `.gitkeep`（8 个 Skill 目录 + `spec/guides/`），仅保留空用户目录的 `.gitkeep`（18→9）

## [3.3.0] - 2026-03-14

### 新增

- **Trellis spec 集成修复** — 5 个 Skill 接入 `.trellis/spec/` 读写闭环（4 Gate 架构）
- `worker-implement` 新增 Step 0：编码前加载项目规范 + 强制复述关键约束 + `[SPEC_GAP]` 降级策略
- `pm-session-start` 新增 Step 3.5：启动时展示 spec 覆盖状态（4 分类含 general）
- `pm-task-review` Stage 1 新增项目规范合规性检查 + 反溯及原则
- `pm-brainstorm` Step 1 spec 扫描 + Step 6 spec 演进入口（`common-spec-update` 触发器）
- `pm-task-planning` Step 1 spec 冲突检查 + Step 7 `context.jsonl` 写入 HARD-GATE

### 文档

- 框架知识库更新：`features.md` Trellis 数据消费列、`directory-map.md` tool 计数修正（23）
- README tool 计数修正（22→23）

## [3.2.0] - 2026-03-13

### 新增

- **Worktree 生命周期优化** — 新增 `worktree_list` Tool、安全增强、元数据持久化

## [3.1.0] - 2026-03-13

### 新增

- **Git 自动化**：`common-session-close` 重写为 8 步流程，新增 Git 自动提交、`.tmp/` 清理、PM push 确认、增强恢复指引
- `worker-check` 新增 Step 4：验证通过后自动 commit 任务产物（allowlist 安全机制 + commit type fallback）
- 双提交模型：worker-check 提交任务代码，session-close 提交会话元数据，语义分离
- PM Git 职责声明：PM 负责 push/merge，Worker 仅限本地 commit（Skill-level policy）
- Commit message 规范：`{type}(T{id}): {title}`（Worker）/ `session: {摘要}`（PM）

## [3.0.12] - 2026-03-13

### 修复

- `gitignore.template` 不再出现在用户项目中（从 Manifest 中排除）
- `.gitignore` 模板重写 — 移除过时条目（MCP build 注释、备份机制、注释掉的 `.easyai-version`）
- `config.yaml` 清理 — 移除内部开发注释（M00/M01/M04）、删除不存在的 `context-budget.md` 引用
- MCP `framework_init` 现在正确写入 `.easyai-manifest.json`（修复首次升级时全量冲突的问题）

## [3.0.11] - 2026-03-13

### 新增

- `framework_check` 新增 MCP Server 版本一致性检测 — 当运行中的 MCP 版本与已安装框架版本不匹配时发出警告和重启提示
- `framework_update` 更新完成后新增 MCP Server 重启提示

## [3.0.10] - 2026-03-13

### 修复

- `FRAMEWORK_VERSION` 常量同步到 3.0.10 — 修复 `update` 命令写入错误版本号的问题（`lib/init.js` + `framework-tools.ts` 均已更新）

## [3.0.9] - 2026-03-12

### 优化

- `pm-framework-evolve` Skill 深度优化 — SKILL.md 重写（知识检索优先设计）+ 5 个 references 文档全面更新
- 框架知识库准确统计：21 Tools（分 7 类）、6 Resources、10 Skills、3+1 Rules
- 新增 Artifacts 沉淀管道、Manifest 智能合并机制文档
- 发布工作流新增 Step 0：发布前强制更新框架知识库

## [3.0.8] - 2026-03-12

### 新增

- `common-session-close` Skill 新增「收工」触发词 — 用户说"收工"时自动执行会话收尾流程

## [3.0.7] - 2026-03-12

### 新增

- Manifest 驱动的智能合并升级 — `framework_update` 只更新框架文件，保护用户自定义的 Skills/Rules/Workflows
- `scripts/generate-manifest.js` — 生成 `easyai-manifest.json`（skeleton 中所有文件的 SHA-256 哈希）

## [3.0.6] - 2026-03-12

### 文档

- `README_AI.md` MCP 配置模板添加 `EASYAI_PROJECT_ROOT` 环境变量
- 新增 AI 自诊断修复指引

## [3.0.5] - 2026-03-12

### 修复

- 修复 MCP Server 项目根目录检测 — 新增 `__dirname` 第三级 fallback + `findTrellisUpward()` 辅助函数
- 修复 `git-utils.ts` — 所有 `execSync` 调用传入 `getProjectRoot()` 作为 cwd

## [3.0.4] - 2026-03-12

### 新增

- `pm-framework-evolve` Skill（PM 专属框架自迭代能力，升级自 `common-framework-evolve`）
- `publish.md` 发布工作流（含 AI 检查清单、CHANGELOG 生成步骤）
- `framework-dev-mode.md` 开发模式规则

### 变更

- MCP 统计更新：21 个 Tools + 6 个 Resources（原 19+5）
- `FRAMEWORK_VERSION` 同步至 3.0.4
- `project-identity.md` 更新框架地图
- 多个 Skill 文档优化（`pm-brainstorm`、`pm-task-review`、`common-session-close`）

## [3.0.3] - 2026-03-10

### 修复

- .gitignore 未打包进 npm 的问题（改用 `gitignore.template`）
- 清理 skeleton 中的硬编码路径引用

## [3.0.2] - 2026-03-09

### 新增

- MCP 框架管理工具（`framework_init` / `framework_check` / `framework_update`）

## [3.0.1] - 2026-03-09

### 文档

- 优化 README.md 并修正 Antigravity URL

## [3.0.0] - 2026-03-08

### 新增

- easyAI 3.0 全新安装体系
- npx 脚手架（`init` / `check` / `update` / `serve` 命令）
- MCP Server 支持 `EASYAI_PROJECT_ROOT` 环境变量
- 双路径安装：AI 引导安装（推荐）+ 命令行安装
- `.docs/` 用户文档空间（requirements / design / guides / notes / archive）
- PM + Worker 双角色工作流
- 10+ Skills 能力模块（含 pm-brainstorm、pm-task-planning、pm-task-review、worker-implement 等）
- 19 个 MCP Tools + 5 个 MCP Resources
- 三阶段验收流程（Spec 合规 → 代码质量 → Artifacts 沉淀）
- pm-framework-evolve 框架自迭代能力
