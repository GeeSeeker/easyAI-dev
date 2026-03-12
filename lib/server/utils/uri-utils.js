/**
 * 解析 trellis:// 自定义协议的 URI
 * trellis://tasks/T001/context → fullPath = "tasks/T001/context"
 * 包含路径规范化和安全校验
 * @param uri - URL 对象
 * @returns 规范化的完整路径（host + pathname）
 */
export function parseTrellisUri(uri) {
    const raw = (uri.host || "") + (uri.pathname || "");
    // 规范化：移除重复斜杠，去除前导/尾部斜杠
    const normalized = raw
        .replace(/\/+/g, "/")
        .replace(/^\//, "")
        .replace(/\/$/, "");
    // 安全校验：禁止路径遍历
    if (normalized.includes("..")) {
        throw new Error(`非法的 URI 路径: ${raw}`);
    }
    return normalized;
}
//# sourceMappingURL=uri-utils.js.map