import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * 注册 worktree_create 工具
 * 为任务创建隔离的 Git worktree
 */
export declare function registerWorktreeCreate(server: McpServer): void;
/**
 * 注册 worktree_merge 工具
 * 将 worktree 分支合并回目标分支
 */
export declare function registerWorktreeMerge(server: McpServer): void;
/**
 * 注册 worktree_cleanup 工具
 * 清理已完成任务的 worktree
 */
export declare function registerWorktreeCleanup(server: McpServer): void;
//# sourceMappingURL=worktree-tools.d.ts.map