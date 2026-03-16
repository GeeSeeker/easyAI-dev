# Layer 4 · 用户体验层（User Experience）

> 用户可感知的交付闭环 — 从提需求到收成果的完整体验。

## 层级定位

用户体验层是框架的**最上层**，定义用户与 AI 交互的完整体验。用户不需要了解下层的技术细节，只需提需求、审批方案、验收结果。

## 包含节点

| 节点                 | 描述                                      |
| -------------------- | ----------------------------------------- |
| requirement-delivery | 需求交付闭环 — 从提需求到验收成果         |
| session-management   | 会话管理 — 启动恢复、跨会话记忆、收尾沉淀 |
| artifact-pipeline    | 文档沉淀管道 — Artifacts → .docs/ 持久化  |

## 层间关联

- **向下依赖** → Layer 3 的 PM/Worker 工作流提供具体执行能力
- **向上服务** → 直接服务用户（最上层，无更高层级）
- **横向协作** → requirement-delivery 驱动 session-management 的会话切换，artifact-pipeline 在各阶段沉淀产物
