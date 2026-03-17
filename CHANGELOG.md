# Changelog

所有版本的重要变更记录。格式基于 [Keep a Changelog](https://keepachangelog.com/)。

## [3.15.0] - 2026-03-17

### 新增

- **Phase 3A Skill Description 深度适配** — 12 个 Skill 标准化触发/排除条件
  - 所有 Skill description 更新为标准格式：`[角色] 动作 — 触发：…排除：…产出：…`
  - `common-skill-eval.md` 速查清单新增「排除条件」列
  - `worker-implement` vs `worker-debug` 触发边界明确化（从零编码 vs 已有代码出 Bug）
  - 评估卡测试：10/10 场景 100% 激活准确率

## [3.14.0] - 2026-03-17

### 新增

- **AI 合规性增强 Phase 2** — MCP 合规性提示系统
  - 新增 `compliance-hints.ts`：自动检测三种场景（missing_verification / unresolved_blockers / stale_task）
  - `task_get()` 返回值新增 `compliance_hints` 字段
  - `task_transition()` 转移到 `in_progress` / `under_review` 时附加合规性提示
  - `task_list()` 活跃任务附加 `hint_count` 摘要
  - `project_status()` 附加 `compliance_hint_total` 汇总
  - 图谱节点更新：`quality-control.md` 新增 compliance-hints 子特性

### 修复

- **hash-utils resolveUriToPath 崩溃** — `context.jsonl` 使用 `path` 字段时 `entry.uri` 为 undefined，导致 `startsWith()` 崩溃。修复：`uri` 改为可选、新增 null guard、增加 `path` 字段回退解析

## [3.13.0] - 2026-03-17

### 新增

- **AI 合规性增强 Phase 1** — Skill 评估守卫 + Workflow 命名规范
  - 新增 `skill-eval-guard.md` Always On Rule：开发/规划/框架/验收类请求前，强制执行 `/common-skill-eval` Workflow
  - 新增 `common-skill-eval.md` Workflow：四步评估流程（评估卡 → 拉取 Level 2 → ABCDE 分级 → 执行），含 12 个 Skill 速查清单
  - Workflow 命名规范：`actor-pm.md` / `actor-worker.md`（角色入口）、`common-*`（通用流程）
  - 强化 `framework-edit-guard.md`：覆盖设计阶段必须查图谱 + 新增"图谱必须同步更新"约束
  - 更新 `project-identity.md`：图谱系统声明为"框架架构的单一事实来源"
  - ABCDE 工作重要性分级从 `worker-lead` 专属提升为全角色通用（写入 Workflow）

## [3.12.0] - 2026-03-17

### 新增

- **P6 框架编辑守卫** — 新 Rule `framework-edit-guard.md`（always_on）
  - 约束 1：修改框架文件前必须查图谱（覆盖 `.agents/` + `.trellis/spec/` + `.trellis/config/` 全部 6 个路径）
  - 约束 2：修改 Skill 前必须读 `skill-creator`（目录结构规范 + YAML frontmatter 格式 + 渐进式披露原则）
  - 解决长对话中 AI 注意力衰减导致的流程合规问题

### 修复

- Rules 计数修正 3+1 → 5+1（补充 `skill-transparency.md` + `framework-edit-guard.md`）

## [3.11.0] - 2026-03-17

### 新增

- **P5 收工 Skill 体系重构** — 拆分 `common-session-close` 为角色专属 Skill
  - `pm-session-close`：PM 专属收工（含知识沉淀、`.tmp/` 清理、Push 确认、恢复指引）
  - `worker-session-close`：Worker 专属收工（含角色分支 独立/组长/组员 + 双触发 自动/手动）
  - Worker 正常完成任务时由 `worker-check` 自动衔接，无需手动说"收工"
  - Worker 中途暂停时仍可手动触发

### 变更

- **删除 `common-session-close`** — 所有引用更新为角色专属 Skill
- Skills 数量 10 → 12（+`pm-session-close`, +`worker-session-close`, +`worker-lead`）
- 6 个图谱节点同步更新（session-management、pm-workflow、worker-workflow、artifact-pipeline、framework-governance、knowledge-management）
- `skill-transparency.md` 示例更新

## [3.10.1] - 2026-03-17

### 修复

- **task_transition 深入修复** — 增强错误诊断（保留完整 stack trace）+ `parseFrontmatter` 全部 `.startsWith()` 调用前增加 `typeof` 防御 + `normalizeRole` 异常类型诊断日志
- 新增 9 个深度防御测试（异常 role 类型 4 个 + 异常 YAML 输入 5 个）

## [3.10.0] - 2026-03-17

### 新增

- **P4 团队执行模式** — 独立执行模式 / 团队执行模式正式命名 + Worker 自主决策
  - 新 Skill `worker-lead`（组长编排）：PLAN 阶段（子任务拆分+并发检查+操作指引）+ INTEGRATE 阶段（技术审核+集成验证+汇总报告）
  - Worker Workflow 新增 Step 5 模式决策：角色缺失硬阻断 + 自主升级流程（需用户确认）
  - 三模式 Skill 编排分支：独立执行模式 / 团队·组长 / 团队·组员
  - ABCDE 工作重要性分级：A=3/B=2/C=1 个外部 CLI 审核，角色自行判断
  - CLI 动态选型：从 config.yaml 的 `strengths` 匹配，不写死映射

### 改进

- 框架知识图谱更新：`_index.md` worker-workflow 描述、`task-management.md` 新增 worker-lead 文件引用、`worker-workflow.md` 三模式 skill_chain
- README 更新：Skill 数量 10+ → 11
- `common-session-close` 描述优化

## [3.9.0] - 2026-03-17

### 新增

- **P3 Skill 使用透明性** — 实时声明 + 事后审计
  - 新 Rule `skill-transparency.md`（always_on）：Skill 激活时输出 `[Skill: {name}] 已激活` 标记 + PATEOAS 状态快照扩展
  - session-close Step 4.6 Skill 审计：收尾时统计 Skill 使用清单，写入 journal `[SKILL_AUDIT]` 条目
  - session-close TC-05：Skill 审计触发测试用例

### 改进

- 框架知识图谱更新：Rules 数量 3→4，framework-governance/session-management 节点同步更新
- README 更新：Rules 数量描述 3→4

## [3.8.1] - 2026-03-17

### 修复

- **update 命令支持新增文件创建** — 升级时 Manifest 中的新增文件和目录会被自动创建，修复 v3.8.0 升级后缺失 `.agents/graph/` 的问题

## [3.8.0] - 2026-03-17

### 新增

- **框架知识图谱**（`.agents/graph/`）— 五层特性树（19 个节点），涵盖基础设施 → 数据层 → 能力层 → 角色系统 → 用户体验
- **Skill 产出契约** — 所有 10 个 Skill 新增 `produces` / `requires` frontmatter 字段
- **Skill 触发测试用例** — 所有 10 个 Skill 新增 ≥ 2 个触发 TC
- **Workflow 显式 Skill 编排** — PM/Worker Workflow 使用 `[必须]` 标记强制 Skill 链路
- **pm-task-planning Step 4.6** — 规划阶段外部 CLI 审核（风险 🟡 以上项目）
- **pm-framework-evolve 图谱驱动** — 知识加载/影响分析/自更新改为读写图谱节点

### 修复

- **task_transition role 参数报错** — 修复传入 `role` 参数时 `Cannot read properties of undefined` 错误

### 变更

- **references/ 目录移除** — `architecture.md`、`features.md`、`directory-map.md` 内容迁移至图谱节点
- **Skill description 统一格式** — 所有 10 个 Skill 重构为 `[角色] 操作 — 触发条件。产出。` 格式
- **publish.md Step 0** — 从 references/ 迁移为图谱驱动

## [3.7.1] - 2026-03-16

### 新增

- **P2 三重防线 — Rules 层长对话防护**
  - 防线 1：`framework-dev-mode.md` 写入守卫 — 修改框架文件前必须回答「写入前三问」+ 交叉约束提醒（project-identity / common-spec-update）
  - 防线 2：Worker Workflow Step 2.5 — 启动时显式加载所有 `always_on` Rules（YAML frontmatter 扫描，失败停机）
  - 防线 3：`common-session-close` Step 4.5 — Rules 合规回顾（动态扫描 + `[RULE_BREACH]` 结构化 journal 日志）

## [3.7.0] - 2026-03-16

### 新增

- **config.yaml 用户引导配置** — 新增 `developer:` 段（name → workspace 文件夹命名）+ `external_cli` / `core_rules` / `mcp_enforced` / `features` 字段，覆盖 P1 全部 5 项引导信息收集需求
- **PM 启动硬性校验** — `pm-session-start` Step 0：`developer.name` 非空阻断检查 + `framework.version` 与 `.easyai-version` 一致性警告 + 5 个配置字段提示

### 增强

- `config-loader.ts` — 新增 `DeveloperConfig` 接口 + `getDefaultUser()` 函数，从 config.yaml 动态读取 developer.name
- `journal-utils.ts` — 移除硬编码 `DEFAULT_USER`，改用 `getDefaultUser()` 动态解析用户目录
- `journal-append.ts` — 响应消息 user fallback 联动 `getDefaultUser()`
- `smoke.test.ts` — 新增 4 个 developer 配置测试用例（38/38 通过）

### 修复

- `config.yaml` 版本号 3.4.0 → 3.6.0 修正（与 `.easyai-version` 对齐）

## [3.6.0] - 2026-03-16

### 新增

- **F44 MCP 已知问题库** — `spec/guides/known-issues.md` 运维知识库，记录 MCP/CLI 已知问题和 workaround，`common-session-close` 自动检查
- **F45 IDE 适配指南** — `.docs/guides/ide-setup.md` 指导非原生 IDE 用户配置框架（MCP Server 安装、连接配置、FAQ）
- **F47 用户自定义目录映射** — `.directory-map` 文件（类 .gitignore 格式），用户声明自定义目录用途，AI 据此定位文件；`pm-session-start` Step 3.6 自动读取
- **F48 文档简化与渐进展开** — `spec/guides/doc-simplify.md` 定义简化规则、渐进展开、双向链接；`common-session-close` 长文档自动简化
- **F56 PBT 属性级测试** — `spec/guides/testing.md` 新增 6 种属性类型（幂等性、往返性、交换律等）；`smoke.test.ts` 新增 7 项属性测试
- **F65 Skill 行为回归测试** — `spec/guides/skill-regression.md` 文档 TDD 流程；`pm-framework-evolve` Step 1 强制检查；`pm-task-review` Stage 1 执行验证；3 个核心 Skill 添加触发测试用例

## [3.5.0] - 2026-03-16

### 新增

- **F32 阻塞沟通协议** — Worker 阻塞上报分 L1/L2/L3 三级，blocker 文件配对命名（`{NN}-question.md` + `{NN}-reply.md`），PM 验收前自动扫描未解决阻塞
- **F39+O3 任务路由配置化** — `config.yaml` 新增 `routing` 段（风险→审查映射、低风险白名单），`pm-task-planning` Step 4.5 路由决策（风险评估→审查策略→CLI 匹配→执行模式）
- **F43 AI 资源清单** — `config.yaml` 新增 `team.roster`（AI 角色、擅长领域、并发配额），CLI 匹配基于任务领域与 AI 能力

### 增强

- `pm-task-review` Stage 2 风险分级动作与 `config.yaml` routing 对齐
- review-standards 优先于白名单规则（`.agents/` 和 `.trellis/spec/` 始终高风险）
- `pm.md` 新增阻塞监控约束，交叉引用 `pm-task-review` 详细处理流程

## [3.4.0] - 2026-03-16

### 新增

- **审查质量门**（`review-standards.md`）— 审核类型分类、4级风险分级、C/W/I报告格式、循环修复机制、7个硬阻断检查点
- **知识分类规范**（`knowledge-categories.md`）— 6种知识分类+触发规则+ADR操作规程+所有权分工
- **ADR模板**（`adr-template.md`）— 标准化架构决策记录模板
- **人话版完成简报** — pm-task-review Stage 3 向用户输出非技术视角的任务成果总结

### 增强

- `pm-task-review` — Pre-Review（审核类型/风险/循环计数）+类型驱动Stage 2+知识分类Stage 3
- `pm-task-planning` — HARD-GATE 3→5条
- `common-session-close` — Step 4知识分类自检+ADR触发+防重复
- 知识库 — directory-map/features/architecture与MCP Server实际对齐

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
