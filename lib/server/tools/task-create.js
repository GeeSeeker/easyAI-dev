import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { generateTaskId, getTaskDir, getProjectRoot, serializeTaskMd, ensureDir, } from "../utils/task-utils.js";
import { checkCapability, capabilityError } from "../utils/capability-gate.js";
import { generateTaskCreateHints } from "../utils/compliance-hints.js";
/**
 * 注册 task_create 工具
 * 创建任务目录 + task.md
 */
export function register(server) {
    server.tool("task_create", "创建新任务。生成任务 ID，创建任务目录和 task.md 文件，初始状态为 pending。assigned_to 指定任务的执行角色（pm 或 worker），非创建者角色。大多数编码/修复任务应指定 worker。", {
        title: z.string(),
        description: z.string(),
        acceptance_criteria: z.string(),
        file_scope: z.string().optional(),
        assign_strategy: z.string().optional(),
        assigned_to: z.enum(["pm", "worker"]),
    }, async ({ title, description, acceptance_criteria, file_scope, assign_strategy, assigned_to, }) => {
        try {
            // Capability Gate: task_create 仅 PM 可调用
            // 注：assigned_to 指定任务执行角色，checkCapability 验证的是调用者（必须为 pm）
            const reject = checkCapability("pm", "task_create");
            if (reject) {
                return capabilityError(reject);
            }
            const now = new Date().toISOString();
            const taskId = generateTaskId(title, assigned_to);
            // 构建任务元数据
            const metadata = {
                id: taskId,
                title: title,
                status: "pending",
                description: description,
                acceptance_criteria: acceptance_criteria,
                created_at: now,
                updated_at: now,
            };
            if (file_scope !== undefined) {
                metadata.file_scope = file_scope;
            }
            if (assign_strategy !== undefined) {
                metadata.assign_strategy = assign_strategy;
            }
            // 构建任务正文
            const body = `## 描述\n${description}\n\n## 验收标准\n${acceptance_criteria}\n\n## 执行记录\n（暂无）`;
            // 序列化为 task.md 格式
            const taskMdContent = serializeTaskMd(metadata, body);
            // 创建任务目录结构
            const taskPath = getTaskDir(taskId);
            // 检查任务目录是否已存在（防止重复创建）
            if (fs.existsSync(taskPath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务目录 ${taskId} 已存在，请检查是否重复创建`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            ensureDir(taskPath);
            ensureDir(path.join(taskPath, "dev"));
            ensureDir(path.join(taskPath, "cli"));
            // 写入 task.md
            const taskMdPath = `${taskPath}/task.md`;
            fs.writeFileSync(taskMdPath, taskMdContent, "utf-8");
            // 生成合规性提示（非阻断）
            const projectRoot = getProjectRoot();
            const complianceHints = generateTaskCreateHints(projectRoot);
            // 构建响应
            const responseData = {
                task_id: taskId,
                message: `任务 ${taskId} 已创建`,
            };
            if (complianceHints.length > 0) {
                responseData.compliance_hints = complianceHints;
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(responseData, null, 2),
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
//# sourceMappingURL=task-create.js.map