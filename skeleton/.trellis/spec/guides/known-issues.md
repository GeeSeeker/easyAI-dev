---
title: MCP 已知问题库
version: 1.0.0
category: guides
status: active
---

# MCP 已知问题库

> 运维知识库：记录 MCP Server 和外部 CLI 的已知问题及 workaround。
> 本文件由 PM 在 `common-session-close` Step 4 检查并持续更新。

## 条目模板

```markdown
### KI-{编号}: {问题简述}

- **影响范围**: {MCP Tool / CLI 名称}
- **症状**: {用户可观察到的现象}
- **根因**: {已知则填写，未知则标注"待查"}
- **Workaround**: {临时解决方案}
- **状态**: 开放 / 已解决（{版本号}）
- **发现日期**: YYYY-MM-DD
```

---

## 已知问题清单

### KI-001: Gemini CLI 429 限流

- **影响范围**: Gemini CLI（外部 CLI 审核模式）
- **症状**: 批量审核时频繁返回 HTTP 429 错误，审核无法完成
- **根因**: Gemini API 请求速率超出免费/标准配额限制
- **Workaround**: 降低并发调度频率；改用其他 CLI（Claude Code / Codex）作为替代审核工具
- **状态**: 开放
- **发现日期**: 2026-03-16

### KI-002: Codex 审核输出范围外 Critical

- **影响范围**: Codex CLI（外部 CLI 审核模式）
- **症状**: Codex 审核报告中包含超出本批次范围的 Critical 级别问题（如要求实现其他批次的功能）
- **根因**: 外部 CLI 缺乏批次边界感知，会基于全局代码视角提出改进
- **Workaround**: PM 在采纳审核意见前，先判断问题是否属于当前批次范围；范围外问题记录为"待办"但不阻塞当前发布
- **状态**: 开放
- **发现日期**: 2026-03-16

---

### KI-003: Gemini CLI `--include-directories` 不接受文件路径

- **影响范围**: Gemini CLI（`--include-directories` 参数）
- **症状**: 传入文件路径时校验失败（将文件路径当作目录校验），导致上下文注入失败
- **根因**: Gemini CLI 只有 `--include-directories`（无 `--include-files`），严格校验路径必须是目录
- **Workaround**: 在 `gemini.js` 适配层使用 `classifyPaths()` 自动将文件路径转为父目录。此逻辑同步应用于 `claude.js` 的 `--add-dir` 参数
- **状态**: 已解决（v4.6.0 — `path-utils.js` 行为归一化）
- **发现日期**: 2026-03-24
- **GitHub 参考**: [#13669](https://github.com/google-gemini/gemini-cli/issues/13669), [#9016](https://github.com/google-gemini/gemini-cli/issues/9016)

---

### KI-004: Gemini CLI stdin 管道死锁（无 `-p` 时进入交互模式）

- **影响范围**: Gemini CLI（外部 CLI 调度 `stdin_mode: true` 模式）
- **症状**: Gemini 通过 Node.js `child_process.spawn` 以 stdin pipe 传入 prompt 时，进程永久挂起直到 600s 超时被强杀。无任何 stdout/stderr 输出
- **根因**: Gemini CLI 在未收到 `-p` 参数时进入交互式 TUI 模式，而 Node.js 的匿名管道（非 TTY）无法满足交互式 stdin 的期望，导致进程死锁
- **修复方案**: 将 `gemini.js` 的 `stdin_mode` 改为 `false`，采用 Agentic 路径传递模式：通过 `--include-directories` 挂载 prompt 文件所在目录，并使用 `-p` 传入短引导语触发 headless 模式
- **状态**: 已解决（T059 — Agentic 路径传递重构）
- **发现日期**: 2026-03-24

## 维护规则

1. **谁负责更新**：PM 在 `common-session-close` Step 4 知识分类自检时检查
2. **何时更新**：
   - 遇到新的 MCP/CLI 问题时立即记录
   - 已知问题被修复时更新状态为"已解决"
3. **编号规则**：`KI-{三位数字}`，递增分配
4. **归档**：已解决超过 2 个版本的问题移至文件末尾的"已归档"章节
