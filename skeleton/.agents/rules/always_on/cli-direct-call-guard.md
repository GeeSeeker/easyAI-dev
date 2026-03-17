---
trigger: always_on
description: 禁止 AI 绕过 common-cli-dispatch 直接调用外部 CLI
---

# CLI 直接调用守卫

AI 在任何情况下，**禁止**通过 `run_command` 直接调用以下命令：

- `codex`
- `claude`
- `gemini`

**唯一合法路径**：通过 `common-cli-dispatch` Skill 的 cli-runner.js 脚本调用。

## 违规自检

如果 AI 发现自己即将使用 `run_command` 直接执行上述命令，必须：

1. **立即停止** — 不执行该命令
2. **改用标准流程** — 激活 `common-cli-dispatch` Skill
3. **记录事件** — 在当前任务日志中标注 `[CLI_GUARD_TRIGGERED]`

## 豁免场景

- 通过 `cli-runner.js` 脚本间接调用（脚本内部的 `child_process.spawn` 不受此规则约束）
- 用户在当前会话中**明确授权**直接调用特定 CLI（如调试 cli-runner.js 本身）
