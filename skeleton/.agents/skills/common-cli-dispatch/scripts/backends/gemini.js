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

    // JSON 输出 + 自动确认 + 非交互模式
    args.push("-o", "json", "-y");

    // 传入工作目录（Gemini 用 --include-directories）
    if (config.workdir) {
      args.push("--include-directories", config.workdir);
    }

    // -p 启用非交互模式（prompt 通过 stdin 传入）
    args.push("-p");

    return args;
  },

  /**
   * 解析 Gemini 的 JSON 输出（-o json 模式，单个 JSON 对象）
   * @param {string} stdout - 原始 stdout 文本
   * @returns {object} 解析结果
   */
  parseOutput(stdout) {
    const trimmed = stdout.trim();
    if (!trimmed) {
      return { message: "", session_id: null, raw_text: null };
    }

    try {
      const data = JSON.parse(trimmed);
      return {
        message: data.response || "",
        session_id: data.session_id || null,
        raw_text: null,
        // 保存 stats 供后续 Token 成本分析使用
        stats: data.stats || null,
      };
    } catch (_err) {
      // JSON 解析失败，降级为纯文本
      return {
        message: trimmed,
        session_id: null,
        raw_text: trimmed,
      };
    }
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
    "[ERROR] [IDEConnectionUtils]",
    "[ERROR] [IDEClient]",
    "is overriding the built-in skill",
  ],
};

module.exports = geminiBackend;
