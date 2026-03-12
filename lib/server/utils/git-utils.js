import { execSync } from "node:child_process";
import { getProjectRoot } from "./task-utils.js";
// ============ 工具函数 ============
/**
 * 获取当前 Git 分支名
 * @returns 当前分支名，失败返回 'HEAD'
 */
function getGitBranch() {
    try {
        const cwd = getProjectRoot();
        const result = execSync("git rev-parse --abbrev-ref HEAD", {
            cwd,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        });
        return result.trim();
    }
    catch (error) {
        return "HEAD";
    }
}
/**
 * 获取 Git 状态（简短格式）
 * @returns `git status --short` 输出，失败返回空字符串
 */
function getGitStatus() {
    try {
        const cwd = getProjectRoot();
        const result = execSync("git status --short", {
            cwd,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        });
        return result.trim();
    }
    catch (error) {
        return "";
    }
}
/**
 * 获取最近 N 条 commit 记录
 * @param count - 获取的 commit 数量，默认为 10
 * @returns commit 信息列表
 */
function getRecentCommits(count = 10) {
    try {
        const cwd = getProjectRoot();
        // 使用 git log 格式化输出
        const format = "%H|%s|%ci|%an";
        const result = execSync(`git log -n ${count} --format="${format}"`, {
            cwd,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        });
        const commits = [];
        const lines = result.trim().split("\n");
        for (const line of lines) {
            const parts = line.split("|");
            if (parts.length >= 4) {
                commits.push({
                    hash: parts[0],
                    message: parts[1],
                    date: parts[2],
                    author: parts[3],
                });
            }
        }
        return commits;
    }
    catch (error) {
        return [];
    }
}
/**
 * 检查当前目录是否在 Git 仓库中
 * @returns 是否在 Git 仓库中
 */
function isGitRepo() {
    try {
        const cwd = getProjectRoot();
        execSync("git rev-parse --git-dir", {
            cwd,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        });
        return true;
    }
    catch (error) {
        return false;
    }
}
export { getGitBranch, getGitStatus, getRecentCommits, isGitRepo };
//# sourceMappingURL=git-utils.js.map