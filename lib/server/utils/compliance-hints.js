import * as fs from "node:fs";
import * as path from "node:path";
import { getTaskDir, parseTaskMd } from "./task-utils.js";
// ============ 常量 ============
/** 任务被视为停滞的阈值（毫秒），24 小时 */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
// ============ 工具函数 ============
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
function generateComplianceHints(taskId) {
    try {
        const taskPath = getTaskDir(taskId);
        const taskMdPath = path.join(taskPath, "task.md");
        // 任务不存在则返回空数组
        if (!fs.existsSync(taskMdPath)) {
            return [];
        }
        const content = fs.readFileSync(taskMdPath, "utf-8");
        const parsed = parseTaskMd(content);
        const hints = [];
        // 检测 1: in_progress 且无 verification.md
        checkMissingVerification(taskPath, parsed.metadata, hints);
        // 检测 2: blockers 目录中有未回复的问题
        checkUnresolvedBlockers(taskPath, hints);
        // 检测 3: in_progress 且 updated_at 超过 24 小时
        checkStaleTask(parsed.metadata, hints);
        return hints;
    }
    catch (error) {
        // C12: 异常时静默降级，不阻断主流程
        console.error(`[compliance-hints] 生成合规提示失败 (${taskId}):`, error instanceof Error ? error.message : String(error));
        return [];
    }
}
/**
 * 检测 in_progress 状态下是否缺少 verification.md
 */
function checkMissingVerification(taskPath, metadata, hints) {
    if (metadata.status !== "in_progress") {
        return;
    }
    const verificationPath = path.join(taskPath, "dev", "verification.md");
    if (!fs.existsSync(verificationPath)) {
        hints.push({
            type: "missing_verification",
            severity: "warning",
            message: "⚠️ 任务处于 in_progress 状态但尚未生成 dev/verification.md。" +
                "完成编码后请运行 worker-check 生成验证报告。",
        });
    }
}
/**
 * 检测 blockers 目录中是否有未回复的问题
 */
function checkUnresolvedBlockers(taskPath, hints) {
    const blockersPath = path.join(taskPath, "blockers");
    if (!fs.existsSync(blockersPath) ||
        !fs.statSync(blockersPath).isDirectory()) {
        return;
    }
    const files = fs.readdirSync(blockersPath);
    const questionFiles = files.filter((f) => f.endsWith("-question.md"));
    // 对每个 question 文件检查是否有对应的 pm-reply
    const unresolvedQuestions = [];
    for (const qFile of questionFiles) {
        // 提取编号：如 01-worker-question.md → 01
        const match = qFile.match(/^(\d+)-/);
        if (!match) {
            continue;
        }
        const number = match[1];
        const hasReply = files.some((f) => f.startsWith(`${number}-`) && f.includes("pm-reply"));
        if (!hasReply) {
            unresolvedQuestions.push(qFile);
        }
    }
    if (unresolvedQuestions.length > 0) {
        hints.push({
            type: "unresolved_blockers",
            severity: "warning",
            message: `⚠️ 存在 ${unresolvedQuestions.length} 个未回复的阻塞问题：` +
                `${unresolvedQuestions.join(", ")}。` +
                "请 PM 在 blockers/ 目录下创建对应的 {编号}-pm-reply.md 回复文件。",
        });
    }
}
/**
 * 检测 in_progress 状态下任务是否停滞超过 24 小时
 */
function checkStaleTask(metadata, hints) {
    if (metadata.status !== "in_progress") {
        return;
    }
    const updatedAt = new Date(metadata.updated_at).getTime();
    const now = Date.now();
    if (now - updatedAt > STALE_THRESHOLD_MS) {
        const hoursAgo = Math.round((now - updatedAt) / (60 * 60 * 1000));
        hints.push({
            type: "stale_task",
            severity: "info",
            message: `ℹ️ 任务已在 in_progress 状态停留 ${hoursAgo} 小时（超过 24 小时阈值）。` +
                "请检查是否需要继续推进或暂停任务。",
        });
    }
}
export { generateComplianceHints };
//# sourceMappingURL=compliance-hints.js.map