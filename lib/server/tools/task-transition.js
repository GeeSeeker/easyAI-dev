import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { getTaskDir, getArchiveDir, parseTaskMd, serializeTaskMd, isValidTransition, ensureDir, VALID_TRANSITIONS, } from "../utils/task-utils.js";
import { checkCapability, capabilityError } from "../utils/capability-gate.js";
import { generateSnapshot } from "../utils/hash-utils.js";
import { generateComplianceHints } from "../utils/compliance-hints.js";
/**
 * 注册 task_transition 工具
 * 状态机校验 + 状态转移
 */
export function register(server) {
    server.tool("task_transition", "校验状态转移合法性。转移到 under_review 时启动 Evidence Gate：拒绝 _FAIL 标记，要求每个验证类别为 _PASS 或 _NA。转移到 archived 时将任务移到归档目录。", {
        task_id: z.string(),
        new_status: z.string(),
        evidence: z.string().optional(),
        role: z.string().optional(),
    }, async ({ task_id, new_status, evidence, role }) => {
        try {
            // 拦截取消操作：cancelled 必须通过 task_cancel 工具（PM + reason 审计）
            if (new_status === "cancelled") {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: "取消任务请使用 task_cancel 工具（需 PM 角色 + 取消原因）。" +
                                    "task_transition 不允许直接转移到 cancelled 状态。",
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // Capability Gate: completed/archived/rejected 转移仅 PM 可执行
            if (new_status === "completed" ||
                new_status === "archived" ||
                new_status === "rejected") {
                let toolName;
                if (new_status === "archived") {
                    toolName = "task_transition_archived";
                }
                else {
                    // completed 和 rejected 都属于 PM 审查行为
                    toolName = "task_transition_completed";
                }
                const reject = checkCapability(role, toolName);
                if (reject) {
                    return capabilityError(reject);
                }
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
            // 校验状态转移是否合法
            if (!isValidTransition(currentStatus, new_status)) {
                const allowed = VALID_TRANSITIONS[currentStatus] || [];
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `非法的状态转移：${currentStatus} → ${new_status}。合法的转移目标为：${allowed.join(", ") || "无（终态）"}`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 如果转移到 under_review，检查 dev/verification.md 是否存在（Evidence Gate）
            if (new_status === "under_review") {
                const verificationPath = path.join(taskPath, "dev", "verification.md");
                if (!fs.existsSync(verificationPath)) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: true,
                                    message: "转移到 under_review 需要 dev/verification.md 作为验收依据（Evidence Gate）",
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
                // 检查 verification.md 是否包含所有三个验证标记（必须全部通过）
                const verificationContent = fs.readFileSync(verificationPath, "utf-8");
                // 使用正则匹配独立标记（防误匹配嵌入文本）
                const markerRegex = (m) => new RegExp(`\\b${m}\\b`);
                const requiredCategories = ["LINT", "TEST", "MANUAL"];
                const failMarkerNames = ["LINT_FAIL", "TEST_FAIL", "MANUAL_FAIL"];
                // 检查是否存在任何 FAIL 标记（显式拒绝）
                const presentFailMarkers = failMarkerNames.filter((marker) => markerRegex(marker).test(verificationContent));
                if (presentFailMarkers.length > 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: true,
                                    message: "存在验证失败标记，请修复后重试（Evidence Gate）",
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
                // 检查每个类别：必须有 PASS 或 NA 标记
                // PASS = 验证通过, NA = 不适用（由 PM 审查）
                const missingCategories = [];
                for (const cat of requiredCategories) {
                    const hasPass = markerRegex(`${cat}_PASS`).test(verificationContent);
                    const hasNa = markerRegex(`${cat}_NA`).test(verificationContent);
                    if (!hasPass && !hasNa) {
                        missingCategories.push(`${cat}_PASS 或 ${cat}_NA`);
                    }
                }
                if (missingCategories.length > 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: true,
                                    message: "转移到 under_review 需要所有验证标记通过。" +
                                        `缺少: ${missingCategories.join(", ")}。` +
                                        "（允许 _NA 标记表示不适用，由 PM 审查）",
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
                // 如果提供了 evidence 参数，追加到任务正文的执行记录中
                if (evidence) {
                    parsed.body += `\n\n## 验收证据\n${evidence}\n`;
                }
            }
            // 如果转移到 archived，将整个任务目录移到 archive/
            if (new_status === "archived") {
                const archiveDir = getArchiveDir();
                ensureDir(archiveDir);
                const archivePath = path.join(archiveDir, task_id);
                // 1. 先检查归档目录中是否已存在同名任务（防止状态污染）
                if (fs.existsSync(archivePath)) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: true,
                                    message: `归档目录中已存在任务 ${task_id}，请检查是否重复归档`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
                // 2. 移动任务目录到归档（原子操作）
                fs.renameSync(taskPath, archivePath);
                // 3. 移动成功后，读取已移动的 task.md，更新状态为 archived
                const archivedTaskMdPath = path.join(archivePath, "task.md");
                const archivedContent = fs.readFileSync(archivedTaskMdPath, "utf-8");
                const archivedParsed = parseTaskMd(archivedContent);
                const updatedMetadata = {
                    ...archivedParsed.metadata,
                    status: "archived",
                    updated_at: new Date().toISOString(),
                };
                const newContent = serializeTaskMd(updatedMetadata, archivedParsed.body);
                fs.writeFileSync(archivedTaskMdPath, newContent, "utf-8");
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                task_id: task_id,
                                previous_status: currentStatus,
                                new_status: new_status,
                                message: `任务 ${task_id} 已归档到 ${archivePath}`,
                            }, null, 2),
                        },
                    ],
                };
            }
            // Phase-Frozen：转移到 in_progress 时自动生成冻结快照（架构 §5.3）
            let snapshotInfo = { snapshot_created: false };
            if (new_status === "in_progress") {
                const snapshotResult = generateSnapshot(taskPath, "implement");
                if (snapshotResult) {
                    snapshotInfo = {
                        snapshot_created: true,
                        snapshot_path: snapshotResult.snapshotPath,
                        entries_count: snapshotResult.entriesCount,
                        frozen_at: snapshotResult.frozenAt,
                    };
                }
            }
            // 更新状态和 updated_at
            const updatedMetadata = {
                ...parsed.metadata,
                status: new_status,
                updated_at: new Date().toISOString(),
            };
            // 写回 task.md
            const newContent = serializeTaskMd(updatedMetadata, parsed.body);
            fs.writeFileSync(taskMdPath, newContent, "utf-8");
            // C5: 转移到 in_progress 或 under_review 时附加合规性提示
            const shouldIncludeHints = new_status === "in_progress" || new_status === "under_review";
            const complianceHints = shouldIncludeHints
                ? generateComplianceHints(task_id)
                : undefined;
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            task_id: task_id,
                            previous_status: currentStatus,
                            new_status: new_status,
                            message: `任务 ${task_id} 状态已从 ${currentStatus} 转移到 ${new_status}`,
                            ...snapshotInfo,
                            ...(complianceHints !== undefined
                                ? { compliance_hints: complianceHints }
                                : {}),
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            // 保留完整 stack trace 便于定位崩溃行（T010 后续修复）
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            console.error(`[task-transition] 未捕获错误: ${errorMessage}`, errorStack);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: true,
                            message: errorMessage,
                            stack: errorStack,
                        }),
                    },
                ],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=task-transition.js.map