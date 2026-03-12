/**
 * context.jsonl 中每条记录的结构
 */
interface ContextEntry {
    uri: string;
    phase?: string;
    priority?: string;
    reason?: string;
    confidence?: number;
    token_estimate?: number;
    source?: string;
    content_hash?: string;
    frozen_at?: string | null;
    stale?: boolean;
}
/**
 * 快照生成结果
 */
interface SnapshotResult {
    snapshotPath: string;
    entriesCount: number;
    frozenAt: string;
}
/**
 * Stale 检测结果
 */
interface StaleCheckResult {
    totalEntries: number;
    staleEntries: StaleEntry[];
    allFresh: boolean;
}
/**
 * 单条 stale 记录
 */
interface StaleEntry {
    uri: string;
    snapshotHash: string;
    currentHash: string;
}
/**
 * 计算文件内容的 SHA256 哈希值
 * @param filePath - 文件绝对路径
 * @returns 格式为 "sha256:xxxx" 的哈希字符串
 */
declare function computeContentHash(filePath: string): string;
/**
 * 将 URI 解析为文件系统绝对路径
 * 支持 trellis:// 和 spec:// 协议
 * @param uri - 资源 URI
 * @returns 文件绝对路径，无法解析时返回 null
 */
declare function resolveUriToPath(uri: string): string | null;
/**
 * 解析 context.jsonl 文件
 * 每行一条 JSON 记录，跳过空行和解析失败的行
 * @param jsonlPath - context.jsonl 文件绝对路径
 * @returns 解析后的条目数组
 */
declare function parseContextJsonl(jsonlPath: string): ContextEntry[];
/**
 * 生成 Phase-Frozen 快照
 * 读取任务目录下的 context.jsonl，为每条 URI 条目计算 content_hash，
 * 填入 frozen_at 时间戳，写入 context-snapshot-{phase}.jsonl
 *
 * @param taskDir - 任务目录绝对路径
 * @param phase - 阶段标识（如 "implement"）
 * @returns 快照结果，context.jsonl 不存在时返回 null
 */
declare function generateSnapshot(taskDir: string, phase: string): SnapshotResult | null;
/**
 * Stale 检测 — 比对快照中每条记录的 content_hash 与当前文件 hash
 * @param snapshotPath - 快照文件绝对路径
 * @returns stale 检测结果
 */
declare function checkStale(snapshotPath: string): StaleCheckResult;
export type { ContextEntry, SnapshotResult, StaleCheckResult, StaleEntry, };
export { computeContentHash, resolveUriToPath, parseContextJsonl, generateSnapshot, checkStale, };
//# sourceMappingURL=hash-utils.d.ts.map