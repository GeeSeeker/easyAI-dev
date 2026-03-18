/**
 * 合规性提示类型枚举
 */
type ComplianceHintType = "missing_verification" | "unresolved_blockers" | "stale_task" | "missing_design_document";
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
/**
 * 检测项目是否缺少活跃的设计文档
 *
 * 扫描 .docs/design/{features,planning}/ 目录，排除：
 * - 以 [DONE] 开头的文件（已完成）
 * - 以 [MILESTONE] 开头的文件（里程碑总结）
 * - 非 .md 文件
 * - archive 子目录中的文件
 *
 * 若未发现活跃设计文档，返回 info 级别提示
 *
 * @param projectRoot - 项目根目录路径
 * @returns 合规性提示数组
 */
declare function checkMissingDesignDocument(projectRoot: string): ComplianceHint[];
/**
 * 为 task_create 生成合规性提示
 *
 * 目前仅检测设计文档缺失，后续可扩展其他检测场景
 *
 * @param projectRoot - 项目根目录路径
 * @returns 合规性提示数组（异常时静默降级返回空数组）
 */
declare function generateTaskCreateHints(projectRoot: string): ComplianceHint[];
export type { ComplianceHint, ComplianceHintType, ComplianceHintSeverity };
export { generateComplianceHints, checkMissingDesignDocument, generateTaskCreateHints, };
//# sourceMappingURL=compliance-hints.d.ts.map