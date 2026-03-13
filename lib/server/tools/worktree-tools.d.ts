import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * 注册 worktree_create 工具
 * 为任务创建隔离的 Git worktree
 */
export declare function registerWorktreeCreate(server: McpServer): void;
/**
 * 注册 worktree_merge 工具
 * 将 worktree 分支合并回目标分支
 *
 * 安全增强：
 * - 合并前检查主仓工作区是否干净
 * - 保存/恢复原始分支
 * - 冲突时返回冲突文件列表
 */
export declare function registerWorktreeMerge(server: McpServer): void;
/**
 * 注册 worktree_cleanup 工具
 * 清理已完成任务的 worktree
 *
 * 安全增强：
 * - 默认不删除分支（需显式 delete_branch: true）
 * - 默认不强制清理（需显式 force: true）
 * - 清理前检查 worktree 是否有未提交变更
 * - 不再 fallback 到 git branch -D 强删
 */
export declare function registerWorktreeCleanup(server: McpServer): void;
/**
 * 注册 worktree_list 工具
 * 列出所有活跃的 Git worktree 及其关联任务
 *
 * 返回结构化信息：task_id、路径、分支、HEAD、is_dirty 状态
 */
export declare function registerWorktreeList(server: McpServer): void;
//# sourceMappingURL=worktree-tools.d.ts.map