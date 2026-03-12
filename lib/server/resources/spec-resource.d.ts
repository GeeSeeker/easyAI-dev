import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * 注册 spec 资源
 * 支持两种 URI 协议：
 *   1. trellis://spec/{category}/{name} — 完整路径
 *   2. spec://{category}/{name}         — 简写语法（自动展开）
 *
 * 两者读取相同的 .trellis/spec/{category}/{name}.md 文件。
 */
export declare function register(server: McpServer): void;
//# sourceMappingURL=spec-resource.d.ts.map