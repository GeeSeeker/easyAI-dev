import { getLatestEntries } from '../utils/journal-utils.js';
/**
 * 注册 journal 资源
 * URI: trellis://journal/latest
 * 返回: 最新的日志条目（最近 5 条）
 */
export function register(server) {
    server.resource('最新日志', 'trellis://journal/latest', async () => {
        try {
            // 获取最新 5 条日志
            const entries = getLatestEntries(5);
            // 格式化输出
            const formattedEntries = entries.map(entry => ({
                date: entry.date,
                tags: entry.tags,
                tasks_touched: entry.tasks_touched,
                content: entry.content,
            }));
            return {
                contents: [
                    {
                        uri: 'trellis://journal/latest',
                        text: JSON.stringify({
                            count: formattedEntries.length,
                            entries: formattedEntries,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                contents: [
                    {
                        uri: 'trellis://journal/latest',
                        text: JSON.stringify({
                            error: true,
                            message: error instanceof Error ? error.message : String(error),
                        }),
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=journal-resource.js.map