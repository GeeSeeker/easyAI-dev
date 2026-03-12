import * as fs from 'node:fs';
import * as path from 'node:path';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getTaskDir } from '../utils/task-utils.js';
import { parseTrellisUri } from '../utils/uri-utils.js';
/**
 * 注册 subtask-context 资源
 * URI: trellis://tasks/{id}/subtasks/{sid}/context
 * 返回: 子任务上下文
 */
export function register(server) {
    server.resource('子任务上下文', new ResourceTemplate('trellis://tasks/{id}/subtasks/{sid}/context', { list: undefined }), async (uri) => {
        try {
            // 使用共享的 URI 解析工具
            const fullPath = parseTrellisUri(uri);
            const match = fullPath.match(/^tasks\/([^/]+)\/subtasks\/([^/]+)\/context$/);
            if (!match) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify({
                                error: true,
                                message: '无效的子任务 URI 格式，预期: trellis://tasks/{id}/subtasks/{sid}/context',
                            }),
                        },
                    ],
                };
            }
            const taskId = match[1];
            const subtaskId = match[2];
            const taskDir = getTaskDir(taskId);
            // 尝试多个可能的子任务上下文位置
            const possiblePaths = [
                // 子目录中的 context.jsonl
                path.join(taskDir, 'subtasks', `${subtaskId}.jsonl`),
                path.join(taskDir, 'subtasks', subtaskId, 'context.jsonl'),
                // 子任务的 markdown 文件
                path.join(taskDir, 'subtasks', `${subtaskId}.md`),
            ];
            let foundContent = null;
            let foundPath = '';
            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    foundContent = fs.readFileSync(possiblePath, 'utf-8');
                    foundPath = possiblePath;
                    break;
                }
            }
            if (!foundContent) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify({
                                task_id: taskId,
                                subtask_id: subtaskId,
                                context: `子任务 ${subtaskId} 的上下文不存在`,
                            }),
                        },
                    ],
                };
            }
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify({
                            task_id: taskId,
                            subtask_id: subtaskId,
                            source: foundPath,
                            context: foundContent,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                contents: [
                    {
                        uri: uri.href,
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
//# sourceMappingURL=subtask-context-resource.js.map