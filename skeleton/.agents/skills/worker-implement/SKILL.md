---
name: worker-implement
description: 执行者实现工作流 — TDD 铁律驱动的编码流程。在 Worker 开始实现任务时由 Workflow 激活。所有新功能、Bug 修复、行为变更必须走 TDD 流程。
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
3. [ ] 编写最小通过代码
4. [ ] 运行测试验证通过（GREEN）
5. [ ] 重构清理

### 状态快照

- 当前角色：Worker
- 当前阶段：IMPLEMENTATION
- TDD 循环：第 {n} 轮 / 共 {total} 个功能点
- 进度：{x}/{y} 功能点完成
```

## 完成条件

当所有约束集中的功能点都通过 TDD 循环后：

1. 激活 `worker-check` Skill 执行三标记自检
2. 生成 `dev/verification.md`
3. 不要在完成前声明"完成"——先验证，再声明
