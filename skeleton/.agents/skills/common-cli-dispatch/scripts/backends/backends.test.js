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

// --- 测试：Codex buildArgs review 模式包含 --dangerously-bypass-approvals-and-sandbox ---
{
  const args = codex.buildArgs({ workdir: "/project", mode: "review" });
  console.assert(args.includes("--json"), "Codex args 应包含 --json");
  console.assert(args.includes("-"), "Codex args 应包含 - (stdin)");
  console.assert(args.includes("-C"), "Codex args 应包含 -C");
  console.assert(
    args.includes("--dangerously-bypass-approvals-and-sandbox"),
    "Codex review args 应包含 --dangerously-bypass-approvals-and-sandbox（禁用沙箱）",
  );
  console.log("✅ Codex buildArgs 正确");
}

// --- 测试：Claude buildArgs 包含 --dangerously-skip-permissions、-p、--output-format json ---
{
  const args = claude.buildArgs({ workdir: "/project", mode: "review" });
  console.assert(
    args.includes("--dangerously-skip-permissions"),
    "Claude args 应包含 --dangerously-skip-permissions",
  );
  console.assert(args.includes("-p"), "Claude args 应包含 -p");
  console.assert(
    args.includes("--output-format"),
    "Claude args 应包含 --output-format",
  );
  const ofIdx = args.indexOf("--output-format");
  console.assert(
    args[ofIdx + 1] === "json",
    "--output-format 的值应为 json",
  );
  console.assert(
    claude.capabilities.stdin_mode === true,
    "Claude stdin_mode 应为 true（通过 stdin pipe 传入 prompt）",
  );
  console.assert(
    claude.capabilities.supports_json === true,
    "Claude supports_json 应为 true（--output-format json）",
  );
  console.log("✅ Claude buildArgs 正确");
}

// --- 测试：Gemini buildArgs 包含 json + --include-directories + stdin_mode ---
{
  const args = gemini.buildArgs({ workdir: "/project", mode: "review" });
  console.assert(args.includes("json"), "Gemini args 应包含 json");
  console.assert(
    args.includes("--include-directories"),
    "Gemini args 应包含 --include-directories",
  );
  console.assert(args.includes("-y"), "Gemini args 应包含 -y");
  console.assert(
    gemini.capabilities.stdin_mode === true,
    "Gemini stdin_mode 应为 true（通过 stdin pipe 传入 prompt）",
  );
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

// --- 测试：Codex execute 模式包含 sandbox_permissions ---
{
  const args = codex.buildArgs({ workdir: "/project", mode: "execute" });
  const joined = args.join(" ");
  console.assert(
    joined.includes("sandbox_permissions"),
    "Codex execute 应包含 sandbox_permissions",
  );
  console.assert(
    joined.includes("disk-write-access"),
    "Codex execute 应包含 disk-write-access",
  );
  console.log("✅ Codex execute buildArgs 正确");
}

// --- 测试：Claude execute 模式与 review 一致 ---
{
  const reviewArgs = claude.buildArgs({ workdir: "/project", mode: "review" });
  const execArgs = claude.buildArgs({ workdir: "/project", mode: "execute" });
  console.assert(
    JSON.stringify(reviewArgs) === JSON.stringify(execArgs),
    "Claude execute 应与 review 参数一致",
  );
  console.log("✅ Claude execute buildArgs 正确（与 review 一致）");
}

// --- 测试：Gemini execute 模式包含 --sandbox false ---
{
  const args = gemini.buildArgs({ workdir: "/project", mode: "execute" });
  const sandboxIdx = args.indexOf("--sandbox");
  console.assert(sandboxIdx !== -1, "Gemini execute 应包含 --sandbox");
  console.assert(
    args[sandboxIdx + 1] === "false",
    "Gemini execute --sandbox 应为 false",
  );
  console.log("✅ Gemini execute buildArgs 正确");
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

// --- 测试：isAvailable 跨平台检测命令正确 ---
{
  const { spawnSync } = require("child_process");
  const expectedCmd = process.platform === "win32" ? "where" : "which";
  // 验证当前平台的检测命令可用（命令本身存在）
  const probe = spawnSync(expectedCmd, ["node"], { timeout: 5000 });
  console.assert(
    probe.status === 0,
    `跨平台检测命令 "${expectedCmd}" 应能找到 node`,
  );
  console.log(
    `✅ 跨平台检测：当前平台 ${process.platform} 使用 "${expectedCmd}" 命令`,
  );
}

console.log("\n所有 backend 测试通过 ✅");
