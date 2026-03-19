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
import { RootsListChangedNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs";
import * as path from "node:path";
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
import { register as registerProjectStatus } from "./tools/project-status.js";
import { registerFrameworkInit, registerFrameworkCheck, registerFrameworkUpdate, } from "./tools/framework-tools.js";
// 资源模块导入
import { register as registerStatusResource } from "./resources/status-resource.js";
import { register as registerTaskContextResource } from "./resources/task-context-resource.js";
import { register as registerSubtaskContextResource } from "./resources/subtask-context-resource.js";
import { register as registerSpecResource } from "./resources/spec-resource.js";
import { register as registerJournalResource } from "./resources/journal-resource.js";
// 工具函数导入
import { setProjectRootFromRoots, resetProjectRootCache, } from "./utils/task-utils.js";
import { fileURLToPath as parseFileUrl } from "node:url";
const __dirname = path.dirname(parseFileUrl(import.meta.url));
let pkgPath = path.resolve(__dirname, "../../package.json");
if (!fs.existsSync(pkgPath)) {
    pkgPath = path.resolve(__dirname, "../package.json");
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const serverVersion = pkg.version;
// 创建 MCP Server 实例
const server = new McpServer({
    name: "easyai-mcp-server",
    version: serverVersion,
}, {
    capabilities: {
        logging: {},
        resources: {},
    },
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
registerProjectStatus(server);
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
// MCP Roots 自动检测
// ============================================
/**
 * 从 IDE 获取工作区根目录并设置为项目根
 * 解析 file:// URI 为本地路径，调用 setProjectRootFromRoots
 */
async function detectProjectRootFromRoots() {
    try {
        const result = await server.server.listRoots();
        if (result.roots.length > 0) {
            const firstRoot = result.roots[0];
            // 将 file:// URI 转为本地路径
            let rootPath;
            if (firstRoot.uri.startsWith("file://")) {
                rootPath = parseFileUrl(firstRoot.uri);
            }
            else {
                rootPath = firstRoot.uri;
            }
            setProjectRootFromRoots(rootPath);
        }
        else {
            console.error("[roots] IDE 未提供工作区根目录，回退到其他检测策略");
        }
    }
    catch (error) {
        // IDE 不支持 roots 能力时优雅降级
        console.error("[roots] listRoots 调用失败（IDE 可能不支持 roots），回退到其他检测策略:", error instanceof Error ? error.message : String(error));
    }
}
// ============================================
// 启动服务器
// ============================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`easyAI MCP Server v${serverVersion} started`);
    // 连接后自动检测 IDE 工作区根目录
    await detectProjectRootFromRoots();
    // 监听 rootsListChanged 通知（IDE 切换工作区时触发）
    server.server.setNotificationHandler(RootsListChangedNotificationSchema, async () => {
        console.error("[roots] 工作区根目录已变更，重新检测");
        resetProjectRootCache();
        await detectProjectRootFromRoots();
    });
}
main().catch((error) => {
    console.error("Failed to start easyAI MCP Server:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map