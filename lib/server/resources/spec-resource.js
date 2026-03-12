import * as fs from "node:fs";
import * as path from "node:path";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProjectRoot } from "../utils/task-utils.js";
/**
 * 读取 spec 文件内容的共享逻辑
 * @param category - spec 分类（如 backend, frontend, guides）
 * @param name - spec 名称（不带 .md 后缀）
 * @param uriHref - 原始请求的 URI（用于响应）
 */
function readSpec(category, name, uriHref) {
    const projectRoot = getProjectRoot();
    // 路径遍历防护：拒绝包含 .. 或路径分隔符的参数
    if (category.includes("..") || category.includes("/") ||
        category.includes("\\") ||
        name.includes("..") || name.includes("/") || name.includes("\\")) {
        return {
            contents: [
                {
                    uri: uriHref,
                    text: JSON.stringify({
                        error: true,
                        message: "非法路径: category 和 name 不允许包含 '..' 或路径分隔符",
                    }),
                },
            ],
        };
    }
    // 防止 .md.md：如果 name 已含 .md 后缀则不再追加
    const fileName = name.endsWith(".md") ? name : `${name}.md`;
    const specRoot = path.join(projectRoot, ".trellis", "spec") + path.sep;
    const specPath = path.resolve(projectRoot, ".trellis", "spec", category, fileName);
    // 二次校验：确保解析后的路径仍在 spec 目录内
    if (!specPath.startsWith(specRoot)) {
        return {
            contents: [
                {
                    uri: uriHref,
                    text: JSON.stringify({
                        error: true,
                        message: "路径越界: 请求的路径超出 .trellis/spec/ 范围",
                    }),
                },
            ],
        };
    }
    // 检查 spec 文件是否存在
    if (!fs.existsSync(specPath)) {
        return {
            contents: [
                {
                    uri: uriHref,
                    text: JSON.stringify({
                        category,
                        name,
                        error: `规格文档不存在: ${specPath}`,
                    }),
                },
            ],
        };
    }
    // 读取 spec 文件内容
    const content = fs.readFileSync(specPath, "utf-8");
    return {
        contents: [
            {
                uri: uriHref,
                text: JSON.stringify({ category, name, path: specPath, content }, null, 2),
            },
        ],
    };
}
/**
 * 从 Variables 中提取字符串值
 * MCP SDK 的 Variables 类型为 Record<string, string | string[]>，
 * 此函数安全地提取第一个字符串值。
 */
function extractParam(variables, key) {
    const val = variables[key];
    if (Array.isArray(val))
        return val[0] ?? "";
    return val ?? "";
}
/**
 * spec resource handler 的共享错误处理包装
 */
function createSpecHandler() {
    return async (uri, variables) => {
        try {
            const category = extractParam(variables, "category");
            const name = extractParam(variables, "name");
            return readSpec(category, name, uri.href);
        }
        catch (error) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify({
                            error: true,
                            message: error instanceof Error ? error.message : String(error),
                        }),
                    },
                ],
            };
        }
    };
}
/**
 * 注册 spec 资源
 * 支持两种 URI 协议：
 *   1. trellis://spec/{category}/{name} — 完整路径
 *   2. spec://{category}/{name}         — 简写语法（自动展开）
 *
 * 两者读取相同的 .trellis/spec/{category}/{name}.md 文件。
 */
export function register(server) {
    // 完整路径：trellis://spec/{category}/{name}
    server.resource("规格文档", new ResourceTemplate("trellis://spec/{category}/{name}", {
        list: undefined,
    }), createSpecHandler());
    // 简写语法：spec://{category}/{name}
    // 等价于 trellis://spec/{category}/{name}
    server.resource("规格文档（简写）", new ResourceTemplate("spec://{category}/{name}", { list: undefined }), createSpecHandler());
}
//# sourceMappingURL=spec-resource.js.map