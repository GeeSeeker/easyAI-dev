/**
 * 框架管理工具 — framework_init / framework_check / framework_update
 *
 * 让 AI 通过 MCP 工具直接执行框架初始化、检查和更新，
 * 用户无需离开 IDE，无需使用命令行。
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * 注册 framework_init 工具
 */
export declare function registerFrameworkInit(server: McpServer): void;
/**
 * 注册 framework_check 工具
 */
export declare function registerFrameworkCheck(server: McpServer): void;
/**
 * 注册 framework_update 工具（Manifest 驱动智能合并）
 */
export declare function registerFrameworkUpdate(server: McpServer): void;
//# sourceMappingURL=framework-tools.d.ts.map