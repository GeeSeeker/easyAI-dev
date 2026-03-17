"use strict";

/**
 * stderr 噪音过滤器 — 参考 ccg-workflow 的 filteringWriter
 *
 * 按行匹配噪音模式，过滤掉已知的无用输出（各 CLI 的启动信息、警告等）。
 */

/**
 * 默认噪音模式列表（各 backend 通用 + 特有）
 */
const DEFAULT_NOISE_PATTERNS = [
  // Gemini 特有
  "[STARTUP]",
  "Session cleanup disabled",
  "Loading extension:",
  "YOLO mode is enabled",
  "Loaded cached credentials",
  // Codex 特有
  "(node:",
  "(Use `node --trace-warnings",
  // 通用噪音
  "[WARN] Skipping unreadable directory",
  "supports tool updates. Listening for changes",
  "Warning:",
];

/**
 * 创建噪音过滤器实例
 * @param {string[]} patterns - 噪音模式列表
 * @returns {{ process: (text: string) => string, flush: (text: string) => string }}
 */
function createNoiseFilter(patterns) {
  const activePatterns = patterns || DEFAULT_NOISE_PATTERNS;

  /**
   * 判断某行是否匹配任意噪音模式
   * @param {string} line - 待检测行
   * @returns {boolean}
   */
  function shouldFilter(line) {
    for (const pattern of activePatterns) {
      if (line.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 处理完整的多行文本，过滤噪音行
   * @param {string} text - 原始 stderr 文本
   * @returns {string} 过滤后的文本
   */
  function process(text) {
    if (!text) {
      return "";
    }

    const lines = text.split("\n");
    const kept = [];

    for (const line of lines) {
      // 保留空行分隔符（原样保留换行结构）
      if (line === "" && kept.length > 0) {
        continue;
      }
      if (!shouldFilter(line)) {
        kept.push(line);
      }
    }

    // 重建文本，保留原始换行符结构
    if (kept.length === 0) {
      return "";
    }
    return kept.join("\n") + "\n";
  }

  /**
   * 处理残留内容（无换行符的尾行）
   * @param {string} text - 残留文本
   * @returns {string} 过滤后的文本
   */
  function flush(text) {
    if (!text) {
      return "";
    }
    if (shouldFilter(text)) {
      return "";
    }
    return text;
  }

  return { process, flush };
}

module.exports = { createNoiseFilter, DEFAULT_NOISE_PATTERNS };
