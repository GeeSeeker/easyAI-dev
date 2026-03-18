---
name: worker-implement
description: "[Worker] TDD 编码 — 触发：Worker 接到任务开始从零编码。排除：修复已有代码的 Bug（用 worker-debug）。产出：代码 + 测试。"
produces: code_with_tests
requires: task_with_constraints
---

# 执行者实现工作流（TDD 驱动）

## 适用场景

Worker 角色开始执行任务中的编码工作时，必须激活本 Skill。

## Step 0：加载项目规范

编码前 **必须** 加载与当前任务相关的项目规范。

1. 通过 `task_get()` 获取任务的 `frozen_context`（含 context.jsonl 清单）
2. 如果有 context.jsonl：读取 `priority: "required"` 的条目（URI 格式可能是 `trellis://spec/...` 或 `spec://...`，两者等效）
3. 如果没有 context.jsonl：扫描 `.trellis/spec/guides/` 下的通用指南
4. **强制复述**：简述 1-2 条对当前任务影响最大的 spec 约束

> ⚠️ **降级策略**：若 `spec/` 目录完全为空，记录 `[SPEC_GAP]` 标记在执行记录中，
> 按任务约束集和通用编码规范继续执行，完成后提醒 PM 补充 spec。
>
> 此步骤完成后再进入 TDD 循环。

## Step 0.5：Plan Auto-Review（执行计划自动审核）

> 适用条件：当前任务 ABCDE 等级为 **A/B/C**（非 D/E）且 Worker 已生成 `implementation_plan.md`。
>
> 本步骤在 Step 0 完成后、进入 TDD 循环前执行。如果任务为 D/E 级，直接跳过本步骤。

### 0.5.1 触发 CLI 审查

1. 确认当前任务 ABCDE 等级（来自 `task.md` 路由配置 或 `common-skill-eval` Step 3 自评）
2. **D/E 级 → 跳过本步骤**，直接进入 Iron Law / TDD 循环
3. **A/B/C 级 → 激活 `common-cli-dispatch`**，使用 `--mode review` 模式审查 `implementation_plan.md`
4. Prompt 上下文应包含：约束集、验收标准、当前 plan 全文、相关 spec 摘要

### 0.5.2 裁决与免打扰推进

CLI 审查返回后，Worker 执行法官裁决（`common-cli-dispatch` Step 5）：

- **全部 `[ACCEPTED]`**：Worker 直接推进执行，不中断用户
  - 使用 `notify_user({ ShouldAutoProceed: true })` 或不调用 `notify_user`，静默进入 TDD 循环
  - 在执行记录中标注 `[PLAN_AUTO_REVIEW: PASSED]`
- **存在 `[REJECTED_CLI_ADVICE]` 但均为低风险**：Worker 自行裁决后推进
  - 需逐条记录拒绝理由，标注 `[PLAN_AUTO_REVIEW: PASSED_WITH_OVERRIDES]`
- **存在根本分歧或极高风险** → 进入 0.5.3 争议升级流程

### 0.5.3 争议升级 → Blocker 移交 PM

当 CLI 审查结果与 Worker 存在**根本分歧**（多条 Critical 级 findings 无法自裁），或变更为**极高风险**（影响框架核心 / 跨模块破坏性变更）时：

> ⚠️ **严禁交由用户裁判。** 技术分歧属于 PM 职责范畴。

1. 在 `.trellis/tasks/{task_id}/blockers/` 下创建 `{NN}-worker-question.md`
2. 文件内容包含：
   - CLI 审查结果摘要（附 findings 原文）
   - Worker 的立场与理由
   - 期望 PM 做的裁决
3. 通过 `task_append_log()` 记录 `🚧 创建 blocker: blockers/{NN}-worker-question.md — Plan 审查分歧`
4. 告知用户：「Plan 审查存在技术分歧，已创建 blocker 文件，请回 PM 会话处理」
5. **停止执行**，等待 PM 回复（`{NN}-pm-reply.md`）后再继续

**争议判定标准**：

| 信号                              | 处理方式                                                 |
| --------------------------------- | -------------------------------------------------------- |
| CLI 报告 ≥ 2 条 Critical findings | Blocker 移交 PM                                          |
| CLI 建议推翻 plan 核心架构        | Blocker 移交 PM                                          |
| CLI 建议与约束集直接冲突          | Worker 以约束集为准，标注 `[REJECTED_CLI_ADVICE]` 并推进 |
| CLI 提出优化建议（Warning/Info）  | Worker 自行裁决，采纳有价值的建议                        |

### 0.5.4 直联授权 → 向用户确认产品细节

当 Worker 在审查 plan 过程中发现 PM 初始约束集**遗漏了必要的业务细节或产品层级上下文**（需要用户拍板提供产品决策）时：

> 此情况与技术分歧有本质区别：技术问题走 PM 裁决（0.5.3），产品问题直接问用户。

**判定条件**（必须同时满足）：

1. 遗漏的信息属于**纯业务/产品决策**（如：用户体验偏好、业务流程选择、数据格式约定）
2. 该信息**不在约束集、spec、design 文档中**
3. PM 无法代替用户做此决策

**执行流程**：

1. 通过 `notify_user` 直接向用户提问，问题聚焦于具体的产品决策
2. 用户回复后，将回复内容通过 `task_append_log()` 追加到任务执行记录
3. 根据用户回复更新 plan，继续执行

> **反滥用约束**：此授权仅限「PM 遗漏的纯产品细节」。以下情况**不允许**直联用户：
>
> - 技术实现方案选择（走 PM / 自行裁决）
> - 对 CLI 审查结果的争议（走 0.5.3 blocker 流程）
> - Worker 对约束集的理解分歧（走阻塞上报协议 L3）

## Iron Law

```
没有失败测试，不准写生产代码
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

违反此规则 = 删除代码，从头开始。没有例外。

## TDD 循环：Red-Green-Refactor

每一个功能点，按以下循环执行：

### 🔴 RED — 写失败测试

1. 为当前功能点编写 **一个** 最小测试
2. 测试名必须清晰描述行为（禁止 `test1`、`test works` 等模糊命名）
3. 一次只测一个行为（名字中有"和"？拆成两个测试）
4. 优先使用真实代码，只有不可避免时才使用 mock

### 测试示例

<Good>
```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };
  const result = await retryOperation(operation);
  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```
命名清晰、测试真实行为、只测一件事
</Good>

<Bad>
```typescript
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```
命名模糊、测试 mock 而非真实代码
</Bad>

### ✅ 验证 RED — 必须看到失败

```bash
# 运行测试，确认失败
npm test path/to/test.test.ts
```

确认：

- 测试 **失败**（不是报错）
- 失败原因是功能缺失（不是拼写错误或语法错误）
- 失败消息符合预期

**测试直接通过？** 你在测试已有行为，修改测试。

### 🟢 GREEN — 写最小代码

编写 **最简单的** 代码让测试通过。

- ❌ 不要添加测试未覆盖的功能
- ❌ 不要重构其他代码
- ❌ 不要"顺便改进"
- ✅ 刚好让测试通过，仅此而已

### ✅ 验证 GREEN — 必须看到通过

```bash
# 运行测试，确认通过
npm test path/to/test.test.ts
```

确认：

- 当前测试 **通过**
- 其他测试仍然通过（无回归）
- 输出干净（无警告、无错误）

**测试失败？** 修改代码，不要修改测试。

### 🤖 CLI 委派决策（GREEN 阶段检查点）

> 每轮 GREEN 阶段**写最小代码前**，先做以下自问。满足全部条件时可将编码委派给外部 CLI。

**决策树**：

```
当前步骤是否适合委派 CLI？
│
├─ Q1: 任务边界清晰？
│   （能用一段文字完整描述输入、输出和限制条件）
│   └─ 否 → 自行编码，跳过委派
│
├─ Q2: 输入输出可序列化？
│   （约束集、目标文件路径、spec 都能写入 Prompt 传给 CLI）
│   └─ 否 → 自行编码，跳过委派
│
├─ Q3: 不需要多文件关联推理？
│   （不涉及跨模块上下文、复杂依赖链或框架全局状态）
│   └─ 否 → 自行编码，跳过委派
│
└─ 全部为「是」→ ✅ 可委派
```

**委派流程**（全部为「是」时执行）：

1. 激活 `common-cli-dispatch` Skill，使用 `--mode execute`
2. 将当前功能点的约束集、目标文件路径和相关 spec 作为 CLI 上下文
3. CLI 执行完毕后，**主控 AI 仍须执行验证 GREEN**（运行测试确认通过）
4. CLI 产出不替代 Worker 的验证责任 — 测试失败须回滚或修正

> ⚠️ **委派不等于免责**：即使委派 CLI 编码，Worker 仍对产出质量负全责。
> CLI 写入的代码必须通过当前轮次的测试验证，否则视为 GREEN 失败。

### 🔵 REFACTOR — 清理代码

测试全部通过后：

- 消除重复
- 改进命名
- 抽取辅助函数

保持测试始终绿色。不添加新行为。

### 🔁 重复

下一个功能点，写下一个失败测试。

## 原子步骤规则

每个 TDD 循环必须是"咬口大小"：

- **每步 2-5 分钟** 可完成
- 如果一步需要超过 5 分钟，说明步骤太大 — 拆分
- 每步只改一个行为点

## Red Flags — 立即停下

如果你发现自己在想：

| 借口                   | 真相                                            |
| ---------------------- | ----------------------------------------------- |
| "太简单不需要测试"     | 简单代码也会出 Bug，测试只要 30 秒              |
| "我先写完再测"         | 事后测试立即通过，证明不了任何事                |
| "先手动测了"           | 手动测试无记录、不可重复、不覆盖边界            |
| "删掉之前的代码太浪费" | 沉没成本谬误。保留未验证代码就是技术债          |
| "保留当参考"           | 你会不自觉地"适配"它。删除就是删除              |
| "先探索一下"           | 可以。但探索完要扔掉，从 TDD 重新开始           |
| "TDD 太慢了"           | TDD 比调试快。测试先行 = 务实                   |
| "这次特殊"             | 不特殊。所有这些都意味着：删掉代码，用 TDD 重来 |

### 测试反面模式

- ❌ 测试名含 "works" / "should work" — 不描述具体行为
- ❌ 过度 mock — 测试的是 mock 框架而非真实代码
- ❌ 一个测试多个断言 — 失败时无法定位
- ❌ 删了旧测试写新的 — 保护已有行为回归

## 异常处理

- **不知道怎么测？** → 先写你期望的 API 用法。断言先写。问 PM。
- **测试太复杂？** → 说明设计太复杂。简化接口。
- **必须 mock 所有东西？** → 代码耦合度太高。用依赖注入。
- **3 次修复失败？** → 激活 `worker-debug` Skill，上报 PM。

## TDD 豁免场景

以下场景可豁免 TDD 流程，但 **必须在编码前声明**（事后声明无效）：

- **纯配置 / 基础设施**：Markdown 文件、YAML 配置、`.gitignore` 等
- **自动生成代码**：schema 生成的类型定义、CLI scaffolding 产物
- **快速原型验证**：需在 task.md 约束集中由 PM 预先标注 `[TDD-EXEMPT]`

⚠️ **反规避规则**：已经写了生产代码再声明豁免 = 违规。此时必须补写测试或回滚代码。

## PATEOAS 导航

每轮 TDD 循环完成后，输出：

```markdown
### 下一步行动

1. [ ] 编写下一个功能点的失败测试
2. [ ] 运行测试验证失败（RED）
3. [ ] CLI 委派自问（Q1-Q3 决策树）
   - 3a. 全部为「是」→ 委派 CLI（`--mode execute`）→ 验证 GREEN
   - 3b. 否 → 自行编写最小通过代码 → 验证 GREEN
4. [ ] 运行测试验证通过（GREEN）
5. [ ] 重构清理

### 状态快照

- 当前角色：Worker
- 当前 Skill: worker-implement
- 当前阶段：IMPLEMENTATION
- Plan Review：{PASSED / PASSED_WITH_OVERRIDES / BLOCKED / SKIPPED(D/E)}
- TDD 循环：第 {n} 轮 / 共 {total} 个功能点
- 进度：{x}/{y} 功能点完成
```

## 完成条件

当所有约束集中的功能点都通过 TDD 循环后：

1. 激活 `worker-check` Skill 执行三标记自检
2. 生成 `dev/verification.md`
3. 不要在完成前声明"完成"——先验证，再声明

## 触发测试用例

### TC-01: 标准 TDD 循环

- **场景**: Worker 开始实现新功能
- **输入**: 任务约束集要求实现用户认证 API
- **期望行为**:
  1. Step 0 加载项目规范
  2. RED: 写失败测试 → 运行确认失败
  3. GREEN: 写最小代码 → 运行确认通过
  4. REFACTOR: 清理代码
  5. 重复直到所有功能点完成
- **验证方法**: 检查是否每个功能点都有对应的失败测试 → 通过代码的记录

### TC-02: 先写代码后补测试被拒绝

- **场景**: Worker 先写了生产代码再补写测试
- **输入**: 生产代码已存在但无对应失败测试记录
- **期望行为**: 触发 Iron Law 违规 → 要求删除代码，从 TDD 重新开始
- **验证方法**: 检查是否拒绝了事后补测试的做法

### TC-03: CLI 委派决策触发

- **场景**: Worker 在 GREEN 阶段遇到一个边界清晰的纯函数实现
- **输入**: 功能点满足所有三个委派条件（边界清晰、可序列化、无多文件推理）
- **期望行为**: 决策树三个自问全部回答「是」→ 激活 `common-cli-dispatch --mode execute` → CLI 编码 → Worker 运行测试验证通过
- **验证方法**: 检查是否执行了 Q1-Q3 自问，并在委派后仍执行了验证 GREEN

### TC-04: Plan Auto-Review 流转

- **场景**: B 级任务，Worker 生成 implementation_plan.md 后触发 CLI 审查
- **输入**: ABCDE = B，CLI 返回 1 条 Warning + 1 条 Info
- **期望行为**:
  1. Step 0.5.1 触发 CLI 审查（`--mode review`）
  2. Step 0.5.2 Worker 裁决所有 findings → 全部为低风险 → 标注 `[PLAN_AUTO_REVIEW: PASSED_WITH_OVERRIDES]`
  3. 静默推进，不中断用户
- **验证方法**: 检查执行记录中是否包含 `[PLAN_AUTO_REVIEW: PASSED_WITH_OVERRIDES]` 标记

### TC-05: Plan Auto-Review 争议升级

- **场景**: A 级任务，CLI 审查报告 3 条 Critical findings
- **输入**: ABCDE = A，CLI 结果含 ≥ 2 条 Critical 级 findings
- **期望行为**:
  1. Step 0.5.3 触发争议升级
  2. 创建 `blockers/{NN}-worker-question.md`
  3. 停止执行，告知用户转交 PM
- **验证方法**: 检查 blocker 文件是否创建 + Worker 是否停止执行

### TC-06: Plan Auto-Review 直联授权

- **场景**: Worker 发现约束集遗漏用户体验偏好（纯产品决策）
- **输入**: 约束集中无数据格式约定，spec/design 文档中也未提及
- **期望行为**:
  1. Step 0.5.4 触发直联授权
  2. 通过 `notify_user` 向用户提问具体产品决策
  3. 收到回复后 `task_append_log()` 记录并继续执行
- **验证方法**: 检查 notify_user 调用内容是否聚焦于产品决策（非技术问题）
