/**
 * Git commit 信息接口
 */
interface GitCommit {
    hash: string;
    message: string;
    date: string;
    author: string;
}
/**
 * 获取当前 Git 分支名
 * @returns 当前分支名，失败返回 'HEAD'
 */
declare function getGitBranch(): string;
/**
 * 获取 Git 状态（简短格式）
 * @returns `git status --short` 输出，失败返回空字符串
 */
declare function getGitStatus(): string;
/**
 * 获取最近 N 条 commit 记录
 * @param count - 获取的 commit 数量，默认为 10
 * @returns commit 信息列表
 */
declare function getRecentCommits(count?: number): GitCommit[];
/**
 * 检查当前目录是否在 Git 仓库中
 * @returns 是否在 Git 仓库中
 */
declare function isGitRepo(): boolean;
export type { GitCommit };
export { getGitBranch, getGitStatus, getRecentCommits, isGitRepo, };
//# sourceMappingURL=git-utils.d.ts.map