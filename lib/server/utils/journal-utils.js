import * as fs from "node:fs";
import * as path from "node:path";
import { getProjectRoot } from "./task-utils.js";
// ============ 常量 ============
const WORKSPACE_ROOT = ".trellis/workspace";
const MAX_LINES_PER_FILE = 2000;
const DEFAULT_USER = "default";
// ============ 工具函数 ============
/**
 * 获取用户 journal 目录
 * 按 architecture §6.4，journal 文件位于 .trellis/workspace/{user}/
 * @param user - 用户名，默认为 'default'
 * @returns journal 目录的绝对路径
 */
function getJournalDir(user = DEFAULT_USER) {
    // 防止路径遍历攻击
    if (user.includes("..") || user.includes("/") || user.includes("\\")) {
        throw new Error(`非法的用户名: ${user}`);
    }
    const projectRoot = getProjectRoot();
    // 修复: journal 文件应位于 .trellis/workspace/{user}/，而非 .trellis/workspace/journal/{user}/
    const journalDir = path.join(projectRoot, WORKSPACE_ROOT, user);
    return journalDir;
}
/**
 * 获取最新（或当前活跃）的 journal 文件路径
 * 返回当前正在写入的文件（最高页码的文件，或 journal.md 如果不存在编号文件）
 * @param user - 用户名，默认为 'default'
 * @returns 最新 journal 文件的绝对路径
 */
function getLatestJournalFile(user = DEFAULT_USER) {
    const journalDir = getJournalDir(user);
    // 确保 journal 目录存在
    if (!fs.existsSync(journalDir)) {
        fs.mkdirSync(journalDir, { recursive: true });
    }
    // 列出所有 journal 文件并按页码排序（从高到低）
    // journal.md = page 0, journal-1.md = page 1, journal-2.md = page 2, ...
    const entries = fs.readdirSync(journalDir);
    const journalFiles = entries
        .filter((name) => name.startsWith("journal") && name.endsWith(".md"))
        .map((name) => {
        if (name === "journal.md") {
            return { name, page: 0 };
        }
        const match = name.match(/journal-(\d+)\.md/);
        return match ? { name, page: parseInt(match[1], 10) } : null;
    })
        .filter((item) => item !== null)
        .sort((a, b) => b.page - a.page); // 降序排列，最高页码在前
    // 如果存在文件，返回最高页码的文件（正在写入的文件）
    if (journalFiles.length > 0) {
        return path.join(journalDir, journalFiles[0].name);
    }
    // 否则返回默认 journal.md 路径
    return path.join(journalDir, "journal.md");
}
/**
 * 获取下一个编号的 journal 文件名
 * @param journalDir - journal 目录路径
 * @returns 下一个编号的文件名（如 journal-1.md）
 */
function getNextJournalFileName(journalDir) {
    const entries = fs.readdirSync(journalDir);
    const numberedFiles = entries
        .filter((name) => name.startsWith("journal-") && name.endsWith(".md"))
        .map((name) => {
        const match = name.match(/journal-(\d+)\.md/);
        return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = numberedFiles.length > 0 ? Math.max(...numberedFiles) : 0;
    const nextNumber = maxNumber + 1;
    return `journal-${nextNumber}.md`;
}
/**
 * 计算文件的行数
 * @param filePath - 文件路径
 * @returns 文件行数
 */
function getFileLineCount(filePath) {
    if (!fs.existsSync(filePath)) {
        return 0;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split("\n").length;
}
/**
 * 追加日志条目到 journal 文件
 * 如果当前文件超过 MAX_LINES_PER_FILE，自动创建新文件
 * @param entry - 日志条目
 * @param user - 用户名，默认为 'default'
 */
function appendJournalEntry(entry, user = DEFAULT_USER) {
    const journalDir = getJournalDir(user);
    let journalFile = getLatestJournalFile(user);
    // 确保 journal 目录存在
    if (!fs.existsSync(journalDir)) {
        fs.mkdirSync(journalDir, { recursive: true });
    }
    // 检查当前文件行数
    const currentLineCount = getFileLineCount(journalFile);
    const entryContent = serializeJournalEntry(entry);
    // 如果超过最大行数，创建新文件
    if (currentLineCount + entryContent.split("\n").length > MAX_LINES_PER_FILE) {
        const newFileName = getNextJournalFileName(journalDir);
        journalFile = path.join(journalDir, newFileName);
    }
    // 追加条目
    const separator = fs.existsSync(journalFile) && getFileLineCount(journalFile) > 0 ? "\n" : "";
    fs.appendFileSync(journalFile, separator + entryContent + "\n");
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
 * 序列化单个日志条目为 YAML frontmatter 格式
 * @param entry - 日志条目
 * @returns 序列化后的字符串
 */
function serializeJournalEntry(entry) {
    const lines = ["---"];
    // date
    lines.push(`date: ${entry.date}`);
    // tags - 转义包含特殊字符的标签
    if (entry.tags && entry.tags.length > 0) {
        const tagsStr = entry.tags.map((t) => escapeYamlString(t)).join(", ");
        lines.push(`tags: [${tagsStr}]`);
    }
    // tasks_touched - 转义包含特殊字符的任务 ID
    if (entry.tasks_touched && entry.tasks_touched.length > 0) {
        const tasksStr = entry.tasks_touched
            .map((t) => escapeYamlString(t))
            .join(", ");
        lines.push(`tasks_touched: [${tasksStr}]`);
    }
    lines.push("---");
    lines.push("");
    lines.push(entry.content);
    return lines.join("\n");
}
/**
 * 解析 journal 文件中的所有条目
 * 条目由 YAML frontmatter 包裹，使用 `---` 作为开始和结束标记
 * @param content - journal 文件内容
 * @returns 解析后的日志条目列表
 */
function parseJournalEntries(content) {
    const entries = [];
    let state = "outside_entry";
    let currentEntry = {
        date: "",
        tags: [],
        tasks_touched: [],
        content: "",
    };
    let frontmatterLines = [];
    let bodyLines = [];
    const lines = content.split("\n");
    // 使用索引迭代，以支持 body 状态下的 lookahead
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed === "---") {
            if (state === "outside_entry") {
                // 遇到第一个 ---，进入 frontmatter
                state = "in_frontmatter";
                frontmatterLines = [];
                bodyLines = [];
            }
            else if (state === "in_frontmatter") {
                // 遇到第二个 ---，frontmatter 结束，进入 body
                state = "in_body";
                // 解析 frontmatter
                currentEntry = parseFrontmatterLines(frontmatterLines);
            }
            else if (state === "in_body") {
                // 在 body 中遇到 ---：预查下一行是否为合法 frontmatter key
                // 只有确认是新条目头部（如 date:）才切分，否则视为 Markdown 分隔线
                const nextNonEmpty = findNextNonEmptyLine(lines, i + 1);
                if (nextNonEmpty !== null && isFrontmatterKey(nextNonEmpty)) {
                    // 确认是新条目，保存当前条目并开始新 frontmatter
                    currentEntry.content = bodyLines.join("\n").trim();
                    if (currentEntry.date || currentEntry.content) {
                        entries.push(currentEntry);
                    }
                    // 重置状态
                    state = "in_frontmatter";
                    frontmatterLines = [];
                    bodyLines = [];
                    currentEntry = {
                        date: "",
                        tags: [],
                        tasks_touched: [],
                        content: "",
                    };
                }
                else {
                    // 不是新条目，--- 作为 body 内容保留
                    bodyLines.push(line);
                }
            }
        }
        else {
            if (state === "in_frontmatter") {
                frontmatterLines.push(line);
            }
            else if (state === "in_body") {
                bodyLines.push(line);
            }
        }
    }
    // 处理最后一个条目（文件可能不以 --- 结尾）
    if (state === "in_body") {
        currentEntry.content = bodyLines.join("\n").trim();
        if (currentEntry.date || currentEntry.content) {
            entries.push(currentEntry);
        }
    }
    return entries;
}
/**
 * 从指定索引开始，查找下一个非空行
 * @param lines - 行数组
 * @param startIdx - 起始索引
 * @returns 非空行内容（trimmed），如果到末尾都未找到则返回 null
 */
function findNextNonEmptyLine(lines, startIdx) {
    for (let j = startIdx; j < lines.length; j++) {
        const t = lines[j].trim();
        if (t)
            return t;
    }
    return null;
}
/**
 * 判断一行是否为合法的 journal frontmatter key
 * 目前支持的 key：date, tags, tasks_touched
 */
function isFrontmatterKey(line) {
    return /^(date|tags|tasks_touched)\s*:/.test(line);
}
/**
 * 解析 frontmatter 行数组，返回 JournalEntry
 * @param lines - frontmatter 行数组
 * @returns 解析后的日志条目（不包含 content）
 */
function parseFrontmatterLines(lines) {
    const entry = {
        date: "",
        tags: [],
        tasks_touched: [],
        content: "",
    };
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        const colonIndex = trimmed.indexOf(":");
        if (colonIndex === -1) {
            continue;
        }
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        if (key === "date") {
            entry.date = value.replace(/^["']|["']$/g, "");
        }
        else if (key === "tags") {
            // 解析数组格式 [item1, item2]
            const arrayMatch = value.match(/^\[(.*)\]$/);
            if (arrayMatch) {
                entry.tags = arrayMatch[1]
                    .split(",")
                    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
                    .filter(Boolean);
            }
        }
        else if (key === "tasks_touched") {
            const arrayMatch = value.match(/^\[(.*)\]$/);
            if (arrayMatch) {
                entry.tasks_touched = arrayMatch[1]
                    .split(",")
                    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
                    .filter(Boolean);
            }
        }
    }
    return entry;
}
/**
 * 搜索日志条目
 * @param query - 搜索查询选项
 * @param user - 用户名，默认为 'default'
 * @returns 匹配的日志条目列表
 */
function searchJournal(query, user = DEFAULT_USER) {
    const journalDir = getJournalDir(user);
    if (!fs.existsSync(journalDir)) {
        return [];
    }
    // 获取所有 journal 文件并按页码排序（从高到低）
    // journal.md = page 0, journal-1.md = page 1, journal-2.md = page 2, ...
    const entries = fs.readdirSync(journalDir);
    const journalFiles = entries
        .filter((name) => name.startsWith("journal") && name.endsWith(".md"))
        .map((name) => {
        if (name === "journal.md") {
            return { name, page: 0 };
        }
        const match = name.match(/journal-(\d+)\.md/);
        return match ? { name, page: parseInt(match[1], 10) } : null;
    })
        .filter((item) => item !== null)
        .sort((a, b) => b.page - a.page); // 降序排列，从最高页码开始读取
    // 解析所有条目（从最新文件开始读取）
    const allEntries = [];
    for (const file of journalFiles) {
        const filePath = path.join(journalDir, file.name);
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = parseJournalEntries(content);
        // 将当前文件的条目反转，使文件内最新的条目排在前面
        allEntries.push(...parsed.reverse());
    }
    // 过滤条目
    const filtered = allEntries.filter((entry) => {
        // 标签过滤
        if (query.tags && query.tags.length > 0) {
            const hasAllTags = query.tags.every((tag) => entry.tags.includes(tag));
            if (!hasAllTags) {
                return false;
            }
        }
        // 关键词过滤
        if (query.keywords && query.keywords.length > 0) {
            const contentLower = entry.content.toLowerCase();
            const hasAllKeywords = query.keywords.every((kw) => contentLower.includes(kw.toLowerCase()));
            if (!hasAllKeywords) {
                return false;
            }
        }
        // 日期范围过滤
        if (query.date_range) {
            const entryDate = new Date(entry.date);
            if (query.date_range.from) {
                const fromDate = new Date(query.date_range.from);
                if (entryDate < fromDate) {
                    return false;
                }
            }
            if (query.date_range.to) {
                const toDate = new Date(query.date_range.to);
                if (entryDate > toDate) {
                    return false;
                }
            }
        }
        return true;
    });
    return filtered;
}
/**
 * 获取最新的 N 条日志条目（跨所有用户目录）
 * 扫描 .trellis/workspace/ 下所有用户目录，合并所有 journal 条目，
 * 按日期倒序排列（最新的在前），返回前 count 条。
 * 修复: 不再依赖 user 参数，避免读写目录不一致导致读取旧数据。
 * @param count - 获取的条目数量，默认为 10
 * @returns 最新的日志条目列表（跨所有用户）
 */
function getLatestEntries(count = 10) {
    const projectRoot = getProjectRoot();
    const workspaceDir = path.join(projectRoot, WORKSPACE_ROOT);
    if (!fs.existsSync(workspaceDir)) {
        return [];
    }
    // 扫描所有用户目录
    const userDirs = fs
        .readdirSync(workspaceDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
    // 合并所有用户的 journal 条目
    const allEntries = [];
    for (const user of userDirs) {
        try {
            const userEntries = searchJournal({}, user);
            allEntries.push(...userEntries);
        }
        catch {
            // 跳过无法读取的用户目录
            continue;
        }
    }
    // 按日期倒序排列（searchJournal 已按文件内顺序排列，这里做跨用户合并排序）
    allEntries.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
    });
    return allEntries.slice(0, count);
}
export { WORKSPACE_ROOT, MAX_LINES_PER_FILE, DEFAULT_USER, getJournalDir, getLatestJournalFile, appendJournalEntry, parseJournalEntries, searchJournal, getLatestEntries, };
//# sourceMappingURL=journal-utils.js.map