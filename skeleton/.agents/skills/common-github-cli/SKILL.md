---
name: common-github-cli
description: "[Common] GitHub CLI 集成 — 触发：需要与 GitHub 交互（搜索代码/Issue、创建 PR、管理 Release 等）。排除：本地 Git 操作（用内置 git 命令）。产出：GitHub API 操作结果。确保在任何需要 GitHub 平台交互时使用此 Skill 而非猜测 gh 命令。"
---

# GitHub CLI 集成

通过 `gh` CLI 与 GitHub 平台交互，替代重量级的 GitHub MCP Server（节省 ~5000 tokens 上下文）。

## 前置条件

- `gh` CLI 已安装（`sudo apt install gh` 或 `brew install gh`）
- 已登录认证（`gh auth login`）

> 如果 `gh` 未安装或未认证，提示用户执行上述命令后再使用。

## 命令速查

按使用频率排序，覆盖日常 90% 的 GitHub 交互需求。

### 搜索

```bash
# 搜索代码（跨仓库）
gh search code "关键词" --repo owner/repo --language typescript

# 搜索 Issue
gh search issues "关键词" --repo owner/repo --state open

# 搜索 PR
gh search prs "关键词" --repo owner/repo --state open

# 搜索仓库
gh search repos "关键词" --language typescript --sort stars
```

### Issue 管理

```bash
# 查看 Issue 列表
gh issue list --repo owner/repo --state open --limit 20

# 查看 Issue 详情
gh issue view <number> --repo owner/repo

# 查看 Issue 评论
gh issue view <number> --repo owner/repo --comments

# 创建 Issue
gh issue create --repo owner/repo \
  --title "标题" \
  --body "描述内容"

# 关闭 Issue
gh issue close <number> --repo owner/repo --reason completed

# 添加评论
gh issue comment <number> --repo owner/repo --body "评论内容"
```

### Pull Request 管理

```bash
# 查看 PR 列表
gh pr list --repo owner/repo --state open

# 查看 PR 详情
gh pr view <number> --repo owner/repo

# 查看 PR diff
gh pr diff <number> --repo owner/repo

# 查看 PR 文件列表
gh pr view <number> --repo owner/repo --json files --jq '.files[].path'

# 查看 PR 检查状态
gh pr checks <number> --repo owner/repo

# 创建 PR（推荐用 temp file 写 body）
cat > /tmp/pr_body.md <<'EOF'
## 摘要
简要描述

## 变更
- 变更 1
- 变更 2
EOF

gh pr create \
  --title "描述性标题" \
  --body-file /tmp/pr_body.md \
  --base main

rm /tmp/pr_body.md

# 合并 PR
gh pr merge <number> --repo owner/repo --squash --delete-branch

# 审查 PR
gh pr review <number> --repo owner/repo --approve --body "LGTM"
```

### 仓库操作

```bash
# 查看仓库信息
gh repo view owner/repo

# 查看文件内容（远程）
gh api repos/owner/repo/contents/path/to/file --jq '.content' | base64 -d

# 查看提交历史
gh api repos/owner/repo/commits --jq '.[0:10] | .[] | "\(.sha[0:7]) \(.commit.message | split("\n")[0])"'

# 查看分支列表
gh api repos/owner/repo/branches --jq '.[].name'

# 查看最新 Release
gh release view --repo owner/repo

# 创建 Release
gh release create v1.0.0 --repo owner/repo \
  --title "v1.0.0" \
  --notes "发布说明"
```

### GitHub API 直接调用

对于没有专用子命令的操作，用 `gh api` 直接访问 REST API：

```bash
# GET 请求
gh api repos/owner/repo/labels --jq '.[].name'

# POST 请求
gh api repos/owner/repo/labels -f name="bug" -f color="d73a4a"

# GraphQL 查询
gh api graphql -f query='{ viewer { login } }'
```

> `gh api` 可以替代任何 GitHub REST/GraphQL API 调用，是万能兜底。

## 输出处理技巧

`gh` 支持 `--json` + `--jq` 参数提取结构化数据：

```bash
# 获取 PR 的 JSON 字段
gh pr view 123 --json title,state,author --jq '{title, state, author: .author.login}'

# Issue 列表只取标题和编号
gh issue list --json number,title --jq '.[] | "#\(.number) \(.title)"'

# 搜索结果取前 5 条
gh search code "pattern" --repo owner/repo --json path --jq '.[0:5] | .[].path'
```

## Shell 安全规则

```bash
# ❌ 禁止：复杂内容用 inline --body
gh pr create --title "Title" --body "## Summary\n- Item 1\n`code`"

# ✅ 正确：用 temp file
cat > /tmp/pr_body.md <<'EOF'
## Summary
- Item 1
`code`
EOF
gh pr create --title "Title" --body-file /tmp/pr_body.md
rm /tmp/pr_body.md
```

## 错误恢复

| 错误                               | 解决方案                                   |
| ---------------------------------- | ------------------------------------------ |
| `gh: command not found`            | `sudo apt install gh` 或 `brew install gh` |
| `not logged into any GitHub hosts` | `gh auth login`                            |
| `head ref not found`               | 先 `git push -u origin <branch>`           |
| `HTTP 403 / 404`                   | 检查仓库权限和名称拼写                     |
| `API rate limit exceeded`          | 等待重置或用 `gh auth status` 检查认证状态 |

## PATEOAS 导航

```markdown
### 下一步行动

1. [ ] 确认 gh CLI 已安装且已认证
2. [ ] 根据操作类型选择对应命令
3. [ ] 执行命令并处理输出
4. [ ] 将结果整合到当前工作流

### 状态快照

- 当前角色：{PM/Worker}
- 当前 Skill: common-github-cli
- 操作类型：{搜索/Issue/PR/仓库/API}
- 执行状态：{未开始/进行中/已完成/失败}
```
