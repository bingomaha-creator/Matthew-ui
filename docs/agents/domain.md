# Domain Docs

Matthew UI 是 single-context React 组件库，领域资料按以下层级使用。

## 阅读顺序

1. `README.md`：公开安装、API、样式入口、主题和质量合同。
2. `RELEASING.md`：发布边界、安全模型和稳定版本流程。
3. 相关源码、测试和 `docs/agents/`：当前实现及工程协作规则。
4. 若本地存在 `CONTEXT.md`，再读取当前进度、测试边界和学习约定。
5. 若本地存在 `docs/architecture/`、`docs/learning/reference/` 或 `docs/adr/`，
   按任务读取相关提案、行为契约或长期决策，不要求全部读取。

`CONTEXT.md` 与除 `docs/agents/` 外的内部资料默认不进入Git。干净clone中缺少它们是
正常情况，不得把其缺失当成阻塞；应以仓库内公开文档、源码和测试继续工作。

## 文档职责

- `README.md` 与 `RELEASING.md` 是干净clone也必须可用的维护合同。
- 本地 `CONTEXT.md` 描述“项目现在是什么状态”，可以随实现进度更新。
- 本地 `docs/architecture/` 描述“考虑过什么以及为什么选择当前方向”，现有资料继续保留。
- `docs/adr/` 描述“最终决定了什么”，保持简短稳定；决策真正需要冻结时再创建，不批量补历史文件。
- 行为契约描述可验证要求，不能用方案提案代替最终实现证据。

若实现或提案与既有 ADR 冲突，应明确指出并讨论是否修改或废弃 ADR，不得静默覆盖。
