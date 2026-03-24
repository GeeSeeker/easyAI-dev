"use strict";

/**
 * path-utils.js — 共享路径处理工具
 *
 * 为各 backend 适配器提供 include_files 路径分类能力：
 * - 文件路径 → 自动提取父目录
 * - 目录路径 → 保持不变
 * - 不存在的路径 → 跳过并警告
 * - 重复目录 → 去重（含 workdir 自身的去重）
 *
 * 零外部 npm 依赖，仅使用 Node.js 内置模块。
 */

const fs = require("fs");
const path = require("path");

/**
 * 将 include_files 路径列表分类为目录列表
 *
 * 处理逻辑：
 * 1. 文件路径 → 提取 path.dirname 作为目录
 * 2. 目录路径 → 直接使用
 * 3. 不存在的路径 → 放入 skipped，stderr 警告
 * 4. 去重：同一目录只保留一次（含 workdir 子路径的相对化处理）
 *
 * @param {string[]} filePaths - 原始路径列表（文件或目录混合）
 * @param {string|null} workdir - 工作目录（用于路径相对化和去重）
 * @returns {{ dirs: string[], skipped: string[] }}
 */
function classifyPaths(filePaths, workdir) {
  const resolvedWorkdir = workdir ? path.resolve(workdir) : null;
  const seen = new Set();
  const dirs = [];
  const skipped = [];

  // workdir 本身始终已包含，不需要重复添加
  if (resolvedWorkdir) {
    seen.add(resolvedWorkdir);
  }

  for (const inputPath of filePaths) {
    let targetDir;

    try {
      // 检测路径是否存在
      const stat = fs.statSync(inputPath);
      if (stat.isFile()) {
        // 文件 → 提取父目录
        targetDir = path.dirname(path.resolve(inputPath));
      } else if (stat.isDirectory()) {
        // 目录 → 直接使用
        targetDir = path.resolve(inputPath);
      } else {
        // 非文件非目录（符号链接等） → 跳过
        skipped.push(inputPath);
        console.error(`警告: 跳过非常规路径: ${inputPath}`);
        continue;
      }
    } catch (_err) {
      // 路径不存在 → 跳过并警告
      skipped.push(inputPath);
      console.error(`警告: 路径不存在，已跳过: ${inputPath}`);
      continue;
    }

    // 去重检查
    if (seen.has(targetDir)) {
      continue;
    }
    seen.add(targetDir);

    // workdir 子路径相对化：避免 CLI 拼接出双重前缀
    let outputPath = targetDir;
    if (resolvedWorkdir && targetDir.startsWith(resolvedWorkdir + path.sep)) {
      outputPath = path.relative(resolvedWorkdir, targetDir);
    }
    // 如果 targetDir 就是 workdir 本身，跳过（已通过 workdir 参数传入）
    if (resolvedWorkdir && targetDir === resolvedWorkdir) {
      continue;
    }

    dirs.push(outputPath);
  }

  return { dirs, skipped };
}

module.exports = { classifyPaths };
