"use strict";

/**
 * Codex CLI 后端适配器
 *
 * 参考 ccg-workflow/codeagent-wrapper/backend.go 的 CodexBackend
 */

const { spawnSync } = require("child_process");

const codexBackend = {
  name: "codex",
  command: "codex",

  // 能力声明
  capabilities: {
    supports_json: true,
    supports_stream_json: false,
    supports_resume: true,
    stdin_mode: true,
    cwd_flag: "-C",
    needs_post_message_delay: true,
  },

  /**
   * 构建 Codex CLI 参数列表
   * @param {object} config - 调用配置
   * @param {string} config.workdir - 工作目录
   * @param {string} config.mode - 运行模式
   * @param {string} [config.session_id] - 恢复会话 ID
   * @returns {string[]} CLI 参数数组
   */
  buildArgs(config) {
    const args = ["exec", "--json"];

    // 跳过 git 仓库检查
    args.push("--skip-git-repo-check");

    if (config.mode === "execute") {
      // execute 模式：赋予磁盘读写权限（沙箱内）
      args.push(
        "-c",
        'sandbox_permissions=["disk-full-read-access","disk-write-access"]',
      );
    } else {
      // review 模式：禁用沙箱
      // Windows 上 Codex 沙箱使用 CreateProcessAsUserW，
      // 会报 "CreateProcessAsUserW failed: 5" 权限错误导致无法读取文件
      args.push("--full-auto");
    }

    if (config.workdir) {
      args.push("-C", config.workdir);
    }

    // 从 stdin 读取 prompt
    args.push("-");

    return args;
  },

  /**
   * 解析 Codex 的 JSON 流输出，提取 agent_message
   * @param {string} stdout - 原始 stdout 文本
   * @returns {object} 解析结果
   */
  parseOutput(stdout) {
    const { parseJSONLines } = require("../lib/parser");
    const { events, rawLines } = parseJSONLines(stdout);

    let message = "";
    let sessionId = null;

    for (const event of events) {
      // 提取 thread_id 作为 session_id
      if (event.thread_id && !sessionId) {
        sessionId = event.thread_id;
      }
      // 提取 agent_message
      if (event.type === "item.completed" && event.item) {
        if (event.item.type === "agent_message") {
          const text = event.item.text;
          if (typeof text === "string") {
            message = text;
          } else if (Array.isArray(text)) {
            message = text.filter((t) => typeof t === "string").join("");
          }
        }
      }
    }

    return {
      message,
      session_id: sessionId,
      raw_text: rawLines.length > 0 ? rawLines.join("\n") : null,
    };
  },

  /**
   * 检测 Codex CLI 是否可用
   * @returns {boolean}
   */
  isAvailable() {
    try {
      // 跨平台检测：Windows 用 where，Linux/macOS 用 which
      const cmd = process.platform === "win32" ? "where" : "which";
      const result = spawnSync(cmd, ["codex"], { timeout: 5000 });
      return result.status === 0;
    } catch (_err) {
      return false;
    }
  },

  // 噪音过滤模式（Codex 特有）
  noisePatterns: ["(node:", "(Use `node --trace-warnings"],
};

module.exports = codexBackend;
