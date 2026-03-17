"use strict";

/**
 * Gemini CLI 后端适配器
 *
 * 参考 ccg-workflow/codeagent-wrapper/backend.go 的 GeminiBackend
 */

const { spawnSync } = require("child_process");

const geminiBackend = {
  name: "gemini",
  command: "gemini",

  // 能力声明
  capabilities: {
    supports_json: true,
    supports_stream_json: true,
    supports_resume: true,
    stdin_mode: false,
    cwd_flag: null, // Gemini 使用 --include-directories
    needs_post_message_delay: false,
  },

  /**
   * 构建 Gemini CLI 参数列表
   * @param {object} config - 调用配置
   * @param {string} config.workdir - 工作目录
   * @param {string} config.mode - 运行模式
   * @param {string} [config.session_id] - 恢复会话 ID
   * @returns {string[]} CLI 参数数组
   */
  buildArgs(config) {
    const args = [];

    // JSON 流输出 + 自动确认
    args.push("-o", "stream-json", "-y");

    // 传入工作目录（Gemini 用 --include-directories）
    if (config.workdir) {
      args.push("--include-directories", config.workdir);
    }

    return args;
  },

  /**
   * 解析 Gemini 的 stream-json 输出，合并 delta 内容
   * @param {string} stdout - 原始 stdout 文本
   * @returns {object} 解析结果
   */
  parseOutput(stdout) {
    const { parseJSONLines } = require("../lib/parser");
    const { events, rawLines } = parseJSONLines(stdout);

    const contentParts = [];
    let sessionId = null;

    for (const event of events) {
      // 提取 session_id
      if (event.session_id && !sessionId) {
        sessionId = event.session_id;
      }
      // 合并 delta 内容
      if (event.content) {
        contentParts.push(event.content);
      }
    }

    return {
      message: contentParts.join(""),
      session_id: sessionId,
      raw_text: rawLines.length > 0 ? rawLines.join("\n") : null,
    };
  },

  /**
   * 检测 Gemini CLI 是否可用
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const result = spawnSync("which", ["gemini"], { timeout: 5000 });
      return result.status === 0;
    } catch (_err) {
      return false;
    }
  },

  // 噪音过滤模式（Gemini 特有）
  noisePatterns: [
    "[STARTUP]",
    "Session cleanup disabled",
    "Loading extension:",
    "YOLO mode is enabled",
    "Loaded cached credentials",
  ],
};

module.exports = geminiBackend;
