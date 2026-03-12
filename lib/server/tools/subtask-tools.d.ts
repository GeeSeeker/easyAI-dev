import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * 注册 subtask_create 工具
 * 创建子任务文件 + DAG 校验
 */
export declare function registerSubtaskCreate(server: McpServer): void;
/**
 * 注册 subtask_dependency_graph 工具
 * 返回 DAG 图 + 循环检测
 */
export declare function registerSubtaskDependencyGraph(server: McpServer): void;
//# sourceMappingURL=subtask-tools.d.ts.map