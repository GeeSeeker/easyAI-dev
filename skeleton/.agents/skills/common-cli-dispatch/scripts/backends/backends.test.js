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

// --- 测试：Claude buildArgs 包含 --dangerously-skip-permissions 和 -p ---
{
  const args = claude.buildArgs({ workdir: "/project", mode: "review" });
  console.assert(
    args.includes("--dangerously-skip-permissions"),
    "Claude args 应包含 --dangerously-skip-permissions",
  );
  console.assert(args.includes("-p"), "Claude args 应包含 -p");
  console.assert(
    !args.includes("--output-format"),
    "Claude args 不应包含 --output-format（使用纯文本模式）",
  );
  console.log("✅ Claude buildArgs 正确");
}

// --- 测试：Gemini buildArgs 包含 json 和 --include-directories 和 -p ---
{
  const args = gemini.buildArgs({ workdir: "/project", mode: "review" });
  console.assert(args.includes("json"), "Gemini args 应包含 json");
  console.assert(
    args.includes("--include-directories"),
    "Gemini args 应包含 --include-directories",
  );
  console.assert(args.includes("-y"), "Gemini args 应包含 -y");
  console.assert(args.includes("-p"), "Gemini args 应包含 -p");
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

// --- 测试：Claude parseOutput 提取纯文本 ---
{
  const stdout = "analysis complete\n";
  const result = claude.parseOutput(stdout);
  console.assert(
    result.message === "analysis complete",
    `Claude 解析不正确: "${result.message}"`,
  );
  console.log("✅ Claude parseOutput 正确");
}

// --- 测试：Gemini parseOutput 解析单 JSON 对象（-o json 模式） ---
{
  const stdout = JSON.stringify({
    session_id: "g789",
    response: "code looks good",
    stats: { models: {} },
  });
  const result = gemini.parseOutput(stdout);
  console.assert(
    result.message === "code looks good",
    `Gemini 解析不正确: "${result.message}"`,
  );
  console.assert(result.session_id === "g789", "Gemini session_id 不正确");
  console.assert(result.stats !== null, "Gemini stats 应非 null");
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
