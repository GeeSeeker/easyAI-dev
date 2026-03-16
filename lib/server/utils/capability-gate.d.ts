/**
 * 角色类型
 */
type Role = "pm" | "组长" | "组员" | "worker";
/**
 * 受限工具名称
 */
type RestrictedTool = "task_create" | "task_transition_completed" | "task_transition_archived" | "task_cancel" | "subtask_create" | "subtask_dependency_graph" | "conflict_check" | "worktree_create" | "worktree_merge" | "worktree_cleanup" | "worktree_list";
/**
 * 角色权限矩阵（来自 architecture §7.1）
 *
 * true = 允许, false = 拒绝
 */
declare const CAPABILITY_MATRIX: Record<RestrictedTool, Record<Role, boolean>>;
/**
 * 校验角色是否有权调用指定工具
 *
 * ⚠️ 诚实的局限性说明（architecture §7.1）：
 * - 角色来源：AI 在 Workflow 触发时自行解析用户输入并写入 Artifacts
 * - 信任模型：MCP Server 信任 AI 传入的 role 参数，无法独立验证 AI 角色
 * - 防护强度：可防止"无意越权"，无法防止"故意越权"
 *
 * @param role - 调用者角色（未提供时拒绝受限操作）
 * @param toolName - 受限工具名称
 * @returns null 表示通过，string 表示拒绝理由
 */
declare function checkCapability(role: string | undefined, toolName: RestrictedTool): string | null;
/**
 * 规范化角色名（支持多种写法）
 */
declare function normalizeRole(role: string | undefined | null): Role | null;
/**
 * 校验 Git ref 名称是否合法（防注入）
 * @param ref - 分支名或标签名
 * @returns true 表示合法
 */
declare function isValidGitRef(ref: string): boolean;
/**
 * 生成 Capability Gate 拒绝的标准 MCP 错误响应
 */
declare function capabilityError(rejectReason: string): {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
};
export type { Role, RestrictedTool };
export { CAPABILITY_MATRIX, checkCapability, normalizeRole, isValidGitRef, capabilityError, };
//# sourceMappingURL=capability-gate.d.ts.map