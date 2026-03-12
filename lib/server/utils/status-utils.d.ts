/**
 * Git 信息接口
 */
interface GitInfo {
    branch: string;
    status: string;
    recent_commits: Array<{
        hash: string;
        message: string;
        date: string;
        author: string;
    }>;
}
/**
 * 任务摘要接口
 */
interface TaskSummary {
    id: string;
    title: string;
    status: string;
}
/**
 * 任务统计接口
 */
interface TaskStats {
    total: number;
    active: number;
    by_status: Record<string, number>;
    active_tasks: TaskSummary[];
}
/**
 * 日志摘要接口
 */
interface JournalSummary {
    latest_count: number;
    entries: Array<{
        date: string;
        tags: string[];
        content: string;
    }>;
}
/**
 * 项目状态数据接口
 */
export interface ProjectStatusData {
    git: GitInfo;
    tasks: TaskStats;
    journal: JournalSummary;
}
/**
 * 获取项目状态数据
 * @param commitCount - 获取的 Git 提交数量，默认为 5
 * @param journalCount - 获取的日志条目数量，默认为 3
 * @returns 项目状态数据
 */
export declare function getProjectStatusData(commitCount?: number, journalCount?: number): ProjectStatusData;
export {};
//# sourceMappingURL=status-utils.d.ts.map