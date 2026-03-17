"use strict";

/**
 * JSON 行解析器 — 逐行 JSON.parse，零依赖
 *
 * 策略：每行尝试 JSON.parse，成功则收集到 events，
 * 失败则收集到 rawLines（纯文本降级）。
 */

/**
 * 解析包含 JSON 行的文本输出
 * @param {string} text - 原始 stdout 文本
 * @returns {{ events: object[], rawLines: string[] }}
 */
function parseJSONLines(text) {
  const events = [];
  const rawLines = [];

  if (!text) {
    return { events, rawLines };
  }

  // 按换行符拆分，处理无换行符的尾行
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed);
      events.push(parsed);
    } catch (_err) {
      rawLines.push(trimmed);
    }
  }

  return { events, rawLines };
}

module.exports = { parseJSONLines };
