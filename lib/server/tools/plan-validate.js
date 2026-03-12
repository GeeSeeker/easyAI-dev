import { z } from "zod";
const ANTI_PATTERNS = [
    {
        name: "多方案未选择",
        description: "列出多种方案但未做出明确选择。" +
            "方案对比必须以明确决策结束。",
        triggerWords: [
            "方案 A", "方案 B", "方案一", "方案二",
            " vs ", " VS ", "对比", "或者",
            "option A", "option B", "alternative",
        ],
        negateWords: [
            "选择", "决定", "采用", "使用", "确定",
            "chosen", "decided", "selected", "using",
        ],
    },
    {
        name: "无决策标准",
        description: "技术比较缺乏选择标准，使用模糊赞同词。" +
            "每次比较必须有明确的选择依据。",
        triggerWords: [
            "都可以", "都行", "均可", "都能满足",
            "可行", "差不多",
            "all viable", "either works", "both fine",
        ],
        negateWords: [
            "因为", "基于", "考虑到", "权衡",
            "because", "based on", "considering",
        ],
    },
    {
        name: "推迟决策",
        description: "将决策延迟到实现阶段。" +
            "所有技术决策必须在规划阶段完成。",
        triggerWords: [
            "实现阶段再定", "后续确认", "待定", "再说",
            "暂不确定", "以后再", "到时候",
            "TBD", "to be determined", "to be decided",
            "later", "defer", "postpone",
        ],
        negateWords: [],
    },
    {
        name: "信息堆砌无结论",
        description: "连续列举信息但缺乏总结性决策语句。" +
            "信息收集必须以约束或决策结束。",
        triggerWords: [
            "以下是", "列举如下", "相关信息",
            "需要注意", "参考资料",
            "here are", "listed below", "for reference",
        ],
        negateWords: [
            "因此", "所以", "结论", "决策", "约束",
            "therefore", "conclusion", "constraint", "decision",
        ],
    },
];
/**
 * 注册 plan_validate 工具
 * 反面模式检测
 */
export function register(server) {
    server.tool("plan_validate", "检测计划内容中的反面模式。识别多方案未选择、无决策标准、推迟决策、信息堆砌无结论等问题。用于规划阶段 PM 自检。", {
        content: z.string().describe("计划内容（纯文本或 Markdown）"),
    }, async ({ content }) => {
        try {
            const detectedPatterns = [];
            // 逐行检测反面模式
            const lines = content.split("\n");
            for (const pattern of ANTI_PATTERNS) {
                // 在整段内容中检测触发词
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineLower = line.toLowerCase();
                    const hasTrigger = pattern.triggerWords.some((word) => lineLower.includes(word.toLowerCase()));
                    if (!hasTrigger)
                        continue;
                    // 检查上下文中是否有反驳词（当前行 ±2 行范围）
                    const contextStart = Math.max(0, i - 2);
                    const contextEnd = Math.min(lines.length - 1, i + 2);
                    const contextLines = lines
                        .slice(contextStart, contextEnd + 1)
                        .join(" ")
                        .toLowerCase();
                    const hasNegate = pattern.negateWords.length > 0 &&
                        pattern.negateWords.some((word) => contextLines.includes(word.toLowerCase()));
                    if (!hasNegate) {
                        // 确认为反面模式
                        detectedPatterns.push({
                            name: pattern.name,
                            description: pattern.description,
                            location: `第 ${i + 1} 行附近: "${line.trim().substring(0, 80)}"`,
                        });
                        break; // 每种模式只报告一次
                    }
                }
            }
            // 去重（同名模式只保留第一个）
            const uniquePatterns = deduplicatePatterns(detectedPatterns);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            valid: uniquePatterns.length === 0,
                            patterns_checked: ANTI_PATTERNS.length,
                            patterns_detected: uniquePatterns.length,
                            patterns: uniquePatterns,
                            advice: uniquePatterns.length > 0
                                ? "⚠️ 检测到反面模式，请在规划中消除所有未决定项后再进入实现阶段"
                                : "✅ 未检测到反面模式，规划内容符合约束集标准",
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
 * 按模式名称去重
 */
function deduplicatePatterns(patterns) {
    const seen = new Set();
    return patterns.filter((p) => {
        if (seen.has(p.name))
            return false;
        seen.add(p.name);
        return true;
    });
}
//# sourceMappingURL=plan-validate.js.map