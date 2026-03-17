"use strict";

const { parseJSONLines } = require("./parser");

// --- 测试：解析有效的单行 JSON ---
{
  const input = '{"type":"message","content":"hello"}\n';
  const result = parseJSONLines(input);
  console.assert(result.events.length === 1, "应解析出 1 个事件");
  console.assert(result.events[0].type === "message", "type 应为 message");
  console.assert(result.events[0].content === "hello", "content 应为 hello");
  console.assert(result.rawLines.length === 0, "不应有 rawLines");
  console.log("✅ 解析单行 JSON 通过");
}

// --- 测试：解析多行 JSON ---
{
  const input =
    ['{"type":"start","id":1}', '{"type":"end","id":2}'].join("\n") + "\n";
  const result = parseJSONLines(input);
  console.assert(result.events.length === 2, "应解析出 2 个事件");
  console.assert(
    result.events[0].type === "start",
    "第一个事件 type 应为 start",
  );
  console.assert(result.events[1].type === "end", "第二个事件 type 应为 end");
  console.log("✅ 解析多行 JSON 通过");
}

// --- 测试：非 JSON 行降级为纯文本 ---
{
  const input = "This is plain text output\nAnother line\n";
  const result = parseJSONLines(input);
  console.assert(result.events.length === 0, "不应有 events");
  console.assert(result.rawLines.length === 2, "应有 2 个 rawLines");
  console.assert(
    result.rawLines[0] === "This is plain text output",
    "第一行内容正确",
  );
  console.log("✅ 非 JSON 降级为纯文本通过");
}

// --- 测试：混合 JSON 和纯文本 ---
{
  const input = 'Loading...\n{"type":"result","data":"ok"}\nDone.\n';
  const result = parseJSONLines(input);
  console.assert(result.events.length === 1, "应有 1 个 event");
  console.assert(result.rawLines.length === 2, "应有 2 个 rawLines");
  console.assert(result.events[0].type === "result", "event type 应为 result");
  console.log("✅ 混合 JSON 和纯文本通过");
}

// --- 测试：空输入 ---
{
  const result = parseJSONLines("");
  console.assert(result.events.length === 0, "空输入不应有 events");
  console.assert(result.rawLines.length === 0, "空输入不应有 rawLines");
  console.log("✅ 空输入通过");
}

// --- 测试：无换行符的尾行 ---
{
  const input = '{"type":"msg"}';
  const result = parseJSONLines(input);
  console.assert(result.events.length === 1, "无换行尾行应被解析");
  console.log("✅ 无换行符尾行通过");
}

console.log("\n所有 parser 测试通过 ✅");
