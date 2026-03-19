---
title: MCP Resource 注册模式
version: 1.0.0
category: backend
status: active
lastUpdated: "2026-03-14"
tags:
  - mcp-server
  - resource
  - registration
  - uri
dependencies:
  - backend/project-structure
---

# MCP Resource 注册模式

## 概述

定义 `resources/` 目录下 MCP Resource 的标准注册模板，包括固定 URI 和模板 URI 两种模式。

## 固定 URI 模式

适用于返回全局单例数据的 Resource（如项目状态、最新日志）：

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProjectStatusData } from "../utils/status-utils.js";

/**
 * 注册 status 资源
 * URI: trellis://status
 * 返回: {返回数据的简短描述}
 */
export function register(server: McpServer): void {
  server.resource("资源中文名称", "trellis://uri-path", async () => {
    try {
      const data = getProjectStatusData();

      return {
        contents: [
          {
            uri: "trellis://uri-path",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: "trellis://uri-path",
            text: JSON.stringify({
              error: true,
              message: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
      };
    }
  });
}
```

## 模板 URI 模式

适用于需要参数化访问的 Resource（如按分类读取规范）：

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

export function register(server: McpServer): void {
  server.resource(
    "资源中文名称",
    new ResourceTemplate("trellis://domain/{param1}/{param2}", {
      list: undefined,
    }),
    async (uri: URL, variables: Record<string, string | string[]>) => {
      try {
        const param1 = extractParam(variables, "param1");
        const param2 = extractParam(variables, "param2");
        // 业务逻辑...

        return {
          contents: [{ uri: uri.href, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    },
  );
}
```

## 返回格式

| 场景 | 格式                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 成功 | `{ contents: [{ uri: string, text: JSON.stringify(data) }] }`                          |
| 错误 | `{ contents: [{ uri: string, text: JSON.stringify({ error: true, message: ... }) }] }` |

**注意**：Resource 的错误返回 **不包含** `isError` 字段（与 Tool 不同），仅通过 `contents[0].text` 中的 `error: true` 标识。

## Resource Name 规范

- 使用中文命名（如 `"项目状态"`、`"最新日志"`、`"规格文档"`）
- 名称应简洁（2-4 个汉字），表达资源类型

## URI 协议

| 协议         | 用途                                    | 示例                                                   |
| ------------ | --------------------------------------- | ------------------------------------------------------ |
| `trellis://` | 完整路径（标准协议）                    | `trellis://status`, `trellis://spec/{category}/{name}` |
| `spec://`    | 简写语法（等价于 `trellis://spec/...`） | `spec://{category}/{name}`                             |

支持双 URI 时，抽取共享 handler 工厂函数避免重复代码。

## 安全防护

模板 URI 的 Resource **必须** 包含路径遍历防护：

1. **参数校验**：拒绝包含 `..`、`/`、`\` 的参数
2. **路径解析后二次校验**：`path.resolve()` 后确认路径仍在目标目录内
3. **辅助函数**：抽取 `extractParam()` 安全提取变量值

```typescript
// 路径遍历防护示例
if (
  category.includes("..") ||
  category.includes("/") ||
  name.includes("..") ||
  name.includes("/")
) {
  return {
    contents: [
      { uri, text: JSON.stringify({ error: true, message: "非法路径" }) },
    ],
  };
}
```
