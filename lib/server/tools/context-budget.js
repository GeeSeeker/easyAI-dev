import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { getTaskDir } from "../utils/task-utils.js";
import { parseContextJsonl, resolveUriToPath, checkStale, } from "../utils/hash-utils.js";
import { getConfig } from "../utils/config-loader.js";
// ============ 常量 ============
const DEFAULT_BUDGET = 60000;
/**
 * 注册 context_budget 工具
 * Token 估算 + 60%/80% 自动降级
 */
export function register(server) {
    server.tool("context_budget", "估算当前任务的上下文 Token 消耗。超过 60% 时建议降级 recommended 上下文，超过 80% 时建议新开会话。可选传入 task_id 分析特定任务。", {
        task_id: z
            .string()
            .optional()
            .describe("可选任务 ID，分析特定任务的上下文预算"),
        phase: z.string().optional().describe("阶段标识，决定预算上限"),
    }, async ({ task_id, phase }) => {
        try {
            const config = getConfig();
            const phaseBudget = config.context.phaseBudget;
            const budget = phaseBudget[phase || "implement"] || DEFAULT_BUDGET;
            let totalTokens = 0;
            // 按 priority 分层统计
            const breakdown = {
                required: { count: 0, tokens: 0 },
                recommended: { count: 0, tokens: 0 },
                deferred: { count: 0, tokens: 0 },
            };
            // 如果指定了 task_id，读取对应的 context.jsonl
            if (task_id) {
                const taskDir = getTaskDir(task_id);
                const contextPath = path.join(taskDir, "context.jsonl");
                if (fs.existsSync(contextPath)) {
                    const entries = parseContextJsonl(contextPath);
                    for (const entry of entries) {
                        const filePath = resolveUriToPath(entry.uri);
                        let tokens = entry.token_estimate || 0;
                        if (filePath && fs.existsSync(filePath)) {
                            const stat = fs.statSync(filePath);
                            tokens = Math.round(stat.size / 3);
                        }
                        const priority = entry.priority || "deferred";
                        if (breakdown[priority]) {
                            breakdown[priority].count += 1;
                            breakdown[priority].tokens += tokens;
                        }
                        // deferred 仅保留 URI 引用，不计入实际预算消耗
                        if (priority !== "deferred") {
                            totalTokens += tokens;
                        }
                    }
                    // 检查快照 stale 状态（优先本阶段快照，回退到 implement 快照）
                    const targetPhase = phase || "implement";
                    let snapshotPath = path.join(taskDir, `context-snapshot-${targetPhase}.jsonl`);
                    if (!fs.existsSync(snapshotPath) && targetPhase !== "implement") {
                        snapshotPath = path.join(taskDir, "context-snapshot-implement.jsonl");
                    }
                    if (fs.existsSync(snapshotPath)) {
                        const staleResult = checkStale(snapshotPath);
                        if (!staleResult.allFresh) {
                            return {
                                content: [
                                    {
                                        type: "text",
                                        text: JSON.stringify({
                                            task_id,
                                            phase: phase || "implement",
                                            budget,
                                            total_tokens: totalTokens,
                                            usage_percent: Math.round((totalTokens / budget) * 100),
                                            status: determineStatus(totalTokens, budget),
                                            breakdown,
                                            stale_warning: {
                                                message: "⚠️ 上下文快照中检测到 stale 条目（spec 文件已变更）",
                                                stale_count: staleResult.staleEntries.length,
                                                stale_entries: staleResult.staleEntries,
                                            },
                                            ...getDegradationAdvice(totalTokens, budget),
                                        }, null, 2),
                                    },
                                ],
                            };
                        }
                    }
                }
            }
            const usagePercent = Math.round((totalTokens / budget) * 100);
            const status = determineStatus(totalTokens, budget);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            task_id: task_id || null,
                            phase: phase || "implement",
                            budget,
                            total_tokens: totalTokens,
                            usage_percent: usagePercent,
                            status,
                            breakdown,
                            ...getDegradationAdvice(totalTokens, budget),
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
// ============ 辅助函数 ============
/**
 * 判断预算状态
 */
function determineStatus(totalTokens, budget) {
    const config = getConfig();
    const ratio = totalTokens / budget;
    if (ratio >= config.context.criticalThreshold)
        return "critical";
    if (ratio >= config.context.warningThreshold)
        return "warning";
    return "normal";
}
/**
 * 根据状态生成降级建议
 */
function getDegradationAdvice(totalTokens, budget) {
    const status = determineStatus(totalTokens, budget);
    if (status === "normal") {
        return { advice: "预算充足，可正常加载所有 required + recommended 上下文" };
    }
    if (status === "warning") {
        return {
            advice: "⚠️ 超过 60% 预算，建议将 recommended 上下文降级为 deferred（仅保留 URI 引用）",
            degradation: {
                action: "降级 recommended → deferred",
                reason: "上下文接近预算上限，优先保留 required 内容",
            },
        };
    }
    // critical
    return {
        advice: "🚨 超过 80% 预算，建议新开会话并使用恢复指令",
        degradation: {
            action: "停止加载新上下文 + 新开会话",
            reason: "上下文已超预算上限",
        },
        recovery_instructions: {
            step1: "新开会话",
            step2: "调用 project_status() 恢复项目状态",
            step3: "调用 task_get(current_task_id) 读取任务详情",
            step4: "调用 journal_search(last_session) 恢复最近工作记录",
        },
    };
}
//# sourceMappingURL=context-budget.js.map