import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { getProjectRoot, getTaskDir } from "../utils/task-utils.js";
// ============ 常量 ============
const SPEC_ROOT = ".trellis/spec";
/**
 * 各阶段的 priority 映射策略
 */
const PHASE_PRIORITY_MAP = {
    implement: {
        frontend: "required",
        backend: "required",
        guides: "recommended",
        general: "recommended",
    },
    check: {
        frontend: "recommended",
        backend: "recommended",
        guides: "required",
        general: "recommended",
    },
    debug: {
        frontend: "recommended",
        backend: "recommended",
        guides: "recommended",
        general: "deferred",
    },
    plan: {
        frontend: "recommended",
        backend: "recommended",
        guides: "required",
        general: "required",
    },
};
/**
 * 注册 context_generate 工具
 * 半自动生成 context.jsonl 推荐清单
 */
export function register(server) {
    server.tool("context_generate", "半自动生成 context.jsonl 推荐清单。分析任务描述，扫描 spec 目录，返回按 phase 分配 priority 的上下文条目。PM 审核后写入 context.jsonl。", {
        task_id: z.string().describe("任务 ID"),
        phase: z
            .string()
            .describe("阶段标识：plan / implement / check / debug"),
    }, async ({ task_id, phase }) => {
        try {
            const taskDir = getTaskDir(task_id);
            const taskMdPath = path.join(taskDir, "task.md");
            if (!fs.existsSync(taskMdPath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: true,
                                message: `任务 ${task_id} 的 task.md 不存在`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 读取任务描述，提取关键词
            const taskContent = fs.readFileSync(taskMdPath, "utf-8");
            const keywords = extractKeywords(taskContent);
            // 扫描 spec 目录
            const projectRoot = getProjectRoot();
            const specDir = path.join(projectRoot, SPEC_ROOT);
            const specFiles = scanSpecFiles(specDir);
            // 匹配并生成推荐清单
            const priorityMap = PHASE_PRIORITY_MAP[phase] || PHASE_PRIORITY_MAP.implement;
            const recommendations = specFiles.map((specFile) => {
                const { confidence, matchedKeywords: matchedKws } = calculateConfidence(specFile, keywords);
                const category = specFile.category;
                const priority = priorityMap[category] || "deferred";
                const tokenEstimate = Math.round(specFile.sizeBytes / 3);
                return {
                    uri: `trellis://spec/${specFile.relativePath}`,
                    phase,
                    priority: confidence > 0.1 ? priority : "deferred",
                    reason: `匹配关键词: ${matchedKws.join(", ") || "目录分类"}`,
                    confidence: Math.round(confidence * 100) / 100,
                    token_estimate: tokenEstimate,
                    source: "auto",
                    content_hash: "",
                    frozen_at: null,
                };
            });
            // 按置信度排序，过滤低置信度
            const filtered = recommendations
                .filter((r) => r.confidence > 0.1)
                .sort((a, b) => b.confidence - a.confidence);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            task_id,
                            phase,
                            total_specs_scanned: specFiles.length,
                            recommendations_count: filtered.length,
                            recommendations: filtered,
                            instruction: "请审核上述推荐清单，添加/删除/调整后写入任务目录的 context.jsonl",
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
 * 从任务内容中提取关键词
 */
function extractKeywords(content) {
    // 提取中文和英文关键词（去除常见停用词）
    const stopWords = new Set([
        "的", "了", "和", "是", "在", "有", "中", "为", "以",
        "the", "a", "an", "is", "are", "in", "of", "to", "for", "and",
        "with", "on", "at", "by", "from", "that", "this", "be", "as",
    ]);
    const words = content
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1 && !stopWords.has(w));
    // 去重
    return [...new Set(words)];
}
/**
 * 扫描 spec 目录下的所有 .md 文件
 */
function scanSpecFiles(specDir) {
    const results = [];
    if (!fs.existsSync(specDir)) {
        return results;
    }
    const categories = ["frontend", "backend", "guides", "general"];
    for (const category of categories) {
        const categoryDir = path.join(specDir, category);
        if (!fs.existsSync(categoryDir) || !fs.statSync(categoryDir).isDirectory()) {
            continue;
        }
        try {
            const files = fs.readdirSync(categoryDir);
            for (const file of files) {
                if (!file.endsWith(".md"))
                    continue;
                const filePath = path.join(categoryDir, file);
                const stat = fs.statSync(filePath);
                results.push({
                    relativePath: `${category}/${file.replace(/\.md$/, "")}`,
                    category,
                    fileName: file,
                    sizeBytes: stat.size,
                    matchedKeywords: [],
                });
            }
        }
        catch (err) {
            // 跳过无法读取的目录
            console.error(`无法读取 spec 目录 ${categoryDir}: ${err}`);
        }
    }
    return results;
}
/**
 * 计算 spec 文件与关键词的匹配置信度
 * 返回置信度值和匹配的关键词列表（不修改原始对象）
 */
function calculateConfidence(specFile, keywords) {
    const fileName = specFile.fileName.toLowerCase().replace(/\.md$/, "");
    const category = specFile.category.toLowerCase();
    let matchCount = 0;
    const matched = [];
    for (const keyword of keywords) {
        // 只做正向匹配（文件名包含关键词），避免短文件名误匹配长关键词
        if (fileName.includes(keyword)) {
            matchCount += 2;
            matched.push(keyword);
        }
        else if (category.includes(keyword)) {
            matchCount += 1;
            matched.push(keyword);
        }
    }
    if (keywords.length === 0)
        return { confidence: 0.3, matchedKeywords: [] };
    return {
        confidence: Math.min(1.0, matchCount / Math.max(keywords.length, 1)),
        matchedKeywords: matched,
    };
}
//# sourceMappingURL=context-generate.js.map