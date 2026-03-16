import * as fs from "node:fs";
import * as path from "node:path";
import { getProjectRoot } from "./task-utils.js";
// ============ 默认值 ============
/**
 * 默认配置（config.yaml 不可用时的降级值）
 * 与 config.yaml 中的声明保持一致
 */
const DEFAULT_CONFIG = {
    context: {
        warningThreshold: 0.6,
        criticalThreshold: 0.8,
        phaseBudget: {
            plan: 40000,
            implement: 60000,
            check: 30000,
            debug: 50000,
        },
        autoDowngrade: true,
    },
    journal: {
        root: ".trellis/workspace",
        maxLinesPerFile: 2000,
        dateFormat: "YYYY-MM-DD",
    },
    tasks: {
        root: ".trellis/tasks",
        archive: ".trellis/tasks/archive",
        maxSubtasks: 10,
    },
    developer: {
        name: "default",
    },
};
// ============ 缓存 ============
let configCache = null;
// ============ YAML 解析 ============
/**
 * 轻量 YAML 解析器（仅支持 config.yaml 用到的结构）
 * 支持：嵌套对象（2 层）、字符串、数字、布尔值、注释、带引号的值
 * 不支持：数组（YAML list 语法）、多行字符串、锚点/别名
 * @param content - YAML 文件内容
 * @returns 解析后的嵌套对象
 */
function parseSimpleYaml(content) {
    const result = {};
    const lines = content.split("\n");
    let currentSection = null;
    for (const line of lines) {
        // 跳过空行和纯注释行
        const trimmed = line.trimEnd();
        if (!trimmed || trimmed.trim().startsWith("#")) {
            continue;
        }
        // 计算缩进深度
        const indent = line.length - line.trimStart().length;
        // 移除行内注释（但保留引号内的 #）
        const contentPart = removeInlineComment(trimmed.trim());
        if (!contentPart)
            continue;
        // 解析 key: value
        const colonIdx = contentPart.indexOf(":");
        if (colonIdx === -1)
            continue;
        const key = contentPart.substring(0, colonIdx).trim();
        const rawValue = contentPart.substring(colonIdx + 1).trim();
        if (indent === 0) {
            // 顶层 key
            if (rawValue === "" || rawValue === "|" || rawValue === ">") {
                // 这是一个 section 头（嵌套对象开始）
                currentSection = key;
                if (!result[key] || typeof result[key] !== "object") {
                    result[key] = {};
                }
            }
            else {
                // 顶层简单值
                currentSection = null;
                result[key] = parseYamlValue(rawValue);
            }
        }
        else if (indent >= 2 && currentSection) {
            // 嵌套 key（在某个 section 内）
            const section = result[currentSection];
            if (rawValue === "" || rawValue === "|" || rawValue === ">") {
                // 二级嵌套对象（如 context.phaseBudget）
                // 读取后续缩进更深的行
                section[key] = {};
            }
            else if (indent >= 4 && typeof section === "object") {
                // 三级嵌套值：找到正确的父级
                // 查找最近的二级 key（indent===2 且值为对象的 key）
                const parentKey = findParentKey(lines, lines.indexOf(line), indent);
                if (parentKey && typeof section[parentKey] === "object") {
                    const subSection = section[parentKey];
                    subSection[key] = parseYamlValue(rawValue);
                }
                else {
                    // 降级：直接放到 section 下
                    section[key] = parseYamlValue(rawValue);
                }
            }
            else {
                section[key] = parseYamlValue(rawValue);
            }
        }
    }
    return result;
}
/**
 * 在行数组中，从 targetIdx 向上查找缩进更浅的父级 key
 */
function findParentKey(lines, targetIdx, targetIndent) {
    for (let i = targetIdx - 1; i >= 0; i--) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            continue;
        const indent = line.length - line.trimStart().length;
        if (indent < targetIndent && indent >= 2) {
            const colonIdx = trimmed.indexOf(":");
            if (colonIdx > 0) {
                return trimmed.substring(0, colonIdx).trim();
            }
        }
        if (indent === 0)
            break; // 到了顶层，停止
    }
    return null;
}
/**
 * 移除 YAML 行内注释（# 后的内容），但保留引号内的 #
 */
function removeInlineComment(line) {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
        }
        else if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
        }
        else if (char === "#" && !inSingleQuote && !inDoubleQuote) {
            // 确保 # 前有空格（YAML 规范）
            if (i === 0 || line[i - 1] === " ") {
                return line.substring(0, i).trim();
            }
        }
    }
    return line;
}
/**
 * 解析 YAML 标量值（字符串、数字、布尔值）
 */
function parseYamlValue(raw) {
    // 空字符串
    if (!raw)
        return "";
    // 移除引号
    if ((raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))) {
        return raw.slice(1, -1);
    }
    // 布尔值
    if (raw === "true")
        return true;
    if (raw === "false")
        return false;
    // 数字
    const num = Number(raw);
    if (!isNaN(num) && raw !== "")
        return num;
    // 默认为字符串
    return raw;
}
// ============ 配置加载 ============
/**
 * 加载并解析 config.yaml
 * 配置不存在或解析失败时，返回默认值
 */
function loadConfig() {
    try {
        const projectRoot = getProjectRoot();
        const configPath = path.join(projectRoot, ".trellis", "config", "config.yaml");
        if (!fs.existsSync(configPath)) {
            return { ...DEFAULT_CONFIG };
        }
        const content = fs.readFileSync(configPath, "utf-8");
        const parsed = parseSimpleYaml(content);
        return mergeWithDefaults(parsed);
    }
    catch {
        // 解析失败时降级到默认值
        return { ...DEFAULT_CONFIG };
    }
}
/**
 * 将解析结果与默认值合并
 * 已解析的值覆盖默认值，未解析的保持默认
 */
function mergeWithDefaults(parsed) {
    const config = structuredClone(DEFAULT_CONFIG);
    // context 段
    const ctx = parsed.context;
    if (ctx && typeof ctx === "object") {
        if (typeof ctx.warningThreshold === "number") {
            config.context.warningThreshold = ctx.warningThreshold;
        }
        if (typeof ctx.criticalThreshold === "number") {
            config.context.criticalThreshold = ctx.criticalThreshold;
        }
        if (typeof ctx.auto_downgrade === "boolean") {
            config.context.autoDowngrade = ctx.auto_downgrade;
        }
        if (typeof ctx.autoDowngrade === "boolean") {
            config.context.autoDowngrade = ctx.autoDowngrade;
        }
        // phaseBudget 子对象
        const pb = ctx.phaseBudget;
        if (pb && typeof pb === "object") {
            for (const [phase, value] of Object.entries(pb)) {
                if (typeof value === "number") {
                    config.context.phaseBudget[phase] = value;
                }
            }
        }
    }
    // journal 段
    const jrn = parsed.journal;
    if (jrn && typeof jrn === "object") {
        if (typeof jrn.maxLinesPerFile === "number") {
            config.journal.maxLinesPerFile = jrn.maxLinesPerFile;
        }
        if (typeof jrn.root === "string") {
            config.journal.root = jrn.root;
        }
        if (typeof jrn.dateFormat === "string") {
            config.journal.dateFormat = jrn.dateFormat;
        }
    }
    // tasks 段
    const tsk = parsed.tasks;
    if (tsk && typeof tsk === "object") {
        if (typeof tsk.root === "string") {
            config.tasks.root = tsk.root;
        }
        if (typeof tsk.archive === "string") {
            config.tasks.archive = tsk.archive;
        }
        if (typeof tsk.max_subtasks === "number") {
            config.tasks.maxSubtasks = tsk.max_subtasks;
        }
        if (typeof tsk.maxSubtasks === "number") {
            config.tasks.maxSubtasks = tsk.maxSubtasks;
        }
    }
    // developer 段
    const dev = parsed.developer;
    if (dev && typeof dev === "object") {
        if (typeof dev.name === "string" && dev.name.trim() !== "") {
            config.developer.name = dev.name.trim();
        }
    }
    return config;
}
// ============ 公共 API ============
/**
 * 获取框架配置（带缓存）
 * 首次调用时加载 config.yaml，后续调用返回缓存
 * @returns 框架配置对象
 */
function getConfig() {
    if (!configCache) {
        configCache = loadConfig();
    }
    return configCache;
}
/**
 * 重置配置缓存
 * 仅供测试和极端场景使用（如配置文件热更新）
 */
function resetConfigCache() {
    configCache = null;
}
/**
 * 获取默认用户名（从 config.yaml 的 developer.name 读取）
 * journal 系统使用此值决定 workspace 文件夹名
 * @returns 开发者名字，未配置时返回 "default"
 */
function getDefaultUser() {
    return getConfig().developer.name;
}
// ============ 导出 ============
export { DEFAULT_CONFIG, getConfig, resetConfigCache, parseSimpleYaml, getDefaultUser, };
//# sourceMappingURL=config-loader.js.map