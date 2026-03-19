/**
 * 转义 YAML 字符串值
 * 对于包含特殊字符的字符串，使用单引号包裹并转义内部单引号
 * @param value - 原始字符串值
 * @returns 转义后的字符串
 */
export function escapeYamlString(value) {
    // 如果字符串包含特殊字符，使用单引号包裹并转义内部单引号
    const specialChars = ['"', "\\", ":", "#"];
    const hasSpecialChar = specialChars.some((char) => value.includes(char));
    if (hasSpecialChar) {
        // 单引号包裹：内部单引号通过双写转义（' → ''）
        return `'${value.replace(/'/g, "''")}'`;
    }
    return value;
}
//# sourceMappingURL=yaml-helpers.js.map