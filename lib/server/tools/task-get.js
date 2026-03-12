import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { getTaskDir, getArchiveDir, parseTaskMd } from "../utils/task-utils.js";
/**
 * 注册 task_get 工具
 * 返回任务完整详情
 */
export function register(server) {
    server.tool("task_get", "获取任务完整详情。返回 { metadata, body, context_entries, subtasks, dev_files, snapshot_files, frozen_context（in_progress 时自动加载冻结快照内容） }。", {
        task_id: z.string(),
    }, async ({ task_id }) => {
        try {
            let taskPath = getTaskDir(task_id);
            let taskMdPath = path.join(taskPath, "task.md");
            let fromArchive = false;
            // 如果主目录中不存在，尝试在归档目录中查找
            if (!fs.existsSync(taskMdPath)) {
                const archiveDir = getArchiveDir();
                const archivePath = path.join(archiveDir, task_id);
                const archiveTaskMdPath = path.join(archivePath, "task.md");
                if (fs.existsSync(archiveTaskMdPath)) {
                    taskPath = archivePath;
                    taskMdPath = archiveTaskMdPath;
                    fromArchive = true;
                }
            }
            // 检查 task.md 是否存在
            if (!fs.existsSync(taskMdPath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务 ${task_id} 的 task.md 文件不存在（已检查主目录和归档目录）`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 读取并解析 task.md
            const content = fs.readFileSync(taskMdPath, "utf-8");
            const parsed = parseTaskMd(content);
            // 解析 context.jsonl（如果存在）
            const contextPath = path.join(taskPath, "context.jsonl");
            let contextEntries = [];
            if (fs.existsSync(contextPath)) {
                const contextContent = fs.readFileSync(contextPath, "utf-8");
                for (const line of contextContent.split("\n")) {
                    const trimmed = line.trim();
                    if (!trimmed) {
                        continue;
                    }
                    try {
                        const entry = JSON.parse(trimmed);
                        contextEntries.push(entry);
                    }
                    catch {
                        // 跳过无法解析的行
                    }
                }
            }
            // 检查 subtasks/ 下有哪些子任务（支持目录和 .md 文件）
            const subtasksPath = path.join(taskPath, "subtasks");
            let subtasks = [];
            if (fs.existsSync(subtasksPath) &&
                fs.statSync(subtasksPath).isDirectory()) {
                const entries = fs.readdirSync(subtasksPath, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        subtasks.push({
                            id: entry.name,
                            type: "directory",
                        });
                    }
                    else if (entry.isFile() && entry.name.endsWith(".md")) {
                        subtasks.push({
                            id: entry.name.slice(0, -3), // 移除 .md 后缀
                            type: "file",
                        });
                    }
                }
            }
            // 检查 dev/ 下有哪些文件
            const devPath = path.join(taskPath, "dev");
            let devFiles = [];
            if (fs.existsSync(devPath) && fs.statSync(devPath).isDirectory()) {
                devFiles = fs.readdirSync(devPath);
            }
            // 扫描任务目录下的冻结快照文件（context-snapshot-{phase}.jsonl）
            let snapshotFiles = [];
            let frozenContext = null;
            if (fs.existsSync(taskPath)) {
                snapshotFiles = fs.readdirSync(taskPath)
                    .filter((f) => f.startsWith("context-snapshot-") && f.endsWith(".jsonl"));
                // 当任务为 in_progress 时，自动加载最近的冻结快照内容
                // 实现架构 §5.3 的 frozen manifest 恢复路径
                if (parsed.metadata.status === "in_progress" &&
                    snapshotFiles.length > 0) {
                    const latestSnapshot = snapshotFiles[snapshotFiles.length - 1];
                    const snapshotPath = path.join(taskPath, latestSnapshot);
                    try {
                        const snapshotContent = fs.readFileSync(snapshotPath, "utf-8");
                        frozenContext = snapshotContent
                            .split("\n")
                            .filter((line) => line.trim())
                            .map((line) => JSON.parse(line));
                    }
                    catch {
                        // 快照解析失败时不阻塞，仅返回文件名
                    }
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            metadata: parsed.metadata,
                            body: parsed.body,
                            from_archive: fromArchive,
                            context_entries: contextEntries,
                            subtasks: subtasks,
                            dev_files: devFiles,
                            snapshot_files: snapshotFiles,
                            ...(frozenContext
                                ? { frozen_context: frozenContext }
                                : {}),
                        }, null, 2),
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
//# sourceMappingURL=task-get.js.map