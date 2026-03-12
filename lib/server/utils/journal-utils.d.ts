declare const WORKSPACE_ROOT = ".trellis/workspace";
declare const MAX_LINES_PER_FILE = 2000;
declare const DEFAULT_USER = "default";
/**
 * Journal 条目接口
 */
export interface JournalEntry {
    date: string;
    tags: string[];
    tasks_touched?: string[];
    content: string;
}
/**
 * 日志搜索查询选项
 */
interface JournalSearchQuery {
    tags?: string[];
    keywords?: string[];
    date_range?: {
        from?: string;
        to?: string;
    };
}
/**
 * 获取用户 journal 目录
 * 按 architecture §6.4，journal 文件位于 .trellis/workspace/{user}/
 * @param user - 用户名，默认为 'default'
 * @returns journal 目录的绝对路径
 */
declare function getJournalDir(user?: string): string;
/**
 * 获取最新（或当前活跃）的 journal 文件路径
 * 返回当前正在写入的文件（最高页码的文件，或 journal.md 如果不存在编号文件）
 * @param user - 用户名，默认为 'default'
 * @returns 最新 journal 文件的绝对路径
 */
declare function getLatestJournalFile(user?: string): string;
/**
 * 追加日志条目到 journal 文件
 * 如果当前文件超过 MAX_LINES_PER_FILE，自动创建新文件
 * @param entry - 日志条目
 * @param user - 用户名，默认为 'default'
 */
declare function appendJournalEntry(entry: JournalEntry, user?: string): void;
/**
 * 解析 journal 文件中的所有条目
 * 条目由 YAML frontmatter 包裹，使用 `---` 作为开始和结束标记
 * @param content - journal 文件内容
 * @returns 解析后的日志条目列表
 */
declare function parseJournalEntries(content: string): JournalEntry[];
/**
 * 搜索日志条目
 * @param query - 搜索查询选项
 * @param user - 用户名，默认为 'default'
 * @returns 匹配的日志条目列表
 */
declare function searchJournal(query: JournalSearchQuery, user?: string): JournalEntry[];
/**
 * 获取最新的 N 条日志条目
 * 条目按时间倒序排列（最新的在前）
 * @param count - 获取的条目数量，默认为 10
 * @param user - 用户名，默认为 'default'
 * @returns 最新的日志条目列表
 */
declare function getLatestEntries(count?: number, user?: string): JournalEntry[];
export type { JournalSearchQuery };
export { WORKSPACE_ROOT, MAX_LINES_PER_FILE, DEFAULT_USER, getJournalDir, getLatestJournalFile, appendJournalEntry, parseJournalEntries, searchJournal, getLatestEntries, };
//# sourceMappingURL=journal-utils.d.ts.map