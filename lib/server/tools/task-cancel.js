import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { getTaskDir, parseTaskMd, serializeTaskMd, isValidTransition, } from "../utils/task-utils.js";
import { checkCapability, capabilityError } from "../utils/capability-gate.js";
/**
 * 注册 task_cancel 工具
 * 取消任务
 */
export function register(server) {
    server.tool("task_cancel", "取消任务。校验状态转移合法性后，将任务状态更新为 cancelled，并在 task.md 末尾追加取消原因和取消时间。", {
        task_id: z.string(),
        reason: z.string().trim().min(1, "取消原因不能为空"),
        role: z.string().optional(),
    }, async ({ task_id, reason, role }) => {
        try {
            // Capability Gate: task_cancel 仅 PM 可调用
            const reject = checkCapability(role, "task_cancel");
            if (reject) {
                return capabilityError(reject);
            }
            const taskPath = getTaskDir(task_id);
            const taskMdPath = path.join(taskPath, "task.md");
            // 检查 task.md 是否存在
            if (!fs.existsSync(taskMdPath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务 ${task_id} 的 task.md 文件不存在`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 读取并解析 task.md
            const content = fs.readFileSync(taskMdPath, "utf-8");
            const parsed = parseTaskMd(content);
            const currentStatus = parsed.metadata.status;
            // 校验是否可以取消
            if (!isValidTransition(currentStatus, "cancelled")) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务当前状态为 ${currentStatus}，不允许取消`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 准备取消时间和取消内容
            const cancelTime = new Date().toISOString();
            const cancelSection = `\n\n## 取消原因\n${reason}\n\n取消时间：${cancelTime}`;
            // 更新状态和 updated_at
            const updatedMetadata = {
                ...parsed.metadata,
                status: "cancelled",
                updated_at: cancelTime,
            };
            // 在 body 末尾追加取消信息
            const newBody = parsed.body + cancelSection;
            // 写回 task.md
            const newContent = serializeTaskMd(updatedMetadata, newBody);
            fs.writeFileSync(taskMdPath, newContent, "utf-8");
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            task_id: task_id,
                            previous_status: currentStatus,
                            new_status: "cancelled",
                            reason: reason,
                            cancelled_at: cancelTime,
                            message: `任务 ${task_id} 已取消`,
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
//# sourceMappingURL=task-cancel.js.map