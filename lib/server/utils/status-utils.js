import * as fs from "node:fs";
import * as path from "node:path";
import { getGitBranch, getGitStatus, getRecentCommits } from "./git-utils.js";
import { listTaskDirs, getTaskDir, parseTaskMd } from "./task-utils.js";
import { getLatestEntries } from "./journal-utils.js";
import { generateComplianceHints } from "./compliance-hints.js";
// ============ 工具函数 ============
/**
 * 获取项目状态数据
 * @param commitCount - 获取的 Git 提交数量，默认为 5
 * @param journalCount - 获取的日志条目数量，默认为 3
 * @returns 项目状态数据
 */
export function getProjectStatusData(commitCount = 5, journalCount = 3) {
    // Git 信息
    const gitInfo = {
        branch: getGitBranch(),
        status: getGitStatus() || "clean",
        recent_commits: getRecentCommits(commitCount).map((c) => ({
            hash: c.hash.substring(0, 8),
            message: c.message,
            date: c.date,
            author: c.author,
        })),
    };
    // 任务列表
    const taskDirs = listTaskDirs();
    const tasks = [];
    for (const taskDir of taskDirs) {
        const taskPath = getTaskDir(taskDir);
        const taskMdPath = path.join(taskPath, "task.md");
        if (fs.existsSync(taskMdPath)) {
            const content = fs.readFileSync(taskMdPath, "utf-8");
            const parsed = parseTaskMd(content);
            tasks.push({
                id: parsed.metadata.id,
                title: parsed.metadata.title,
                status: parsed.metadata.status,
            });
        }
    }
    // 活跃任务（排除已完成、已归档和已取消）
    const activeTasks = tasks.filter((t) => t.status !== "completed" &&
        t.status !== "archived" &&
        t.status !== "cancelled");
    // C7: 为活跃任务附加合规性提示计数
    let complianceHintTotal = 0;
    for (const task of activeTasks) {
        const hints = generateComplianceHints(task.id);
        task.hint_count = hints.length;
        complianceHintTotal += hints.length;
    }
    // 计算按状态分组的任务计数
    const byStatus = {};
    for (const task of tasks) {
        byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    }
    // 最新日志
    const latestJournalEntries = getLatestEntries(journalCount);
    const journalSummary = {
        latest_count: latestJournalEntries.length,
        entries: latestJournalEntries.map((entry) => ({
            date: entry.date,
            tags: entry.tags,
            content: entry.content.substring(0, 100) +
                (entry.content.length > 100 ? "..." : ""),
        })),
    };
    return {
        git: gitInfo,
        tasks: {
            total: tasks.length,
            active: activeTasks.length,
            by_status: byStatus,
            active_tasks: activeTasks,
            compliance_hint_total: complianceHintTotal,
        },
        journal: journalSummary,
    };
}
//# sourceMappingURL=status-utils.js.map