import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { listTaskDirs, getTaskDir, parseTaskMd } from "../utils/task-utils.js";
/**
 * 注册 task_list 工具
 * 扫描 .trellis/tasks/ 目录，返回任务列表
 */
export function register(server) {
    server.tool("task_list", "列出所有活跃任务。扫描 .trellis/tasks/ 目录，读取每个任务的 task.md frontmatter，返回任务列表。可选按 status 过滤。", {
        filters: z
            .object({
            status: z.string().optional(),
        })
            .optional(),
    }, async ({ filters }) => {
        try {
            const taskDirs = listTaskDirs();
            const tasks = [];
            for (const taskDir of taskDirs) {
                const taskPath = getTaskDir(taskDir);
                const taskMdPath = path.join(taskPath, "task.md");
                // 如果 task.md 不存在则跳过
                if (!fs.existsSync(taskMdPath)) {
                    continue;
                }
                const content = fs.readFileSync(taskMdPath, "utf-8");
                const parsed = parseTaskMd(content);
                // 按 status 过滤
                if (filters?.status && parsed.metadata.status !== filters.status) {
                    continue;
                }
                tasks.push({
                    id: parsed.metadata.id,
                    title: parsed.metadata.title,
                    status: parsed.metadata.status,
                    created_at: parsed.metadata.created_at,
                    updated_at: parsed.metadata.updated_at,
                });
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ tasks }, null, 2),
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
//# sourceMappingURL=task-list.js.map