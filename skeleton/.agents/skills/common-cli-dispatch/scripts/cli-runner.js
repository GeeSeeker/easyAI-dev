#!/usr/bin/env node
"use strict";

/**
 * cli-runner.js — 外部 CLI 统一调度引擎
 *
 * 支持多 backend 并行调用（codex / claude / gemini），
 * 通过子进程管控实现超时终止、降级策略和结构化输出。
 *
 * 用法：
 *   node cli-runner.js \
 *     --backend codex,claude \
 *     --mode review \
 *     --prompt-file .tmp/cli-dispatch/prompt.md \
 *     --workdir /path/to/project \
 *     --timeout 600 \
 *     --output-dir .tmp/cli-dispatch/results/
 *
 * 零外部 npm 依赖，仅使用 Node.js 内置模块。
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const { createNoiseFilter, DEFAULT_NOISE_PATTERNS } = require("./lib/filter");
const { formatSingleResult, formatMultiResult } = require("./lib/reporter");

// --- 后端注册表 ---
const BACKEND_REGISTRY = {
  codex: require("./backends/codex"),
  claude: require("./backends/claude"),
  gemini: require("./backends/gemini"),
};

// --- CLI 参数解析 ---

/**
 * 解析命令行参数
 * @param {string[]} argv - process.argv
 * @returns {object} 解析后的配置
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  const config = {
    backends: [],
    mode: "review",
    promptFile: null,
    workdir: process.cwd(),
    timeout: 600,
    outputDir: null,
    taskId: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--backend":
        config.backends = args[++i].split(",").map((s) => s.trim());
        break;
      case "--mode":
        config.mode = args[++i];
        break;
      case "--prompt-file":
        config.promptFile = args[++i];
        break;
      case "--workdir":
        config.workdir = args[++i];
        break;
      case "--timeout":
        config.timeout = parseInt(args[++i], 10);
        break;
      case "--output-dir":
        config.outputDir = args[++i];
        break;
      case "--task-id":
        config.taskId = args[++i];
        break;
      case "--help":
        printUsage();
        process.exit(0);
        break;
      default:
        console.error(`未知参数: ${args[i]}`);
        process.exit(1);
    }
  }

  return config;
}

/**
 * 打印使用帮助
 */
function printUsage() {
  console.log(`用法: node cli-runner.js [选项]

选项:
  --backend <name,...>    后端名称，逗号分隔（codex,claude,gemini）
  --mode <mode>          运行模式（review）[默认: review]
  --prompt-file <path>   Prompt 文件路径
  --workdir <path>       工作目录 [默认: 当前目录]
  --timeout <seconds>    超时秒数 [默认: 600]
  --output-dir <path>    结果输出目录
  --task-id <id>         任务 ID
  --help                 显示帮助`);
}

/**
 * 验证配置参数
 * @param {object} config - 解析后的配置
 */
function validateConfig(config) {
  if (config.backends.length === 0) {
    console.error("错误: 必须指定至少一个 --backend");
    process.exit(1);
  }

  if (!config.promptFile) {
    console.error("错误: 必须指定 --prompt-file");
    process.exit(1);
  }

  if (!fs.existsSync(config.promptFile)) {
    console.error(`错误: prompt 文件不存在: ${config.promptFile}`);
    process.exit(1);
  }
}

// --- 降级策略 ---

/**
 * 解析请求的 backends，执行降级检查
 * @param {string[]} requested - 请求的 backend 名称列表
 * @returns {object[]} 可用的 backend 配置列表（含降级信息）
 */
function resolveBackends(requested) {
  const resolved = [];

  for (const name of requested) {
    const backend = BACKEND_REGISTRY[name];
    if (!backend) {
      console.error(`警告: 未知 backend "${name}", 跳过`);
      continue;
    }

    if (backend.isAvailable()) {
      resolved.push({ backend, degradedFrom: null });
    } else {
      // 尝试降级：按注册顺序找一个可用的替代
      const fallback = findFallback(name);
      if (fallback) {
        console.error(`降级: ${name} 不可用，使用 ${fallback.name} 代替`);
        resolved.push({ backend: fallback, degradedFrom: name });
      } else {
        console.error(`错误: ${name} 不可用，且无可用的替代 backend`);
        resolved.push({
          backend,
          degradedFrom: null,
          unavailable: true,
        });
      }
    }
  }

  return resolved;
}

/**
 * 查找可用的替代 backend
 * @param {string} excludeName - 要排除的 backend 名称
 * @returns {object|null} 可用的 backend 对象
 */
function findFallback(excludeName) {
  for (const [name, backend] of Object.entries(BACKEND_REGISTRY)) {
    if (name !== excludeName && backend.isAvailable()) {
      return backend;
    }
  }
  return null;
}

// --- 单个 CLI 执行 ---

/**
 * 执行单个 backend CLI 调用
 * @param {object} backendInfo - { backend, degradedFrom, unavailable }
 * @param {object} config - 运行配置
 * @returns {Promise<object>} 执行结果
 */
function executeBackend(backendInfo, config) {
  const { backend, degradedFrom, unavailable } = backendInfo;
  const startTime = Date.now();

  // 不可用的 backend 直接返回错误
  if (unavailable) {
    return Promise.resolve({
      backend: backend.name,
      mode: config.mode,
      exit_code: 127,
      duration_ms: 0,
      error: `${backend.name} CLI 不可用`,
      degraded_from: null,
    });
  }

  return new Promise((resolve) => {
    const promptContent = fs.readFileSync(config.promptFile, "utf-8");
    const args = backend.buildArgs({
      workdir: config.workdir,
      mode: config.mode,
    });

    // 合并所有噪音模式（默认 + backend 特有）
    const allPatterns = [...DEFAULT_NOISE_PATTERNS, ...backend.noisePatterns];
    const noiseFilter = createNoiseFilter(allPatterns);

    // 为使用 stdin 的 backend 构建额外参数
    const cliArgs = [...args];
    if (!backend.capabilities.stdin_mode) {
      // 对于不使用 stdin 的 backend，prompt 作为最后一个参数
      cliArgs.push(promptContent);
    }

    const child = spawn(backend.command, cliArgs, {
      cwd: backend.capabilities.cwd_flag ? undefined : config.workdir,
      // stdin_mode: true 的 backend（如 Codex）通过 pipe 传入 prompt
      // stdin_mode: false 的 backend（如 Claude、Gemini）通过 CLI 参数传入
      // 后者必须设 stdin 为 'ignore'，否则 CLI 会等待 stdin 输入导致挂起
      stdio: [
        backend.capabilities.stdin_mode ? "pipe" : "ignore",
        "pipe",
        "pipe",
      ],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      const raw = data.toString();
      const filtered = noiseFilter.process(raw);
      stderr += filtered;
    });

    // 超时控制：SIGTERM → 等待 5s → SIGKILL（C9）
    let timedOut = false;
    const timeoutMs = config.timeout * 1000;
    const timer = setTimeout(() => {
      timedOut = true;
      console.error(
        `超时: ${backend.name} 超过 ${config.timeout}s, 发送 SIGTERM`,
      );
      child.kill("SIGTERM");

      // 5 秒后强制 SIGKILL
      setTimeout(() => {
        if (!child.killed) {
          console.error(`强制终止: ${backend.name} SIGKILL`);
          child.kill("SIGKILL");
        }
      }, 5000);
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;

      // 解析输出
      const parsed = backend.parseOutput(stdout);

      const result = {
        backend: backend.name,
        mode: config.mode,
        exit_code: timedOut ? 124 : code || 0,
        duration_ms: durationMs,
        degraded_from: degradedFrom,
        session_id: parsed.session_id,
        error: timedOut ? `超时 (${config.timeout}s)` : null,
        stderr_filtered: stderr || null,
      };

      // 构建 review_result（从 parsed.message 提取）
      if (!result.error && code === 0 && parsed.message) {
        result.review_result = {
          findings: [],
          passed_checks: [],
          summary: parsed.message,
        };
      }

      resolve(result);
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        backend: backend.name,
        mode: config.mode,
        exit_code: 1,
        duration_ms: Date.now() - startTime,
        error: err.message,
        degraded_from: degradedFrom,
      });
    });

    // 写入 stdin（Codex 等使用 stdin 传入 prompt）
    if (backend.capabilities.stdin_mode) {
      child.stdin.write(promptContent);
      child.stdin.end();
    }
  });
}

// --- 并行执行 ---

/**
 * 并行执行多个 backend
 * @param {object[]} backendInfos - 已解析的 backend 列表
 * @param {object} config - 运行配置
 * @returns {Promise<object[]>} 所有结果
 */
async function executeParallel(backendInfos, config) {
  const promises = backendInfos.map((info) => executeBackend(info, config));
  return Promise.all(promises);
}

// --- 结果输出 ---

/**
 * 保存结果到文件
 * @param {object[]} results - 执行结果
 * @param {string} outputDir - 输出目录
 * @param {string} taskId - 任务 ID
 */
function saveResults(results, outputDir, taskId) {
  if (!outputDir) {
    return;
  }

  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  // 保存各 backend 的独立结果
  for (const result of results) {
    const filename = `result-${result.backend}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, formatSingleResult(result, taskId), "utf-8");
  }
}

// --- 主入口 ---

async function main() {
  const config = parseArgs(process.argv);
  validateConfig(config);

  // 解析 backends（含降级检查）
  const backendInfos = resolveBackends(config.backends);

  if (backendInfos.length === 0) {
    console.error("错误: 没有可用的 backend");
    process.exit(127);
  }

  // 执行
  const results = await executeParallel(backendInfos, config);

  // 保存结果文件
  saveResults(results, config.outputDir, config.taskId);

  // 设置退出码（任一失败则非零）
  const hasFailure = results.some((r) => r.exit_code !== 0);
  const exitCode = hasFailure ? 1 : 0;

  // 输出到 stdout（主控 AI 读取）
  // 注意：非 TTY 管道场景下 stdout 是异步的，
  // 必须等 write 回调完成后再退出，否则输出会丢失
  const output =
    results.length === 1
      ? formatSingleResult(results[0], config.taskId)
      : formatMultiResult(results, config.taskId);

  process.stdout.write(output, () => {
    process.exit(exitCode);
  });
}

// 导出供测试使用
module.exports = {
  parseArgs,
  resolveBackends,
  executeBackend,
  BACKEND_REGISTRY,
};

// 直接运行时执行主函数
if (require.main === module) {
  main().catch((err) => {
    console.error(`致命错误: ${err.message}`);
    process.exit(1);
  });
}
