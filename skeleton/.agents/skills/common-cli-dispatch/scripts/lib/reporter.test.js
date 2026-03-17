"use strict";

const { formatSingleResult, formatMultiResult } = require("./reporter");

// --- 测试：格式化单个成功结果 ---
{
  const result = {
    backend: "codex",
    mode: "review",
    exit_code: 0,
    duration_ms: 5000,
    review_result: {
      findings: [{ severity: "Info", description: "Minor style issue" }],
      passed_checks: ["lint", "types"],
      summary: "Overall good",
    },
  };
  const output = formatSingleResult(result, "T001");
  const parsed = JSON.parse(output);
  console.assert(parsed.schema_version === "1.0", "schema_version 应为 1.0");
  console.assert(parsed.task_id === "T001", "task_id 应为 T001");
  console.assert(parsed.backend === "codex", "backend 应为 codex");
  console.assert(parsed.exit_code === 0, "exit_code 应为 0");
  console.assert(parsed.degraded_from === null, "degraded_from 应为 null");
  console.assert(parsed.error === null, "error 应为 null");
  console.log("✅ 格式化单个成功结果通过");
}

// --- 测试：格式化错误结果 ---
{
  const result = {
    backend: "claude",
    mode: "review",
    exit_code: 1,
    duration_ms: 1000,
    error: "CLI not found",
    degraded_from: "codex",
  };
  const output = formatSingleResult(result, "T002");
  const parsed = JSON.parse(output);
  console.assert(parsed.error === "CLI not found", "error 应为 CLI not found");
  console.assert(parsed.degraded_from === "codex", "degraded_from 应为 codex");
  console.assert(
    parsed.review_result === null,
    "错误结果 review_result 应为 null",
  );
  console.log("✅ 格式化错误结果通过");
}

// --- 测试：格式化多结果合并 ---
{
  const results = [
    { backend: "codex", exit_code: 0, duration_ms: 3000 },
    { backend: "claude", exit_code: 0, duration_ms: 4000 },
  ];
  const output = formatMultiResult(results, "T003");
  const parsed = JSON.parse(output);
  console.assert(parsed.total === 2, "total 应为 2");
  console.assert(parsed.succeeded === 2, "succeeded 应为 2");
  console.assert(parsed.failed === 0, "failed 应为 0");
  console.assert(parsed.results.length === 2, "results 应有 2 个元素");
  console.log("✅ 格式化多结果合并通过");
}

// --- 测试：部分失败的多结果 ---
{
  const results = [
    { backend: "codex", exit_code: 0, duration_ms: 3000 },
    { backend: "claude", exit_code: 1, error: "timeout", duration_ms: 600000 },
  ];
  const output = formatMultiResult(results, "T004");
  const parsed = JSON.parse(output);
  console.assert(parsed.succeeded === 1, "succeeded 应为 1");
  console.assert(parsed.failed === 1, "failed 应为 1");
  console.log("✅ 部分失败的多结果通过");
}

console.log("\n所有 reporter 测试通过 ✅");
