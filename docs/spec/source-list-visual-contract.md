# SourceList 视觉合同

状态：已实现；质量检查通过；已随 v0.4.0 发布
确认日期：2026-10-05
适用范围：P2-1 默认 SourceList、明暗、响应式与视觉验收
行为依据：[SourceList 行为合同](source-list-behavior-contract.md)

用户已认可轻量外框、细分隔线、无标题纯列表的可交互预览。预览不是正式组件，
不是固定色值来源；正式实现以组件库全局 Token 和本文约束为准。
2026-10-05 用户已确认第 5 节的 12 个字段与链接颜色回退，并授权实施。

## 1. 层级与布局（SLST-V01）

- 来源信息是阅读辅助，不借用 TaskList 的任务图形、连接线、进度或状态配色。
- 有标题：根节点 1px 轻量边框、radiusMd、colorSurface，无阴影；整组开合按钮
  位于顶部，条目不再套独立卡片。展开且非空时标题与列表之间一条分隔线。
- 无标题：不显示开合按钮、外框、圆角背景层或占位标题，只保留来源条目与分隔线；
  背景透明，由宿主决定页面表面。模式由有无标题决定，不另加 variant 开关。
- 默认 width:100%、min-width:0，跟随可用容器；不冻结预览外围舞台的 560px，
  不内置 TaskList 的 480px 或 Dialog 的 512px 最大宽度。业务通过正常 CSS 控制宽度。
- 相邻条目间只有 1px 分隔线，首条上方、末条下方不添加额外条目分隔线；
  单条和空列表无悬空线条。无标题时列表自身不增加外围 padding。

## 2. 标题栏与开合（SLST-V02）

- 标题栏最小高度 controlHeightMd（默认 40px），padding 默认上下 8px／左右 12px，
  gap 12px。最小高度允许长标题或放大字号撑高，不设单行固定高度。
- 标题字号 fontSizeMd（默认 14px）、字重 500，数量字号为
  calc(fontSizeSm - 1px)（默认 12px）、字重 400、colorTextMuted。
  数量与箭头靠右；数量使用 tabular-nums，标题可换行，图形不被挤压。
- 装饰箭头沿用 Thinking / ToolCall 的轻量线形：收起向下、展开向上；
  不以原生 details 三角作为第二套外观，不开放替换图形或角度参数。
- hover 用 colorSurfaceHover；focus-visible 使用 colorFocus，不去掉可见焦点。
  根字号 16px 时箭头占位 16px，粗指针按钮有效最小高度至少 44px。
- 第一版不做整组高度／淡入动画；最多箭头与标题 hover 使用 durationFast 短过渡，
  prefers-reduced-motion:reduce 时取消。没有加载、循环或状态动画。

## 3. 条目排版（SLST-V03）

- 条目默认 padding 上下／左右 12px；无标题时默认左右 0、上下 12px。
  垂直高度由全文内容决定，不做 TaskList 式等高行。
- 标题 fontSizeMd（默认 14px）/500，摘要 fontSizeSm（默认 13px）/400，
  来源说明 calc(fontSizeSm - 1px)（默认 12px）/400，字体族继承宿主。
- 标题／摘要／说明上下间距 6px；未提供摘要或说明时不留下空段落与对应间距。
  默认正文行高 1.6，辅助说明同样保持可读，不压缩成紧密日志。
- 普通标题与摘要使用 colorText，来源说明使用 colorTextMuted；
  链接标题使用主题主色前景，hover 明确显示下划线，不把整条背景变成交互高亮。
  不使用永久绿色／成功图形或用颜色表达“证据已验证”。
- 标题、摘要、来源文字允许全文换行与长词内断行，不默认 ellipsis／line-clamp。
  保留合理文本空白／换行（正文采用 pre-wrap），但不按代码进行等宽排版或高亮。
- 无效链接的标题与无 href 标题外观一致，没有链接色、下划线或伪点击提示。
- 业务提供 domId 的 li 可程序化聚焦，focus 时显示 colorFocus 轮廓；
  轮廓不能被根节点裁切，不以添加整行 hover／手形光标冒充普通条目的交互能力。

## 4. 明暗、窄宽与主题范围（SLST-V04）

- 所有颜色、外框、圆角、字号与控件高度映射既有 Token，不复制 Agent 字体栈、
  styled-components 或预览中的固定颜色，不增加全局 Token。
- 默认亮／暗中标题、摘要、说明、链接和 focus 均须可读；链接前景已确认回退到
  colorPrimaryActive，与 Select 的主色前景处理一致。hover 用下划线、不另设
  hover 颜色字段；不新增主题推断逻辑或暗中修改全局预设。
- 320px 可用容器、375px 视口和 200% 根字号不得横向撑破页面；标题、数量、箭头
  均可用，文本不因窄宽被隐藏。长 URL 和中英文长段落要真实验证。
- className/style 位于根 div；公开变量可在业务祖先或根节点覆盖。
  本模块不 Portal，变量与字体直接继承，不建立另一套主题桥接。
- 动态文本、条目数量、开合与主题切换不会增加无关焦点转移或自动滚动。
  收起时的内部焦点处理以行为合同 SLST-B04 为准。

## 5. 已确认的组件 Token（SLST-V05）

以下 12 个字段已获确认；字号跟随全局 Token，不新增独立字号、宽度或动画字段。

挂在 MatthewThemeConfig.components.SourceList，以 --matthew-ui-source-list-
为统一变量前缀；SourceListComponentTokens 不单独包级导出。

| 字段 | 类型／校验 | CSS 后缀 | 回退／范围 |
| --- | --- | --- | --- |
| background | string | background | colorSurface，仅有标题外框模式 |
| borderColor | string | border-color | colorBorder，外框与分隔线 |
| headerColor | string | header-color | colorText，列表标题与箭头 |
| headerHoverBackground | string | header-hover-background | colorSurfaceHover |
| itemTitleColor | string | item-title-color | colorText，无链接标题 |
| summaryColor | string | summary-color | colorText |
| sourceColor | string | source-color | colorTextMuted，来源说明 |
| linkColor | string | link-color | colorPrimaryActive |
| borderRadius | number ≥ 0 | radius | radiusMd，仅有标题外框模式 |
| headerMinHeight | number > 0 | header-min-height | controlHeightMd |
| itemPaddingBlock | number ≥ 0 | item-padding-block | 12px／0.75rem |
| itemPaddingInline | number ≥ 0 | item-padding-inline | 有标题 12px；无标题 0；显式配置覆盖两种模式 |

不新增宽度、状态色、编号、箭头、链接 target、焦点管理或动画参数 Token。
标题、摘要与来源说明字号先跟随现有全局字号，不再给每种文字建立任意字段。

实现必须遵守：

- 复用 componentTokensToCssVars、ComponentTokenFieldMap 与 ThemeProvider 的独立
  字段合并，不复制校验器；组件名 SourceList、CSS 前缀 source-list。
- 数字按设计 px／16 转 rem；只接受有限数字；正尺寸 >0、圆角／padding ≥0。
  string 只校验类型，不校验 CSS 语法，不派生其他字段色值。
- undefined 不输出；非法 null 进入校验，错误文本沿用
  components.SourceList.<field> 与现有 TypeError／RangeError 模板。
- 只输出显式配置，不建立组件根默认变量表；空对象／undefined 按字段继承，
  子层撤销恢复父值或 CSS 默认，亮暗切换保留显式覆盖。
- 无标题透明模式不能因为 background 配置而偷偷恢复有标题面板背景。

## 6. 视觉与真实包验收（SLST-V06）

Story 至少展示：默认收起／展开、无标题、业务指定默认展开、受控拒绝、空列表、
单条、无链接／网页链接／危险链接退化、长标题／多行摘要、动态增删重排、
明暗、组件定制／嵌套撤销、窄容器、reduced-motion 与业务控制的证据定位链路。

真实 Chromium 的按需／全量 CSS 至少检查：

1. 有标题 1px 外框、8px 默认圆角、40px 最小标题高度、正文层级与默认间距。
2. 无标题透明根、无外框、左右 0 padding；单条／空列表没有多余分隔线。
3. 已冻结字段的逐项 computed style 覆盖、亮暗回退、祖先 CSS、嵌套与动态撤销。
4. 320px 容器、375px 视口、200% 根字号与长链接，无水平溢出或关键内容隐藏。
5. 默认／hover 链接、危险链接的普通文字退化、焦点轮廓与文字对比。
6. 折叠节点仍挂载但不可访问；展开后指定 domId 的目标条目可见、可滚动并可聚焦。
   多实例验收选择器必须限定到正确实例，不能用另一份列表掩盖定位／主题失败。
7. 真实 reduced-motion 媒体下无过渡；Story 若注入等价声明模拟，必须明确注明，
   不能用模拟替代实际媒体验收。

React 18.2/19 真实 tarball 验证沿用现有包入口、类型、ESM/CJS、ref、CSS 与构建
流程；关键错误有故障注入回归。README 在实现批次同步公开用法与实际验证结果，
不能把合同或预览称为已发布能力。
