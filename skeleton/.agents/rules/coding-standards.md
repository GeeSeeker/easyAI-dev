---
trigger: glob
description: Code formatting and quality standards for source files
globs: *.ts,*.js,*.py
---

# 编码规范

本规范在编辑源代码文件时自动注入（`.ts`, `.js`, `.py`）。

## 通用规范

1. **文件编码**：UTF-8，LF 换行符
2. **缩进**：2 空格（TypeScript/JavaScript）、4 空格（Python）
3. **行宽**：建议 100 字符以内，最大不超过 120 字符
4. **文件末尾**：保留一个空行

## TypeScript / JavaScript

1. **命名约定**：
   - 变量 / 函数：`camelCase`
   - 类 / 接口 / 类型：`PascalCase`
   - 常量：`UPPER_SNAKE_CASE`
   - 文件名：`kebab-case.ts`
2. **类型安全**：优先使用 `strict: true`，避免 `any`
3. **导入顺序**：Node 内置 → 第三方包 → 项目内部模块，各组之间空行分隔
4. **错误处理**：禁止空 `catch` 块，必须记录或上抛错误
5. **注释语言**：代码注释统一使用中文（面向用户可读性）

## Python

1. **命名约定**：遵循 PEP 8
2. **类型注解**：所有公共函数必须添加类型注解
3. **文档字符串**：所有公共函数 / 类必须有 docstring

## 代码质量

1. **单一职责**：每个函数 / 方法只做一件事
2. **DRY 原则**：避免重复代码，抽取公共逻辑
3. **先测试后编码**：修改逻辑前先确保有对应测试覆盖
4. **提交前验证**：确保 lint 通过 + 测试通过
