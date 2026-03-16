import { z } from "zod";
import { appendJournalEntry, getDefaultUser } from "../utils/journal-utils.js";
/**
 * 注册 journal_append 工具
 * 写入日志条目
 */
export function register(server) {
    server.tool("journal_append", "追加日志条目。向 journal 文件写入一条新记录，包含日期、标签和内容。如果当前文件超过最大行数则自动创建新文件。", {
        date: z.string(),
        tags: z.array(z.string()),
        content: z.string(),
        tasks_touched: z
            .array(z.string())
            .optional()
            .describe("关联的任务 ID 列表"),
        user: z.string().optional(),
    }, async ({ date, tags, content, tasks_touched, user }) => {
        try {
            // 构建 JournalEntry 对象
            const entry = {
                date: date,
                tags: tags,
                tasks_touched: tasks_touched,
                content: content,
            };
            // 调用 appendJournalEntry（user 未传入时由 appendJournalEntry 从 config 读取默认值）
            appendJournalEntry(entry, user);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            message: "日志条目已追加",
                            date: date,
                            tags: tags,
                            user: user || getDefaultUser(),
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
//# sourceMappingURL=journal-append.js.map