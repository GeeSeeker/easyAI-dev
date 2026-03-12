import { z } from 'zod';
import { searchJournal } from '../utils/journal-utils.js';
/**
 * 注册 journal_search 工具
 * 搜索日志条目
 */
export function register(server) {
    server.tool('journal_search', '搜索日志条目。根据标签、关键词、日期范围等条件搜索 journal 中的日志，返回匹配的条目列表。所有参数均为可选。', {
        tags: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        date_from: z.string().optional(),
        date_to: z.string().optional(),
        user: z.string().optional(),
    }, async ({ tags, keywords, date_from, date_to, user }) => {
        try {
            // 构建搜索查询对象
            const query = {};
            if (tags && tags.length > 0) {
                query.tags = tags;
            }
            if (keywords && keywords.length > 0) {
                query.keywords = keywords;
            }
            if (date_from || date_to) {
                query.date_range = {};
                if (date_from) {
                    query.date_range.from = date_from;
                }
                if (date_to) {
                    query.date_range.to = date_to;
                }
            }
            // 调用 searchJournal
            const results = searchJournal(query, user);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            count: results.length,
                            entries: results,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
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
//# sourceMappingURL=journal-search.js.map