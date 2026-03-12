declare const TRELLIS_ROOT = ".trellis";
declare const TASKS_ROOT = ".trellis/tasks";
declare const ARCHIVE_ROOT = ".trellis/tasks/archive";
/**
 * 任务状态枚举
 */
type TaskStatus = "pending" | "in_progress" | "under_review" | "completed" | "archived" | "cancelled" | "rejected";
/**
 * 合法状态转移矩阵（来自 architecture §5.2）
 * Key: 当前状态, Value: 允许转移到的状态列表
 */
declare const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]>;
/**
 * 任务元数据接口
 */
interface TaskMetadata {
    id: string;
    title: string;
    status: TaskStatus;
    description: string;
    acceptance_criteria: string;
    file_scope?: string;
    assign_strategy?: string;
    created_at: string;
    updated_at: string;
}
/**
 * 解析后的任务文档结构
 */
interface ParsedTask {
    metadata: TaskMetadata;
    body: string;
}
/**
 * 获取项目根目录
 * 检测优先级：
 *   1. EASYAI_PROJECT_ROOT 环境变量（显式指定）
 *   2. process.cwd() 向上遍历查找 .trellis（IDE 工作目录在项目内时有效）
 *   3. __dirname 向上遍历查找 .trellis（MCP Server 安装在项目 node_modules 内时有效）
 * @returns 项目根目录的绝对路径
 */
declare function getProjectRoot(): string;
/**
 * 重置项目根目录缓存
 * 仅供测试和极端场景使用
 */
declare function resetProjectRootCache(): void;
/**
 * 获取任务目录绝对路径
 * @returns 任务目录的绝对路径
 */
declare function getTasksDir(): string;
/**
 * 获取归档目录绝对路径
 * @returns 归档目录的绝对路径
 */
declare function getArchiveDir(): string;
/**
 * 获取指定任务的目录路径
 * @param taskId - 任务 ID（如 T001-login-api）
 * @returns 任务目录的绝对路径
 */
declare function getTaskDir(taskId: string): string;
/**
 * 将文本转换为 kebab-case slug
 * - 转换为小写 ASCII
 * - 将空格和特殊字符替换为连字符
 * - 截断至 30 个字符
 * @param text - 输入文本（支持中文和英文）
 * @returns kebab-case slug
 */
declare function slugify(text: string): string;
/**
 * 生成任务 ID（格式：T{NNN}-{slug}）
 * 自动递增序号，基于现有任务目录（包括归档目录中的任务）
 * @param title - 任务标题
 * @returns 任务 ID（如 T001-login-api）
 */
declare function generateTaskId(title: string): string;
/**
 * 解析 task.md 文件内容
 * @param content - task.md 文件内容
 * @returns 解析后的元数据和正文
 */
declare function parseTaskMd(content: string): ParsedTask;
/**
 * 序列化为 task.md 文件格式
 * @param metadata - 任务元数据
 * @param body - 任务正文
 * @returns task.md 文件内容
 */
declare function serializeTaskMd(metadata: TaskMetadata, body: string): string;
/**
 * 校验状态转移是否合法
 * @param from - 当前状态
 * @param to - 目标状态
 * @returns 是否允许转移
 */
declare function isValidTransition(from: TaskStatus, to: TaskStatus): boolean;
/**
 * 列出所有任务目录（排除归档目录）
 * @returns 任务目录名列表
 */
declare function listTaskDirs(): string[];
/**
 * 确保目录存在，不存在则创建
 * @param dirPath - 目录路径
 */
declare function ensureDir(dirPath: string): void;
export type { TaskStatus, TaskMetadata, ParsedTask };
export { TRELLIS_ROOT, TASKS_ROOT, ARCHIVE_ROOT, VALID_TRANSITIONS, getProjectRoot, resetProjectRootCache, getTasksDir, getArchiveDir, getTaskDir, generateTaskId, slugify, parseTaskMd, serializeTaskMd, isValidTransition, listTaskDirs, ensureDir, };
//# sourceMappingURL=task-utils.d.ts.map