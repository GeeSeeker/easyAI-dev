/**
 * 解析 trellis:// 自定义协议的 URI
 * trellis://tasks/T001/context → fullPath = "tasks/T001/context"
 * 包含路径规范化和安全校验
 * @param uri - URL 对象
 * @returns 规范化的完整路径（host + pathname）
 */
export declare function parseTrellisUri(uri: URL): string;
//# sourceMappingURL=uri-utils.d.ts.map