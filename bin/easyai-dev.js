#!/usr/bin/env node

/**
 * easyai-dev CLI — easyAI 框架命令行工具
 *
 * 命令：
 *   init [dir]    初始化新项目或集成到已有项目
 *   check [dir]   检查框架完整性
 *   update [dir]  更新框架（只更新 .agents/ 和 .trellis/spec/）
 *   serve         启动 MCP Server（供 Antigravity IDE 使用）
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0];
const targetDir = args[1] || ".";

// 颜色常量
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m";

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
${BOLD}easyAI — 让用户以纯客户的视角进行软件开发${NC}

${BOLD}用法:${NC}
  easyai-dev <command> [options]

${BOLD}命令:${NC}
  ${GREEN}init${NC} [dir]      初始化新项目或集成到已有项目（默认: 当前目录）
  ${GREEN}check${NC} [dir]     检查框架完整性
  ${GREEN}update${NC} [dir]    更新框架（只更新 .agents/ 和 .trellis/spec/）
  ${GREEN}serve${NC}           启动 MCP Server（供 Antigravity IDE 使用）

${BOLD}示例:${NC}
  npx @geeseeker/easyai-dev init my-project
  npx @geeseeker/easyai-dev init .
  npx @geeseeker/easyai-dev check
  npx @geeseeker/easyai-dev serve

${BOLD}MCP 配置:${NC}
  在 Antigravity IDE 中配置 MCP Server:
  {
    "easyai-mcp-server": {
      "command": "npx",
      "args": ["-y", "@geeseeker/easyai-dev", "serve"]
    }
  }
`);
}

/**
 * 主函数
 */
async function main() {
  switch (command) {
    case "init": {
      const { doInit } = await import("../lib/init.js");
      const resolvedDir = path.resolve(targetDir);
      await doInit(resolvedDir);
      break;
    }

    case "check": {
      const { doCheck } = await import("../lib/init.js");
      const resolvedDir = path.resolve(targetDir);
      await doCheck(resolvedDir);
      break;
    }

    case "update": {
      const { doUpdate } = await import("../lib/init.js");
      const resolvedDir = path.resolve(targetDir);
      await doUpdate(resolvedDir);
      break;
    }

    case "serve": {
      // 支持 --project-root 参数和环境变量
      const projectRootArg = args.find((a) => a.startsWith("--project-root="));
      if (projectRootArg) {
        const root = projectRootArg.split("=")[1];
        process.env.EASYAI_PROJECT_ROOT = path.resolve(root);
      }
      // 动态导入 MCP Server
      await import("../lib/server/index.js");
      break;
    }

    case "--help":
    case "-h":
    case undefined:
      printHelp();
      break;

    case "--version":
    case "-v": {
      const pkgPath = path.join(__dirname, "..", "package.json");
      const { default: pkg } = await import(pkgPath, {
        with: { type: "json" },
      });
      console.log(pkg.version);
      break;
    }

    default:
      console.error(`${RED}未知命令: ${command}${NC}`);
      console.error(`使用 ${BOLD}easyai-dev --help${NC} 查看可用命令`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${RED}错误: ${error.message}${NC}`);
  process.exit(1);
});
