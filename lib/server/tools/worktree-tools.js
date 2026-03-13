import { z } from "zod";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { getTaskDir, parseTaskMd, serializeTaskMd, } from "../utils/task-utils.js";
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
 * 获取仓库默认分支名
 * 优先从 remote HEAD 获取，回退到当前分支，最终回退到 "main"
 */
function getDefaultBranch() {
    try {
        // 优先从 remote HEAD 获取
        const ref = execFileSync("git", ["symbolic-ref", "refs/remotes/origin/HEAD"], { encoding: "utf-8" }).trim();
        return ref.replace("refs/remotes/origin/", "");
    }
    catch {
        // 无远程时，回退当前分支
        try {
            const current = execFileSync("git", ["branch", "--show-current"], {
                encoding: "utf-8",
            }).trim();
            return current || "main";
        }
        catch {
            return "main";
        }
    }
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
/**
 * 校验 task_id 格式（防路径遍历和注入）
 */
function isValidTaskId(taskId) {
    // 只允许字母、数字、下划线和短横线，禁止路径分隔符、".."、空格等
    return /^[A-Za-z0-9_-]+$/.test(taskId) && taskId.length > 0;
}
/**
 * 构造标准 MCP 错误响应
 */
function errorResponse(message, details) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(details
                    ? { error: true, message, details }
                    : { error: true, message }),
            },
        ],
        isError: true,
    };
}
/**
 * 构造标准 MCP 成功响应
 */
function successResponse(data) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
}
/**
 * 安全恢复 Git 分支
 * 恢复失败时 fallback 到默认分支
 */
function safeRestoreBranch(branch, cwd) {
    if (!branch)
        return null;
    try {
        execFileSync("git", ["checkout", branch], {
            encoding: "utf-8",
            cwd,
        });
        return branch;
    }
    catch {
        // 原始分支恢复失败，fallback 到默认分支
        const fallback = getDefaultBranch();
        try {
            execFileSync("git", ["checkout", fallback], {
                encoding: "utf-8",
                cwd,
            });
            return fallback;
        }
        catch {
            return null;
        }
    }
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
            // task_id 格式校验（防路径遍历）
            if (!isValidTaskId(task_id)) {
                return errorResponse(`非法的 task_id: "${task_id}"。只允许字母、数字、下划线和短横线。`);
            }
            // 检查任务是否存在
            const taskDir = getTaskDir(task_id);
            if (!fs.existsSync(taskDir)) {
                return errorResponse(`任务 ${task_id} 不存在`);
            }
            const worktreePath = getWorktreePath(task_id);
            const branch = getWorktreeBranch(task_id);
            const baseBranch = base_branch || getDefaultBranch();
            // 校验分支名合法性（防注入）
            const refError = validateRef(baseBranch, "base_branch");
            if (refError)
                return refError;
            // 检查 worktree 是否已存在
            if (fs.existsSync(worktreePath)) {
                return errorResponse(`任务 ${task_id} 的 worktree 已存在: ${worktreePath}`);
            }
            execFileSync("git", ["rev-parse", "--verify", baseBranch], {
                encoding: "utf-8",
            });
            // 创建 worktree 目录
            fs.mkdirSync(path.dirname(worktreePath), { recursive: true });
            // 使用 execFileSync 创建 worktree（防 shell 注入）
            execFileSync("git", ["worktree", "add", "-b", branch, worktreePath, baseBranch], { encoding: "utf-8" });
            // 持久化 worktree 元数据到 task.md frontmatter
            try {
                const taskMdPath = path.join(taskDir, "task.md");
                if (fs.existsSync(taskMdPath)) {
                    const taskContent = fs.readFileSync(taskMdPath, "utf-8");
                    const parsed = parseTaskMd(taskContent);
                    parsed.metadata.worktree_path = worktreePath;
                    parsed.metadata.worktree_branch = branch;
                    parsed.metadata.worktree_base_branch = baseBranch;
                    parsed.metadata.updated_at = new Date().toISOString();
                    const newContent = serializeTaskMd(parsed.metadata, parsed.body);
                    fs.writeFileSync(taskMdPath, newContent, "utf-8");
                }
            }
            catch {
                // 元数据持久化失败不阻塞 worktree 创建
            }
            return successResponse({
                task_id,
                worktree_path: worktreePath,
                branch,
                base_branch: baseBranch,
                message: `任务 ${task_id} 的 worktree 已创建`,
            });
        }
        catch (error) {
            return errorResponse(error instanceof Error ? error.message : String(error));
        }
    });
}
/**
 * 注册 worktree_merge 工具
 * 将 worktree 分支合并回目标分支
 *
 * 安全增强：
 * - 合并前检查主仓工作区是否干净
 * - 保存/恢复原始分支
 * - 冲突时返回冲突文件列表
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
            // task_id 格式校验
            if (!isValidTaskId(task_id)) {
                return errorResponse(`非法的 task_id: "${task_id}"。只允许字母、数字、下划线和短横线。`);
            }
            const worktreePath = getWorktreePath(task_id);
            const branch = getWorktreeBranch(task_id);
            const target = target_branch || getDefaultBranch();
            // 校验分支名合法性
            const refError = validateRef(target, "target_branch");
            if (refError)
                return refError;
            // 检查 worktree 是否存在
            if (!fs.existsSync(worktreePath)) {
                return errorResponse(`任务 ${task_id} 的 worktree 不存在`);
            }
            const gitRoot = getGitRoot();
            // 保存当前分支
            const originalBranch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf-8", cwd: gitRoot }).trim();
            // 预检：主仓工作区是否干净
            const status = execFileSync("git", ["status", "--porcelain"], {
                encoding: "utf-8",
                cwd: gitRoot,
            }).trim();
            if (status) {
                return errorResponse("主仓库有未提交变更，请先 commit 或 stash 后再合并。", `未提交文件：\n${status}`);
            }
            // 切换到目标分支
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
                // 合并冲突：获取冲突文件列表
                let conflictFiles = [];
                try {
                    const conflictOutput = execFileSync("git", ["diff", "--name-only", "--diff-filter=U"], { encoding: "utf-8", cwd: gitRoot }).trim();
                    conflictFiles = conflictOutput ? conflictOutput.split("\n") : [];
                }
                catch {
                    // 获取冲突列表失败，继续处理
                }
                // 中止合并
                try {
                    execFileSync("git", ["merge", "--abort"], {
                        encoding: "utf-8",
                        cwd: gitRoot,
                    });
                }
                catch {
                    // --abort 失败时不阻塞流程
                }
                // 恢复原始分支
                const restoredTo = safeRestoreBranch(originalBranch, gitRoot);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: "合并失败：存在冲突。已中止合并。",
                                conflict_files: conflictFiles,
                                restored_to: restoredTo,
                                details: mergeError instanceof Error
                                    ? mergeError.message
                                    : String(mergeError),
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 合并成功：恢复原始分支（如果与 target 不同）
            let restoredTo = target;
            if (originalBranch && originalBranch !== target) {
                const restored = safeRestoreBranch(originalBranch, gitRoot);
                if (restored)
                    restoredTo = restored;
            }
            return successResponse({
                task_id,
                merged_branch: branch,
                target_branch: target,
                restored_to: restoredTo,
                message: `分支 ${branch} 已合并到 ${target}`,
            });
        }
        catch (error) {
            return errorResponse(error instanceof Error ? error.message : String(error));
        }
    });
}
/**
 * 注册 worktree_cleanup 工具
 * 清理已完成任务的 worktree
 *
 * 安全增强：
 * - 默认不删除分支（需显式 delete_branch: true）
 * - 默认不强制清理（需显式 force: true）
 * - 清理前检查 worktree 是否有未提交变更
 * - 不再 fallback 到 git branch -D 强删
 */
export function registerWorktreeCleanup(server) {
    server.tool("worktree_cleanup", "清理指定任务的 worktree 及其分支。", {
        task_id: z.string(),
        delete_branch: z.boolean().optional(),
        force: z.boolean().optional(),
        role: z.string().optional(),
    }, async ({ task_id, delete_branch, force, role }) => {
        try {
            // Capability Gate
            const reject = checkCapability(role, "worktree_cleanup");
            if (reject) {
                return capabilityError(reject);
            }
            // task_id 格式校验
            if (!isValidTaskId(task_id)) {
                return errorResponse(`非法的 task_id: "${task_id}"。只允许字母、数字、下划线和短横线。`);
            }
            const worktreePath = getWorktreePath(task_id);
            const branch = getWorktreeBranch(task_id);
            // 检查 worktree 是否存在
            if (!fs.existsSync(worktreePath)) {
                return errorResponse(`任务 ${task_id} 的 worktree 不存在`);
            }
            // 安全预检：检查 worktree 是否有未提交变更
            if (!force) {
                try {
                    const dirtyStatus = execFileSync("git", ["status", "--porcelain"], {
                        encoding: "utf-8",
                        cwd: worktreePath,
                    }).trim();
                    if (dirtyStatus) {
                        const dirtyFiles = dirtyStatus.split("\n");
                        return errorResponse(`任务 ${task_id} 的 worktree 有未提交变更，请先提交或丢弃。` +
                            "如需强制清理，请传入 force: true。", `未提交文件（${dirtyFiles.length} 个）：\n${dirtyStatus}`);
                    }
                }
                catch {
                    // status 命令失败时继续（可能 worktree 状态异常）
                }
            }
            // 移除 worktree（根据 force 决定是否 --force）
            const removeArgs = ["worktree", "remove", worktreePath];
            if (force) {
                removeArgs.push("--force");
            }
            execFileSync("git", removeArgs, { encoding: "utf-8" });
            // 可选：删除分支（默认不删除）
            const shouldDeleteBranch = delete_branch === true;
            let branchDeleted = false;
            let branchWarning = null;
            if (shouldDeleteBranch) {
                // 从 task.md 读取 worktree_base_branch，作为 checkout 目标
                // 确保 HEAD 在 merge target 上，git branch -d 才能正确判断 "fully merged"
                const taskMdPath = path.join(getTaskDir(task_id), "task.md");
                let mergeTarget = null;
                try {
                    if (fs.existsSync(taskMdPath)) {
                        const taskContent = fs.readFileSync(taskMdPath, "utf-8");
                        const parsed = parseTaskMd(taskContent);
                        mergeTarget = parsed.metadata.worktree_base_branch || null;
                    }
                }
                catch {
                    // 读取失败不阻塞
                }
                // 如果知道 merge target，先切过去再删除
                let originalBranch = null;
                if (mergeTarget) {
                    try {
                        originalBranch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf-8" }).trim();
                        if (originalBranch !== mergeTarget) {
                            execFileSync("git", ["checkout", mergeTarget], {
                                encoding: "utf-8",
                            });
                        }
                        else {
                            originalBranch = null; // 已经在目标分支上
                        }
                    }
                    catch {
                        originalBranch = null; // checkout 失败，不影响后续
                    }
                }
                try {
                    execFileSync("git", ["branch", "-d", branch], {
                        encoding: "utf-8",
                    });
                    branchDeleted = true;
                }
                catch {
                    // 分支未合并 → 不强删，返回警告
                    branchWarning =
                        `分支 ${branch} 尚未合并到任何分支，已保留。` +
                            `如需强制删除，请手动执行 git branch -D ${branch}`;
                }
                // 恢复原始分支
                if (originalBranch) {
                    safeRestoreBranch(originalBranch, getGitRoot());
                }
            }
            return successResponse({
                task_id,
                worktree_removed: worktreePath,
                branch_deleted: branchDeleted ? branch : null,
                ...(branchWarning ? { warning: branchWarning } : {}),
                message: `任务 ${task_id} 的 worktree 已清理`,
            });
        }
        catch (error) {
            return errorResponse(error instanceof Error ? error.message : String(error));
        }
    });
}
/**
 * 注册 worktree_list 工具
 * 列出所有活跃的 Git worktree 及其关联任务
 *
 * 返回结构化信息：task_id、路径、分支、HEAD、is_dirty 状态
 */
export function registerWorktreeList(server) {
    server.tool("worktree_list", "列出当前所有 Git worktree 及其关联任务。", {
        role: z.string().optional(),
    }, async ({ role }) => {
        try {
            // Capability Gate（全角色可查询）
            const reject = checkCapability(role, "worktree_list");
            if (reject) {
                return capabilityError(reject);
            }
            // 获取 porcelain 格式的 worktree 列表
            const output = execFileSync("git", ["worktree", "list", "--porcelain"], { encoding: "utf-8" });
            // 解析 porcelain 输出
            const worktrees = parseWorktreePorcelain(output);
            // 过滤出 easyAI 管理的 worktree（.worktrees/ 目录下的）
            const taskWorktrees = worktrees
                .filter((w) => w.path.includes(`${path.sep}.worktrees${path.sep}`))
                .map((w) => {
                // 从路径提取 task_id
                const taskId = path.basename(w.path);
                // 检查 worktree 是否有未提交变更（三态：clean / dirty / unknown）
                let isDirty = null;
                try {
                    const dirtyStatus = execFileSync("git", ["status", "--porcelain"], { encoding: "utf-8", cwd: w.path }).trim();
                    isDirty = dirtyStatus.length > 0;
                }
                catch {
                    // status 失败时标记为 unknown（null）
                    isDirty = null;
                }
                return {
                    task_id: taskId,
                    path: w.path,
                    branch: w.branch,
                    head: w.head,
                    is_dirty: isDirty,
                    is_detached: w.detached,
                };
            });
            return successResponse({
                total: taskWorktrees.length,
                worktrees: taskWorktrees,
                message: taskWorktrees.length > 0
                    ? `找到 ${taskWorktrees.length} 个任务关联的 worktree`
                    : "当前没有任务关联的 worktree",
            });
        }
        catch (error) {
            return errorResponse(error instanceof Error ? error.message : String(error));
        }
    });
}
/**
 * 解析 git worktree list --porcelain 输出
 *
 * porcelain 格式示例：
 * worktree /path/to/main
 * HEAD abc123
 * branch refs/heads/main
 *
 * worktree /path/to/.worktrees/T001
 * HEAD def456
 * branch refs/heads/worktree/T001
 */
function parseWorktreePorcelain(output) {
    const worktrees = [];
    const blocks = output.trim().split("\n\n");
    for (const block of blocks) {
        if (!block.trim())
            continue;
        const lines = block.trim().split("\n");
        const info = { detached: false };
        for (const line of lines) {
            if (line.startsWith("worktree ")) {
                info.path = line.substring("worktree ".length);
            }
            else if (line.startsWith("HEAD ")) {
                info.head = line.substring("HEAD ".length);
            }
            else if (line.startsWith("branch ")) {
                info.branch = line
                    .substring("branch ".length)
                    .replace("refs/heads/", "");
            }
            else if (line === "detached") {
                info.detached = true;
            }
        }
        if (info.path && info.head) {
            worktrees.push({
                path: info.path,
                head: info.head,
                branch: info.branch || "",
                detached: info.detached ?? false,
            });
        }
    }
    return worktrees;
}
//# sourceMappingURL=worktree-tools.js.map