---
title: 测试规范
version: 1.0.0
category: guides
status: active
---

# 测试规范

## 概述

定义 easyAI 项目的测试标准和流程。

## 测试分层

1. **单元测试**：覆盖核心逻辑和工具函数
2. **集成测试**：验证 MCP Tool 端到端行为
3. **验收测试**：通过 verification.md 三标记验证

## TDD 流程

遵循 worker-implement Skill 的 TDD 铁律：

- 🔴 RED：先写失败测试
- 🟢 GREEN：最小通过代码
- 🔵 REFACTOR：重构优化

## 属性级测试（PBT）

> Property-Based Testing：验证系统级不变量，补齐功能测试的盲区。

### 6 种属性类型

| 属性             | 含义                    | 检查方法                    | 示例                                                         |
| ---------------- | ----------------------- | --------------------------- | ------------------------------------------------------------ |
| **幂等性**       | 重复执行结果相同        | `f(f(x)) === f(x)`          | `normalizeRole(normalizeRole("PM")) === normalizeRole("PM")` |
| **往返性**       | 序列化→反序列化后值不变 | `parse(serialize(x)) === x` | `parseSimpleYaml` 解析后值类型不丢失                         |
| **交换律**       | 参数顺序不影响结果      | `f(a,b) === f(b,a)`         | 集合操作、合并操作                                           |
| **不变量保持**   | 操作后核心属性不变      | 操作前后断言恒成立          | 状态转移后 task 总数不变                                     |
| **降级安全**     | 异常输入不崩溃          | 空/畸形输入返回安全默认值   | `getConfig()` 在 config.yaml 缺失时返回 `DEFAULT_CONFIG`     |
| **状态机合法性** | 仅允许合法状态转移      | 穷举非法转移全部返回 false  | `isValidTransition("archived", "pending") === false`         |

### 编写规范

1. **标注属性**：每个属性级测试用例必须在注释中标注验证的属性类型
2. **输入生成**：优先使用边界值和典型代表值，而非随机生成
3. **布局**：属性测试与功能测试分组（如 `describe("属性测试", () => { ... })`）

### 示例

```typescript
describe("属性测试", () => {
  it("[幂等性] normalizeRole 重复调用结果不变", () => {
    const inputs = ["pm", "PM", "worker", "组长", "unknown"];
    for (const input of inputs) {
      const once = normalizeRole(input);
      const twice = normalizeRole(once ?? "");
      assert.equal(once, twice);
    }
  });

  it("[降级安全] getConfig 在配置缺失时不崩溃", () => {
    resetConfigCache();
    const config = getConfig();
    assert.ok(config.context);
    assert.ok(config.journal);
  });
});
```

## 验证标记

每次提交必须包含：

- LINT_PASS / LINT_NA
- TEST_PASS / TEST_NA
- MANUAL_PASS / MANUAL_NA
