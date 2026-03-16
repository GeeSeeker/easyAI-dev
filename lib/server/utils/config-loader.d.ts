/**
 * 上下文预算配置
 */
interface ContextConfig {
    warningThreshold: number;
    criticalThreshold: number;
    phaseBudget: Record<string, number>;
    autoDowngrade: boolean;
}
/**
 * Journal 配置
 */
interface JournalConfig {
    root: string;
    maxLinesPerFile: number;
    dateFormat: string;
}
/**
 * 任务管理配置
 */
interface TasksConfig {
    root: string;
    archive: string;
    maxSubtasks: number;
}
/**
 * 开发者信息配置
 */
interface DeveloperConfig {
    name: string;
}
/**
 * 框架完整配置
 */
export interface EasyAIConfig {
    context: ContextConfig;
    journal: JournalConfig;
    tasks: TasksConfig;
    developer: DeveloperConfig;
}
/**
 * 默认配置（config.yaml 不可用时的降级值）
 * 与 config.yaml 中的声明保持一致
 */
declare const DEFAULT_CONFIG: EasyAIConfig;
/**
 * 轻量 YAML 解析器（仅支持 config.yaml 用到的结构）
 * 支持：嵌套对象（2 层）、字符串、数字、布尔值、注释、带引号的值
 * 不支持：数组（YAML list 语法）、多行字符串、锚点/别名
 * @param content - YAML 文件内容
 * @returns 解析后的嵌套对象
 */
declare function parseSimpleYaml(content: string): Record<string, Record<string, unknown> | unknown>;
/**
 * 获取框架配置（带缓存）
 * 首次调用时加载 config.yaml，后续调用返回缓存
 * @returns 框架配置对象
 */
declare function getConfig(): EasyAIConfig;
/**
 * 重置配置缓存
 * 仅供测试和极端场景使用（如配置文件热更新）
 */
declare function resetConfigCache(): void;
/**
 * 获取默认用户名（从 config.yaml 的 developer.name 读取）
 * journal 系统使用此值决定 workspace 文件夹名
 * @returns 开发者名字，未配置时返回 "default"
 */
declare function getDefaultUser(): string;
export { DEFAULT_CONFIG, getConfig, resetConfigCache, parseSimpleYaml, getDefaultUser, };
//# sourceMappingURL=config-loader.d.ts.map