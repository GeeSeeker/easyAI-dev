// ============ 类型定义 ============
/**
 * 角色权限矩阵（来自 architecture §7.1）
 *
 * true = 允许, false = 拒绝
 */
const CAPABILITY_MATRIX = {
    task_create: { pm: true, 组长: false, 组员: false, worker: false },
    task_transition_completed: {
        pm: true,
        组长: false,
        组员: false,
        worker: false,
    },
    task_transition_archived: {
        pm: true,
        组长: false,
        组员: false,
        worker: false,
    },
    task_cancel: { pm: true, 组长: false, 组员: false, worker: false },
    subtask_create: { pm: false, 组长: true, 组员: false, worker: false },
    subtask_dependency_graph: {
        pm: true,
        组长: true,
        组员: false,
        worker: false,
    },
    conflict_check: { pm: true, 组长: true, 组员: false, worker: false },
    worktree_create: { pm: true, 组长: false, 组员: false, worker: false },
    worktree_merge: { pm: true, 组长: false, 组员: false, worker: false },
    worktree_cleanup: { pm: true, 组长: false, 组员: false, worker: false },
    worktree_list: { pm: true, 组长: true, 组员: true, worker: true },
};
// ============ 校验函数 ============
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
function checkCapability(role, toolName) {
    // 受限工具必须提供角色参数
    if (!role) {
        return (`调用 ${toolName} 需要提供 role 参数。` +
            "请在 Workflow 触发时传入角色标识（pm / 组长 / 组员 / worker）。" +
            "（Capability Gate, architecture §7.1）");
    }
    // 规范化角色名
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
        return `未识别的角色: "${role}"。合法角色: pm, 组长, 组员, worker`;
    }
    // 查询权限矩阵
    const toolPermissions = CAPABILITY_MATRIX[toolName];
    if (!toolPermissions) {
        // 非受限工具，不做限制
        return null;
    }
    if (!toolPermissions[normalizedRole]) {
        const allowedRoles = Object.entries(toolPermissions)
            .filter(([, allowed]) => allowed)
            .map(([r]) => r);
        return (`角色"${normalizedRole}"无权调用 ${toolName}。` +
            ` 允许的角色: ${allowedRoles.join(", ")}。` +
            "（Capability Gate, architecture §7.1）");
    }
    return null;
}
/**
 * 规范化角色名（支持多种写法）
 */
function normalizeRole(role) {
    const lower = role.toLowerCase().trim();
    // PM 角色
    if (lower === "pm" || lower === "项目经理" || lower === "project_manager") {
        return "pm";
    }
    // 组长
    if (lower === "组长" || lower === "leader" || lower === "team_lead") {
        return "组长";
    }
    // 组员（支持 "组员", "组员A", "组员1" 等变体）
    if (lower.startsWith("组员") ||
        lower === "member" ||
        lower === "team_member" ||
        /^组员\d+$/.test(lower)) {
        return "组员";
    }
    // Worker / 独立执行者
    if (lower === "worker" ||
        lower === "独立执行者" ||
        lower === "执行者" ||
        lower === "executor") {
        return "worker";
    }
    return null;
}
/**
 * 校验 Git ref 名称是否合法（防注入）
 * @param ref - 分支名或标签名
 * @returns true 表示合法
 */
function isValidGitRef(ref) {
    // 禁止空字符串
    if (!ref || ref.trim() === "")
        return false;
    // 禁止包含 shell 特殊字符
    if (/[;&|`$(){}[\]!'"\\<>]/.test(ref))
        return false;
    // 禁止路径遍历
    if (ref.includes(".."))
        return false;
    // 禁止以 - 开头（防止被解析为命令行参数）
    if (ref.startsWith("-"))
        return false;
    // 禁止空格和控制字符
    if (/[\s\x00-\x1f\x7f]/.test(ref))
        return false;
    return true;
}
/**
 * 生成 Capability Gate 拒绝的标准 MCP 错误响应
 */
function capabilityError(rejectReason) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    error: true,
                    gate: "capability",
                    message: rejectReason,
                }),
            },
        ],
        isError: true,
    };
}
export { CAPABILITY_MATRIX, checkCapability, normalizeRole, isValidGitRef, capabilityError, };
//# sourceMappingURL=capability-gate.js.map