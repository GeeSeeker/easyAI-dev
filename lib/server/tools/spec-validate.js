import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { getProjectRoot } from "../utils/task-utils.js";
// ============ 常量 ============
const SPEC_ROOT = ".trellis/spec";
const SPEC_SCHEMA_PATH = ".trellis/spec/spec-schema.json";
/**
 * 注册 spec_validate 工具
 * 依据 spec-schema.json 校验规范文件格式
 */
export function register(server) {
    server.tool("spec_validate", "依据 spec-schema.json 校验规范文件格式。检查必须字段（title, version, category）、版本号格式（SemVer）、枚举值合法性。", {
        file: z
            .string()
            .describe("规范文件相对路径（如 backend/api-design），不含 .md 后缀"),
    }, async ({ file }) => {
        try {
            const projectRoot = getProjectRoot();
            const specRoot = path.join(projectRoot, SPEC_ROOT) + path.sep;
            const specFilePath = path.resolve(specRoot, `${file}.md`);
            // 防止路径遍历攻击
            if (!specFilePath.startsWith(specRoot)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                valid: false,
                                file,
                                errors: [`非法路径: 不允许访问 ${SPEC_ROOT} 目录之外的文件`],
                            }),
                        },
                    ],
                };
            }
            // 检查文件是否存在
            if (!fs.existsSync(specFilePath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                valid: false,
                                file,
                                errors: [`规范文件不存在: ${specFilePath}`],
                            }),
                        },
                    ],
                };
            }
            // 读取 schema
            const schemaPath = path.join(projectRoot, SPEC_SCHEMA_PATH);
            if (!fs.existsSync(schemaPath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                valid: false,
                                file,
                                errors: ["spec-schema.json 不存在，无法校验"],
                            }),
                        },
                    ],
                };
            }
            const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
            // 读取文件内容，提取 YAML frontmatter
            const content = fs.readFileSync(specFilePath, "utf-8");
            const frontmatter = parseSpecFrontmatter(content);
            // 校验
            const errors = validateAgainstSchema(frontmatter, schema);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            valid: errors.length === 0,
                            file,
                            errors,
                            parsed_fields: Object.keys(frontmatter),
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
// ============ 辅助函数 ============
/**
 * 从 spec 文件中提取 YAML frontmatter
 * 简化解析，提取 key: value 对
 */
function parseSpecFrontmatter(content) {
    const result = {};
    const trimmed = content.trim();
    if (!trimmed.startsWith("---"))
        return result;
    const endIndex = trimmed.indexOf("\n---", 4);
    if (endIndex === -1)
        return result;
    const frontmatterText = trimmed.substring(4, endIndex);
    for (const line of frontmatterText.split("\n")) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("#"))
            continue;
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex === -1)
            continue;
        const key = trimmedLine.substring(0, colonIndex).trim();
        let value = trimmedLine.substring(colonIndex + 1).trim();
        // 去除引号
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        result[key] = value;
    }
    return result;
}
/**
 * 依据 Schema 校验 frontmatter
 */
function validateAgainstSchema(frontmatter, schema) {
    const errors = [];
    // 检查必须字段
    if (schema.required) {
        for (const field of schema.required) {
            if (!frontmatter[field]) {
                errors.push(`缺少必须字段: ${field}`);
            }
        }
    }
    // 检查字段格式
    if (schema.properties) {
        for (const [field, prop] of Object.entries(schema.properties)) {
            const value = frontmatter[field];
            if (!value)
                continue;
            // 正则匹配
            if (prop.pattern) {
                const regex = new RegExp(prop.pattern);
                if (!regex.test(value)) {
                    errors.push(`字段 ${field} 格式不符: 期望匹配 ${prop.pattern}，实际为 "${value}"`);
                }
            }
            // 枚举校验
            if (prop.enum && !prop.enum.includes(value)) {
                errors.push(`字段 ${field} 值不合法: 期望 [${prop.enum.join(", ")}]，实际为 "${value}"`);
            }
        }
    }
    return errors;
}
//# sourceMappingURL=spec-validate.js.map