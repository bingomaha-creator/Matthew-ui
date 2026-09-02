# Matthew UI Agent Guide

## Agent skills

### Issue tracker

问题与需求使用 GitHub Issues 管理；外部 Pull Request 暂不作为需求分流入口。除非用户明确要求，不创建、评论、打标签或关闭 Issue。详见 `docs/agents/issue-tracker.md`。

### Triage labels

使用 `needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix` 五种状态标签。详见 `docs/agents/triage-labels.md`。

### Domain docs

本仓库采用 single-context：先读仓库内的 `README.md`、`RELEASING.md` 和相关源码；
`CONTEXT.md`、架构提案、学习契约等是存在时再读取的本地补充资料。详见
`docs/agents/domain.md`。
