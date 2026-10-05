# SourceList 行为合同

状态：已实现；质量检查通过、尚未发布；Agent 接入另行验收
确认日期：2026-10-05
适用范围：P2-1 来源列表第一版
视觉依据：[SourceList 视觉合同](source-list-visual-contract.md)

本文记录已确认的产品行为，以及为这些行为收敛的最小技术接口。2026-10-05 用户
已确认 12 个组件 Token 字段并授权实施；Agent 接入和发布仍是独立任务。

## 1. 定位与业务归属（SLST-B01）

SourceList 展示调用方提供的来源条目，不是引用管理器、证据检索器或通用 List 框架。
Chat、Research、Bug 可在业务端将各自的数据映射为同一展示接口，不在组件库新增
ChatSourceList、ResearchSourceList 或 BugSourceList。

| 组件库负责 | 业务端负责 |
| --- | --- |
| 来源标题、摘要、说明与可选链接的展示 | DTO 映射、检索、加载、权限与证据真实性 |
| 整组折叠、键盘操作、DOM 与可访问性 | 引用编号、证据排序、去重策略与业务文案 |
| 稳定条目身份、公开定位 DOM 接口与主题 | 报告引用解析、展开请求、滚动定位与会话跳转 |
| 安全链接退化 | 更严格的来源协议策略、审核与编辑操作 |

第一版不承诺完整替换 Research 的逐条支持原文折叠或 Bug 的代码材料区域；
只抽共同展示能力，不以任意渲染插槽吸收所有业务差异。

## 2. 公开接口（SLST-B02）

以下类型形状收敛已确认需求；正式实现须保留这些公开字段与含义：

```ts
import type { ComponentPropsWithoutRef } from 'react'

export interface SourceListItem {
  id: string
  title: string
  summary?: string
  source?: string
  href?: string
  target?: '_self' | '_blank'
  domId?: string
}

export type SourceListProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'title' | 'dangerouslySetInnerHTML'
> & {
  items: readonly SourceListItem[]
  title?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}
```

- 根入口与 `matthew-ui/source-list` 导出 SourceList / SourceListItem / SourceListProps。
  ref 指向根 HTMLDivElement；className/style/data/aria 与适用原生事件透传到根节点。
- items 必填，可以为空。条目 id/title 必填；调用方保证 id 在当前列表内唯一、稳定，
  title 提供有意义的来源名称。模块不生成来源标题或本地化回退文案。
- title 是整组折叠标题，不是根节点原生 title 提示；undefined、空字符串或纯空白
  title 均按无标题模式处理。摘要、来源说明与条目标题按纯文本显示，不接受 HTML
  字符串解析、Markdown 渲染或 ReactNode 装饰内容。
- summary 是调用方选取的证据／摘要，source 是自由的来源说明；组件不解释其中的
  文件路径、字符范围、可信度、网页域名或引用编号。
- 不开放任意 children、renderItem、行内操作、业务跳转回调或命令式定位服务。

## 3. 标题、数量与空列表（SLST-B03）

- 有标题时显示一枚原生 type="button" 的整组开合按钮，文字为 title；非空列表右侧
  显示语言无关的条目数量，随后是装饰箭头。数量只等于 items.length，不代表独立
  网页数、已引用数或已经核验的来源数。
- 无标题时没有开合按钮，列表始终可见；open/defaultOpen/onOpenChange 在该模式
  不参与显示和交互，不添加另一枚无名称按钮。
- 空列表仍保留根节点与语义列表；有标题时保留可操作标题，但不显示数量，不显示
  悬空的标题／内容分隔线。无标题时不显示额外占位区域或默认“暂无来源”。
- 业务可以在外部决定完全不渲染 SourceList，或另行提供空态。

## 4. 受控与非受控折叠（SLST-B04）

- 有标题默认收起；非受控初始值为 defaultOpen ?? false。
- open !== undefined 表示受控：按钮只请求 onOpenChange(!open)，不自行改变显示；
  调用方拒绝更新时仍保持原状态。调用方主动修改 open 不触发回调。
- 非受控按钮切换内部状态，同时报告此次请求；defaultOpen 后续变化不重置状态。
- 同时提供 open/defaultOpen 时 open 优先，开发环境按实例警告一次，沿用现有
  Thinking / ToolCall / TaskList 约定；生产环境不依赖警告工作。
- 无标题期间不重置内部展开状态；重新获得标题后继续使用原非受控状态或当前 open。
- 列表折叠后保持挂载，但通过可靠隐藏语义使其不可见、不能进入 Tab 序列，也不
  出现在可访问树中。不用透明度、视觉裁切或仅移出屏幕代替隐藏。
- 若外部请求折叠时焦点仍位于列表内部，应在隐藏前将焦点退回开合按钮；焦点在
  列表之外时不抢焦点。展开本身不自动聚焦某条来源。
- Chat 的跨虚拟条目重挂载状态由业务使用受控 open 保存；组件不缓存到全局 Store
  或 storage，不承诺非受控状态跨卸载保留。

## 5. 条目身份与动态变化（SLST-B05）

- 严格按调用方数组顺序渲染，不自动排序、去重、截断或添加引用编号。
  同一来源的多个证据片段可以使用不同 id，各自成为独立条目。
- 用 item.id 保持条目身份；重排、更新文本或链接时，同一 id 的 li 保持 DOM 身份。
  domId 是定位标识，不替代 React key，也不把数组下标当成身份。
- 增删、重排、更新条目，以及列表变空，不改变展开状态、不触发 onOpenChange；
  不自动滚动、不主动聚焦，不建立选中或当前来源状态。
- 删除当前聚焦条目后不擅自选中／聚焦下一条。需要继续阅读定位，由业务决定。
- 未提供或为空的 summary/source 不制造空段落；非空文本原样展示，全文换行，
  不默认 line-clamp、省略、抽取摘要或提供“更多”。

## 6. 链接与文本安全（SLST-B06）

- 只有有效 href 时标题渲染为普通 a；仅标题是链接，不把整条 li 做成点击按钮。
  摘要与说明可正常选中，条目本身不执行跳转。
- 不提供 href、空 href、无效 URL 或不允许协议时，标题退化为普通文本，不保留
  可点击 href、target 或伪交互样式。原始危险字符串不会作为点击目标。
- 第一版允许 http/https 与解析后仍为 http/https 的相对链接、查询、片段链接及
  协议相对链接；拒绝 javascript/data/vbscript/file/blob/mailto/tel 和其他协议。
  安全判断基于 URL 解析后的协议，不靠大小写敏感的 startsWith 或简单文本正则；
  混合大小写、浏览器可归一化的控制字符等必须有拒绝危险协议的测试。
- 相对链接依照消费页面的正常基地址解析；SSR 不读取 window/document，不因
  渲染来源而访问网络或拉取远程内容。纯文本渲染不使用 dangerouslySetInnerHTML。
- target 默认 _self；_blank 显式开启新标签页，并设置 rel="noopener noreferrer"。
  target 不改变无效链接的退化行为，不允许绕过协议检查。
- Agent 的外部来源选择 _blank；Research 的 https-only 等更严格策略先在业务
  映射时筛选。允许协议不表示组件为目的网站的真实性或内容安全背书。

## 7. DOM、焦点与 Research 定位（SLST-B07）

- 根为 div，列表使用 ul/li 原生语义，不模拟 listbox、option 或选择控件。
- 标题按钮提供 aria-expanded / aria-controls；受控属性不能被透传覆盖破坏。
  内容容器 id 按实例生成，多个列表即使包含相同数据 id，也不产生重复自动 DOM id。
- domId 提供时原样设到对应 li，并设置 tabIndex={-1}：条目支持程序化聚焦，
  但不增加日常 Tab 停靠点。未提供 domId 时不为每条来源额外生成定位 id 或 Tab 目标。
- 调用方保证 domId 在整个页面唯一，可通过业务实例／run 前缀区分多个列表；
  同一个数据 id 在不同列表中使用不同 domId。组件不静默重写外部定位 id，
  不声称可以修复调用方提供的重复 id。
- 箭头 aria-hidden；按钮支持原生 Enter/Space。链接按浏览器原生键盘与点击语义
  工作；不添加全局键盘监听、aria-live、aria-selected 或证据状态播报。
- 条目被程序化聚焦时提供明确焦点样式，默认不会成为看似可点击的整行。
- Research 链路由业务执行：找到目标 → 请求展开 → 等待受控展开实际提交 →
  使用 domId 获取 li → scrollIntoView → focus({ preventScroll: true })。
  组件确保提交展开后条目可见、可聚焦；调用方拒绝展开时不得绕过隐藏直接聚焦。
- 无标题模式可直接定位，无需虚构展开状态。组件不解析 evidence ID、不生成
  evidence- 前缀、不决定滚动对齐方式或打开业务页面。

## 8. 验收与发布边界（SLST-B08）

单测／真实 Chromium 至少覆盖：

1. 类型、根 ref、属性透传、纯文本 HTML 字符串、稳定 key、无默认业务文案。
2. 有／无标题、数量、默认收起、defaultOpen、受控拒绝、冲突警告与空列表。
3. 折叠保持节点挂载，但链接无法 Tab 到达、隐藏内容不在可访问树；内部焦点
   收起时回到按钮，外部焦点不被抢走。
4. 动态增删、重排、变空、更新文本／href，DOM 身份与展开态保持且无隐式回调。
5. 无链接／安全链接／危险协议退化、相对路径、_self/_blank、rel 与恶意 HTML。
6. 多列表相同数据 id 的自动容器 id 隔离；业务提供唯一 domId 的条目可聚焦。
7. 用业务测试宿主走完“受控展开提交 → 滚动 → 聚焦”，保留相同条目的 DOM 身份。
8. SSR、React 18.2/19、StrictMode 与无网络副作用。

实现时接入根导出、source-list 子路径、独立 CSS、全量 CSS、ESM/CJS 与声明；
JS 不隐式引 CSS，不夹带其他组件，不新增运行时依赖或全局 Token。
真实 npm pack 消费验证沿用现有流程，两种 CSS 模式、React 18.2/19 均验收。
关键样式／隐藏／聚焦断言须有能拒绝破坏实现的回归保护，定位断言限定到目标实例。

## 9. 非目标

不做检索、自动加载原文、Markdown／HTML 渲染、证据判定、引用编号管理、业务路由、
逐条折叠、悬浮预览、复制、代码高亮、审核操作、任意条目插槽、分页或虚拟化。
不抽通用 List／Disclosure／Portal 原语，不重构已有组件或改变两个仓库的依赖连接。
Agent 接入、代码提交、推送、改版本与发布须另行授权。
