import * as fs from 'node:fs';
import * as path from 'node:path';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getTaskDir } from '../utils/task-utils.js';
import { parseTrellisUri } from '../utils/uri-utils.js';
/**
 * 注册 task-context 资源
 * URI: trellis://tasks/{id}/context
 * 返回: 任务的 context.jsonl 内容
 */
export function register(server) {
    server.resource('任务上下文', new ResourceTemplate('trellis://tasks/{id}/context', { list: undefined }), async (uri) => {
        try {
            // 使用共享的 URI 解析工具
            const fullPath = parseTrellisUri(uri);
            const match = fullPath.match(/^tasks\/([^/]+)\/context$/);
            if (!match) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify({
                                error: true,
                                message: '无效的任务 URI 格式，预期: trellis://tasks/{id}/context',
                            }),
                        },
                    ],
                };
            }
            const taskId = match[1];
            const taskDir = getTaskDir(taskId);
            const contextPath = path.join(taskDir, 'context.jsonl');
            // 检查 context.jsonl 是否存在
            if (!fs.existsSync(contextPath)) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify({
                                task_id: taskId,
                                context: '该任务暂无上下文记录（context.jsonl 不存在）',
                            }),
                        },
                    ],
                };
            }
            // 读取 context.jsonl 内容
            const content = fs.readFileSync(contextPath, 'utf-8');
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify({
                            task_id: taskId,
                            context: content,
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
//# sourceMappingURL=task-context-resource.js.map