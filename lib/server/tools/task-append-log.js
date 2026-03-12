import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';
import { getTaskDir, parseTaskMd, serializeTaskMd, } from '../utils/task-utils.js';
/**
 * 注册 task_append_log 工具
 * 在 task.md 的 "## 执行记录" 部分追加条目
 */
export function register(server) {
    server.tool('task_append_log', '追加执行记录条目。在 task.md 的 "## 执行记录" 部分追加一条记录，格式为：- [ISO时间] 条目内容。如果不存在该章节则自动创建。', {
        task_id: z.string(),
        entry: z.string(),
    }, async ({ task_id, entry }) => {
        try {
            const taskPath = getTaskDir(task_id);
            const taskMdPath = path.join(taskPath, 'task.md');
            // 检查 task.md 是否存在
            if (!fs.existsSync(taskMdPath)) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                error: true,
                                message: `任务 ${task_id} 的 task.md 文件不存在`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 读取并解析 task.md
            const content = fs.readFileSync(taskMdPath, 'utf-8');
            const parsed = parseTaskMd(content);
            // 准备新条目
            const isoTime = new Date().toISOString();
            const newEntry = `- [${isoTime}] ${entry}`;
            // 检查 body 中是否有 "## 执行记录"
            const executionLogHeader = '## 执行记录';
            let newBody = parsed.body;
            if (newBody.includes(executionLogHeader)) {
                // 在执行记录章节后追加条目
                const headerIndex = newBody.indexOf(executionLogHeader);
                const afterHeader = newBody.substring(headerIndex + executionLogHeader.length);
                // 找到该章节的结束位置（下一个 ## 标题或文件末尾）
                const nextHeaderIndex = afterHeader.search(/\n##[^#]/);
                let sectionContent;
                let afterSection = '';
                if (nextHeaderIndex !== -1) {
                    sectionContent = afterHeader.substring(0, nextHeaderIndex + 1); // 保留换行符
                    afterSection = afterHeader.substring(nextHeaderIndex + 1);
                }
                else {
                    sectionContent = afterHeader;
                }
                // 追加新条目
                newBody = newBody.substring(0, headerIndex) +
                    executionLogHeader +
                    sectionContent.trimEnd() +
                    '\n' +
                    newEntry +
                    (afterSection ? '\n\n' + afterSection.trimStart() : '');
            }
            else {
                // 在 body 末尾追加执行记录章节
                if (newBody && !newBody.endsWith('\n')) {
                    newBody += '\n';
                }
                newBody += `\n${executionLogHeader}\n${newEntry}`;
            }
            // 更新 updated_at
            const updatedMetadata = {
                ...parsed.metadata,
                updated_at: isoTime,
            };
            // 写回 task.md
            const newContent = serializeTaskMd(updatedMetadata, newBody);
            fs.writeFileSync(taskMdPath, newContent, 'utf-8');
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            task_id: task_id,
                            entry: newEntry,
                            message: `已向任务 ${task_id} 追加执行记录`,
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
//# sourceMappingURL=task-append-log.js.map