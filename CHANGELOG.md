# Changelog

所有版本的重要变更记录。格式基于 [Keep a Changelog](https://keepachangelog.com/)。

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
