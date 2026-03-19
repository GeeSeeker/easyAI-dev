import { getProjectStatusData } from "../utils/status-utils.js";
export function register(server) {
    server.tool("project_status", "获取项目当前状态概览。返回 Git 分支/状态/最近提交、活跃任务列表、以及最新的日志条目。", {}, async () => {
        try {
            // 使用共享的状态聚合器
            const statusData = getProjectStatusData(5, 3);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(statusData, null, 2),
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
//# sourceMappingURL=project-status.js.map