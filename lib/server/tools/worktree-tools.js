import { z } from "zod";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { getTaskDir } from "../utils/task-utils.js";
import { checkCapability, capabilityError, isValidGitRef, } from "../utils/capability-gate.js";
// ============ 内部工具函数 ============
/**
 * 获取 Git 仓库根目录
 */
function getGitRoot() {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
        encoding: "utf-8",
    }).trim();
}
/**
 * 获取任务对应的 worktree 分支名
 */
function getWorktreeBranch(taskId) {
    return `worktree/${taskId}`;
}
/**
 * 获取任务对应的 worktree 目录路径
 */
function getWorktreePath(taskId) {
    const gitRoot = getGitRoot();
    return path.join(gitRoot, ".worktrees", taskId);
}
/**
 * 校验 Git ref 合法性并返回错误响应（如果非法）
 */
function validateRef(ref, label) {
    if (!isValidGitRef(ref)) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        error: true,
                        message: `非法的 ${label}: "${ref}"。` +
                            "分支名不能包含特殊字符、空格或以 - 开头。",
                    }),
                },
            ],
            isError: true,
        };
    }
    return null;
}
// ============ Tool 注册 ============
/**
 * 注册 worktree_create 工具
 * 为任务创建隔离的 Git worktree
 */
export function registerWorktreeCreate(server) {
    server.tool("worktree_create", "为指定任务创建 Git worktree，提供并行任务的物理隔离。", {
        task_id: z.string(),
        base_branch: z.string().optional(),
        role: z.string().optional(),
    }, async ({ task_id, base_branch, role }) => {
        try {
            // Capability Gate
            const reject = checkCapability(role, "worktree_create");
            if (reject) {
                return capabilityError(reject);
            }
            // 检查任务是否存在
            const taskDir = getTaskDir(task_id);
            if (!fs.existsSync(taskDir)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务 ${task_id} 不存在`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            const worktreePath = getWorktreePath(task_id);
            const branch = getWorktreeBranch(task_id);
            const baseBranch = base_branch || "main";
            // 校验分支名合法性（防注入）
            const refError = validateRef(baseBranch, "base_branch");
            if (refError)
                return refError;
            // 检查 worktree 是否已存在
            if (fs.existsSync(worktreePath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务 ${task_id} 的 worktree 已存在: ` + worktreePath,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 创建 worktree 目录
            fs.mkdirSync(path.dirname(worktreePath), { recursive: true });
            // 使用 execFileSync 创建 worktree（防 shell 注入）
            execFileSync("git", ["worktree", "add", "-b", branch, worktreePath, baseBranch], { encoding: "utf-8" });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            task_id,
                            worktree_path: worktreePath,
                            branch,
                            base_branch: baseBranch,
                            message: `任务 ${task_id} 的 worktree 已创建`,
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
/**
 * 注册 worktree_merge 工具
 * 将 worktree 分支合并回目标分支
 */
export function registerWorktreeMerge(server) {
    server.tool("worktree_merge", "将指定任务的 worktree 分支合并回目标分支。", {
        task_id: z.string(),
        target_branch: z.string().optional(),
        role: z.string().optional(),
    }, async ({ task_id, target_branch, role }) => {
        try {
            // Capability Gate
            const reject = checkCapability(role, "worktree_merge");
            if (reject) {
                return capabilityError(reject);
            }
            const worktreePath = getWorktreePath(task_id);
            const branch = getWorktreeBranch(task_id);
            const target = target_branch || "main";
            // 校验分支名合法性
            const refError = validateRef(target, "target_branch");
            if (refError)
                return refError;
            // 检查 worktree 是否存在
            if (!fs.existsSync(worktreePath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务 ${task_id} 的 worktree 不存在`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            const gitRoot = getGitRoot();
            // 先切换到目标分支再合并
            execFileSync("git", ["checkout", target], {
                encoding: "utf-8",
                cwd: gitRoot,
            });
            // 执行合并
            try {
                const mergeMsg = `Merge ${branch} into ${target}`;
                execFileSync("git", ["merge", branch, "--no-ff", "-m", mergeMsg], {
                    encoding: "utf-8",
                    cwd: gitRoot,
                });
            }
            catch (mergeError) {
                // 合并冲突时中止合并并报告
                try {
                    execFileSync("git", ["merge", "--abort"], {
                        encoding: "utf-8",
                        cwd: gitRoot,
                    });
                }
                catch {
                    // 忽略 --abort 错误
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: "合并失败：可能存在冲突。" + "请手动解决冲突后重试。",
                                details: mergeError instanceof Error
                                    ? mergeError.message
                                    : String(mergeError),
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            task_id,
                            merged_branch: branch,
                            target_branch: target,
                            message: `分支 ${branch} 已合并到 ${target}`,
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
/**
 * 注册 worktree_cleanup 工具
 * 清理已完成任务的 worktree
 */
export function registerWorktreeCleanup(server) {
    server.tool("worktree_cleanup", "清理指定任务的 worktree 及其分支。", {
        task_id: z.string(),
        delete_branch: z.boolean().optional(),
        role: z.string().optional(),
    }, async ({ task_id, delete_branch, role }) => {
        try {
            // Capability Gate
            const reject = checkCapability(role, "worktree_cleanup");
            if (reject) {
                return capabilityError(reject);
            }
            const worktreePath = getWorktreePath(task_id);
            const branch = getWorktreeBranch(task_id);
            // 检查 worktree 是否存在
            if (!fs.existsSync(worktreePath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务 ${task_id} 的 worktree 不存在`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 使用 execFileSync 移除 worktree（防 shell 注入）
            execFileSync("git", ["worktree", "remove", worktreePath, "--force"], {
                encoding: "utf-8",
            });
            // 可选：删除分支
            const branchDeleted = delete_branch !== false;
            if (branchDeleted) {
                try {
                    execFileSync("git", ["branch", "-d", branch], {
                        encoding: "utf-8",
                    });
                }
                catch {
                    // 分支未合并时尝试强制删除
                    try {
                        execFileSync("git", ["branch", "-D", branch], {
                            encoding: "utf-8",
                        });
                    }
                    catch {
                        // 分支已不存在，忽略
                    }
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            task_id,
                            worktree_removed: worktreePath,
                            branch_deleted: branchDeleted ? branch : null,
                            message: `任务 ${task_id} 的 worktree 已清理`,
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
//# sourceMappingURL=worktree-tools.js.map