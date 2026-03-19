---
title: 工具函数复用约定
version: 1.0.0
category: backend
status: active
lastUpdated: "2026-03-14"
tags:
  - mcp-server
  - utils
  - conventions
  - code-organization
dependencies:
  - backend/project-structure
---

# 工具函数复用约定

## 概述

定义 `utils/` 目录下工具函数的编写规范，包括文件内部结构、类型定义、导出方式和跨模块复用策略。

## 文件内部结构

每个 utils 文件按以下顺序组织，使用分节注释分隔：

```typescript
// ============ 常量 ============

const TRELLIS_ROOT = ".trellis";
const MAX_LINES_PER_FILE = 2000;

// ============ 类型定义 ============

type TaskStatus = "pending" | "in_progress" | ...;

interface TaskMetadata {
  id: string;
  title: string;
  // ...
}

// ============ 缓存 ============

let projectRootCache: string | null = null;

// ============ 工具函数 ============

function getProjectRoot(): string { ... }
function getTaskDir(taskId: string): string { ... }

// ============ 导出 ============

export type { TaskStatus, TaskMetadata };
export { getProjectRoot, getTaskDir, ... };
```

## 分节注释格式

使用 `// ============ {节名} ============` 格式，包括以下标准节（按出现顺序）：

1. **常量** — 模块级常量（`UPPER_SNAKE_CASE`）
2. **类型定义** — `type`、`interface`、`enum` 定义
3. **缓存**（可选）— 模块级缓存变量
4. **校验函数** / **工具函数** — 按功能组织
5. **导出** — 集中导出声明

## 常量定义

- 命名：`UPPER_SNAKE_CASE`
- 位置：文件顶部，导入语句之后
- 示例：`TRELLIS_ROOT`、`TASKS_ROOT`、`MAX_LINES_PER_FILE`、`DEFAULT_USER`

## 类型定义

- 接口使用 `interface`（可扩展的数据结构）
- 联合类型使用 `type`（有限枚举值）
- 类型名使用 `PascalCase`
- 仅挂名定义（type-only）使用 `export type { ... }` 单独导出

## 函数注释

每个函数必须携带 JSDoc 注释（中文），包含：

```typescript
/**
 * 获取项目根目录
 * 检测优先级：环境变量 → cwd 遍历 → __dirname 遍历
 * @param startDir - 起始目录
 * @returns 项目根目录的绝对路径
 */
function getProjectRoot(): string { ... }
```

## 导出方式

在文件底部集中导出，分为类型导出和值导出两部分：

```typescript
// ============ 导出 ============

export type { TaskStatus, TaskMetadata, ParsedTask };
export {
  TRELLIS_ROOT,
  TASKS_ROOT,
  getProjectRoot,
  getTaskDir,
  generateTaskId,
  parseTaskMd,
  serializeTaskMd,
  isValidTransition,
  listTaskDirs,
  ensureDir,
};
```

**禁止**：函数定义处使用 `export function`（散落导出）。
**唯一例外**：仅含一个函数的极简文件（如 `uri-utils.ts`）。

## 缓存机制

需要缓存计算结果时：

1. 模块级变量初始化为 `null`
2. 首次调用时计算并缓存
3. 提供 `reset` 函数供测试使用

```typescript
let projectRootCache: string | null = null;

function getProjectRoot(): string {
  if (projectRootCache) return projectRootCache;
  // 计算逻辑...
  projectRootCache = result;
  return result;
}

function resetProjectRootCache(): void {
  projectRootCache = null;
}
```

## 跨模块复用

| 规则             | 说明                                                 |
| ---------------- | ---------------------------------------------------- |
| Tool → Utils     | Tool 文件通过 `import` 调用 utils，禁止内联复杂逻辑  |
| Utils → Utils    | 同层引用限制为两个层级（A → B 可以，A → B → C 避免） |
| Resource → Utils | 与 Tool 同理，委托给 utils 处理                      |
| Utils 内部       | 同一 utils 文件内函数可自由互调                      |

## 安全相关工具

安全相关的校验函数集中在 `capability-gate.ts`：

- `checkCapability()` — 角色权限校验
- `normalizeRole()` — 角色名规范化
- `isValidGitRef()` — Git ref 防注入
- `capabilityError()` — 标准拒绝响应生成

安全函数的使用模式：返回 `null` 表示通过，返回 `string` 表示拒绝理由。
