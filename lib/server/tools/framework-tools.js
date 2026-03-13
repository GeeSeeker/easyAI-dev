/**
 * 框架管理工具 — framework_init / framework_check / framework_update
 *
 * 让 AI 通过 MCP 工具直接执行框架初始化、检查和更新，
 * 用户无需离开 IDE，无需使用命令行。
 */
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
// ============ 常量 ============
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// skeleton 在 npm 包中的位置：lib/server/tools/ → 向上 3 级 → skeleton/
const SKELETON_DIR = path.resolve(__dirname, "..", "..", "..", "skeleton");
// 框架版本（与 package.json 保持一致）
const FRAMEWORK_VERSION = "3.0.10";
// Manifest 相关常量
const MANIFEST_FILENAME = "easyai-manifest.json";
/**
 * 计算文件的 SHA-256 哈希
 */
function fileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
}
// 必需目录
const REQUIRED_DIRS = [
    ".agents/rules",
    ".agents/workflows",
    ".agents/skills",
    ".trellis/config",
    ".trellis/spec",
    ".trellis/tasks",
    ".trellis/workspace",
    ".docs/requirements",
    ".docs/design",
    ".docs/guides",
    ".docs/notes",
    ".docs/archive",
];
// 必需文件
const REQUIRED_FILES = [
    ".agents/rules/project-identity.md",
    ".agents/rules/anti-hallucination.md",
    ".agents/rules/coding-standards.md",
    ".agents/workflows/pm.md",
    ".agents/workflows/worker.md",
    ".trellis/config/config.yaml",
    ".easyai-version",
];
// ============ 工具函数 ============
/**
 * 递归复制目录
 */
function copyDirSync(src, dest, noOverwrite = false) {
    const logs = [];
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            logs.push(...copyDirSync(srcPath, destPath, noOverwrite));
        }
        else {
            if (noOverwrite && fs.existsSync(destPath)) {
                logs.push(`⊘ 跳过（已存在）: ${entry.name}`);
                continue;
            }
            fs.copyFileSync(srcPath, destPath);
        }
    }
    return logs;
}
/**
 * 合并 .gitignore
 */
function mergeGitignore(targetDir) {
    // npm 不打包 .gitignore 文件，skeleton 中使用 gitignore.template
    const skeletonGitignore = path.join(SKELETON_DIR, "gitignore.template");
    const targetGitignore = path.join(targetDir, ".gitignore");
    if (!fs.existsSync(skeletonGitignore)) {
        return "⊘ skeleton 中无 .gitignore";
    }
    const skeletonLines = fs
        .readFileSync(skeletonGitignore, "utf-8")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
    if (!fs.existsSync(targetGitignore)) {
        fs.copyFileSync(skeletonGitignore, targetGitignore);
        return "✓ .gitignore 已创建";
    }
    const existingLines = fs
        .readFileSync(targetGitignore, "utf-8")
        .split("\n")
        .map((l) => l.trim());
    const newLines = skeletonLines.filter((l) => !existingLines.includes(l));
    if (newLines.length > 0) {
        fs.appendFileSync(targetGitignore, "\n\n# easyAI 框架\n" + newLines.join("\n") + "\n");
        return `✓ .gitignore 已追加 ${newLines.length} 条规则`;
    }
    return "⊘ .gitignore 无需更新";
}
// ============ 注册工具 ============
/**
 * 注册 framework_init 工具
 */
export function registerFrameworkInit(server) {
    server.tool("framework_init", "在指定目录初始化 easyAI 框架。复制 .agents/、.trellis/、.docs/ 骨架到项目中。" +
        "支持新项目和已有项目集成（不覆盖已有的 README.md 和 .gitignore）。", {
        targetDir: z
            .string()
            .describe("目标项目目录的绝对路径。默认为当前工作目录。")
            .optional(),
    }, async ({ targetDir: inputDir }) => {
        try {
            const targetDir = inputDir || process.cwd();
            const resolvedDir = path.resolve(targetDir);
            // 检查 skeleton 是否存在
            if (!fs.existsSync(SKELETON_DIR)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                error: `骨架目录不存在: ${SKELETON_DIR}`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            // 检查是否已初始化
            const agentsDir = path.join(resolvedDir, ".agents");
            const trellisDir = path.join(resolvedDir, ".trellis");
            if (fs.existsSync(agentsDir) && fs.existsSync(trellisDir)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                error: "项目已初始化过（.agents/ 和 .trellis/ 已存在）。" +
                                    "如需更新框架，请使用 framework_update 工具。",
                            }),
                        },
                    ],
                };
            }
            // 检测是否是已有项目
            fs.mkdirSync(resolvedDir, { recursive: true });
            const isExisting = fs.readdirSync(resolvedDir).filter((f) => !f.startsWith(".")).length >
                0;
            const logs = [];
            logs.push(isExisting ? "模式: 集成到已有项目" : "模式: 新项目初始化");
            // 复制 .agents/
            const agentsSrc = path.join(SKELETON_DIR, ".agents");
            if (fs.existsSync(agentsSrc)) {
                copyDirSync(agentsSrc, path.join(resolvedDir, ".agents"));
                logs.push("✓ .agents/ — 规则 + 工作流 + Skills");
            }
            // 复制 .trellis/
            const trellisSrc = path.join(SKELETON_DIR, ".trellis");
            if (fs.existsSync(trellisSrc)) {
                copyDirSync(trellisSrc, path.join(resolvedDir, ".trellis"));
                logs.push("✓ .trellis/ — 配置 + 规范 + 任务骨架");
            }
            // 复制 .docs/
            const docsSrc = path.join(SKELETON_DIR, ".docs");
            if (fs.existsSync(docsSrc)) {
                copyDirSync(docsSrc, path.join(resolvedDir, ".docs"));
                logs.push("✓ .docs/ — 文档空间");
            }
            // 合并 .gitignore
            logs.push(mergeGitignore(resolvedDir));
            // README.md（不覆盖已有）
            const readmeSrc = path.join(SKELETON_DIR, "README.md");
            const readmeDest = path.join(resolvedDir, "README.md");
            if (fs.existsSync(readmeSrc) && !fs.existsSync(readmeDest)) {
                fs.copyFileSync(readmeSrc, readmeDest);
                logs.push("✓ README.md 已创建");
            }
            else if (fs.existsSync(readmeDest)) {
                logs.push("⊘ README.md 已存在，跳过");
            }
            // 版本清单
            fs.writeFileSync(path.join(resolvedDir, ".easyai-version"), `${FRAMEWORK_VERSION}\n`);
            logs.push(`✓ .easyai-version — v${FRAMEWORK_VERSION}`);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            version: FRAMEWORK_VERSION,
                            targetDir: resolvedDir,
                            logs,
                            nextStep: "框架初始化完成！输入 /pm 启动项目经理，开始开发。",
                        }),
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
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                        }),
                    },
                ],
                isError: true,
            };
        }
    });
}
/**
 * 注册 framework_check 工具
 */
export function registerFrameworkCheck(server) {
    server.tool("framework_check", "检查当前项目的 easyAI 框架完整性。验证必需目录、文件、版本和 Git 状态。", {
        targetDir: z
            .string()
            .describe("目标项目目录的绝对路径。默认为当前工作目录。")
            .optional(),
    }, async ({ targetDir: inputDir }) => {
        try {
            const targetDir = inputDir || process.cwd();
            const resolvedDir = path.resolve(targetDir);
            const results = {
                dirs: [],
                files: [],
                version: {
                    installed: null,
                    latest: FRAMEWORK_VERSION,
                    upToDate: false,
                },
                git: { initialized: false },
                summary: { missing: 0, warnings: 0, total: 0 },
            };
            // 检查目录
            for (const dir of REQUIRED_DIRS) {
                const exists = fs.existsSync(path.join(resolvedDir, dir));
                results.dirs.push({ path: dir, exists });
                if (!exists)
                    results.summary.missing++;
            }
            // 检查文件
            for (const file of REQUIRED_FILES) {
                const exists = fs.existsSync(path.join(resolvedDir, file));
                results.files.push({ path: file, exists });
                if (!exists)
                    results.summary.missing++;
            }
            // 检查版本
            const versionFile = path.join(resolvedDir, ".easyai-version");
            if (fs.existsSync(versionFile)) {
                const installed = fs.readFileSync(versionFile, "utf-8").trim();
                results.version.installed = installed;
                results.version.upToDate = installed === FRAMEWORK_VERSION;
                if (!results.version.upToDate)
                    results.summary.warnings++;
            }
            else {
                results.summary.missing++;
            }
            // 检查 Git
            try {
                execSync("git rev-parse --is-inside-work-tree", {
                    cwd: resolvedDir,
                    stdio: "pipe",
                });
                results.git.initialized = true;
            }
            catch {
                results.git.initialized = false;
                results.summary.warnings++;
            }
            results.summary.total =
                REQUIRED_DIRS.length + REQUIRED_FILES.length + 1;
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results, null, 2),
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
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                        }),
                    },
                ],
                isError: true,
            };
        }
    });
}
/**
 * 注册 framework_update 工具（Manifest 驱动智能合并）
 */
export function registerFrameworkUpdate(server) {
    server.tool("framework_update", "更新 easyAI 框架到最新版本。使用 Manifest 驱动的智能合并：" +
        "只更新框架自有文件，保留用户自定义的 Skills/Rules/Workflows。" +
        "框架文件被用户修改过时报告冲突，由用户决策。", {
        targetDir: z
            .string()
            .describe("目标项目目录的绝对路径。默认为当前工作目录。")
            .optional(),
    }, async ({ targetDir: inputDir }) => {
        try {
            const targetDir = inputDir || process.cwd();
            const resolvedDir = path.resolve(targetDir);
            // 确认已初始化
            if (!fs.existsSync(path.join(resolvedDir, ".agents"))) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                error: "项目未初始化，请先使用 framework_init 工具。",
                            }),
                        },
                    ],
                };
            }
            // 检查版本
            const versionFile = path.join(resolvedDir, ".easyai-version");
            let installedVersion = "unknown";
            if (fs.existsSync(versionFile)) {
                installedVersion = fs.readFileSync(versionFile, "utf-8").trim();
            }
            if (installedVersion === FRAMEWORK_VERSION) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                message: `框架已是最新版本 (v${FRAMEWORK_VERSION})`,
                                updated: false,
                            }),
                        },
                    ],
                };
            }
            // 读取新旧 Manifest
            const newManifestPath = path.join(SKELETON_DIR, MANIFEST_FILENAME);
            const oldManifestPath = path.join(resolvedDir, `.${MANIFEST_FILENAME}`);
            if (!fs.existsSync(newManifestPath)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                error: `新版本缺少 ${MANIFEST_FILENAME}，无法执行安全升级`,
                            }),
                        },
                    ],
                };
            }
            const newManifest = JSON.parse(fs.readFileSync(newManifestPath, "utf-8"));
            let oldManifest = {
                files: {},
            };
            if (fs.existsSync(oldManifestPath)) {
                oldManifest = JSON.parse(fs.readFileSync(oldManifestPath, "utf-8"));
            }
            const logs = [];
            const conflicts = [];
            let updated = 0;
            let created = 0;
            let removed = 0;
            let skipped = 0;
            logs.push(`更新: v${installedVersion} → v${FRAMEWORK_VERSION}`);
            // 阶段 1：处理新 Manifest 中的文件
            for (const [relPath, newEntry] of Object.entries(newManifest.files)) {
                const targetPath = path.join(resolvedDir, relPath);
                const skeletonPath = path.join(SKELETON_DIR, relPath);
                const oldEntry = oldManifest.files[relPath];
                if (!fs.existsSync(targetPath)) {
                    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                    fs.copyFileSync(skeletonPath, targetPath);
                    logs.push(`+ ${relPath} — 新增`);
                    created++;
                    continue;
                }
                if (!oldEntry) {
                    fs.copyFileSync(skeletonPath, targetPath + ".new");
                    conflicts.push({
                        file: relPath,
                        reason: "框架新增此文件，但项目中已有同名文件",
                    });
                    continue;
                }
                if (oldEntry.hash === newEntry.hash) {
                    skipped++;
                    continue;
                }
                const currentHash = fileHash(targetPath);
                if (currentHash === oldEntry.hash) {
                    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                    fs.copyFileSync(skeletonPath, targetPath);
                    logs.push(`✓ ${relPath} — 已更新`);
                    updated++;
                }
                else {
                    fs.copyFileSync(skeletonPath, targetPath + ".new");
                    conflicts.push({
                        file: relPath,
                        reason: "框架已更新此文件，但用户也修改过它",
                    });
                }
            }
            // 阶段 2：处理框架删除的文件
            for (const [relPath, oldEntry] of Object.entries(oldManifest.files)) {
                if (newManifest.files[relPath]) {
                    continue;
                }
                const targetPath = path.join(resolvedDir, relPath);
                if (!fs.existsSync(targetPath)) {
                    continue;
                }
                const currentHash = fileHash(targetPath);
                if (currentHash === oldEntry.hash) {
                    fs.unlinkSync(targetPath);
                    logs.push(`- ${relPath} — 已移除`);
                    removed++;
                }
                else {
                    conflicts.push({
                        file: relPath,
                        reason: "框架已移除此文件，但用户修改过它",
                    });
                }
            }
            // 更新 Manifest 和版本号
            fs.copyFileSync(newManifestPath, oldManifestPath);
            fs.writeFileSync(versionFile, `${FRAMEWORK_VERSION}\n`);
            logs.push(`✓ .easyai-version → v${FRAMEWORK_VERSION}`);
            const preserved = [
                ".trellis/config/config.yaml",
                ".trellis/tasks/",
                ".trellis/workspace/",
                ".docs/",
                "README.md",
                ".gitignore",
                "用户自定义的 Skills / Rules / Workflows",
            ];
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            updated: true,
                            fromVersion: installedVersion,
                            toVersion: FRAMEWORK_VERSION,
                            stats: { created, updated, removed, skipped },
                            logs,
                            conflicts,
                            preserved,
                        }),
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
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                        }),
                    },
                ],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=framework-tools.js.map