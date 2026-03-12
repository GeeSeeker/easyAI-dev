---
title: 外部 CLI 集成指南
version: "1.0"
category: guides
status: active
---

# 外部 CLI 集成指南

> **版本**：v1.0（M05 创建）
> **适用角色**：PM（调度）、Worker（执行时参考）
> **架构依据**：`easyAI-底层架构设计.md` §5.4

---

## 1. 安全约束

### 1.1 核心原则：代码主权

外部 CLI（Codex / Claude Code / Gemini CLI）= **外包资源池**，不是项目成员。

- 外部 CLI **不能直接写主工作区**，只能输出到 `.trellis/tasks/Txxx/cli/{cli-name}/`
- 外部 CLI 产出视为 **Prototype**，主控 AI 需重构后才能合入代码库
- 主控 AI 重构时须确保：对齐项目编码规范、去除冗余、验证类型安全

### 1.2 输出目录规范

```
.trellis/tasks/T001-xxx/
└── cli/
    ├── codex/          ← Codex CLI 产出
    │   ├── review.md   ← 审查报告
    │   └── patch.diff  ← 代码建议（diff 格式）
    ├── claude-code/    ← Claude Code 产出
    │   ├── review.md
    │   └── patch.diff
    └── gemini/         ← Gemini CLI 产出
        ├── review.md
        └── patch.diff
```

### 1.3 调用前检查清单

每次调用外部 CLI 前，PM/Worker 必须确认：

- [ ] 明确调用目的（审查 / 执行 / 分析）
- [ ] 限定输出范围（哪些文件、哪些维度）
- [ ] 指定输出格式（Markdown 报告 / unified diff / JSON）
- [ ] 设置合理超时

---

## 2. 统一调用模板

### 2.1 Codex CLI（后端/逻辑方向）

**适用场景**：逻辑审查、算法分析、后端代码生成、安全检查

```yaml
调用工具：mcp_codexmcp_codex
参数：
  PROMPT: |
    任务：{调用目的}
    任务 ID：{task_id}
    
    ## 上下文
    {相关代码或文件路径}
    
    ## 约束
    {来自 task.md 的约束集}
    
    ## 输出要求
    - 格式：{Markdown 报告 / unified diff patch}
    - 输出路径（如有文件写入）：.trellis/tasks/{task_id}/cli/codex/
    - 语言：中文
  cd: /home/GeeSeeker/projects/easyAI-dev
  sandbox: read-only  # 审查模式；需写入 cli/ 时用 workspace-write
```

> **超时说明**：Codex CLI 无显式超时参数，复杂任务通常在 5–10 分钟内完成。

### 2.2 Claude Code

**适用场景**：代码审查、重构建议、文档生成、多文件分析

```yaml
调用工具：mcp_claude-code-mcp_claude_code
参数：
  prompt: |
    任务：{调用目的}
    任务 ID：{task_id}
    
    ## 上下文
    {相关代码或文件路径}
    
    ## 约束
    {来自 task.md 的约束集}
    
    ## 输出要求
    - 格式：{Markdown 报告 / unified diff patch}
    - 如需写入文件，仅允许写入 .trellis/tasks/{task_id}/cli/claude-code/
    - 语言：中文
    
    注意：不要修改项目源代码，只提供分析报告或建议。
  workFolder: /home/GeeSeeker/projects/easyAI-dev
```

> **说明**：Claude Code MCP 工具无显式 sandbox 参数，通过 prompt 中的指令约束写入行为。复杂任务通常 5–10 分钟完成。

### 2.3 Gemini CLI（前端/集成方向）

**适用场景**：前端审查、可维护性分析、模式一致性检查

```yaml
调用工具：mcp_geminimcp_gemini
参数：
  PROMPT: |
    任务：{调用目的}
    任务 ID：{task_id}
    
    ## 上下文
    {相关代码或文件路径}
    
    ## 约束
    {来自 task.md 的约束集}
    
    ## 输出要求
    - 格式：{Markdown 报告 / unified diff patch}
    - 如需写入文件，仅允许写入 .trellis/tasks/{task_id}/cli/gemini/
    - 语言：中文
  cd: /home/GeeSeeker/projects/easyAI-dev
  sandbox: true  # 沙箱模式，防止意外修改
```

> **超时说明**：Gemini CLI 无显式超时参数，复杂任务通常在 5–10 分钟内完成。

---

## 3. 多模型交叉审查流程

### 3.1 流程概述

```
Stage 1：并行审查（产出互不可见）
  ├─ CLI-A 审查产出 → 生成 review-A.md
  └─ CLI-B 审查产出 → 生成 review-B.md

Stage 2：主控 AI 综合（分级处理）
  └─ 合并两份报告 → 去重 → 分级

Stage 3：决策与修复
  ├─ Critical → 必须修复
  ├─ Warning → 建议修复
  └─ Info → 酌情处理
```

### 3.2 执行步骤

#### Stage 1：并行审查

同时调用两个不同 CLI 审查同一产出。**关键**：两个 CLI 的输入互不可见（不给 CLI-B 看 CLI-A 的报告），确保独立判断。

推荐组合：
- **Codex + Gemini**（互补：后端逻辑 vs 前端模式）
- **Codex + Claude Code**（互补：执行优化 vs 架构视角）

审查维度模板：

```markdown
## 审查维度

### Spec 合规
- 约束集中每条约束是否被满足？
- 验收标准是否全部覆盖？

### 代码质量
- 命名规范、类型安全、错误处理
- 单一职责、DRY 原则

### 模式一致性
- 是否与项目现有代码风格一致？
- 是否遵循项目架构约定？

### 安全
- 输入验证、注入防护、认证/授权
- 敏感信息暴露风险

## 输出格式（JSON）
{
  "findings": [
    {
      "severity": "Critical | Warning | Info",
      "dimension": "spec | quality | patterns | security",
      "file": "path/to/file.ts",
      "line": 42,
      "description": "问题描述",
      "fix_suggestion": "修复建议"
    }
  ],
  "passed_checks": ["通过的检查项"],
  "summary": "总体评估"
}
```

#### Stage 2：综合报告

主控 AI 收到两份审查报告后：

1. 合并所有 findings
2. 去重（同一位置同一问题只保留一条）
3. 交叉验证（两个 CLI 都发现的问题 → 提升严重程度）
4. 生成综合报告：

```markdown
## 交叉审查报告：T{xxx}

### Critical（X 项）— 必须修复
- [ ] [SPEC] file.ts:42 — 约束 C1 未满足：{描述}
- [ ] [SEC] api.ts:15 — 输入未校验：{描述}

### Warning（Y 项）— 建议修复
- [ ] [QUA] utils.ts:88 — 命名不一致：{描述}

### Info（Z 项）— 酌情处理
- [ ] [PAT] helper.ts:20 — 建议抽取函数：{描述}

### 已通过检查
- ✅ 约束集 C1-C5 全部满足
- ✅ 无安全漏洞
```

#### Stage 3：决策

- **Critical > 0**：必须修复后才能进入验收
- **Critical = 0, Warning > 0**：建议修复，但可由 PM 判断是否接受
- **全部 Info**：可直接进入验收

---

## 4. 使用场景指南

| 场景 | 使用方式 | CLI 选择 | sandbox 设置 |
|------|----------|----------|-------------|
| 独立审核 | CLI 读取代码，产出审核报告 | 按领域选择 | read-only |
| 边界清晰的执行 | CLI 按 spec 生成代码 | 按领域选择 | workspace-write |
| 多模型交叉审查 | 两个 CLI 分别审查 | Codex + Gemini | read-only |
| 快速分析 | 单 CLI 分析特定问题 | 按问题类型 | read-only |

### 注意事项

1. **workspace-write 模式**：仅当确实需要 CLI 写入 `cli/` 目录时使用，且需确保 CLI 只写入指定目录
2. **超时控制**：复杂任务建议设置较长超时，避免中途中断
3. **产出重构**：所有外部 CLI 产出在合入前必须经主控 AI 重构对齐项目规范（代码主权原则）
