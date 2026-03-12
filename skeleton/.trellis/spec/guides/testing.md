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

## 验证标记

每次提交必须包含：
- LINT_PASS / LINT_NA
- TEST_PASS / TEST_NA
- MANUAL_PASS / MANUAL_NA
