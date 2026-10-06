# CodeBlock 行为合同

状态：已实现；质量检查通过；Agent 接入验收通过（用户回报）；尚未发布
确认日期：2026-10-06
适用范围：P2-2 只读代码／原始文本块第一版
视觉依据：[CodeBlock 视觉合同](code-block-visual-contract.md)

用户已认可行为、视觉与 8 字段 Token 方案，并看过亮暗、横向滚动、自动换行及
无标题栏预览。2026-10-06 用户进一步授权实施；源码实现已完成并通过完整质量检查，
Agent 接入、提交推送和发布仍是独立任务。
预览中的复制仅模拟反馈，不能作为真实剪贴板验收证据。

## 1. 定位与业务归属（CB-B01）

CodeBlock 是可选复制的只读代码／原始文本展示，不是编辑器、JSON 格式化器、
Diff 查看器或 Markdown 渲染器。

| 组件库负责 | 调用方负责 |
| --- | --- |
| 原文、可选标题／语言标签、滚动／换行 | 数据取回、JSON.stringify、脱敏、截断与材料选择 |
| 显式复制、成功／失败反馈、键盘可访问性 | 本地化文案、敏感信息策略与业务状态 |
| 主题、响应式与包入口 | 外部折叠、限高、页面布局与会话生命周期 |

- 第一批使用候选是 Chat 工具参数／结果，以及 Bug 材料／引用内部的原文块。
  不替换 ToolCall 状态与展开管理，也不接管 Bug 材料卡片、来源链接或引用定位。
- Memory／Knowledge 的阅读正文不因使用 pre 就必须迁移，保留业务阅读排版。
- SafeMarkdown 当前输出经过净化的 HTML 字符串；本批不改 Markdown 管线，
  不把 React CodeBlock 拼进 HTML，不绕过净化。Markdown fence 接入另行讨论。

## 2. 公开接口（CB-B02）

```ts
import type { ComponentPropsWithoutRef } from 'react'

export interface CodeBlockCopyConfig {
  label: string
  copiedLabel: string
  errorLabel: string
}

export type CodeBlockProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'title' | 'dangerouslySetInnerHTML'
> & {
  code: string
  title?: string
  language?: string
  wrap?: boolean
  copy?: CodeBlockCopyConfig
}
```

- 根与 `matthew-ui/code-block` 导出 CodeBlock、CodeBlockProps、CodeBlockCopyConfig。
  ref 指向 HTMLDivElement；className/style/data/aria 与适用原生事件透传到根。
- code 必填且仅接受 string；不接受对象、ReactNode、children、renderCode 或 HTML。
  title 是面板显示标题，不是根 div 原生 title 提示。
- title/language 是纯文本；undefined、空字符串或纯空白视为未提供。
  非空内容按提供的文字显示，不内置名称、语言翻译或文件类型推断。
- wrap 默认 false。copy 未提供时没有复制按钮、反馈区域或复制行为；提供时
  三个字段均必填，调用方须提供有意义的本地化文案。不内置中文／英文回退。
- 不开放复制实现注入、任意按钮插槽、反馈时长配置或命令式复制服务。

## 3. 原文、标题与空内容（CB-B03）

- 使用 pre/code 文本节点；HTML、脚本、Markdown 与 diff 标记均作为普通文本，
  不使用 dangerouslySetInnerHTML，不执行内容，不自动链接或语法高亮。
- 保留输入的缩进、空格、制表符、换行和首尾空白；不 trim、不格式化、不添加
  行号、前后缀、额外末尾换行或折叠标记。wrap 仅改变排版，不改变原字符串。
- title、language 或 copy 任一提供时才有标题栏；仅 copy 时按钮仍有明确名称，
  仅 language 时正常显示语言标签；三者均无则完全省略标题栏与分隔线。
- 空 code 保留代码区域，不显示默认空态。copy 已配置时仍允许复制空字符串，
  不误报“没有内容”，不把显示占位文案复制出去。
- title/language 不属于复制内容。language 只是显示标签，不触发自动检测、
  语法解析、CSS 类名插值或外部资源加载。

## 4. 滚动、换行与动态内容（CB-B04）

- 默认保留原始行结构，长行只在代码区域内部横向滚动，不撑宽页面或祖先布局。
  wrap=true 使用 pre-wrap 与长词断行，仍保留显式换行与缩进。
- 默认不设最大高度、不裁剪、不虚拟化。业务可用正常 CSS 给代码区域限高并
  设置内部滚动；Bug 现有 24rem 限高是业务配置，不冻结成组件默认。
- 动态修改 code/title/language/wrap 不抢焦点、不自动滚到顶部或底部，不生成
  新的 key 强制重建整个组件；内容缩短时浏览器自然钳制滚动位置不算主动滚动。
- CodeBlock 没有内部 disclosure；需要折叠时放入 ToolCall 或业务折叠容器。
  若业务卸载组件，内部反馈无需跨卸载保存。

## 5. 复制与异步生命周期（CB-B05）

- 仅用户激活原生 type="button" 时调用 navigator.clipboard.writeText；不在挂载、
  prop 更新或 hover 时复制，不读取剪贴板、不提前请求权限、不访问网络。
- 写入点击当时的 code 字符串快照，不从 DOM textContent 反取，确保排版、标题、
  语言标签及反馈不混入原文。空白、CRLF、制表符也不主动归一化。
- Promise 成功后才显示 copiedLabel；拒绝、同步异常或 API 不可用都显示 errorLabel，
  不假成功、不产生未处理 rejection、不记录待复制正文或泄露系统错误详情。
- pending 时按钮仍保留 label 与焦点，使用 aria-disabled / aria-busy 阻止重复请求；
  不因换成 disabled 或替换 DOM 丢失焦点。不增加未经本地化的“复制中”文案。
  aria-disabled 只表达语义，事件处理仍须实际阻止重复写入。
- 成功／失败反馈位于按钮旁，约 2000ms 后清除；按钮 label 保持稳定。失败后可重试，
  新请求清除上一条反馈及计时器，不调用全局 Toast，不移动焦点。
- code 改变时立即清除旧反馈并使旧请求失效；即便内容 A → B → A，旧完成也不能
  被当成当前请求成功。旧系统写入不可撤回，但不能为新内容显示“已复制”。
- copy 被移除、配置改变或卸载时清理计时器并隔离旧请求完成；不得重新创建已移除
  的反馈或覆盖新请求状态。多实例的 pending、反馈、计时器互不影响。
  配置改变按三个文案字段的值判断；父层重渲染产生等值的新对象不重置请求或反馈。
- 不实现 execCommand 回退、隐藏 textarea 或“复制失败后自动选中全部”。失败时
  文本仍可正常选择，供用户手动复制。SSR 渲染不访问 navigator/window/document。

平台依据：[MDN Clipboard.writeText](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)
说明安全上下文要求、完成 Promise 与拒绝行为；本合同只承诺如实处理结果，不保证
消费环境权限策略一定允许写入。

## 6. DOM、键盘与可访问性（CB-B06）

- 根 div、正文 pre/code、复制原生 button；不伪装编辑器、textbox 或可编辑区域。
  Enter/Space 使用按钮原生行为，不截获全局键盘。
- 代码滚动区域支持键盘聚焦与方向键滚动，并保留清晰 focus-visible；不为每行
  增加 Tab 停靠点。若使用 tabIndex=0，须以 region 与非空 title 关联，或以调用方
  的 aria-label/aria-labelledby 提供名称；无名称模式避免制造无名 region。
- 有标题时可生成按实例唯一 id 关联代码区域；不把 language 误当完整内容说明，
  多实例不会产生重复自动 id。根节点显式 aria 属性仍按正常规则透传。
- 成功／失败短反馈使用 role=status 的温和播报；原文更新不设 aria-live，不逐字
  播报代码。配置 copy 后空 status 节点也须保持在可访问树中，不用 display:none
  使其直到结果到达才注册；空节点不占用可见布局空间。颜色不是区分成功／失败的唯一依据。
- 组件嵌入 ToolCall 详情后，复制和代码选择不触发父级开合；祖先隐藏时不绕过
  隐藏去复制或抢焦点。若父组件错误地将详情放进标题 button，应先修复组合结构。

## 7. 行为验收（CB-B07）

单测／真实 Chromium 至少覆盖：

1. 公开类型、根 ref／透传、纯文本安全、空字符串、首尾空白、制表符与换行。
2. 标题／语言／复制的各种组合，无配置时无标题栏／按钮／反馈；无默认业务文案。
3. writeText 参数严格等于 code 快照；成功、拒绝、同步异常、API 缺失与重试。
4. pending 重复点击被阻止且焦点保持；两实例独立；反馈计时与卸载清理。
5. pending 时 code 变化、A→B→A、移除／改变 copy、旧请求晚于新请求完成，
   不恢复旧反馈、不误报新内容已复制；新请求使用最新文本。
6. wrap 开关不改复制值；键盘滚动、焦点样式、Tab 顺序、反馈可访问性。
7. 放在 ToolCall 详情中，复制不改变展开；更新不抢焦点或自动滚动。
8. SSR、StrictMode、React 18.2/19；渲染阶段没有浏览器 API 或网络副作用。

剪贴板分支可用可控替身覆盖竞态，但真实 Chromium 还须在允许权限的测试宿主
验证真实写入与读取比对（读取仅限测试），不能用替身成功冒充平台写入验收。
测试不得读取用户剪贴板；使用隔离浏览器上下文与合成内容。

## 8. 工程与非目标（CB-B08）

- 实现时接入根／code-block 子路径、独立 style.css、全量 CSS、ESM/CJS 与 d.ts；
  JS 不隐式引 CSS，不夹带不需要的组件，不新增运行时依赖或全局 Token。
- 真实 npm pack 消费、两种 CSS 模式、React 18.2/19、类型／ref／构建与公开入口
  精确验证沿用现有流程；README 在实现批次标注源码新增但尚未发布。
- 不做高亮、行号、编辑、diff 对比、自动语言识别、Markdown／HTML 渲染、下载、
  内容截断、内置折叠、自动滚动、代码执行、联网或 Agent 工具权限逻辑。
- 不新抽通用 Clipboard／Toast／CodeRenderer 框架，不改 Agent 源码、npm link、
  SafeMarkdown 或既有组件。实施、Agent 接入、提交推送、版本与发布另行授权。

## 9. 实施验收记录

2026-10-06：npm run quality:check 严格退出码为 0；完整 426 个单元／浏览器用例、
100 个 Story、104 条发布验证器回归通过，React 18.2／19 真实 tarball 的类型、
ESM／CJS、ref、两种 CSS 模式与构建均通过。CodeBlock 新增 20 个单元／浏览器
用例、12 个 Story、10 条发布回归；真实写入／读取在隔离的合成浏览器上下文验证，
失败分支使用明确的边界故障注入，旧请求隔离用可控 Promise 验证。
未改运行时依赖、全局 Token 数量、版本号或 Agent 仓库；本批不发布。
