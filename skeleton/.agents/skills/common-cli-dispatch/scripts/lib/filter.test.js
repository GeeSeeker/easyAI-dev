"use strict";

const { createNoiseFilter, DEFAULT_NOISE_PATTERNS } = require("./filter");

// --- 测试：过滤匹配噪音模式的行 ---
{
  const filter = createNoiseFilter(["[WARN]", "Loading..."]);
  const input =
    "[WARN] Skipping dir\nValid output\nLoading... please wait\nDone\n";
  const result = filter.process(input);
  console.assert(
    result === "Valid output\nDone\n",
    `过滤结果不正确: "${result}"`,
  );
  console.log("✅ 过滤噪音行通过");
}

// --- 测试：保留不匹配的行 ---
{
  const filter = createNoiseFilter(["[WARN]"]);
  const input = "Line 1\nLine 2\nLine 3\n";
  const result = filter.process(input);
  console.assert(result === "Line 1\nLine 2\nLine 3\n", "应保留所有行");
  console.log("✅ 保留正常行通过");
}

// --- 测试：空输入 ---
{
  const filter = createNoiseFilter(["[WARN]"]);
  const result = filter.process("");
  console.assert(result === "", "空输入应返回空字符串");
  console.log("✅ 空输入通过");
}

// --- 测试：默认噪音模式包含已知模式 ---
{
  console.assert(Array.isArray(DEFAULT_NOISE_PATTERNS), "应导出默认模式数组");
  console.assert(DEFAULT_NOISE_PATTERNS.length > 0, "默认模式不应为空");
  console.log("✅ 默认噪音模式导出通过");
}

// --- 测试：flush 残留内容（无换行符尾行） ---
{
  const filter = createNoiseFilter(["noise"]);
  const partial = "valid partial";
  const flushed = filter.flush(partial);
  console.assert(flushed === "valid partial", `flush 结果不正确: "${flushed}"`);
  console.log("✅ flush 残留内容通过");
}

// --- 测试：flush 过滤噪音残留 ---
{
  const filter = createNoiseFilter(["noise"]);
  const partial = "this is noise content";
  const flushed = filter.flush(partial);
  console.assert(flushed === "", "噪音残留应被过滤");
  console.log("✅ flush 过滤噪音残留通过");
}

console.log("\n所有 filter 测试通过 ✅");
