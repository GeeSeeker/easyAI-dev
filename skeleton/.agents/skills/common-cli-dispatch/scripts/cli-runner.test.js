"use strict";

const {
  parseArgs,
  resolveBackends,
  BACKEND_REGISTRY,
} = require("./cli-runner");

// --- 测试：parseArgs 基本参数解析 ---
{
  const config = parseArgs([
    "node",
    "cli-runner.js",
    "--backend",
    "codex,claude",
    "--mode",
    "review",
    "--prompt-file",
    "/tmp/test.md",
    "--workdir",
    "/project",
    "--timeout",
    "300",
    "--output-dir",
    "/tmp/results",
    "--task-id",
    "T001",
  ]);
  console.assert(config.backends.length === 2, "应有 2 个 backends");
  console.assert(config.backends[0] === "codex", "第一个 backend 应为 codex");
  console.assert(config.backends[1] === "claude", "第二个 backend 应为 claude");
  console.assert(config.mode === "review", "mode 应为 review");
  console.assert(config.promptFile === "/tmp/test.md", "promptFile 应正确");
  console.assert(config.workdir === "/project", "workdir 应正确");
  console.assert(config.timeout === 300, "timeout 应为 300");
  console.assert(config.outputDir === "/tmp/results", "outputDir 应正确");
  console.assert(config.taskId === "T001", "taskId 应正确");
  console.log("✅ parseArgs 基本参数解析通过");
}

// --- 测试：parseArgs 默认值 ---
{
  const config = parseArgs([
    "node",
    "cli-runner.js",
    "--backend",
    "codex",
    "--prompt-file",
    "/tmp/test.md",
  ]);
  console.assert(config.mode === "review", "默认 mode 应为 review");
  console.assert(config.timeout === 600, "默认 timeout 应为 600");
  console.assert(config.outputDir === null, "默认 outputDir 应为 null");
  console.log("✅ parseArgs 默认值通过");
}

// --- 测试：BACKEND_REGISTRY 包含三个 backend ---
{
  console.assert("codex" in BACKEND_REGISTRY, "应包含 codex");
  console.assert("claude" in BACKEND_REGISTRY, "应包含 claude");
  console.assert("gemini" in BACKEND_REGISTRY, "应包含 gemini");
  console.assert(
    Object.keys(BACKEND_REGISTRY).length === 3,
    "应有 3 个 backend",
  );
  console.log("✅ BACKEND_REGISTRY 包含三个 backend");
}

// --- 测试：resolveBackends 正常解析可用的 backend ---
{
  const resolved = resolveBackends(["codex"]);
  console.assert(resolved.length === 1, "应解析出 1 个 backend");
  console.assert(resolved[0].backend.name === "codex", "应为 codex");
  console.assert(resolved[0].degradedFrom === null, "不应有降级");
  console.log("✅ resolveBackends 正常解析通过");
}

// --- 测试：resolveBackends 未知 backend ---
{
  // 将 stderr 临时重定向以避免测试噪音
  const origStderr = console.error;
  let warnMsg = "";
  console.error = (msg) => {
    warnMsg = msg;
  };

  const resolved = resolveBackends(["nonexistent"]);
  console.assert(resolved.length === 0, "未知 backend 应被跳过");
  console.assert(warnMsg.includes("nonexistent"), "应输出警告");

  console.error = origStderr;
  console.log("✅ resolveBackends 未知 backend 处理通过");
}

// --- 测试：resolveBackends 多 backend ---
{
  const resolved = resolveBackends(["codex", "claude"]);
  console.assert(resolved.length === 2, "应解析出 2 个 backend");
  console.log("✅ resolveBackends 多 backend 通过");
}

console.log("\n所有 cli-runner 测试通过 ✅");
