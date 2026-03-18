# 🚀 快速上手：从安装到第一个需求

> **预计阅读时间**：10 分钟 | **目标**：完成 easyAI 安装，并交付你的第一个需求

---

## 1. easyAI 是什么？

easyAI 是一个在 [Antigravity IDE](https://antigravity.google/) 中运行的 **AI 协作开发框架**。

你不需要写代码 — easyAI 会组建一支 AI 团队为你工作：

- **PM（项目经理）**：和你对话，理解需求，拆分任务
- **Worker（执行者）**：写代码、跑测试、提交成果

你的角色就是**客户**：提需求 → 审批方案 → 验收成果。

---

## 2. 准备工作

你需要安装两样东西：

### Antigravity IDE

easyAI 专为 Antigravity IDE 设计。前往 [antigravity.google](https://antigravity.google/) 下载安装。

### Node.js

easyAI 的 MCP Server 需要 Node.js 运行。

```bash
# 检查是否已安装
node --version  # 需要 >= 18

# 如未安装，前往 https://nodejs.org/ 下载
```

---

## 3. 安装 easyAI

### 推荐方式：让 AI 帮你安装

打开 Antigravity IDE，在对话框中粘贴：

```text
请帮我安装 easyAI 框架。
安装指南：https://raw.githubusercontent.com/GeeSeeker/easyAI-dev/main/README_AI.md
请读取这份指南，按步骤自动完成配置。
```

AI 会自动完成所有配置。等它提示你重启 IDE 后，重启即可。

### 手动安装

如果你更喜欢自己动手：

```bash
# 创建新项目
npx @geeseeker/easyai-dev init my-project
cd my-project
```

然后将 MCP 配置写入 `~/.gemini/antigravity/mcp_config.json`：

```json
{
  "easyai-mcp-server": {
    "command": "npx",
    "args": ["-y", "@geeseeker/easyai-dev", "serve"],
    "env": {
      "EASYAI_PROJECT_ROOT": "/你的项目绝对路径/my-project"
    }
  }
}
```

重启 IDE。

---

## 4. 第一次对话：和 PM 聊天

安装完成后，在 Antigravity IDE 中打开你的项目，输入：

```text
/actor-pm
```

PM 会自动启动，获取项目状态，然后向你报告：

```text
我是 easyAI 的 PM。我将负责管理项目任务、与你确认需求、
拆分任务给执行者、并验收他们的产出。

## 项目状态快照
- 分支: main
- 活跃任务: 0 个
- 当前无活跃任务，可以开始新需求
```

现在，试着告诉 PM 你想做什么。比如：

```text
我想做一个待办事项应用，能添加和删除待办项。
```

---

## 5. PM 的工作流程

PM 收到你的需求后，会执行以下流程（你只需等待和审批）：

### 第一步：需求发散

PM 会像一个专业产品经理一样**向你提问**，帮你把模糊的想法变成清晰的设计：

- 「待办项需要什么字段？标题、描述、截止日期？」
- 「需要优先级排序吗？」
- 「数据存储用什么方案？」

### 第二步：生成设计文档

讨论完成后，PM 会将你们的共识写成设计文档，存放在 `.docs/design/` 目录下。

### 第三步：拆分任务

PM 会将设计拆分为**具体的开发任务**，每个任务包含：

- 精确的**约束集**（Worker 必须遵守的规则）
- 明确的**验收标准**（怎样才算完成）
- **文件范围**（需要修改哪些文件）

PM 会将任务拆分结果展示给你，等你审批。

---

## 6. 让 Worker 干活

任务创建完成后，PM 会告诉你下一步操作。你需要**开启一个新的对话**，输入：

```text
/actor-worker T001
```

> `T001` 是任务 ID，PM 会告诉你具体的 ID。

Worker 会：

1. 读取任务的约束集和验收标准
2. 按 **TDD（测试驱动开发）** 编写代码：先写测试 → 再写实现
3. 完成后进行**三标记自检**（代码检查 ✅、测试通过 ✅、手动验证 ✅）
4. 提交验收

整个过程**无需你干预**，Worker 会自动完成。

---

## 7. 验收成果

Worker 完成后，回到 PM 对话，PM 会进行**三阶段审查**：

1. **规范合规**：代码是否符合项目规范
2. **代码质量**：逻辑是否正确、边界是否处理
3. **文档沉淀**：重要发现是否已记录

审查通过后，PM 会用非技术语言向你汇报成果：

```text
✅ 任务 T001 验收通过！

你现在拥有了一个待办事项应用的基础功能：
- 可以添加新的待办事项
- 可以删除已完成的待办事项
- 数据保存在本地 JSON 文件中
```

---

## 8. 下一步

恭喜！你已经使用 easyAI 完成了第一个需求的交付。接下来：

- 📖 [**核心概念**](core-concepts.md) — 深入了解框架的五层架构、设计哲学、质量保障体系
- 📋 [**工作流实战指南**](workflow-guide.md) — PM/Worker 操作手册、配置定制、常见问题

---

<p align="center">
  <sub>easyAI — 让用户以纯客户的视角进行软件开发</sub>
</p>
