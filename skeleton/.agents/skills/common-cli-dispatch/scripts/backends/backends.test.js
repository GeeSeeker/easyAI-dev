"use strict";

const codex = require("./codex");
const claude = require("./claude");
const gemini = require("./gemini");

// --- 测试：各 backend 都实现了 capability interface ---
for (const backend of [codex, claude, gemini]) {
  console.assert(
    typeof backend.name === "string",
    `${backend.name}: name 应为 string`,
  );
  console.assert(
    typeof backend.command === "string",
    `${backend.name}: command 应为 string`,
  );
  console.assert(
    typeof backend.capabilities === "object",
    `${backend.name}: capabilities 应为 object`,
  );
  console.assert(
    typeof backend.buildArgs === "function",
    `${backend.name}: buildArgs 应为 function`,
  );
  console.assert(
    typeof backend.parseOutput === "function",
    `${backend.name}: parseOutput 应为 function`,
  );
  console.assert(
    typeof backend.isAvailable === "function",
    `${backend.name}: isAvailable 应为 function`,
  );
  console.assert(
    Array.isArray(backend.noisePatterns),
    `${backend.name}: noisePatterns 应为 array`,
  );
  console.log(`✅ ${backend.name} 实现了 capability interface`);
}

// --- 测试：Codex buildArgs 包含 --json 和 stdin - ---
{
  const args = codex.buildArgs({ workdir: "/project", mode: "review" });
  console.assert(args.includes("--json"), "Codex args 应包含 --json");
  console.assert(args.includes("-"), "Codex args 应包含 - (stdin)");
  console.assert(args.includes("-C"), "Codex args 应包含 -C");
  console.log("✅ Codex buildArgs 正确");
}

// --- 测试：Claude buildArgs 包含 stream-json 和 --setting-sources ---
{
  const args = claude.buildArgs({ workdir: "/project", mode: "review" });
  console.assert(
    args.includes("stream-json"),
    "Claude args 应包含 stream-json",
  );
  console.assert(
    args.includes("--setting-sources"),
    "Claude args 应包含 --setting-sources",
  );
  console.assert(args.includes("-p"), "Claude args 应包含 -p");
  console.log("✅ Claude buildArgs 正确");
}

// --- 测试：Gemini buildArgs 包含 stream-json 和 --include-directories ---
{
  const args = gemini.buildArgs({ workdir: "/project", mode: "review" });
  console.assert(
    args.includes("stream-json"),
    "Gemini args 应包含 stream-json",
  );
  console.assert(
    args.includes("--include-directories"),
    "Gemini args 应包含 --include-directories",
  );
  console.assert(args.includes("-y"), "Gemini args 应包含 -y");
  console.log("✅ Gemini buildArgs 正确");
}

// --- 测试：Codex parseOutput 提取 agent_message ---
{
  const stdout = [
    '{"type":"thread.started","thread_id":"t123"}',
    '{"type":"item.completed","item":{"type":"agent_message","text":"hello world"}}',
    '{"type":"thread.completed","thread_id":"t123"}',
  ].join("\n");
  const result = codex.parseOutput(stdout);
  console.assert(
    result.message === "hello world",
    `Codex 解析结果不正确: "${result.message}"`,
  );
  console.assert(result.session_id === "t123", "Codex session_id 不正确");
  console.log("✅ Codex parseOutput 正确");
}

// --- 测试：Claude parseOutput 提取 result ---
{
  const stdout = [
    '{"type":"assistant","session_id":"s456","subtype":"init"}',
    '{"type":"result","session_id":"s456","result":"analysis complete"}',
  ].join("\n");
  const result = claude.parseOutput(stdout);
  console.assert(
    result.message === "analysis complete",
    `Claude 解析不正确: "${result.message}"`,
  );
  console.assert(result.session_id === "s456", "Claude session_id 不正确");
  console.log("✅ Claude parseOutput 正确");
}

// --- 测试：Gemini parseOutput 合并 delta 内容 ---
{
  const stdout = [
    '{"type":"init","session_id":"g789"}',
    '{"type":"message","content":"part1 ","delta":true}',
    '{"type":"message","content":"part2","delta":true}',
  ].join("\n");
  const result = gemini.parseOutput(stdout);
  console.assert(
    result.message === "part1 part2",
    `Gemini 解析不正确: "${result.message}"`,
  );
  console.assert(result.session_id === "g789", "Gemini session_id 不正确");
  console.log("✅ Gemini parseOutput 正确");
}

// --- 测试：isAvailable 返回 boolean ---
{
  for (const backend of [codex, claude, gemini]) {
    const available = backend.isAvailable();
    console.assert(
      typeof available === "boolean",
      `${backend.name}: isAvailable 应返回 boolean`,
    );
    console.log(`✅ ${backend.name} isAvailable 返回 ${available}`);
  }
}

console.log("\n所有 backend 测试通过 ✅");
