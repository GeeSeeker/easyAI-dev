import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { getProjectRoot } from "./task-utils.js";
// ============ 核心函数 ============
/**
 * 计算文件内容的 SHA256 哈希值
 * @param filePath - 文件绝对路径
 * @returns 格式为 "sha256:xxxx" 的哈希字符串
 */
function computeContentHash(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    return `sha256:${hash}`;
}
/**
 * 将 URI 解析为文件系统绝对路径
 * 支持 trellis:// 和 spec:// 协议
 * @param uri - 资源 URI
 * @returns 文件绝对路径，无法解析时返回 null
 */
function resolveUriToPath(uri) {
    // 防御 undefined：context.jsonl 条目可能使用 path 字段而非 uri
    if (!uri)
        return null;
    const projectRoot = getProjectRoot();
    // 统一前缀：追加 sep 防止匹配兄弟目录如 spec-malicious/
    const specRoot = path.join(projectRoot, ".trellis", "spec") + path.sep;
    // spec:// 简写 → trellis://spec/...
    if (uri.startsWith("spec://")) {
        let specPath = uri.replace("spec://", "");
        // 规范化：去除已有 .md 后缀后统一追加，防止 .md.md
        if (specPath.endsWith(".md")) {
            specPath = specPath.slice(0, -3);
        }
        const fullPath = path.resolve(projectRoot, ".trellis", "spec", `${specPath}.md`);
        if (!fullPath.startsWith(specRoot))
            return null;
        return fs.existsSync(fullPath) ? fullPath : null;
    }
    // trellis://spec/{category}/{name}
    if (uri.startsWith("trellis://spec/")) {
        let specPath = uri.replace("trellis://spec/", "");
        // 规范化：去除已有 .md 后缀后统一追加，防止 .md.md
        if (specPath.endsWith(".md")) {
            specPath = specPath.slice(0, -3);
        }
        const fullPath = path.resolve(projectRoot, ".trellis", "spec", `${specPath}.md`);
        if (!fullPath.startsWith(specRoot))
            return null;
        return fs.existsSync(fullPath) ? fullPath : null;
    }
    return null;
}
/**
 * 解析 context.jsonl 文件
 * 每行一条 JSON 记录，跳过空行和解析失败的行
 * @param jsonlPath - context.jsonl 文件绝对路径
 * @returns 解析后的条目数组
 */
function parseContextJsonl(jsonlPath) {
    const content = fs.readFileSync(jsonlPath, "utf-8");
    const entries = [];
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        try {
            entries.push(JSON.parse(trimmed));
        }
        catch (err) {
            // 记录解析失败的行，便于排查 context.jsonl 格式错误
            console.warn(`[hash-utils] context.jsonl 解析失败，跳过该行: ${trimmed.substring(0, 80)}`);
        }
    }
    return entries;
}
/**
 * 生成 Phase-Frozen 快照
 * 读取任务目录下的 context.jsonl，为每条 URI 条目计算 content_hash，
 * 填入 frozen_at 时间戳，写入 context-snapshot-{phase}.jsonl
 *
 * @param taskDir - 任务目录绝对路径
 * @param phase - 阶段标识（如 "implement"）
 * @returns 快照结果，context.jsonl 不存在时返回 null
 */
function generateSnapshot(taskDir, phase) {
    const contextPath = path.join(taskDir, "context.jsonl");
    if (!fs.existsSync(contextPath)) {
        return null;
    }
    const entries = parseContextJsonl(contextPath);
    const frozenAt = new Date().toISOString();
    // 为每条记录计算 content_hash 并设置 frozen_at
    const frozenEntries = entries.map((entry) => {
        // 兼容两种格式：uri（spec:// / trellis://）和 path（相对路径）
        let filePath = resolveUriToPath(entry.uri);
        if (!filePath && entry.path) {
            const absPath = path.resolve(getProjectRoot(), entry.path);
            if (fs.existsSync(absPath)) {
                filePath = absPath;
            }
        }
        const contentHash = filePath
            ? computeContentHash(filePath)
            : entry.content_hash || "";
        return {
            ...entry,
            content_hash: contentHash,
            frozen_at: frozenAt,
        };
    });
    // 写入快照文件
    const snapshotPath = path.join(taskDir, `context-snapshot-${phase}.jsonl`);
    const snapshotContent = frozenEntries
        .map((e) => JSON.stringify(e))
        .join("\n");
    fs.writeFileSync(snapshotPath, snapshotContent + "\n", "utf-8");
    return {
        snapshotPath,
        entriesCount: frozenEntries.length,
        frozenAt,
    };
}
/**
 * Stale 检测 — 比对快照中每条记录的 content_hash 与当前文件 hash
 * @param snapshotPath - 快照文件绝对路径
 * @returns stale 检测结果
 */
function checkStale(snapshotPath) {
    if (!fs.existsSync(snapshotPath)) {
        return { totalEntries: 0, staleEntries: [], allFresh: true };
    }
    const entries = parseContextJsonl(snapshotPath);
    const staleEntries = [];
    for (const entry of entries) {
        if (!entry.content_hash)
            continue;
        // 兼容两种格式：uri 和 path
        let filePath = resolveUriToPath(entry.uri);
        if (!filePath && entry.path) {
            const absPath = path.resolve(getProjectRoot(), entry.path);
            if (fs.existsSync(absPath)) {
                filePath = absPath;
            }
        }
        const entryIdentifier = entry.uri || entry.path || "unknown";
        // 文件已删除或重命名 → 标记为 stale（漂移的最严重形式）
        if (!filePath) {
            staleEntries.push({
                uri: entryIdentifier,
                snapshotHash: entry.content_hash,
                currentHash: "deleted",
            });
            continue;
        }
        const currentHash = computeContentHash(filePath);
        if (currentHash !== entry.content_hash) {
            staleEntries.push({
                uri: entry.uri ?? entry.path ?? "",
                snapshotHash: entry.content_hash,
                currentHash,
            });
        }
    }
    return {
        totalEntries: entries.length,
        staleEntries,
        allFresh: staleEntries.length === 0,
    };
}
export { computeContentHash, resolveUriToPath, parseContextJsonl, generateSnapshot, checkStale, };
//# sourceMappingURL=hash-utils.js.map