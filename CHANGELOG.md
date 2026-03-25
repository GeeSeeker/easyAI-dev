# Changelog

所有版本的重要变更记录。格式基于 [Keep a Changelog](https://keepachangelog.com/)。

## [4.7.0] - 2026-03-25

### 变更

- **task_create 参数重命名** — `role` 参数重命名为 `assigned_to`，消除 AI 将"创建者角色"与"执行者角色"混淆的歧义。工具描述增强：明确说明 `assigned_to` 指定任务执行角色（非创建者），大多数编码/修复任务应指定 `worker`。`generateTaskId()` 内部参数同步更新

## [4.6.1] - 2026-03-24

### 修复

- **Gemini CLI stdin 死锁根治** — `gemini.js` 的 `stdin_mode` 从 `true` 改为 `false`，废弃通过 stdin 管道传入 prompt 的模式（该模式因 Gemini 在无 `-p` 时进入交互式 TUI 导致永久死锁）。改用 Agentic 路径传递：通过 `--include-directories` 挂载 prompt 文件所在目录 + `-p` 短引导语触发 headless 模式。`cli-runner.js` 改为按需读取 prompt 内容（仅 `stdin_mode: true` 的 Codex/Claude 才读取），Gemini 完全走文件挂载路径
- **已知问题库更新** — 新增 KI-004：Gemini CLI stdin 管道死锁（已通过 Agentic 路径传递解决）

## [4.6.0] - 2026-03-24

### 修复

- **CLI Dispatch 路径行为归一化** — 新增 `path-utils.js` 共享路径分类器，修复 `--include-files` 传入文件路径时被 Gemini CLI `--include-directories` 和 Claude Code `--add-dir` 当作目录校验而失败的问题。文件路径自动转为父目录 + 去重 + 不存在路径跳过。三个 backend（Gemini/Claude/Codex）统一使用 `classifyPaths()`，10 个新增测试全部覆盖
- **已知问题库更新** — 新增 KI-003：Gemini CLI `--include-directories` 不接受文件路径（已通过适配层解决）

## [4.5.0] - 2026-03-24

### 新增

- **五维审计 Skill** — 新增 `worker-five-dimension-audit` Skill，覆盖功能、安全、性能、兼容性、可维护性五维度代码审计，集成 ABCDE 闸门分级和 `[AUDIT_FINDING]` 标签，支持自动生成 `.docs/audit/` 审计报告

### 优化

- **CLI 角色主权明晰化** — 框架全量同步 CLI 治理三重身份（委托人+法官+监工），涵盖 `common-cli-dispatch` SKILL.md、`external-cli-guide.md`、底层架构设计 §5.2、`anti-hallucination` Rule 7、图谱节点 `external-cli-dispatch.md`
- **三态裁决标记** — 新增 `[PARTIALLY_ACCEPTED: reason]` 裁决标记，与 `[ACCEPTED]` / `[REJECTED_CLI_ADVICE]` 构成完整裁决体系
- **代码主权声明强化** — Rule 7 明确"外部 CLI 产出不具有自动采纳权"，裁决以约束集和 spec 为准
- **下游 Skill 措辞同步** — `worker-lead` 四处旧措辞（"审核"/"重构为项目规范"）更新为 Review/Execute 双模式裁决/验证措辞

### 修复

- **Gemini CLI 路径双重前缀** — `gemini.js` `buildArgs()` 中 `--include-directories` 路径使用 `path.resolve()` + `path.relative()` 规范化，避免 workdir 二次拼接

## [4.4.1] - 2026-03-24

### 修复

- **Windows 含空格路径参数崩溃** — `cli-runner.js` 新增 `quoteArgsForShell()` 函数，在 `shell: true`（Windows 必需）场景下，对含空格或 cmd.exe 特殊字符的参数自动加双引号包裹。修复 `--include-directories`、`--add-dir`、`-C` 等路径参数被 cmd.exe 错误拆分的问题。影响所有三个 backend（Gemini/Claude/Codex），8 个新增测试覆盖

## [4.4.0] - 2026-03-23

### 新增

- **CLI Dispatch 会话恢复** — 通过 `--session-id` + `--follow-up` 实现多轮追问。Codex 使用 `exec resume <id>`（官方非交互式语法），Claude 使用 `--resume <id>`，Gemini 使用 `--resume <id>`。已通过三个 CLI 实际 resume 测试验证上下文保持
- **CLI Dispatch 模型选择** — `--model` 参数覆盖 config.yaml `default_model`。各 CLI 自动映射为对应参数（Codex `-m` / Claude `--model` / Gemini `--model`）
- **CLI Dispatch 上下文文件注入** — `--include-files` 缩窄审查范围。Claude 通过 `--add-dir`、Gemini 通过 `--include-directories` 注入
- **CLI Dispatch 会话列表查询** — `--list-sessions <backend>` 查询历史会话（Claude/Codex 文件系统模式、Gemini CLI flag 模式）
- **Claude JSON 结构化输出** — `--output-format json` 返回含 `session_id` 的 JSON 对象，`supports_json` 升级为 `true`。解决了 `-p` 模式无法获取 session_id 的问题

### 修复

- **Codex resume 语法修正** — 从错误的 `codex resume`（交互式 TUI）改为 `codex exec resume`（官方非交互式语法），移除 `exec resume` 不支持的 `-C`/`-m` 参数
- **Claude `--setting-sources` 移除** — 完全移除该参数（已无需要），改用 `--output-format json` 实现结构化输出

### 文档

- **external-cli-guide.md 升级至 v3.0** — 参数表新增 5 项、Backend 特性矩阵扩展为 7 列、JSON schema 新增 session_id
- **图谱节点更新** — `external-cli-dispatch.md` 核心能力新增 5 项

## [4.3.31] - 2026-03-23

### 修复

- **Claude `--setting-sources=` 导致自定义配置被剥离** — 该参数禁用所有配置源（user/project/local），导致使用自定义 API 代理或认证配置的用户报 `Not logged in`。移除此参数，`stdin_mode: true` + `-p` 已足够保证 one-shot 执行。**已通过实际 Claude CLI 调用验证**（exit_code: 0）

## [4.3.30] - 2026-03-22

### 修复

- **Claude `--setting-sources` 空参数被 Windows shell 消除** — `args.push("--setting-sources", "")` 在 Windows `shell: true` 模式下，空字符串 `""` 被 cmd.exe 吞噬导致 `argument missing` 报错。改为 `args.push("--setting-sources=")` 使用 `=` 语法合并为单个参数

## [4.3.29] - 2026-03-22

### 修复

- **Codex Windows 沙箱权限错误（最终修复）** — review 模式从 `--full-auto` 改为 `--dangerously-bypass-approvals-and-sandbox`（参考 ccg-workflow executor.go:777），彻底规避 `CreateProcessAsUserW failed: 5` 错误。`--full-auto` 本意关闭沙箱，实际仍启用写沙箱
- **Claude 闲聊响应问题** — `stdin_mode` 改为 `true`，长 prompt 通过 stdin pipe 传入，修复命令行参数模式下 Claude 进入交互/闲聊模式的问题；同时追加 `--setting-sources ""` 阻断本地配置文件的全局 prompt 干扰（参考 ccg-workflow backend.go:95）

## [4.3.28] - 2026-03-22

### 新增

- **AI 驱动的 Config 智能合并** — 框架升级后将 config 差异写入 `.config-pending.json`，下次 PM 会话启动时 AI 自动检测并引导用户逐个配置新字段（推荐值 + 理由），取代旧的 console.log 提示
- **pm-session-start Step 0c** — 新增 Config 新字段引导步骤，AI 结合项目上下文智能推荐配置值

### 修复

- **MCP framework_update config 差异检测** — 升级前保存用户 config 快照，修复 appendMissingSections 修改后无法检测差异的问题

## [4.3.27] - 2026-03-22

### 新增

- **Update 后 config 新字段提示** — 框架更新后自动检测用户 config.yaml 中缺少的配置项，输出 `💡 config.yaml 发现 N 个新配置项` 提示，帮助用户发现需要手动添加的新配置

## [4.3.26] - 2026-03-21

### 新增

- **CLI 独立超时配置** — `config.yaml` 中每个外部 CLI（Codex/Claude/Gemini）可单独配置 `timeout`（秒），`cli-runner.js` 启动时自动读取，优先级：CLI `--timeout` 参数 > config.yaml > 默认 600s

### 变更

- **上下文预算标记为实验性** — `config.yaml` 中 `context` 段添加 `experimental: true` 和说明注释，明确该功能尚未真正接入工作流

## [4.3.25] - 2026-03-21

### 修复

- **Codex Windows 沙箱权限错误** — review 模式添加 `--full-auto` 禁用沙箱，修复 `CreateProcessAsUserW failed: 5` 导致无法读取项目文件的问题
- **Gemini 长 Prompt 回显问题** — `stdin_mode` 改为 `true`，prompt 通过 stdin pipe 传入，修复 Windows `cmd.exe` 对长 prompt positional arg 转义截断导致 Gemini 只回显模板的问题

## [4.3.24] - 2026-03-21

### 修复

- **Windows CLI spawn 兼容性** — `cli-runner.js` 添加 `shell: true`（仅 Windows），修复 npm 全局安装的 `.cmd` 脚本（codex/gemini）无法被 `spawn()` 执行的 `ENOENT` 错误
- **Gemini -p 参数冲突** — `gemini.js` 移除 `-p` 标志，修复与 positional prompt 同时存在导致 `Cannot use both a positional prompt and -p flag` 的错误

## [4.3.23] - 2026-03-21

### 新增

- **新手引导全面升级** — 替换 README 演示任务为语义地图生成，标准化记事本四分区模板，并新增专门的归档引导体验 (#T050)
- **归档体系增强** — 新增记事本与设计方案的归档标准模板，`.docs/` 根目录支持存放核心常青文档，并在里程碑归档中自动扫描旧版本常青文档 (#T051)

### 优化

- **收工地图自动刷新** — 收工流程中自动检测文件目录结构的物理变动（`git diff --name-status`），静默生成并更新语义地图，保持图谱永远新鲜 (#T049)

### 修复

- **CLI Backend 跨平台兼容性** — 修复 `isAvailable()` 中硬编码 `which` 导致 Windows 平台下未处理的检测错误，改为依据 `process.platform` 平台分发使用 `where` / `which` 寻找存在的可执行文件 (#T048)

## [4.3.21] - 2026-03-20

### 修复

- **MCP Root 检查异常自修复死循环** — 移除了 MCP Server 对项目必须要预先成功 `init` 然后才能连接的硬时序假设，使得在 Win / 纯净机器的初次初始化场景不再报错找不到工作区，同时移除了对注入系统环境变量的依赖和激进误导指令。

## [4.3.20] - 2026-03-20

### 修复

- **移除废弃的 `.docs/archive/` 检查** — 框架已采用「就地养老式」归档（文件用 `[DONE]`/`[OBSOLETE]` 前缀就地标记），不再需要独立的 archive 目录。从 `framework_check` 和 `init` 的检查列表中移除，消除每次 check 的误报。

## [4.3.19] - 2026-03-20

### 优化

- **用户视角统计修正** — 骨架分发的框架组件统计表中移除开发专属组件（`publish.md`、`framework-dev-mode.md`），仅展示用户实际拥有的 Workflows（4）和 Rules（7），避免 AI 在用户环境中引用不存在的文件。

## [4.3.18] - 2026-03-20

### 优化

- **知识图谱与骨架同步** — 同步三个角色 Workflow (`actor-pm.md`, `actor-worker.md`, `worker-quick-fix.md`) 的描述至最新一致状态；更新 `pm-framework-evolve` Skill 中的框架资源统计数据（Workflows 变更为 4+1），确保图谱数据与物理文件一致。

## [4.3.17] - 2026-03-20

### 修复

- **Init 输出修正** — 修复初始化提示中斜杠命令名称错误（`/pm` → `/actor-pm`）；移除 MCP 配置中硬编码的 `EASYAI_PROJECT_ROOT` 环境变量，改为无需手动指定路径的简洁配置，一次配置即可在所有项目中复用。

## [4.3.16] - 2026-03-20

### 修复

- **发布时序重构** — 彻底重构了 `/publish` 流程，将修改版本号前置于框架编译步骤。修复了发布包中的 MCP Server 产物始终挂载旧版本号，导致运行时报版本不一致警告的问题。

## [4.3.15] - 2026-03-20

### 修复

- **版本同步时序修复** — 修正 `/publish` 流程中 skeleton 同步早于版本号更新的 bug，确保用户新初装或更新易产生遗留版本号（如一直显示 `4.3.13`）的问题。
- **语义地图初始检测修复** — 修正 `pm-session-start` 在环境初启动阶段由于数据结构层级调整（扁平 `directories` 变为嵌套 `tree`）导致的地图检测失败缺陷。

## [4.3.14] - 2026-03-19

### 修复

- **版本基线对齐** — 将 `playground/`（开发基线）中各个模块的规则集与即将发布至 `easyAI-dev-latest/skeleton/` 模板的版本清单文件及 `config.yaml` 进行最后一次深度物理对齐，确保所有新安装的用户获得的配置骨架干净、最新。

## [4.3.13] - 2026-03-19

### 修复

- **MCP Server 启动失败 (ENOENT)** — 修复了生产环境打包产物（`lib/server/index.js`）在运行时与开发阶段（`packages/mcp-server/build/`）所在目录深度不同导致的 `package.json` 寻址失败崩溃 Bug，现已引入安全的双层动态回退探测机制。

## [4.3.12] - 2026-03-19

### 修复

- **工作区隔离异常 (AI 幻觉防护)** — 彻底移除 MCP 日志工具（`journal_append` 和 `journal_search`）中可选的 `user` 参数暴露，改为底层自动读取基于 `config.yaml` 定义的 `developer.name`，从物理层面彻底封死大模型强行越权伪造角色目录（如 `PM` 或 `worker` 文件夹）的隐患。

## [4.3.11] - 2026-03-19

### 修复

- 修正了图谱中 `manifest-mechanism` 节点对 `easyai-manifest.json` 的错误称呼，已补充前导点改为 `.easyai-manifest.json`。

## [4.3.10] - 2026-03-19

### 修复

- **框架审计与问题修复 (Phase 1/2/3)** — 闭环完成全量遍历性代码安全检查，解决 20 项审计意见，巩固代码底座
- **图谱与文档过时引用修复** — 清理了 `.agents/graph`、`spec` 和各角色 `SKILL.md` 中残留的旧路径（如 `always_on/glob`）并统一了编号风格
- **MCP Server 代码复用 (DRY)** — 提取 `escapeYamlString`、规范化 `slugify` 的 ASCII-only 正则、复用 `context.jsonl` 解析逻辑
- **Git 工具安全加固** — `git-utils.ts` 中的 `execSync` 彻底替换为 `execFileSync` 消除 Shell 注入风险，增加 30 秒限时，并使用安全分隔符解析 Git 日志
- **语义化版本比较** — `framework-tools.ts` 实现安全的版本追踪比较，彻底修复跨位版本号比对误判的 Bug
- **更新回滚机制** — `framework_update` 增加事务级备份与回滚机制，防止异常中断破坏框架完整性

### 变更

- **CLI 调度测试流演进** — 从并行的 `task-transition` 审查实践中，抛弃基于纯文字正则过滤外部 CLI 的黑盒修补思路，明确演进至采用全双工通信环境的新一代对话架构蓝图
- **CLI 调用配置化增强** — `config.yaml` 支持更为全面的 CLI 细粒度声明选项并清理无上下文 TODO 代码
- **独立规范拆分** — 将 `project_status` 工具模块从底层 `index.ts` 中独立文件化以统一代码存放界面

## [4.3.9] - 2026-03-19

### 修复

- **图谱数据修正（9 项）** — 更新 rules 扁平化描述、补全 `framework-governance` files 字段（skill-eval-guard、cli-direct-call-guard、permissions.yaml）、修正 manifest 文件名、pm-workflow 补充 pm-onboarding、SKILL.md 快速参考索引数量校正
- **移除废弃的 `.directory-map` 引用** — `file-persistence` 图谱节点清理 children/files/子特性描述

### 新增

- **图谱迭代机制强化** — publish.md Step 0 扩展为 5 类全覆盖扫描、pm-framework-evolve Step 4 增加 playground 上下文提醒、Step 6 增加 files 引用校验
- **记事本日常整理约定** — actor-pm.md 新增约束：完成的待办应即时移入完成区，不仅依赖收工批量整理

## [4.3.8] - 2026-03-19

### 修复

- **`framework_check/init/update` 项目根目录检测失败** — 三个框架管理工具使用 `process.cwd()` 作为默认目标目录，但 MCP Server 进程的工作目录并非项目根。改为使用 `getProjectRoot()`（含 MCP roots 协议 + `.trellis` 向上遍历逻辑），与其他所有工具保持一致

## [4.3.7] - 2026-03-19

### 修复

- **Rules 物理结构扁平化** — 彻底清除 `always_on/` 和 `glob/` 的残留物理子文件夹，将真实的规则文件直接平铺于 `.agents/rules/`
- **消除全量硬编码路径** — 更新 MCP Server `framework-tools.ts` 以及图谱节点（`quality-control.md`、`framework-governance.md`、`external-cli-dispatch.md`、`worker-workflow.md`）、工作流与 Skills 中残余的旧子目录硬编码引用

## [4.2.4] - 2026-03-19

### 修复

- **`framework_check` 路径不匹配** — `REQUIRED_FILES` 从 `rules/xxx.md` 修正为 `rules/always_on/xxx.md` 和 `rules/glob/xxx.md`，修复所有新安装项目 `framework_check` 必定报 3 个 missing files 的问题
- **`FRAMEWORK_VERSION` 硬编码过时** — `init.js` 和 `framework-tools` 中版本号从 4.2.2 同步到 4.2.4
- **图谱文件引用补全** — pm-workflow 补充 `pm-braindump-assimilate` + `common-semantic-map` + `common-github-cli`；worker-workflow 补充 `common-github-cli`；session-management 补充 `common-semantic-map`
- **文档数字同步** — README.md + core-concepts.md 中节点数 18→20、Skills 14→17、Rules 7→8

## [4.2.3] - 2026-03-19

### 修复

- **文档前缀约定补全** — `artifact-pipeline` 图谱节点新增完整前缀约定表（`[DONE]`/`[OBSOLETE]`/`[MILESTONE]`），修复 AI 操作 `.docs/` 时因图谱信息不完整而无法发现已有前缀规则的问题
- **framework-edit-guard 新增约束 1d** — `.docs/` 下创建/重命名/移动/归档文件时，要求 AI 先查阅 `artifact-pipeline` 图谱节点，防止违反前缀约定

## [4.2.2] - 2026-03-19

### 文档

- **增强 MCP 安装引导** — `README_AI.md` 新增 S5 章节：增强 MCP 选装（Context7 文档检索 + ContextWeaver 代码语义搜索 + Exa 互联网搜索），安装后自动写入 `GEMINI.md` 检索优先级规则；S4 更新过渡引导
- **README.md** — 方式一描述中提及增强 MCP 生态

## [4.2.1] - 2026-03-19

### 修复

- **common-github-cli Skill 补全** — 补充缺失命令：`gh issue edit`、`gh pr edit`、`gh release list`、`gh repo create/fork`；修复 temp file 路径为 `.tmp/`；添加 auth scope 提示和 `--repo` 可选说明

## [4.2.0] - 2026-03-19

### 新增

- **GitHub CLI 轻量集成 Skill** — 新增 `common-github-cli` Skill，用 `gh` CLI 替代重量级 GitHub MCP Server（节省约 5000 tokens 上下文），按需激活不常驻，覆盖搜索代码/Issue、创建 PR、管理 Release 等日常操作

## [4.1.0] - 2026-03-19

### 新增

- **自动化项目代码语义地图 (Semantic Map)** — 新增 `common-semantic-map` Skill，基于骨架提取（Skeleton Heuristics）自动扫描项目并在 `.docs/` 下成成结构化及人工可读双文件导航，消除项目进入的“战争迷雾”
- **环境初始化地图铺底防御** — `pm-session-start` 新增 Step 3.8 初底检测，在框架首次加载时主动发现并引导全景地图生成

### 重构

- **Rules 目录分类流派化** — 将 `.agents/rules/` 按触发模型精细化拆分为 `always_on/` 和 `glob/` 子目录，框架规范图谱层同步更新溯源依赖

## [4.0.0] - 2026-03-18

- **外部 CLI 审查拦截机制 (Evidence Gate)** — MCP 状态机进入 under_review 前，强制要求达到 ABCDE 分级对应的 CLI 独立审查数量（A=3, B=2, C=1），否则硬阻断转移
- **外部 CLI 角色定义系统** — 新增 7 个专属角色提示词（Codex/Claude/Gemini 的 Reviewer/Architect/Implementer 等），指导外部 CLI 按照特定规范审查
- **独立上下文模式模板 (Context Profiles)** — 新增 `analyze-mode.md`、`review-mode.md`、`execute-mode.md`，精确控制不同阶段外部 CLI 的知识投喂量
- **CLI 执行参数深化** — `cli-runner.js` 新增 `--session-id` (连续对话恢复) 和 `--context-mode` (分析/审查/执行三种核心流)
- **外部 CLI 法官裁决集成** — `common-cli-dispatch` Step 5 升级，提取 CLI 独立审核意见并生成 `[ACCEPTED]` 或 `[REJECTED_CLI_ADVICE]` 首末裁决报告（verdict.md）
- **Worker 动态委派 CLI 节点** — `worker-implement` 增加是否将明确代码委派外部 CLI 的自助分析节点
- **PM 整合 CLI 需求分析** — `pm-brainstorm` 支持在 A/B 级复杂方案规划前，使用外部 CLI 的 analyze 模式预演并出具可行性报告
- **计划自动驾驶 (Plan Auto-Review)** — Worker 产出执行计划后自动触发 CLI review，若 `[ACCEPTED]` 则静默全自动流转代码编写，将极大削减中断

### 变更

- **anti-hallucination Rule 主权更新** — 允许外部 CLI 直接修改项目文件，主控 AI (Antigravity) 肩负完整测试验收的最终安全兜底责任

## [3.21.0] - 2026-03-18

- **集中式工具权限矩阵** — 新增 `.trellis/config/permissions.yaml`，集中声明 AI 行为边界（工具分级、路径保护、角色权限）
- **Brain Dump 同化器** — 新增 `pm-braindump-assimilate` Skill，解析用户非结构化输入并分类路由到框架各位置
- **Worker 标准化完成汇报** — `worker-session-close` Step 7 改为固定格式汇报（含任务 ID、变更摘要、验证结果、可复制的 PM 验收提示词）
- **PM 记事本主动记录** — `pm-session-start` 新增 Step 3.3（PM 记事本恢复）和 Step 3.65（权限矩阵概览）；`actor-pm` 新增记事本主动记录约束

### 修复

- **任务编号重复** — `generateTaskId()` 改为递归扫描归档子目录（`archive/YYYY-MM/`），修复里程碑归档后新建任务编号重复的 Bug

## [3.20.0] - 2026-03-18

### 新增

- **图谱主动赋能（Graph Active Enablement）** — 从"半主动赋能"升级为"主动提示增强"
  - **[P1] MCP compliance-hints 设计文档检测** — `task_create` 返回值新增 `compliance_hints` 字段，自动检测 `.docs/design/` 下是否有活跃设计文档，缺失时生成 `info` 提示（非阻断）
  - **[P2] 跨会话图谱追踪** — `worker-session-close` Step 3.5 改用 commit range 检测 + 图谱不一致时写入 `[GRAPH_STALE]` journal 条目；`pm-session-start` 新增 Step 3.7 图谱健康检查
  - **[P3] 依赖链文件级检查** — `common-skill-eval` 新增 Step 1b，检查候选 Skill 的 `requires` 前置产出（仅 `design_document` 和 `task_with_constraints` 两种可靠类型）
  - **[P4] 非任务上下文修改提醒** — `framework-edit-guard` 新增约束 1c，在非正式任务中修改框架文件时提醒检查图谱和创建任务

### 变更

- compliance-hints 提示类型从 3 种扩展为 4 种（新增 `missing_design_document`）
- `task-create.ts` 首次接入 compliance-hints 体系（此前仅 `task-transition.ts` 消费）

## [3.19.6] - 2026-03-18

### 新增

- **记事本四分区模板** — `user-记事本.md`（说明+长期+待办+完成）和 `pm-记事本.md`（长期+待办+完成），框架初始化时自动创建
- **pm-session-close Step 4.8 记事本整理** — 收工时自动检查说明区完整性、按处理模式（跳过/询问/自动）整理记事本
- **pm-milestone-archive 里程碑报告模板** — 标准化模板含路径引用规则（优先归档路径，动态路径加 ⚠️ 备注）
- **design/ 根文件常青约定** — 项目核心文档归档时不动，属「宪法」级别

### 变更

- artifact-pipeline 图谱节点新增记事本约定和 design 根文件说明

## [3.19.5] - 2026-03-18

### 新增

- **CLI execute 模式** — `cli-runner.js --mode execute` 支持外部 CLI 修改文件
  - Codex：添加 `sandbox_permissions`（disk-full-read-access + disk-write-access）
  - Gemini：添加 `--sandbox false` 禁用沙箱
  - Claude：无需额外参数（`--dangerously-skip-permissions` 已覆盖）
- **execute.md Prompt 模板** — 新增执行模式专用 Prompt 模板

## [3.19.4] - 2026-03-18

### 修复

- **Gemini CLI 无输出** — 添加 `-p` 非交互模式标志 + 输出格式从 `stream-json` 改为 `json`（单 JSON 对象）+ `parseOutput` 重写适配新格式
- **Claude CLI 认证失败** — 移除 `--setting-sources ''`（会清空 API key 配置），改用 MCP 参考项目的 `--dangerously-skip-permissions`；纯文本输出模式
- **Claude CLI 超时挂起** — `spawn` 的 `stdio[0]` 从 `pipe` 改为 `ignore`（非 stdin 模式的 backend 不应打开 stdin pipe）
- **多 backend 输出丢失** — `process.stdout.write()` 后未等 flush 即调用 `process.exit()`
- **Gemini stderr 噪音** — 新增 3 条噪音过滤模式（IDE 连接错误、skill 覆盖警告）

## [3.19.3] - 2026-03-18

### 文档

- **README.md 全面重构** — 新增设计哲学（框架即人体比喻）、适合谁区块、完整需求交付流程示例、教程入口链接
- **新增 3 份教程文档** — `docs/getting-started.md`（快速上手）、`docs/core-concepts.md`（核心概念）、`docs/workflow-guide.md`（工作流实战指南）
- **命令统一修正** — README.md / README_AI.md / skeleton/README.md 中 `/pm` → `/actor-pm`
- **MCP 数据修正** — 23 个 MCP 工具 + 6 个数据源（源码级核实）
- **安装指南补全** — 命令行安装路径增加 `EASYAI_PROJECT_ROOT` 环境变量说明

## [3.19.2] - 2026-03-18

### 修复

- **Step 4.5 标准状态字段规范** — 定义设计文档标准状态字段（`> **状态**：`），收工时双重更新可见字段 + HTML 注释。修复原实现仅加隐藏注释、不更新用户可见状态的问题

## [3.19.1] - 2026-03-18

### 新增

- **pm-session-close Step 4.5 关联文档状态同步** — 收工时自动检测已完成任务关联的设计文档，建议打 `[DONE]`/`[OBSOLETE]` 标记（需用户确认），遵循 pm-milestone-archive 标记规范

## [3.19.0] - 2026-03-18

### 新增

- **外部 CLI 统一调度体系（common-cli-dispatch）** — 新增 Skill + 调度引擎
  - `cli-runner.js`：Node.js 调度引擎，支持多 backend 并行（codex/claude/gemini）、降级策略、超时控制（SIGTERM→5s→SIGKILL）
  - 3 个 Backend 适配器（codex.js / claude.js / gemini.js）：统一 capability interface
  - lib 工具链：JSON 流解析（parser.js）、噪音过滤（filter.js）、报告生成（reporter.js）
  - SKILL.md：ABCDE 分级闸门（A=3/B=2/C=1/D-E=0 CLI）+ 标准调用流程
  - templates/review.md：统一审查 Prompt 模板
  - 34 项测试全通过，零 npm 依赖
- **cli-direct-call-guard Rule** — 禁止 AI 直接 run_command 调用 codex/claude/gemini，必须通过 cli-runner.js
- **external-cli-dispatch 图谱节点** — 能力层新增，含 serves/depends_on 关系

### 变更

- **ABCDE 分级体系全量统一** — config.yaml `risk_review_mapping(low/medium/high/critical)` → `grade_review_mapping(A/B/C/D/E)`
  - `low_risk_whitelist` → `auto_downgrade_whitelist`（含 D/E 级自动降级规则）
  - 清理所有残留旧分级引用（`pm_self_review`/`single_cli_review`/`dual_cli_review`）
- **config.yaml team.roster** — `mcp_tool` 字段替换为 `cli_command`，移除 `external_cli` 顶级字段
- **pm-brainstorm / pm-task-planning / common-skill-eval** — CLI 调用方式从 MCP Tool 改为 cli-runner.js
- **external-cli-guide.md** — 调用模板从 MCP 改为 cli-runner.js
- Skills 数量 13 → 14（新增 common-cli-dispatch）

## [3.18.2] - 2026-03-18

### 修复

- **文档交叉引用全量修复（T016）** — 20+ 个文件中约 35 处过期斜杠命令引用修正
  - `/worker` → `/actor-worker`、`/pm` → `/actor-pm`、`pm.md` → `actor-pm.md` 等
  - 覆盖 Workflows、Skills、Rules、图谱节点、用户指南

### 改进

- **升级保护可扩展化（T015）** — `generate-manifest.js` 从硬编码改为 `MERGE_MODE_MAP` 查表机制
- **图谱 `upgrade` 标注推广** — 4 个代表性节点（manifest-mechanism、framework-governance、pm-workflow、spec-system）显式标注 `upgrade: replace`

## [3.18.1] - 2026-03-18

### 修复

- **FRAMEWORK_VERSION 全端同步** — `framework-tools.ts` 和 `init.js` 常量从 3.17.4 同步到 3.18.1
- **config.yaml 升级保护** — `generate-manifest.js` 新增 `merge_mode: append`；`framework-tools.ts` / `init.js` 新增 `appendMissingSections()` 函数（YAML 顶层段落智能追加）

## [3.18.0] - 2026-03-18

### 新增

- **图谱接入工作层（T018）** — 图谱从「参考层」升级为「工作层」，接入日常 Workflow 和 Skill
  - `common-skill-eval` Step 1：框架请求时读取 `_index.md` + `skill_chain` 辅助域→Skill 映射
  - `pm-task-planning` Step 7：框架任务自动将图谱节点写入 `context.jsonl`
  - `actor-worker`：启动时关注 context 中的图谱条目
  - `pm-session-start`：状态快照增加「框架能力概览」
- **三层图谱自维护机制** — 编辑时、收工时、发布时三层防护
  - `framework-edit-guard` 增加约束 1b：修改后检查图谱引用一致性
  - `worker-session-close`：git diff 交叉比对图谱 files，不一致仅报警
  - `publish.md` 新增 Step 0.5：发布前图谱一致性校验
- **ABCDE ↔ 🟢🟡🔴⚫ 映射统一** — `common-skill-eval` Step 3 新增映射定义（A→⚫/B→🔴/C→🟡/D→🟢/E→无需审查）
- **pm-brainstorm Step 3.5** — A/B 级设计方案须经 CLI 审核后再呈现用户
- **图谱 `upgrade` 标注约定** — 节点 `files` 可选 `upgrade` 字段（replace/append/preserve），`config-management` 示范 `upgrade: append`

### 变更

- 5 个文档同步更新（ai-compliance-enforcement / framework-knowledge-graph / graph README / project-identity / knowledge-categories）

## [3.17.5] - 2026-03-18

### 修复

- **图谱数据清洗（T017）** — 全量审计修正 19 个业务节点
  - 5 处过期路径修正（`worker.md` → `actor-worker.md`、`pm.md` → `actor-pm.md`）
  - 7 处双向一致性补全（缺失的 `relates_to` 反向引用）
  - v3.12→v3.17 新增文件已录入图谱（compliance-hints / worker-quick-fix / pm-milestone-archive / worker-session-close / worker-lead）

## [3.17.1] - 2026-03-18

### 修复

- **`framework_check` 报告所有目录不存在** — `framework-tools.ts` 和 `lib/init.js` 中 `REQUIRED_DIRS` 仍引用已废弃的 `.docs/requirements` 和 `.docs/guides`，更新为 `.docs/notes` / `.docs/refs` / `.docs/design`
- **`FRAMEWORK_VERSION` 常量未同步** — `framework-tools.ts` 和 `lib/init.js` 中版本停留在 3.16.1，更新为 3.17.1
- **`REQUIRED_FILES` 引用旧 Workflow 文件名** — `pm.md` / `worker.md` 已在 v3.13.0 重命名为 `actor-pm.md` / `actor-worker.md`

## [3.17.0] - 2026-03-18

### 新增

- **`.docs/` 目录结构重构** — 从旧结构（requirements/design/guides/notes/archive）迁移为意图流驱动的新结构（notes/refs/design/archive）
  - `notes/`：纯草稿场区（user-/pm- 前缀），禁止长期堆积
  - `refs/`：外部参考资料库（替代原 requirements/）
  - `design/planning/`：长线项目规划、Roadmap、里程碑总结
  - `design/features/`：特性架构蓝图
  - 废弃 `requirements/` 和 `guides/` 目录
- **`pm-milestone-archive` 新 Skill** — 里程碑进度归档（触发：用户主动要求「进度归档」）
  - 5 步归档流程：docs 去水 → archive 冷藏区转移 → tmp 彻底清空 → trellis 任务清理 → 里程碑总结报告
  - PM 工作流新增「场景 F：里程碑归档与大扫除」
  - `common-skill-eval` 速查清单同步更新

### 变更

- 10+ 个框架文件旧引用全量清理（project-identity / 5 个图谱节点 / pm-session-close / pm-task-review / common-skill-eval / README）
- 知识分类路由更新：`GUIDE → design/features/`、`REQ → refs/`、新增 `PLANNING` 类别
- Skills 数量 12 → 13（新增 pm-milestone-archive）
- 发行版 README.md 项目结构树同步更新

## [3.16.1] - 2026-03-17

### 修复

- **MCP Server Phase 2 合规性提示未生效** — `compliance-hints.ts` 等 5 个文件之前只存在于 `playground/packages/`（不参与编译），现已同步到 `packages/mcp-server/`
- **清理 `playground/packages/`** — MCP 源码不应存在于 playground，已删除

## [3.16.0] - 2026-03-17

### 新增

- **Phase 3B worker-quick-fix 轻量修复 Workflow**
  - 新增 `worker-quick-fix.md` 轻量工作流（跳过 TDD 流程）
  - `actor-worker.md` 新增 quick-fix 模式分支拦截
  - `worker-workflow.md` 图谱节点同步更新

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
