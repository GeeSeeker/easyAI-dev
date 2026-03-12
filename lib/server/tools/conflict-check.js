import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { listTaskDirs, getTasksDir, parseTaskMd, } from "../utils/task-utils.js";
import { checkCapability, capabilityError } from "../utils/capability-gate.js";
// ============ 辅助函数 ============
/**
 * 简易 glob 匹配（支持 * 和 ** 通配符）
 * - `*` 匹配不含 `/` 的任意字符
 * - `**` 匹配包含 `/` 的任意路径
 * @param pattern - glob 模式
 * @param filePath - 待匹配的文件路径
 * @returns 是否匹配
 */
function globMatch(pattern, filePath) {
    // 规范化路径分隔符
    const normalizedPattern = pattern.replace(/\\/g, "/");
    const normalizedPath = filePath.replace(/\\/g, "/");
    // 精确匹配
    if (normalizedPattern === normalizedPath) {
        return true;
    }
    // 将 glob 模式转换为正则表达式
    // 顺序关键：占位符 → 转义 → 单字符通配 → GLOBSTAR 展开
    let regexStr = normalizedPattern
        // ** 先标记为占位符（必须在转义前处理）
        .replace(/\*\*/g, "§GLOBSTAR§")
        // 转义正则特殊字符（除了 * 和 ?）
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        // * 匹配不含 / 的任意字符（必须在 GLOBSTAR 展开前）
        .replace(/\*/g, "[^/]*")
        // ? 匹配单个非 / 字符（必须在 GLOBSTAR 展开前）
        .replace(/\?/g, "[^/]")
        // §GLOBSTAR§/ → (.*/)?（零或多层目录）
        .replace(/§GLOBSTAR§\//g, "(.*/)?")
        // 尾部 §GLOBSTAR§ → .*（匹配任意路径）
        .replace(/§GLOBSTAR§/g, ".*");
    regexStr = `^${regexStr}$`;
    try {
        const regex = new RegExp(regexStr);
        return regex.test(normalizedPath);
    }
    catch {
        // 正则构建失败时回退为精确匹配
        return normalizedPattern === normalizedPath;
    }
}
/**
 * 解析 file_scope 字符串为文件路径列表
 * 支持逗号分隔和换行分隔
 * @param fileScope - file_scope 字段的值
 * @returns 文件路径/glob 模式列表
 */
function parseFileScope(fileScope) {
    if (!fileScope)
        return [];
    return fileScope
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
// ============ 注册函数 ============
/**
 * 注册 conflict_check 工具
 * 文件范围重叠检测（架构 §4.2）
 */
export function register(server) {
    server.tool("conflict_check", "检测文件范围与现有活跃任务的重叠冲突。" +
        "在 PM 创建新任务前调用，防止多个任务修改同一文件导致合并冲突。" +
        "返回冲突报告（冲突文件 + 涉及任务 ID + 建议）。", {
        files: z
            .array(z.string())
            .min(1)
            .describe("待检查的文件路径列表（相对于项目根，支持 glob 模式，" +
            "如 src/auth/*.ts）"),
        tasks: z
            .array(z.string())
            .optional()
            .describe("可选的任务 ID 列表（不指定则检查所有活跃任务）"),
        role: z
            .string()
            .optional()
            .describe("调用者角色（pm / 组长）"),
    }, async ({ files, tasks, role }) => {
        // Capability Gate 校验（PM + 组长）
        const rejectReason = checkCapability(role, "conflict_check");
        if (rejectReason) {
            return capabilityError(rejectReason);
        }
        try {
            const conflicts = [];
            const tasksDir = getTasksDir();
            // 获取要检查的任务列表
            let taskDirNames;
            if (tasks && tasks.length > 0) {
                // 校验任务 ID 安全性（复用项目统一的路径穿越防护）
                for (const taskId of tasks) {
                    if (taskId.includes("..") ||
                        taskId.includes("/") ||
                        taskId.includes("\\")) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        error: true,
                                        message: `非法的任务 ID: ${taskId}`,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                }
                taskDirNames = tasks;
            }
            else {
                // 检查所有任务目录
                taskDirNames = listTaskDirs();
            }
            // 活跃状态（排除已完成/已归档/已取消）
            const ACTIVE_STATUSES = new Set([
                "pending",
                "in_progress",
                "under_review",
                "rejected",
            ]);
            let checkedTaskCount = 0;
            for (const taskDirName of taskDirNames) {
                const taskMdPath = path.join(tasksDir, taskDirName, "task.md");
                // 跳过没有 task.md 的目录
                if (!fs.existsSync(taskMdPath))
                    continue;
                const content = fs.readFileSync(taskMdPath, "utf-8");
                // 复用项目统一的 frontmatter 解析器（DRY）
                const { metadata } = parseTaskMd(content);
                // 只检查活跃状态的任务
                if (!ACTIVE_STATUSES.has(metadata.status))
                    continue;
                checkedTaskCount++;
                const taskFiles = parseFileScope(metadata.file_scope || "");
                if (taskFiles.length === 0)
                    continue;
                // 检查每个输入文件是否与任务文件范围冲突
                for (const inputFile of files) {
                    for (const taskFile of taskFiles) {
                        // 双向 glob 匹配：
                        // 1. 输入文件匹配任务的 glob 模式
                        // 2. 任务文件匹配输入的 glob 模式
                        const inputMatchesTask = globMatch(taskFile, inputFile);
                        const taskMatchesInput = globMatch(inputFile, taskFile);
                        if (inputMatchesTask || taskMatchesInput) {
                            conflicts.push({
                                file: inputFile,
                                conflicting_task: taskDirName,
                                task_title: metadata.title || taskDirName,
                                task_status: metadata.status,
                                overlap_type: inputFile === taskFile ? "exact" : "glob",
                            });
                        }
                    }
                }
            }
            // 去重（同一文件 + 同一任务只报告一次）
            const uniqueConflicts = deduplicateConflicts(conflicts);
            // 生成建议
            const advice = generateAdvice(uniqueConflicts);
            const report = {
                has_conflicts: uniqueConflicts.length > 0,
                conflicts: uniqueConflicts,
                checked_files: files.length,
                checked_tasks: checkedTaskCount,
                advice,
            };
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(report, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: true,
                            message: error instanceof Error ? error.message : String(error),
                        }),
                    },
                ],
                isError: true,
            };
        }
    });
}
// ============ 辅助函数 ============
/**
 * 去重冲突记录（同一文件 + 同一任务只保留一条）
 */
function deduplicateConflicts(conflicts) {
    const seen = new Set();
    return conflicts.filter((c) => {
        const key = `${c.file}::${c.conflicting_task}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
/**
 * 根据冲突情况生成建议
 */
function generateAdvice(conflicts) {
    if (conflicts.length === 0) {
        return "✅ 未检测到文件范围冲突，可以安全创建任务。";
    }
    const taskCount = new Set(conflicts.map((c) => c.conflicting_task)).size;
    const lines = [
        `⚠️ 检测到 ${conflicts.length} 个文件冲突，` +
            `涉及 ${taskCount} 个现有任务。建议：`,
    ];
    // 分析冲突类型给出具体建议
    const inProgressConflicts = conflicts.filter((c) => c.task_status === "in_progress");
    const pendingConflicts = conflicts.filter((c) => c.task_status === "pending");
    if (inProgressConflicts.length > 0) {
        lines.push("1. 执行中的任务有文件冲突 → " +
            "建议使用 worktree_create() 物理隔离 " +
            "或建立任务依赖（等前序任务完成）");
    }
    if (pendingConflicts.length > 0) {
        lines.push(`${inProgressConflicts.length > 0 ? "2" : "1"}. ` +
            "待分配的任务有文件冲突 → " +
            "建议调整文件范围避开冲突 " +
            "或合并为同一任务");
    }
    return lines.join("\n");
}
//# sourceMappingURL=conflict-check.js.map