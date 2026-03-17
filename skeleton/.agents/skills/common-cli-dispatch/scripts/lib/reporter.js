"use strict";

/**
 * 结构化输出报告生成器 — 符合设计文档 §3.6 的 JSON 输出契约
 *
 * 支持单结果和多结果（并行调用）两种格式。
 */

/**
 * 格式化单个 backend 执行结果为 JSON 字符串
 * @param {object} result - 执行结果对象
 * @param {string} result.backend - backend 名称
 * @param {string} [result.mode] - 运行模式（review/execute）
 * @param {number} result.exit_code - 退出码
 * @param {number} result.duration_ms - 执行时长（毫秒）
 * @param {object} [result.review_result] - 审查结果
 * @param {string} [result.session_id] - 会话 ID
 * @param {string} [result.error] - 错误信息
 * @param {string} [result.degraded_from] - 降级来源
 * @param {string} [result.stderr_filtered] - 被过滤的 stderr 内容
 * @param {string} taskId - 任务 ID
 * @returns {string} JSON 字符串
 */
function formatSingleResult(result, taskId) {
  const output = {
    schema_version: "1.0",
    task_id: taskId || null,
    backend: result.backend || null,
    mode: result.mode || "review",
    exit_code: result.exit_code ?? 0,
    duration_ms: result.duration_ms || 0,
    degraded_from: result.degraded_from || null,
    review_result: null,
    session_id: result.session_id || null,
    error: null,
    stderr_filtered: result.stderr_filtered || null,
  };

  // 有错误时不输出 review_result
  if (result.error || result.exit_code !== 0) {
    output.error = result.error || `exit code ${result.exit_code}`;
  } else if (result.review_result) {
    output.review_result = result.review_result;
  }

  return JSON.stringify(output, null, 2);
}

/**
 * 格式化多个 backend 并行执行结果为合并 JSON 字符串
 * @param {object[]} results - 执行结果数组
 * @param {string} taskId - 任务 ID
 * @returns {string} JSON 字符串
 */
function formatMultiResult(results, taskId) {
  const formattedResults = results.map((r) =>
    JSON.parse(formatSingleResult(r, taskId)),
  );

  let succeeded = 0;
  let failed = 0;
  for (const r of formattedResults) {
    if (r.exit_code === 0 && !r.error) {
      succeeded++;
    } else {
      failed++;
    }
  }

  const output = {
    results: formattedResults,
    total: formattedResults.length,
    succeeded,
    failed,
  };

  return JSON.stringify(output, null, 2);
}

module.exports = { formatSingleResult, formatMultiResult };
