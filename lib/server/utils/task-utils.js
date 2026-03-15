import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { getConfig } from "./config-loader.js";
// ============ 常量 ============
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TRELLIS_ROOT = ".trellis";
/** 默认值，运行时从 config.yaml 读取 */
const DEFAULT_TASKS_ROOT = ".trellis/tasks";
const DEFAULT_ARCHIVE_ROOT = ".trellis/tasks/archive";
/**
 * 合法状态转移矩阵（来自 architecture §5.2）
 * Key: 当前状态, Value: 允许转移到的状态列表
 */
const VALID_TRANSITIONS = {
    pending: ["in_progress", "cancelled"],
    in_progress: ["under_review", "cancelled"],
    under_review: ["completed", "rejected", "cancelled"],
    completed: ["archived", "cancelled"],
    archived: [],
    cancelled: [],
    rejected: ["in_progress", "cancelled"],
};
// ============ 缓存 ============
let projectRootCache = null;
// ============ 工具函数 ============
/**
 * 获取项目根目录
 * 检测优先级：
 *   1. EASYAI_PROJECT_ROOT 环境变量（显式指定）
 *   2. process.cwd() 向上遍历查找 .trellis（IDE 工作目录在项目内时有效）
 *   3. __dirname 向上遍历查找 .trellis（MCP Server 安装在项目 node_modules 内时有效）
 * @returns 项目根目录的绝对路径
 */
function getProjectRoot() {
    if (projectRootCache) {
        return projectRootCache;
    }
    // 策略 1：优先使用环境变量（支持全局 MCP Server 模式）
    const envRoot = process.env.EASYAI_PROJECT_ROOT;
    if (envRoot) {
        const resolvedRoot = path.resolve(envRoot);
        if (fs.existsSync(path.join(resolvedRoot, TRELLIS_ROOT)) &&
            fs.statSync(path.join(resolvedRoot, TRELLIS_ROOT)).isDirectory()) {
            projectRootCache = resolvedRoot;
            return resolvedRoot;
        }
        throw new Error(`EASYAI_PROJECT_ROOT 指向的目录不包含 ${TRELLIS_ROOT}: ${resolvedRoot}`);
    }
    // 策略 2：从 process.cwd() 向上遍历
    const cwdResult = findTrellisUpward(process.cwd());
    if (cwdResult) {
        projectRootCache = cwdResult;
        return cwdResult;
    }
    // 策略 3：从 __dirname（MCP Server 可执行文件所在目录）向上遍历
    // 适用场景：MCP Server 安装在项目的 node_modules/ 或 packages/ 下
    const dirnameResult = findTrellisUpward(__dirname);
    if (dirnameResult) {
        projectRootCache = dirnameResult;
        return dirnameResult;
    }
    throw new Error(`无法找到项目根目录：未找到 ${TRELLIS_ROOT} 目录。` +
        `已尝试：cwd(${process.cwd()}) 和 __dirname(${__dirname}) 向上遍历。` +
        `请设置环境变量 EASYAI_PROJECT_ROOT 指向项目根目录，` +
        `或确保 MCP Server 从项目目录内启动。`);
}
/**
 * 从指定目录向上遍历查找包含 .trellis 的目录
 * @param startDir - 起始目录
 * @returns 找到的项目根目录路径，未找到返回 null
 */
function findTrellisUpward(startDir) {
    let currentDir = startDir;
    while (currentDir !== path.parse(currentDir).root) {
        const trellisPath = path.join(currentDir, TRELLIS_ROOT);
        if (fs.existsSync(trellisPath) && fs.statSync(trellisPath).isDirectory()) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}
/**
 * 重置项目根目录缓存
 * 仅供测试和极端场景使用
 */
function resetProjectRootCache() {
    projectRootCache = null;
}
/**
 * 获取任务目录绝对路径
 * @returns 任务目录的绝对路径
 */
function getTasksDir() {
    const projectRoot = getProjectRoot();
    const tasksRoot = getConfig().tasks.root;
    return path.join(projectRoot, tasksRoot);
}
/**
 * 获取归档目录绝对路径
 * @returns 归档目录的绝对路径
 */
function getArchiveDir() {
    const projectRoot = getProjectRoot();
    const archiveRoot = getConfig().tasks.archive;
    return path.join(projectRoot, archiveRoot);
}
/**
 * 获取指定任务的目录路径
 * @param taskId - 任务 ID（如 T001-login-api）
 * @returns 任务目录的绝对路径
 */
function getTaskDir(taskId) {
    // 防止路径遍历攻击
    if (taskId.includes("..") || taskId.includes("/") || taskId.includes("\\")) {
        throw new Error(`非法的任务 ID: ${taskId}`);
    }
    const tasksDir = getTasksDir();
    return path.join(tasksDir, taskId);
}
/**
 * 将文本转换为 kebab-case slug
 * - 转换为小写 ASCII
 * - 将空格和特殊字符替换为连字符
 * - 截断至 30 个字符
 * @param text - 输入文本（支持中文和英文）
 * @returns kebab-case slug
 */
function slugify(text) {
    // 转换为小写
    let result = text.toLowerCase();
    // 将中文字符和特殊字符转换为连字符（保留字母数字）
    result = result.replace(/[^\w\u4e00-\u9fff]+/g, "-");
    // 将连续的连字符压缩为单个
    result = result.replace(/-+/g, "-");
    // 移除首尾的连字符
    result = result.replace(/^-+|-+$/g, "");
    // 截断至 30 个字符
    if (result.length > 30) {
        result = result.substring(0, 30);
        // 确保不以连字符结尾
        result = result.replace(/-+$/, "");
    }
    // 如果结果为空，使用默认值
    if (!result) {
        result = "task";
    }
    return result;
}
/**
 * 生成任务 ID（格式：T{NNN}-{slug}）
 * 自动递增序号，基于现有任务目录（包括归档目录中的任务）
 * @param title - 任务标题
 * @returns 任务 ID（如 T001-login-api）
 */
function generateTaskId(title) {
    const slug = slugify(title);
    const tasksDir = getTasksDir();
    const archiveDir = getArchiveDir();
    ensureDir(tasksDir);
    let maxNumber = 0;
    // 扫描活动任务目录
    try {
        const taskDirs = listTaskDirs();
        for (const dirName of taskDirs) {
            const match = dirName.match(/^T(\d+)-/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNumber) {
                    maxNumber = num;
                }
            }
        }
    }
    catch (error) {
        // 如果无法列出目录，继续扫描归档目录
    }
    // 扫描归档目录中的任务，防止 ID 重用
    try {
        if (fs.existsSync(archiveDir)) {
            const archiveEntries = fs.readdirSync(archiveDir, {
                withFileTypes: true,
            });
            for (const entry of archiveEntries) {
                if (entry.isDirectory()) {
                    const match = entry.name.match(/^T(\d+)-/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num > maxNumber) {
                            maxNumber = num;
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        // 如果无法扫描归档目录，使用当前 maxNumber
    }
    const nextNumber = maxNumber + 1;
    const numberPart = nextNumber.toString().padStart(3, "0");
    return `T${numberPart}-${slug}`;
}
/**
 * 解析 YAML frontmatter
 * 简单的正则表达式解析器，无需外部库
 * 支持多行块标量（block scalar）语法
 * @param content - 文档内容
 * @returns 解析后的键值对对象
 */
function parseFrontmatter(content) {
    const result = {};
    // 移除开头的 ---
    const trimmed = content.trim();
    if (!trimmed.startsWith("---")) {
        return result;
    }
    // 查找结尾的 ---
    const endIndex = trimmed.indexOf("\n---", 4);
    if (endIndex === -1) {
        return result;
    }
    const frontmatterText = trimmed.substring(4, endIndex);
    // 逐行解析
    const lines = frontmatterText.split("\n");
    let i = 0;
    while (i < lines.length) {
        const trimmedLine = lines[i].trim();
        if (!trimmedLine || trimmedLine.startsWith("#")) {
            i++;
            continue;
        }
        // 解析 key: value 格式
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex === -1) {
            i++;
            continue;
        }
        const key = trimmedLine.substring(0, colonIndex).trim();
        const restOfLine = trimmedLine.substring(colonIndex + 1).trim();
        // 检查是否是块标量（key: | 或 key: >）
        if (restOfLine === "|" || restOfLine === ">") {
            // 多行块标量：收集后续缩进行
            const blockLines = [];
            i++;
            // 读取所有缩进的行（至少有一个空格或为空行）
            while (i < lines.length) {
                const line = lines[i];
                if (line === "" || line.startsWith(" ") || line.startsWith("\t")) {
                    // 移除统一缩进（每行前面的空格）
                    if (line !== "") {
                        // 找到最小缩进量，然后移除
                        const leadingSpaces = line.match(/^\s*/)?.[0]?.length || 0;
                        blockLines.push(line.substring(Math.min(leadingSpaces, 2))); // 保留最多 2 个空格的缩进
                    }
                    else {
                        blockLines.push(""); // 保留空行
                    }
                    i++;
                }
                else {
                    // 遇到非缩进行，块标量结束
                    break;
                }
            }
            result[key] = blockLines.join("\n");
            continue;
        }
        let value = restOfLine;
        // 处理带引号的字符串
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        // 处理数组格式 [item1, item2]
        else if (value.startsWith("[") && value.endsWith("]")) {
            value = value
                .slice(1, -1)
                .split(",")
                .map((item) => item.trim().replace(/^["']|["']$/g, ""));
        }
        result[key] = value;
        i++;
    }
    return result;
}
/**
 * 转义 YAML 字符串值
 * 对于包含特殊字符的字符串，使用单引号包裹并转义内部单引号
 * @param value - 原始字符串值
 * @returns 转义后的字符串
 */
function escapeYamlString(value) {
    // 如果字符串包含特殊字符，使用单引号包裹并转义内部单引号
    const specialChars = ['"', "\\", ":", "#"];
    const hasSpecialChar = specialChars.some((char) => value.includes(char));
    if (hasSpecialChar) {
        // 单引号包裹：内部单引号通过双写转义（' → ''）
        return `'${value.replace(/'/g, "''")}'`;
    }
    return value;
}
/**
 * 序列化为 YAML frontmatter 格式
 * 支持多行字符串使用块标量语法
 * @param data - 要序列化的对象
 * @returns YAML frontmatter 字符串
 */
function serializeFrontmatter(data) {
    const lines = ["---"];
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null) {
            continue;
        }
        if (Array.isArray(value)) {
            // 数组元素也需要转义特殊字符
            const arrayStr = value
                .map((v) => `"${String(v).replace(/"/g, '\\"')}"`)
                .join(", ");
            lines.push(`${key}: [${arrayStr}]`);
        }
        else if (typeof value === "string") {
            // 如果字符串包含换行符，使用 YAML 块标量
            if (value.includes("\n")) {
                lines.push(`${key}: |`);
                for (const valueLine of value.split("\n")) {
                    lines.push(`  ${valueLine}`);
                }
            }
            else {
                // 使用转义函数处理特殊字符
                const escapedValue = escapeYamlString(value);
                lines.push(`${key}: ${escapedValue}`);
            }
        }
        else if (typeof value === "boolean" || typeof value === "number") {
            lines.push(`${key}: ${value}`);
        }
    }
    lines.push("---");
    return lines.join("\n");
}
/**
 * 解析 task.md 文件内容
 * @param content - task.md 文件内容
 * @returns 解析后的元数据和正文
 */
function parseTaskMd(content) {
    const frontmatter = parseFrontmatter(content);
    // 提取正文（在 frontmatter 之后）
    const trimmed = content.trim();
    const endMatch = trimmed.match(/\n---\n/);
    let body = "";
    if (endMatch && endMatch.index !== undefined) {
        body = trimmed.substring(endMatch.index + 5).trim();
    }
    const metadata = {
        id: String(frontmatter.id || ""),
        title: String(frontmatter.title || ""),
        status: frontmatter.status || "pending",
        description: String(frontmatter.description || ""),
        acceptance_criteria: String(frontmatter.acceptance_criteria || ""),
        file_scope: frontmatter.file_scope
            ? String(frontmatter.file_scope)
            : undefined,
        assign_strategy: frontmatter.assign_strategy
            ? String(frontmatter.assign_strategy)
            : undefined,
        worktree_path: frontmatter.worktree_path
            ? String(frontmatter.worktree_path)
            : undefined,
        worktree_branch: frontmatter.worktree_branch
            ? String(frontmatter.worktree_branch)
            : undefined,
        worktree_base_branch: frontmatter.worktree_base_branch
            ? String(frontmatter.worktree_base_branch)
            : undefined,
        created_at: String(frontmatter.created_at || new Date().toISOString()),
        updated_at: String(frontmatter.updated_at || new Date().toISOString()),
    };
    return { metadata, body };
}
/**
 * 序列化为 task.md 文件格式
 * @param metadata - 任务元数据
 * @param body - 任务正文
 * @returns task.md 文件内容
 */
function serializeTaskMd(metadata, body) {
    const frontmatterData = {
        id: metadata.id,
        title: metadata.title,
        status: metadata.status,
        description: metadata.description,
        acceptance_criteria: metadata.acceptance_criteria,
        created_at: metadata.created_at,
        updated_at: metadata.updated_at,
    };
    if (metadata.file_scope) {
        frontmatterData.file_scope = metadata.file_scope;
    }
    if (metadata.assign_strategy) {
        frontmatterData.assign_strategy = metadata.assign_strategy;
    }
    if (metadata.worktree_path) {
        frontmatterData.worktree_path = metadata.worktree_path;
    }
    if (metadata.worktree_branch) {
        frontmatterData.worktree_branch = metadata.worktree_branch;
    }
    if (metadata.worktree_base_branch) {
        frontmatterData.worktree_base_branch = metadata.worktree_base_branch;
    }
    const frontmatter = serializeFrontmatter(frontmatterData);
    return `${frontmatter}\n\n${body}`;
}
/**
 * 校验状态转移是否合法
 * @param from - 当前状态
 * @param to - 目标状态
 * @returns 是否允许转移
 */
function isValidTransition(from, to) {
    const allowed = VALID_TRANSITIONS[from] || [];
    return allowed.includes(to);
}
/**
 * 列出所有任务目录（排除归档目录）
 * @returns 任务目录名列表
 */
function listTaskDirs() {
    const tasksDir = getTasksDir();
    if (!fs.existsSync(tasksDir)) {
        return [];
    }
    const entries = fs.readdirSync(tasksDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isDirectory() && entry.name !== "archive")
        .map((entry) => entry.name)
        .sort();
}
/**
 * 确保目录存在，不存在则创建
 * @param dirPath - 目录路径
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
export { TRELLIS_ROOT, DEFAULT_TASKS_ROOT, DEFAULT_ARCHIVE_ROOT, VALID_TRANSITIONS, getProjectRoot, resetProjectRootCache, getTasksDir, getArchiveDir, getTaskDir, generateTaskId, slugify, parseTaskMd, serializeTaskMd, isValidTransition, listTaskDirs, ensureDir, };
//# sourceMappingURL=task-utils.js.map