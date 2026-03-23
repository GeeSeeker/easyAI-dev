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
    supports_json: false,
    supports_stream_json: false,
    supports_resume: true,
    stdin_mode: true,
    cwd_flag: null, // Claude 不支持 -C，通过 spawn options.cwd 设置
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
    // 核心参数：跳过权限检查 + one-shot 模式
    const args = ["--dangerously-skip-permissions", "-p"];

    // 注意：不添加 --setting-sources= 参数。
    // 该参数会禁用所有配置源（user/project/local），
    // 导致使用自定义配置（API proxy、自定义认证等）的用户无法连接。
    // stdin_mode: true + -p 已足够保证 one-shot 执行模式。

    return args;
  },

  /**
   * 解析 Claude 的纯文本输出
   * @param {string} stdout - 原始 stdout 文本
   * @returns {object} 解析结果
   */
  parseOutput(stdout) {
    const trimmed = stdout.trim();

    return {
      message: trimmed,
      session_id: null,
      raw_text: null,
    };
  },

  /**
   * 检测 Claude Code CLI 是否可用
   * @returns {boolean}
   */
  isAvailable() {
    try {
      // 跨平台检测：Windows 用 where，Linux/macOS 用 which
      const cmd = process.platform === "win32" ? "where" : "which";
      const result = spawnSync(cmd, ["claude"], { timeout: 5000 });
      return result.status === 0;
    } catch (_err) {
      return false;
    }
  },

  // 噪音过滤模式（Claude 特有）
  noisePatterns: [],
};

module.exports = claudeBackend;
