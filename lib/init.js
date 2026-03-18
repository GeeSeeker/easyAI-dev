/**
 * easyai-dev 初始化逻辑
 *
 * 提供三个核心函数：
 * - doInit()   — 初始化新项目或集成到已有项目
 * - doCheck()  — 检查框架完整性
 * - doUpdate() — 更新框架（只更新 .agents/ 和 .trellis/spec/）
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色常量
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m";

// skeleton 目录路径
const SKELETON_DIR = path.join(__dirname, "..", "skeleton");

// 框架版本
const FRAMEWORK_VERSION = "3.19.4";

// 需要检查的必需目录
const REQUIRED_DIRS = [
  ".agents/rules",
  ".agents/workflows",
  ".agents/skills",
  ".trellis/config",
  ".trellis/spec",
  ".trellis/tasks",
  ".trellis/workspace",
  ".docs/notes",
  ".docs/refs",
  ".docs/design",
  ".docs/archive",
];

// 需要检查的必需文件
const REQUIRED_FILES = [
  ".agents/rules/project-identity.md",
  ".agents/rules/anti-hallucination.md",
  ".agents/rules/coding-standards.md",
  ".agents/workflows/actor-pm.md",
  ".agents/workflows/actor-worker.md",
  ".trellis/config/config.yaml",
  ".easyai-version",
];

// 初始化时不应覆盖的文件（已有项目集成时）
const NO_OVERWRITE_FILES = ["README.md", ".gitignore"];

// Manifest 相关常量
const MANIFEST_FILENAME = "easyai-manifest.json";

/**
 * 计算文件的 SHA-256 哈希
 */
function fileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * 递归复制目录
 * @param src - 源目录
 * @param dest - 目标目录
 * @param options - 选项
 */
function copyDirSync(src, dest, options = { noOverwrite: false, log: true }) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, options);
    } else {
      if (options.noOverwrite && fs.existsSync(destPath)) {
        if (options.log) {
          console.log(
            `  ${YELLOW}⊘${NC} ${path.relative(dest, destPath)}` +
              ` — 已存在，跳过`,
          );
        }
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 合并 .gitignore 文件
 * 将新条目追加到已有的 .gitignore 中（不产生重复行）
 */
function mergeGitignore(targetDir) {
  // npm 不打包 .gitignore 文件，skeleton 中使用 gitignore.template
  const skeletonGitignore = path.join(SKELETON_DIR, "gitignore.template");
  const targetGitignore = path.join(targetDir, ".gitignore");

  if (!fs.existsSync(skeletonGitignore)) {
    return;
  }

  const skeletonLines = fs
    .readFileSync(skeletonGitignore, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (!fs.existsSync(targetGitignore)) {
    // 如果目标没有 .gitignore，直接复制
    fs.copyFileSync(skeletonGitignore, targetGitignore);
    console.log(`  ${GREEN}✓${NC} .gitignore — 已创建`);
    return;
  }

  // 读取现有 .gitignore
  const existingContent = fs.readFileSync(targetGitignore, "utf-8");
  const existingLines = existingContent.split("\n").map((l) => l.trim());
  const newLines = skeletonLines.filter((l) => !existingLines.includes(l));

  if (newLines.length > 0) {
    const appendContent = "\n\n# easyAI 框架\n" + newLines.join("\n") + "\n";
    fs.appendFileSync(targetGitignore, appendContent);
    console.log(
      `  ${GREEN}✓${NC} .gitignore — 已追加 ${newLines.length} 条规则`,
    );
  } else {
    console.log(`  ${YELLOW}⊘${NC} .gitignore — 无需追加`);
  }
}

/**
 * 智能追加缺失的 YAML 顶层段落（merge_mode 为 append 的文件使用智能追加）
 * 只追加用户文件中不存在的顶层 key，完全保留用户已有内容和注释
 * 当前仅支持 YAML 格式文件
 */
function appendMissingSections(userPath, skeletonPath, frameworkVersion) {
  try {
    const userContent = fs.readFileSync(userPath, "utf-8");
    const skeletonContent = fs.readFileSync(skeletonPath, "utf-8");

    // 提取顶层 key
    const topKeyRegex = /^([a-z_][a-z0-9_]*):/gm;
    const userKeys = new Set();
    let match;
    while ((match = topKeyRegex.exec(userContent)) !== null) {
      userKeys.add(match[1]);
    }

    const skeletonKeys = [];
    const skeletonKeyRegex = /^([a-z_][a-z0-9_]*):/gm;
    while ((match = skeletonKeyRegex.exec(skeletonContent)) !== null) {
      skeletonKeys.push(match[1]);
    }

    const missingKeys = skeletonKeys.filter((k) => !userKeys.has(k));

    if (missingKeys.length > 0) {
      const lines = skeletonContent.split("\n");
      let appendText = "\n";

      for (const key of missingKeys) {
        const keyIdx = lines.findIndex((l) => l.startsWith(`${key}:`));
        if (keyIdx === -1) continue;

        let startIdx = keyIdx;
        while (startIdx > 0 && lines[startIdx - 1].startsWith("#")) {
          startIdx--;
        }
        if (startIdx > 0 && lines[startIdx - 1].trim() === "") {
          startIdx--;
        }

        let endIdx = keyIdx + 1;
        while (endIdx < lines.length) {
          if (/^[a-z_][a-z0-9_]*:/.test(lines[endIdx])) break;
          if (
            lines[endIdx].startsWith("#") &&
            endIdx + 1 < lines.length &&
            /^[a-z_][a-z0-9_]*:/.test(lines[endIdx + 1])
          )
            break;
          endIdx++;
        }

        appendText += lines.slice(startIdx, endIdx).join("\n") + "\n";
      }

      fs.appendFileSync(userPath, appendText);
      console.log(
        `  ${GREEN}✓${NC} config.yaml — ` +
          `追加 ${missingKeys.length} 个新段落: ${missingKeys.join(", ")}`,
      );
    } else {
      console.log(`  ${YELLOW}⊘${NC} config.yaml — 无新段落需追加`);
    }

    // 始终更新 framework.version
    let updatedContent = fs.readFileSync(userPath, "utf-8");
    const versionLineRegex = /^(\s+version:\s*")([^"]+)(")/m;
    if (versionLineRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        versionLineRegex,
        `$1${frameworkVersion}$3`,
      );
      fs.writeFileSync(userPath, updatedContent);
      console.log(
        `  ${GREEN}✓${NC} config.yaml — ` +
          `framework.version → ${frameworkVersion}`,
      );
    }
  } catch (err) {
    console.log(
      `  ${YELLOW}⚠${NC} config.yaml 智能合并失败，保留用户文件: ` +
        err.message,
    );
  }
}

/**
 * 初始化项目
 * @param targetDir - 目标项目目录（绝对路径）
 */
export async function doInit(targetDir) {
  // 检查 skeleton 目录
  if (!fs.existsSync(SKELETON_DIR)) {
    console.error(`${RED}✗ 骨架目录不存在: ${SKELETON_DIR}${NC}`);
    process.exit(1);
  }

  // 检查是否已初始化
  const agentsDir = path.join(targetDir, ".agents");
  const trellisDir = path.join(targetDir, ".trellis");
  if (fs.existsSync(agentsDir) && fs.existsSync(trellisDir)) {
    console.log(
      `${YELLOW}⚠ 项目已初始化过（.agents/ 和 .trellis/ 已存在）${NC}`,
    );
    console.log(`${YELLOW}  如需更新框架，请使用: easyai-dev update${NC}`);
    console.log(
      `${YELLOW}  如需重新初始化，请先手动删除 .agents/ 和 .trellis/${NC}`,
    );
    return;
  }

  // 检测是否是已有项目（非空目录）
  const isExistingProject =
    fs.existsSync(targetDir) &&
    fs.readdirSync(targetDir).filter((f) => !f.startsWith(".")).length > 0;

  console.log(`\n${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log(
    `${BLUE}${BOLD}easyAI 框架初始化${NC}` +
      (isExistingProject ? ` ${YELLOW}（集成模式）${NC}` : ""),
  );
  console.log(`${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log(`目标项目: ${GREEN}${targetDir}${NC}\n`);

  // 确保目标目录存在
  fs.mkdirSync(targetDir, { recursive: true });

  // 复制 .agents/
  const agentsSrc = path.join(SKELETON_DIR, ".agents");
  if (fs.existsSync(agentsSrc)) {
    copyDirSync(agentsSrc, path.join(targetDir, ".agents"));
    console.log(`  ${GREEN}✓${NC} .agents/ — 规则 + 工作流 + Skills`);
  }

  // 复制 .trellis/
  const trellisSrc = path.join(SKELETON_DIR, ".trellis");
  if (fs.existsSync(trellisSrc)) {
    copyDirSync(trellisSrc, path.join(targetDir, ".trellis"));
    console.log(`  ${GREEN}✓${NC} .trellis/ — 配置 + 规范 + 任务骨架`);
  }

  // 复制 .docs/
  const docsSrc = path.join(SKELETON_DIR, ".docs");
  if (fs.existsSync(docsSrc)) {
    copyDirSync(docsSrc, path.join(targetDir, ".docs"));
    console.log(`  ${GREEN}✓${NC} .docs/ — 文档空间`);
  }

  // 处理 .gitignore（合并而非覆盖）
  mergeGitignore(targetDir);

  // 处理 README.md
  const readmeSrc = path.join(SKELETON_DIR, "README.md");
  const readmeDest = path.join(targetDir, "README.md");
  if (fs.existsSync(readmeSrc) && !fs.existsSync(readmeDest)) {
    fs.copyFileSync(readmeSrc, readmeDest);
    console.log(`  ${GREEN}✓${NC} README.md — 已创建`);
  } else if (fs.existsSync(readmeDest)) {
    console.log(`  ${YELLOW}⊘${NC} README.md — 已存在，跳过`);
  }

  // 复制 Manifest 文件（记录初始文件哈希）
  const manifestSrc = path.join(SKELETON_DIR, MANIFEST_FILENAME);
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, path.join(targetDir, `.${MANIFEST_FILENAME}`));
    console.log(`  ${GREEN}✓${NC} .${MANIFEST_FILENAME} — 框架文件清单`);
  }

  // 写入版本清单
  fs.writeFileSync(
    path.join(targetDir, ".easyai-version"),
    `${FRAMEWORK_VERSION}\n`,
  );
  console.log(`  ${GREEN}✓${NC} .easyai-version — v${FRAMEWORK_VERSION}`);

  // 输出完成信息
  console.log(`\n${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log(`${GREEN}${BOLD}✅ easyAI 框架初始化完成！${NC}`);
  console.log(`${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log(`
${BOLD}下一步：配置 MCP Server${NC}

在 Antigravity IDE 的 MCP 设置中添加：

  {
    "easyai-mcp-server": {
      "command": "npx",
      "args": ["-y", "@geeseeker/easyai-dev", "serve"],
      "env": {
        "EASYAI_PROJECT_ROOT": "${targetDir}"
      }
    }
  }

配置完成后，重启 IDE，输入 ${GREEN}/pm${NC} 启动项目经理。
`);
}

/**
 * 检查框架完整性
 * @param targetDir - 目标项目目录（绝对路径）
 */
export async function doCheck(targetDir) {
  let missing = 0;
  let warnings = 0;

  console.log(`\n${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log(`${BLUE}${BOLD}easyAI 框架完整性检查${NC}`);
  console.log(`${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log(`目标项目: ${GREEN}${targetDir}${NC}\n`);

  // 检查目录
  console.log(`${BOLD}目录检查:${NC}`);
  for (const dir of REQUIRED_DIRS) {
    if (fs.existsSync(path.join(targetDir, dir))) {
      console.log(`  ${GREEN}✓${NC} ${dir}/`);
    } else {
      console.log(`  ${RED}✗${NC} ${dir}/ ${RED}(缺失)${NC}`);
      missing++;
    }
  }

  // 检查文件
  console.log(`\n${BOLD}文件检查:${NC}`);
  for (const file of REQUIRED_FILES) {
    if (fs.existsSync(path.join(targetDir, file))) {
      console.log(`  ${GREEN}✓${NC} ${file}`);
    } else {
      console.log(`  ${RED}✗${NC} ${file} ${RED}(缺失)${NC}`);
      missing++;
    }
  }

  // 检查版本
  console.log(`\n${BOLD}版本检查:${NC}`);
  const versionFile = path.join(targetDir, ".easyai-version");
  if (fs.existsSync(versionFile)) {
    const installedVersion = fs.readFileSync(versionFile, "utf-8").trim();
    if (installedVersion === FRAMEWORK_VERSION) {
      console.log(`  ${GREEN}✓${NC} 框架版本: v${installedVersion} (最新)`);
    } else {
      console.log(
        `  ${YELLOW}⚠${NC} 框架版本: v${installedVersion}` +
          ` (最新: v${FRAMEWORK_VERSION})`,
      );
      warnings++;
    }
  } else {
    console.log(`  ${RED}✗${NC} .easyai-version 不存在`);
    missing++;
  }

  // 检查 Git 状态
  console.log(`\n${BOLD}Git 状态:${NC}`);
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: targetDir,
      stdio: "pipe",
    });
    console.log(`  ${GREEN}✓${NC} Git 仓库已初始化`);
  } catch {
    console.log(`  ${YELLOW}⚠${NC} 非 Git 仓库` + ` — worktree 等功能将不可用`);
    warnings++;
  }

  // 汇总
  console.log("");
  const total = REQUIRED_DIRS.length + REQUIRED_FILES.length + 1;
  if (missing === 0 && warnings === 0) {
    console.log(`${GREEN}✅ 框架完整，共 ${total} 项全部通过${NC}`);
  } else if (missing === 0) {
    console.log(`${YELLOW}⚠ 框架基本完整，有 ${warnings} 项警告${NC}`);
  } else {
    console.log(`${RED}⚠ 发现 ${missing} 项缺失，` + `${warnings} 项警告${NC}`);
    console.log(`${RED}  建议运行: npx @geeseeker/easyai-dev init .${NC}`);
  }
}

/**
 * 更新框架（Manifest 驱动的智能合并）
 *
 * 核心逻辑：
 * - 纯用户文件（不在 manifest 中）→ 不碰
 * - 框架文件、用户未修改 → 自动覆盖
 * - 框架文件、用户已修改 → 报告冲突，保存 .new 文件
 * - 框架新增文件 → 自动创建
 * - 框架删除文件、用户未修改 → 删除
 * - 框架删除文件、用户已修改 → 报告冲突
 *
 * @param targetDir - 目标项目目录（绝对路径）
 */
export async function doUpdate(targetDir) {
  // 检查是否已初始化
  if (!fs.existsSync(path.join(targetDir, ".agents"))) {
    console.error(`${RED}✗ 项目未初始化，请先运行: easyai-dev init${NC}`);
    process.exit(1);
  }

  // 检查版本
  const versionFile = path.join(targetDir, ".easyai-version");
  let installedVersion = "unknown";
  if (fs.existsSync(versionFile)) {
    installedVersion = fs.readFileSync(versionFile, "utf-8").trim();
  }

  if (installedVersion === FRAMEWORK_VERSION) {
    // 版本相同 → 检查 Manifest 完整性（补充缺失文件）
    const newManifestPath = path.join(SKELETON_DIR, MANIFEST_FILENAME);
    if (fs.existsSync(newManifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(newManifestPath, "utf-8"));
      const missingFiles = [];

      for (const relPath of Object.keys(manifest.files)) {
        const targetPath = path.join(targetDir, relPath);
        if (!fs.existsSync(targetPath)) {
          const skeletonPath = path.join(SKELETON_DIR, relPath);
          if (fs.existsSync(skeletonPath)) {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.copyFileSync(skeletonPath, targetPath);
            missingFiles.push(relPath);
          }
        }
      }

      if (missingFiles.length > 0) {
        // 同步本地 Manifest
        const oldManifestPath = path.join(targetDir, `.${MANIFEST_FILENAME}`);
        fs.copyFileSync(newManifestPath, oldManifestPath);

        console.log(
          `\n${BLUE}${BOLD}easyAI 框架文件补充${NC}` +
            ` (v${FRAMEWORK_VERSION})`,
        );
        for (const f of missingFiles) {
          console.log(`  ${GREEN}+${NC} ${f} — 新增`);
        }
        console.log(
          `\n${GREEN}✅ 补充了 ${missingFiles.length} 个缺失文件${NC}`,
        );
        return;
      }
    }

    console.log(`${GREEN}✅ 框架已是最新版本 (v${FRAMEWORK_VERSION})${NC}`);
    return;
  }

  // 读取新旧 Manifest
  const newManifestPath = path.join(SKELETON_DIR, MANIFEST_FILENAME);
  const oldManifestPath = path.join(targetDir, `.${MANIFEST_FILENAME}`);

  if (!fs.existsSync(newManifestPath)) {
    console.error(
      `${RED}✗ 新版本缺少 ${MANIFEST_FILENAME}，无法执行安全升级${NC}`,
    );
    process.exit(1);
  }

  const newManifest = JSON.parse(fs.readFileSync(newManifestPath, "utf-8"));
  let oldManifest = { files: {} };
  if (fs.existsSync(oldManifestPath)) {
    oldManifest = JSON.parse(fs.readFileSync(oldManifestPath, "utf-8"));
  }

  console.log(`\n${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log(`${BLUE}${BOLD}easyAI 框架更新（智能合并）${NC}`);
  console.log(`${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log(
    `当前版本: ${YELLOW}v${installedVersion}${NC}` +
      ` → 目标版本: ${GREEN}v${FRAMEWORK_VERSION}${NC}\n`,
  );

  const conflicts = [];
  let updated = 0;
  let created = 0;
  let removed = 0;
  let skipped = 0;

  // 阶段 1：处理新 Manifest 中的文件（新增 + 更新）
  console.log(`${BOLD}处理框架文件:${NC}`);
  for (const [relPath, newEntry] of Object.entries(newManifest.files)) {
    const targetPath = path.join(targetDir, relPath);
    const skeletonPath = path.join(SKELETON_DIR, relPath);
    const oldEntry = oldManifest.files[relPath];

    // merge_mode: append → merge_mode 为 append 的文件使用智能追加
    if (newEntry.merge_mode === "append" && fs.existsSync(targetPath)) {
      appendMissingSections(targetPath, skeletonPath, FRAMEWORK_VERSION);
      continue;
    }

    if (!fs.existsSync(targetPath)) {
      // 文件在用户项目中不存在 → 直接创建
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(skeletonPath, targetPath);
      console.log(`  ${GREEN}+${NC} ${relPath} — 新增`);
      created++;
      continue;
    }

    if (!oldEntry) {
      // 新 Manifest 有，旧 Manifest 没有，但用户文件已存在
      // → 框架新增文件与用户已有文件冲突
      fs.copyFileSync(skeletonPath, targetPath + ".new");
      conflicts.push({
        file: relPath,
        reason: "框架新增此文件，但你的项目中已有同名文件",
      });
      continue;
    }

    // 框架文件在新旧版本中都有，检查是否有更新
    if (oldEntry.hash === newEntry.hash) {
      // 框架这个文件没更新，跳过
      skipped++;
      continue;
    }

    // 框架文件有更新，检查用户是否修改过
    const currentHash = fileHash(targetPath);
    if (currentHash === oldEntry.hash) {
      // 用户未修改 → 直接覆盖
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(skeletonPath, targetPath);
      console.log(`  ${GREEN}✓${NC} ${relPath} — 已更新`);
      updated++;
    } else {
      // 用户已修改 → 报告冲突
      fs.copyFileSync(skeletonPath, targetPath + ".new");
      conflicts.push({
        file: relPath,
        reason: "框架已更新此文件，但你也修改过它",
      });
    }
  }

  // 阶段 2：处理旧 Manifest 中有、新 Manifest 中没有的文件（框架删除）
  for (const [relPath, oldEntry] of Object.entries(oldManifest.files)) {
    if (newManifest.files[relPath]) {
      continue; // 新版本中仍存在，已在阶段 1 处理
    }

    const targetPath = path.join(targetDir, relPath);
    if (!fs.existsSync(targetPath)) {
      continue; // 文件已不存在，无需处理
    }

    const currentHash = fileHash(targetPath);
    if (currentHash === oldEntry.hash) {
      // 用户未修改 → 直接删除
      fs.unlinkSync(targetPath);
      console.log(`  ${RED}-${NC} ${relPath} — 已移除（框架不再需要）`);
      removed++;
    } else {
      // 用户已修改 → 报告冲突
      conflicts.push({
        file: relPath,
        reason: "框架已移除此文件，但你修改过它",
      });
    }
  }

  // 更新项目中的 Manifest 和版本号
  fs.copyFileSync(newManifestPath, oldManifestPath);
  fs.writeFileSync(versionFile, `${FRAMEWORK_VERSION}\n`);
  console.log(`  ${GREEN}✓${NC} .easyai-version — v${FRAMEWORK_VERSION}`);

  // 统计输出
  console.log(
    `\n${BOLD}统计:${NC} ` +
      `${GREEN}${created} 新增${NC}, ` +
      `${GREEN}${updated} 更新${NC}, ` +
      `${RED}${removed} 移除${NC}, ` +
      `${skipped} 无变化`,
  );

  // 不更新的内容
  console.log(`\n${BOLD}以下内容未被修改（保留用户数据）:${NC}`);
  console.log(
    `  ${YELLOW}⊘${NC} .trellis/config/config.yaml` +
      `（智能追加新段落，保留用户配置）`,
  );
  console.log(`  ${YELLOW}⊘${NC} .trellis/tasks/`);
  console.log(`  ${YELLOW}⊘${NC} .trellis/workspace/`);
  console.log(`  ${YELLOW}⊘${NC} .docs/`);
  console.log(`  ${YELLOW}⊘${NC} README.md`);
  console.log(`  ${YELLOW}⊘${NC} .gitignore`);
  console.log(`  ${YELLOW}⊘${NC} 用户自定义的 Skills / Rules / Workflows`);

  // 冲突报告
  if (conflicts.length > 0) {
    console.log(`\n${YELLOW}${BOLD}⚠ 检测到 ${conflicts.length} 个冲突:${NC}`);
    for (let i = 0; i < conflicts.length; i++) {
      const c = conflicts[i];
      console.log(`\n  ${i + 1}. ${YELLOW}${c.file}${NC}`);
      console.log(`     → ${c.reason}`);
      console.log(`     → 框架新版已保存到 ${c.file}.new`);
      console.log(`     → 请手动比较并决定保留哪个版本`);
    }
    console.log(`\n${YELLOW}提示: 使用 diff <file> <file>.new 比较差异${NC}`);
  }

  console.log(`\n${GREEN}${BOLD}✅ 框架更新完成！${NC}`);
}
