"use strict";

/**
 * Gemini CLI 后端适配器
 *
 * 参考 ccg-workflow/codeagent-wrapper/backend.go 的 GeminiBackend
 */

const { spawnSync } = require("child_process");
const path = require("path");

const geminiBackend = {
  name: "gemini",
  command: "gemini",

  // 能力声明
  capabilities: {
    supports_json: true,
    supports_stream_json: true,
    supports_resume: true,
    // Agentic 路径传递模式：不使用 stdin pipe，
    // 改为挂载 prompt 文件目录 + 短引导语触发 headless 模式
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
   * @param {string} [config.model] - 指定模型
   * @param {string[]} [config.include_files] - 注入的文件/目录路径
   * @param {string} [config.promptFile] - Prompt 文件绝对路径
   * @returns {string[]} CLI 参数数组
   */
  buildArgs(config) {
    const args = [];

    // JSON 输出 + 自动确认
    args.push("-o", "json", "-y");

    // 会话恢复：追加 --resume <session_id>
    if (config.session_id) {
      args.push("--resume", config.session_id);
    }

    // 模型选择
    if (config.model) {
      args.push("--model", config.model);
    }

    // execute 模式：禁用沙箱以允许文件写入
    if (config.mode === "execute") {
      args.push("--sandbox", "false");
    }

    // 传入工作目录（Gemini 用 --include-directories）
    if (config.workdir) {
      args.push("--include-directories", config.workdir);
    }

    // 上下文文件注入：通过 --include-directories 传入额外目录
    // 使用 classifyPaths 归一化：文件→父目录，去重，跳过不存在路径
    if (config.include_files && config.include_files.length > 0) {
      const { classifyPaths } = require("../lib/path-utils");
      const { dirs } = classifyPaths(config.include_files, config.workdir);
      for (const dir of dirs) {
        args.push("--include-directories", dir);
      }
    }

    // Agentic 路径传递：挂载 prompt 文件所在目录，
    // 并用短引导语 -p 触发 headless 模式（避免 stdin 死锁）
    if (config.promptFile) {
      const promptDir = path.dirname(path.resolve(config.promptFile));
      args.push("--include-directories", promptDir);
      args.push(
        "-p",
        "请严格遵守挂载目录中 prompt 文档的指令执行任务并按要求输出格式",
      );
    }

    return args;
  },

  /**
   * 构建会话列表查询参数
   * @returns {string[]} CLI 参数数组
   */
  listSessionsArgs() {
    return { type: "cli", args: ["--list-sessions"] };
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
      // 跨平台检测：Windows 用 where，Linux/macOS 用 which
      const cmd = process.platform === "win32" ? "where" : "which";
      const result = spawnSync(cmd, ["gemini"], { timeout: 5000 });
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
