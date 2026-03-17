# 外部 CLI 审查 Prompt 模板

> 本模板由 `common-cli-dispatch` Skill 在 Step 2 中使用。
> AI 读取本模板后填充变量，写入 `.tmp/cli-dispatch/prompt-{timestamp}.md`。

---

## 任务信息

- **任务 ID**：{task_id}
- **审查模式**：review

## 上下文

{context}

## 约束集

{constraints}

## 审查维度

{review_dimensions}

## 输出要求

请严格按以下 JSON 格式输出审查结果：

```json
{output_format}
```

输出说明：

- `severity`：问题严重程度（`Critical` / `Warning` / `Info`）
- `dimension`：审查维度（`spec` / `quality` / `patterns` / `security`）
- `description`：问题描述（中文）
- `fix_suggestion`：修复建议（中文）
- `passed_checks`：已通过的检查项列表
- `summary`：总体评估（中文）

## 注意事项

- 不要修改项目源代码，只提供分析报告
- 输出语言：中文
- 两个 CLI 的输入互不可见，确保独立判断
