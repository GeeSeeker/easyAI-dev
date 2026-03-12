import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { getTaskDir, ensureDir } from "../utils/task-utils.js";
import { checkCapability, capabilityError } from "../utils/capability-gate.js";
// ============ 内部工具函数 ============
/**
 * 获取任务的 subtasks 目录路径
 */
function getSubtasksDir(taskId) {
    return path.join(getTaskDir(taskId), "subtasks");
}
/**
 * 列出已有子任务文件
 */
function listSubtaskFiles(taskId) {
    const subtasksDir = getSubtasksDir(taskId);
    if (!fs.existsSync(subtasksDir)) {
        return [];
    }
    return fs
        .readdirSync(subtasksDir)
        .filter((f) => f.match(/^S\d+-.*\.md$/))
        .sort();
}
/**
 * 生成子任务 ID（格式：S{NNN}-{name}）
 */
function generateSubtaskId(existingFiles, name) {
    let maxNum = 0;
    for (const file of existingFiles) {
        const match = file.match(/^S(\d+)-/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum)
                maxNum = num;
        }
    }
    const nextNum = (maxNum + 1).toString().padStart(3, "0");
    // 简化名称为 kebab-case
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 30);
    return `S${nextNum}-${slug || "subtask"}`;
}
/**
 * 解析子任务 Markdown 中的 dependencies 字段
 */
function parseDependencies(content) {
    const match = content.match(/^dependencies:\s*\[([^\]]*)\]/m);
    if (!match || !match[1].trim())
        return [];
    return match[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
}
/**
 * 检测依赖图中是否存在循环（DFS）
 * @returns 如果有循环，返回循环路径；否则返回 null
 */
function detectCycle(graph) {
    const visited = new Set();
    const inStack = new Set();
    const pathStack = [];
    function dfs(node) {
        if (inStack.has(node)) {
            // 找到循环，返回路径
            const cycleStart = pathStack.indexOf(node);
            return [...pathStack.slice(cycleStart), node];
        }
        if (visited.has(node))
            return null;
        visited.add(node);
        inStack.add(node);
        pathStack.push(node);
        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
            const cycle = dfs(neighbor);
            if (cycle)
                return cycle;
        }
        pathStack.pop();
        inStack.delete(node);
        return null;
    }
    for (const node of graph.keys()) {
        const cycle = dfs(node);
        if (cycle)
            return cycle;
    }
    return null;
}
/**
 * 构建依赖图（从文件系统读取所有子任务）
 */
function buildDependencyGraph(taskId) {
    const graph = new Map();
    const subtasksDir = getSubtasksDir(taskId);
    if (!fs.existsSync(subtasksDir)) {
        return graph;
    }
    const files = listSubtaskFiles(taskId);
    for (const file of files) {
        const sid = file.replace(".md", "");
        const content = fs.readFileSync(path.join(subtasksDir, file), "utf-8");
        const deps = parseDependencies(content);
        graph.set(sid, deps);
    }
    return graph;
}
// ============ Tool 注册 ============
/**
 * 注册 subtask_create 工具
 * 创建子任务文件 + DAG 校验
 */
export function registerSubtaskCreate(server) {
    server.tool("subtask_create", "在指定任务下创建子任务。支持依赖声明，自动进行 DAG 循环检测。", {
        parent_id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        dependencies: z.array(z.string()).optional(),
        role: z.string().optional(),
    }, async ({ parent_id, name, description, dependencies, role }) => {
        try {
            // Capability Gate: subtask_create 仅组长可调用
            const reject = checkCapability(role, "subtask_create");
            if (reject) {
                return capabilityError(reject);
            }
            // 检查父任务是否存在
            const taskDir = getTaskDir(parent_id);
            if (!fs.existsSync(taskDir)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `父任务 ${parent_id} 不存在`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            const subtasksDir = getSubtasksDir(parent_id);
            ensureDir(subtasksDir);
            // 生成子任务 ID
            const existingFiles = listSubtaskFiles(parent_id);
            const subtaskId = generateSubtaskId(existingFiles, name);
            // 如果有依赖，校验依赖的子任务是否存在
            const deps = dependencies || [];
            // 检测自依赖
            if (deps.includes(subtaskId)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `子任务不能依赖自己: ${subtaskId}`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            for (const dep of deps) {
                const depFile = path.join(subtasksDir, `${dep}.md`);
                if (!fs.existsSync(depFile)) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: true,
                                    message: `依赖的子任务 ${dep} 不存在`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
            }
            // 生成子任务内容
            const depsStr = deps.length > 0 ? `[${deps.map((d) => `"${d}"`).join(", ")}]` : "[]";
            const subtaskContent = [
                "---",
                `id: ${subtaskId}`,
                `name: ${name}`,
                `status: pending`,
                `dependencies: ${depsStr}`,
                `created_at: ${new Date().toISOString()}`,
                "---",
                "",
                `## ${name}`,
                "",
                description || "（暂无描述）",
                "",
            ].join("\n");
            // 写入文件前进行 DAG 循环检测
            const graph = buildDependencyGraph(parent_id);
            graph.set(subtaskId, deps);
            const cycle = detectCycle(graph);
            if (cycle) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `检测到循环依赖: ${cycle.join(" → ")}`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 写入子任务文件
            const subtaskPath = path.join(subtasksDir, `${subtaskId}.md`);
            fs.writeFileSync(subtaskPath, subtaskContent, "utf-8");
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            subtask_id: subtaskId,
                            parent_id: parent_id,
                            dependencies: deps,
                            message: `子任务 ${subtaskId} 已创建`,
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
/**
 * 注册 subtask_dependency_graph 工具
 * 返回 DAG 图 + 循环检测
 */
export function registerSubtaskDependencyGraph(server) {
    server.tool("subtask_dependency_graph", "获取指定任务的子任务依赖图。返回所有子任务及其依赖关系，并自动检测循环依赖。", {
        task_id: z.string(),
        role: z.string().optional(),
    }, async ({ task_id, role }) => {
        try {
            // Capability Gate: subtask_dependency_graph 仅组长/PM 可调用
            const reject = checkCapability(role, "subtask_dependency_graph");
            if (reject) {
                return capabilityError(reject);
            }
            // 检查任务是否存在
            const taskDir = getTaskDir(task_id);
            if (!fs.existsSync(taskDir)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务 ${task_id} 不存在`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            const graph = buildDependencyGraph(task_id);
            // 循环检测
            const cycle = detectCycle(graph);
            // 构建可视化文本
            const nodes = [];
            for (const [id, deps] of graph.entries()) {
                nodes.push({ id, dependencies: deps });
            }
            // 拓扑排序（如果无循环）
            let executionOrder = null;
            if (!cycle) {
                executionOrder = topologicalSort(graph);
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            task_id,
                            total_subtasks: nodes.length,
                            has_cycle: !!cycle,
                            cycle_path: cycle || undefined,
                            nodes,
                            execution_order: executionOrder || undefined,
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
/**
 * 拓扑排序（Kahn 算法）
 * @returns 有效执行顺序，如果有循环返回 null
 */
function topologicalSort(graph) {
    // 计算入度
    const inDegree = new Map();
    for (const node of graph.keys()) {
        if (!inDegree.has(node))
            inDegree.set(node, 0);
        for (const dep of graph.get(node) || []) {
            inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
        }
    }
    // 注意：这里图的边 A -> B 意味着 A 依赖 B，即 B 需要先执行
    // 所以拓扑排序需要反过来：入度为 0 的是被依赖最多的（基础任务）
    // 重新计算：将依赖方向反转
    const reverseInDegree = new Map();
    const reverseGraph = new Map();
    for (const node of graph.keys()) {
        if (!reverseInDegree.has(node))
            reverseInDegree.set(node, 0);
        if (!reverseGraph.has(node))
            reverseGraph.set(node, []);
    }
    for (const [node, deps] of graph.entries()) {
        reverseInDegree.set(node, deps.length);
        for (const dep of deps) {
            if (!reverseGraph.has(dep))
                reverseGraph.set(dep, []);
            reverseGraph.get(dep).push(node);
        }
    }
    // Kahn 算法
    const queue = [];
    for (const [node, degree] of reverseInDegree.entries()) {
        if (degree === 0)
            queue.push(node);
    }
    const result = [];
    while (queue.length > 0) {
        const node = queue.shift();
        result.push(node);
        for (const neighbor of reverseGraph.get(node) || []) {
            const newDegree = (reverseInDegree.get(neighbor) || 1) - 1;
            reverseInDegree.set(neighbor, newDegree);
            if (newDegree === 0)
                queue.push(neighbor);
        }
    }
    return result.length === graph.size ? result : null;
}
//# sourceMappingURL=subtask-tools.js.map