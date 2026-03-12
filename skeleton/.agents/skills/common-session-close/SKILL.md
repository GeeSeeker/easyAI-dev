---
name: common-session-close
description: 会话收尾与日志沉淀 — 汇总本会话工作、写入 journal 日志、更新任务记录。在会话结束前由 AI 自主激活。
---

# 会话收尾 & 日志沉淀

## 适用场景

任何角色（PM / Worker）在会话结束前，必须执行本 Skill 完成收尾动作。

## 触发条件

- 用户明确表示本次会话结束
- 上下文预算接近阈值，需要新开会话
- 任务执行完成，准备提交验收

## 执行步骤

### 1. 汇总本会话工作

梳理本次会话中完成的所有工作：

- 修改了哪些文件
- 完成了哪些任务/子任务步骤
- 做出了哪些关键决策
- 遇到了哪些问题及解决方案

### 2. 写入 Journal 日志

调用 MCP Tool `journal_append()`：

```
journal_append({
  date: "当天日期",
  tags: ["相关标签", "任务ID"],
  content: "## Session: {工作主题}\n\n### 完成内容\n- ...\n\n### 关键决策\n- ...\n\n### 下次对话起点\n1. 读本日志\n2. 继续 {具体后续工作}"
})
```

### 3. 更新任务执行记录

如果本会话涉及具体任务，调用 MCP Tool `task_append_log()`：

```
task_append_log({
  task_id: "T001",
  entry: "完成了 xxx，剩余 yyy 待处理"
})
```

### 4. Artifacts 文档沉淀检查

> 本质：在会话收尾时充当"最后一道提醒"，确保面向用户的有价值内容不会随会话消散。

1. **扫描本会话 Artifacts**
   - 检查本会话创建的所有 Artifacts
   - 识别面向用户的内容（排除 `task.md` 等过程性文件）

2. **列出候选沉淀内容**
   - 向用户展示候选文档列表，说明每项的建议目标路径：

   | Artifacts 类型 | 建议沉淀目标 |
   |----------------|-------------|
   | `walkthrough.md` | `.docs/notes/` 或 `.docs/guides/` |
   | `other`（分析报告等） | `.docs/notes/` 或 `.docs/design/` |
   | `implementation_plan.md` | 通常已由 `pm-brainstorm` Step 6 处理，跳过 |
   | `task.md` | 不沉淀（`.trellis/tasks/` 已持久化） |

3. **用户确认后执行**
   - 用户确认需要沉淀 → 提炼内容并写入目标路径
   - 用户确认无需沉淀 → 跳过
   - 告知用户沉淀结果

### 5. 输出恢复指引

向用户输出收尾报告和 PATEOAS 导航：

```markdown
## 本次会话已收尾

### 已沉淀

- ✅ Journal 日志已写入
- ✅ 任务记录已更新
- {✅ 文档已沉淀到 `.docs/` / ⚠️ 无需沉淀}

### PATEOAS 导航

#### 下一步行动

1. [ ] 新开会话，执行 `/pm` 恢复 PM 上下文
2. [ ] 或执行 `/worker {task_id}` 继续具体任务
3. [ ] 新会话将读取 `trellis://journal/latest` Resource 自动恢复状态

#### 状态快照

- 当前角色：{PM / Worker}
- 当前阶段：SESSION_CLOSE
- 已沉淀：Journal ✅ | 任务记录 ✅ | .docs/ {✅/⚠️ 无需沉淀}
- 遗留事项：{有/无} — {具体内容}
```

## 硬约束

- **未记日志不可收工** — 必须至少写入一条 journal 条目
- 如果 `journal_append()` 失败，手动将日志内容告知用户，请用户协助保存
