"use strict";

/**
 * Claude Code CLI 后端适配器
 *
 * 参考 ccg-workflow/codeagent-wrapper/backend.go 的 ClaudeBackend
 */

const { spawnSync } = require("child_process");

const claudeBackend = {
  name: "claude",
  command: "claude",

  // 能力声明
  capabilities: {
    supports_json: true,
    supports_stream_json: true,
    supports_resume: true,
    stdin_mode: false,
    cwd_flag: null, // Claude 不支持 -C，通过 cmd.Dir 设置
    needs_post_message_delay: false,
  },

  /**
   * 构建 Claude Code CLI 参数列表
   * @param {object} config - 调用配置
   * @param {string} config.workdir - 工作目录
   * @param {string} config.mode - 运行模式
   * @param {string} [config.session_id] - 恢复会话 ID
   * @returns {string[]} CLI 参数数组
   */
  buildArgs(config) {
    const args = ["-p"];

    // 禁用所有设置源（防止递归调用）
    args.push("--setting-sources", "");

    // JSON 流输出
    args.push("--output-format", "stream-json", "--verbose");

    return args;
  },

  /**
   * 解析 Claude 的 stream-json 输出，提取 result
   * @param {string} stdout - 原始 stdout 文本
   * @returns {object} 解析结果
   */
  parseOutput(stdout) {
    const { parseJSONLines } = require("../lib/parser");
    const { events, rawLines } = parseJSONLines(stdout);

    let message = "";
    let sessionId = null;

    for (const event of events) {
      // 提取 session_id
      if (event.session_id && !sessionId) {
        sessionId = event.session_id;
      }
      // 提取最终 result
      if (event.result) {
        message = event.result;
      }
    }

    return {
      message,
      session_id: sessionId,
      raw_text: rawLines.length > 0 ? rawLines.join("\n") : null,
    };
  },

  /**
   * 检测 Claude Code CLI 是否可用
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const result = spawnSync("which", ["claude"], { timeout: 5000 });
      return result.status === 0;
    } catch (_err) {
      return false;
    }
  },

  // 噪音过滤模式（Claude 特有）
  noisePatterns: [],
};

module.exports = claudeBackend;
