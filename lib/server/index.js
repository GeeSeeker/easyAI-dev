#!/usr/bin/env node
/**
 * easyAI MCP Server — 入口文件
 *
 * 完整版本（M01-M05）：
 * - 注册所有任务管理工具（task_list, task_get, task_create, task_transition, task_append_log, task_cancel）
 * - 注册所有日志工具（journal_append, journal_search）
 * - 注册项目状态工具（project_status）
 * - 注册上下文管理工具（context_generate, context_budget, spec_validate, plan_validate）
 * - 注册冲突检测工具（conflict_check）
 * - 注册所有资源（status, task-context, subtask-context, spec, journal）
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// 工具模块导入
import { register as registerTaskList } from "./tools/task-list.js";
import { register as registerTaskGet } from "./tools/task-get.js";
import { register as registerTaskCreate } from "./tools/task-create.js";
import { register as registerTaskTransition } from "./tools/task-transition.js";
import { register as registerTaskAppendLog } from "./tools/task-append-log.js";
import { register as registerTaskCancel } from "./tools/task-cancel.js";
import { register as registerJournalAppend } from "./tools/journal-append.js";
import { register as registerJournalSearch } from "./tools/journal-search.js";
import { registerSubtaskCreate, registerSubtaskDependencyGraph, } from "./tools/subtask-tools.js";
import { registerWorktreeCreate, registerWorktreeMerge, registerWorktreeCleanup, registerWorktreeList, } from "./tools/worktree-tools.js";
import { register as registerContextGenerate } from "./tools/context-generate.js";
import { register as registerContextBudget } from "./tools/context-budget.js";
import { register as registerSpecValidate } from "./tools/spec-validate.js";
import { register as registerPlanValidate } from "./tools/plan-validate.js";
import { register as registerConflictCheck } from "./tools/conflict-check.js";
import { registerFrameworkInit, registerFrameworkCheck, registerFrameworkUpdate, } from "./tools/framework-tools.js";
// 资源模块导入
import { register as registerStatusResource } from "./resources/status-resource.js";
import { register as registerTaskContextResource } from "./resources/task-context-resource.js";
import { register as registerSubtaskContextResource } from "./resources/subtask-context-resource.js";
import { register as registerSpecResource } from "./resources/spec-resource.js";
import { register as registerJournalResource } from "./resources/journal-resource.js";
// 工具函数导入
import { getProjectStatusData } from "./utils/status-utils.js";
// 创建 MCP Server 实例
const server = new McpServer({
    name: "easyai-mcp-server",
    version: "0.1.0",
}, {
    capabilities: {
        logging: {},
        resources: {},
    },
});
// ============================================
// Tool: project_status
// 获取项目当前状态概览（Git 状态 + 活跃任务摘要 + 最新日志）
// ============================================
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
// ============================================
// 注册所有工具模块
// ============================================
registerTaskList(server);
registerTaskGet(server);
registerTaskCreate(server);
registerTaskTransition(server);
registerTaskAppendLog(server);
registerTaskCancel(server);
registerJournalAppend(server);
registerJournalSearch(server);
registerSubtaskCreate(server);
registerSubtaskDependencyGraph(server);
registerWorktreeCreate(server);
registerWorktreeMerge(server);
registerWorktreeCleanup(server);
registerWorktreeList(server);
registerContextGenerate(server);
registerContextBudget(server);
registerSpecValidate(server);
registerPlanValidate(server);
registerConflictCheck(server);
registerFrameworkInit(server);
registerFrameworkCheck(server);
registerFrameworkUpdate(server);
// ============================================
// 注册所有资源模块
// ============================================
registerStatusResource(server);
registerTaskContextResource(server);
registerSubtaskContextResource(server);
registerSpecResource(server);
registerJournalResource(server);
// ============================================
// 启动服务器
// ============================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("easyAI MCP Server v0.1.0 started");
}
main().catch((error) => {
    console.error("Failed to start easyAI MCP Server:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map