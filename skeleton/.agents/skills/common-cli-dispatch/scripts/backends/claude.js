"use strict";

/**
 * Claude Code CLI 后端适配器
 *
 * 参考官方文档：https://code.claude.com/docs/en/headless
 * 核心能力：-p 模式 + --output-format json + --resume/--continue
 */

const { spawnSync } = require("child_process");

const claudeBackend = {
  name: "claude",
  command: "claude",

  // 能力声明
  capabilities: {
    supports_json: true, // 通过 --output-format json 支持
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
   * @param {string} [config.model] - 指定模型
   * @param {string[]} [config.include_files] - 注入的文件/目录路径
   * @returns {string[]} CLI 参数数组
   */
  buildArgs(config) {
    // 核心参数：跳过权限检查 + one-shot 模式 + JSON 输出
    // --output-format json 返回含 session_id 的 JSON 对象
    // 参考：https://code.claude.com/docs/en/headless
    const args = ["--dangerously-skip-permissions", "-p", "--output-format", "json"];

    // 会话恢复优先级：
    // 1. --resume <id>：恢复指定会话
    // 2. --continue：续接最近一次会话（无需手动传 session_id）
    if (config.session_id) {
      args.push("--resume", config.session_id);
    }

    // 模型选择
    if (config.model) {
      args.push("--model", config.model);
    }

    // 上下文文件注入：通过 --add-dir 传入目录
    // Claude 的 --add-dir 接受多个目录，每个需要独立的 --add-dir 参数
    if (config.include_files && config.include_files.length > 0) {
      for (const filePath of config.include_files) {
        args.push("--add-dir", filePath);
      }
    }

    return args;
  },

  /**
   * 构建会话列表查询参数
   * @returns {object} 查询配置
   */
  listSessionsArgs() {
    // Claude sessions list 是交互式 TUI，读文件系统代替
    const os = require("os");
    const sessionsDir = require("path").join(
      os.homedir(), ".claude", "projects",
    );
    return { type: "fs", dir: sessionsDir };
  },

  /**
   * 解析 Claude 的输出
   * 当使用 --output-format json 时，输出为 JSON 对象：
   * { "type": "result", "result": "...", "session_id": "...", ... }
   * 降级为纯文本解析当 JSON 解析失败时
   * @param {string} stdout - 原始 stdout 文本
   * @returns {object} 解析结果
   */
  parseOutput(stdout) {
    const trimmed = stdout.trim();

    // 优先尝试 JSON 解析（--output-format json 模式）
    try {
      const data = JSON.parse(trimmed);
      return {
        message: data.result || "",
        session_id: data.session_id || null,
        raw_text: null,
      };
    } catch (_jsonErr) {
      // JSON 解析失败，降级为纯文本
      // 尝试从输出中提取 session_id（交互模式退出时的 resume 提示）
      let sessionId = null;
      const resumeMatch = trimmed.match(
        /--resume\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
      );
      if (resumeMatch) {
        sessionId = resumeMatch[1];
      }

      return {
        message: trimmed,
        session_id: sessionId,
        raw_text: trimmed,
      };
    }
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
