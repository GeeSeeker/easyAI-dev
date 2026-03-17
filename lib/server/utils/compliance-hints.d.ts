/**
 * 合规性提示类型枚举
 */
type ComplianceHintType = "missing_verification" | "unresolved_blockers" | "stale_task";
/**
 * 提示严重性
 */
type ComplianceHintSeverity = "warning" | "info";
/**
 * 合规性提示
 */
interface ComplianceHint {
    type: ComplianceHintType;
    severity: ComplianceHintSeverity;
    message: string;
}
/**
 * 生成指定任务的合规性提示列表
 *
 * 检测三种场景：
 * 1. in_progress 状态且无 dev/verification.md → missing_verification
 * 2. blockers/ 目录下有未回复的文件 → unresolved_blockers
 * 3. in_progress 状态且 updated_at 超过 24 小时 → stale_task
 *
 * @param taskId - 任务 ID
 * @returns 合规性提示数组（异常时静默降级返回空数组）
 */
declare function generateComplianceHints(taskId: string): ComplianceHint[];
export type { ComplianceHint, ComplianceHintType, ComplianceHintSeverity };
export { generateComplianceHints };
//# sourceMappingURL=compliance-hints.d.ts.map