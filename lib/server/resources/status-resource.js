import { getProjectStatusData } from '../utils/status-utils.js';
/**
 * 注册 status 资源
 * URI: trellis://status
 * 返回: 项目总览（Git branch/status/recent commits + 任务统计 + 最新日志摘要）
 */
export function register(server) {
    server.resource('项目状态', 'trellis://status', async () => {
        try {
            // 直接使用共享的状态聚合器，返回完整结果
            const statusData = getProjectStatusData(5, 3);
            return {
                contents: [
                    {
                        uri: 'trellis://status',
                        text: JSON.stringify(statusData, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                contents: [
                    {
                        uri: 'trellis://status',
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
//# sourceMappingURL=status-resource.js.map