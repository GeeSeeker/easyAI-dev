# 外部 CLI 上下文：审查模式 (Review Mode)

> 本模板由 `common-cli-dispatch` Skill 组装 Prompt 时加载。
> **场景**：主控 AI（Worker/PM）请求对计划草案或交付代码进行严格验收审查。
> **目的**：客观审视产出质量，核对其是否达成验收标准。

---

## 模式守卫 (Guardrails)

当前会话目标是对具体的系统产出进行客观、冷酷的审视。
为了避免先入为主的偏见，主控 AI 的计划探索过程及执行日志已被屏蔽。你只需关注“最终产出”与“验收标准”的匹配度。

## 需求与背景 (Requirements & Context)

{requirements}

## 验收标准 (Acceptance Criteria)

{acceptance_criteria}

## 待审查产出 (Target Content)

{target_content}

## 审查指示 (Instructions)

请基于上述材料，执行极其严格的审查。请注意：

1. 逐条对照验收标准进行核实。
2. 指出潜在的逻辑错误、性能瓶颈、架构不一致以及代码规范违备。
3. 必须输出明确的结论：发现严重问题时建议「驳回」，可接受则建议「采纳」。
4. 审查结果应当具有高度可操作性，并附上修正代码片段或直接重构建议。
