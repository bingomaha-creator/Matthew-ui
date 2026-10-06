# CodeBlock 视觉合同

状态：已实现；质量检查通过；Agent 接入验收通过（用户回报）；尚未发布
确认日期：2026-10-06
适用范围：P2-2 默认外观、明暗、响应式、8 字段 Token 与视觉验收
行为依据：[CodeBlock 行为合同](code-block-behavior-contract.md)

用户已认可轻量外框、可选标题栏、无高亮／行号、默认横向滚动与可选换行，
并确认亮暗预览方向。预览是临时样稿，不是固定颜色来源或已实现证明；正式
实现必须映射组件库既有全局 Token，不复制 Agent 样式或预览固定色值。
2026-10-06 实现与真实浏览器／tarball 验收通过；小字对比度校正见 CB-V04。

## 1. 面板与布局（CB-V01）

- 根节点 width:100%、min-width:0、box-sizing:border-box，跟随父容器，不设
  固定／最大宽度、阴影、任务状态图形或外层占位舞台。
- 1px colorBorder 轻量描边、radiusMd（默认 8px）、colorSurface 背景。
  有无标题栏均保留代码面板外框，不借用 SourceList 无标题透明列表的规则。
- 标题栏存在时与代码区域之间一条 1px 分隔线；无标题栏时不留空白 header 或线。
- 默认不设最大高度；业务通过正常 CSS 限高与调整宽度，不增加 maxHeight Token。
  根可裁切背景圆角，但不能让代码／复制按钮的焦点轮廓不可见。

## 2. 标题栏（CB-V02）

- 标题栏背景 colorSurfaceHover，最小高度 38px／2.375rem，上下 6px、左右 12px，
  左右主组间距 16px；高度允许文字换行与根字号放大，不使用固定 height。
- 左侧标题 fontSizeSm（默认 13px）/500/colorText；语言标签
  calc(fontSizeSm - 1px)（默认 12px）/400/colorText，两者间距 10px。
  字体族继承宿主，标题不默认截断，语言标签不做彩色徽章。
- 右侧是短反馈与文字“复制”按钮（文字由 copy 配置提供），间距 8px；
  仅复制时仍靠右。窄容器允许操作组换到下一行，不覆盖或挤出标题。
- 复制按钮是轻量原生文字按钮，无默认图标；默认 colorText，hover 用
  colorText 与轻背景，focus-visible 使用 colorFocus。按钮文字 13px、400，
  默认 padding 4px/6px、圆角 4px。粗指针有效命中区域至少 44×44px。
- 不为 pending／success 换图标或增添未确认文案；pending 降低交互可用性但
  保留可读名称与焦点。无复制配置时没有伪交互外观。

## 3. 正文与滚动（CB-V03）

- 正文使用系统等宽字体：ui-monospace、SFMono-Regular、Menlo、Consolas、monospace。
  不加载字体，不复制 Agent 正文字体；业务可通过普通 CSS 覆盖代码字体。
- 字号 fontSizeSm（默认 13px）、字重 400、行高 1.6、tab-size:2；默认上下／左右
  padding 12px／0.75rem。正文色 colorText，不对关键字、diff 增删行单独上色。
- 默认 white-space:pre，overflow-x:auto；滚动只发生在代码区域，不是整个页面。
  wrap=true 使用 pre-wrap / overflow-wrap:anywhere，原始换行仍保留。
- 原文可选择，不禁用 user-select，不做省略号、line-clamp、遮罩或折叠高度。
  不自绘滚动条；平台原生滚动条可能只在滚动期间显示。
- 空 code 保留基础 padding，不显示默认占位文本或虚构代码行。
- 键盘聚焦代码区有明确 colorFocus 轮廓；它表示滚动／阅读焦点，不暗示可编辑。

## 4. 复制反馈与动效（CB-V04）

- 反馈在按钮旁，占用正常布局空间，可换行；字体为 12px／400。
  success／error 均用 colorText，以本地化文本明确区分，不只依赖颜色。
- 反馈出现不遮盖代码，不使用全局 Toast、浮层或自动焦点；约 2 秒清除。
  长本地化文案必须换行，不越出组件。反馈生命周期以 CB-B05 为准。
- 不做正文高度、滚动、渐入或循环动画。最多按钮 hover 使用 durationFast；
  prefers-reduced-motion:reduce 取消该过渡，不改变复制结果或反馈停留时长。

实施校正：既有 colorTextMuted 在默认 colorSurfaceHover 上仅约 4.34:1，未通过
Story 可访问性检查；colorDanger 在亮／暗标题栏上也未达到普通小字门槛。
语言、按钮与成功／失败反馈改用 colorText，以字号／字重维持层级。
不改变全局 Token、标题栏背景或新增派生色。

## 5. 已确认的组件 Token（CB-V05）

挂在 MatthewThemeConfig.components.CodeBlock，公开 CSS 前缀
`--matthew-ui-code-block-`；CodeBlockComponentTokens 不单独包级导出。

| 字段 | 类型／校验 | CSS 后缀 | 默认回退／作用范围 |
| --- | --- | --- | --- |
| background | string | background | colorSurface，代码面板背景 |
| color | string | color | colorText，代码正文 |
| borderColor | string | border-color | colorBorder，外框与标题分隔线 |
| headerBackground | string | header-background | colorSurfaceHover，标题栏 |
| headerColor | string | header-color | colorText，标题；语言／操作仍使用全局 colorText |
| borderRadius | number ≥ 0 | radius | radiusMd，面板圆角 |
| paddingBlock | number ≥ 0 | padding-block | 12px，正文上下 padding |
| paddingInline | number ≥ 0 | padding-inline | 12px，正文左右 padding |

- 复用 componentTokensToCssVars / ComponentTokenFieldMap 及 ThemeProvider 独立
  字段合并；组件名 CodeBlock、cssPrefix code-block，字段表保留编译期完整检查。
- 只输出显式配置；undefined 不输出，null 进入校验。string 仅验证类型，不验证
  CSS 语法，不自动派生文字／hover／反馈色；使用者负责配色与对比度。
- 数字必须有限且 ≥0，以设计 px／16 转 rem；TypeError／RangeError 与
  components.CodeBlock.<field> 错误文本模板沿用现有通用转换，不复制校验器。
- 空对象／undefined 按字段继承，撤销子层配置恢复父值或 CSS 默认；亮暗切换
  保留显式配置。不在组件根或 tokens.css 建默认组件变量表，不增全局 Token。
- className/style 位于根 div，公开变量可在祖先／根覆盖；没有 Portal 或主题桥接。
  headerColor 不暗中派生语言、按钮或反馈颜色；正文 padding 不改变标题栏 padding。
- 不加宽度、限高、字号、字体族、行号、语言、复制状态或反馈时长 Token。
  布局／字体特殊需求由业务正常 CSS 处理，不为每种业务材料再建主题字段。

## 6. 明暗与响应式（CB-V06）

- 默认亮暗都从既有 Token 回退；不把代码块固定为暗色，也不保证预览色值逐字相同。
  正文、标题、语言标签、按钮、反馈、边框与焦点在两种主题均可读。
- 320px 可用容器、375px 视口与 200% 根字号不撑破页面；标题／语言／按钮与
  长反馈均保留，不依赖 hover 才显示复制，不以裁切隐藏主要操作。
- 长 JSON、URL、中英文、长词与多行缩进在两种 wrap 模式真实检查；nowrap 允许
  代码内部横向溢出，但页面与根宽度不得跟随内容变宽。
- 嵌入 ToolCall 后跟随详情容器；外部折叠、Bug 业务限高不会被默认布局覆盖。
  动态文字、主题与 wrap 切换不造成额外焦点移动或程序化滚动。

## 7. Story 与真实包验收（CB-V07）

Story 至少覆盖默认代码、长行滚动、自动换行、空原文、纯文本／HTML 字符串、
标题／语言／复制组合、无标题栏、复制成功／失败／pending、动态文本与旧请求隔离、
亮暗、8 字段覆盖、嵌套主题动态撤销、窄容器、业务限高、ToolCall 组合与 reduced-motion。
可控复制替身须注明模拟性质，不代替真实平台验收。

真实 Chromium 按需／全量 CSS 至少检查：

1. 1px 外框、8px 默认圆角、38px 最小 header、13px 等宽正文／1.6 行高／12px padding。
2. 无标题栏时 header／分隔线不存在；空代码无默认占位；内容按纯文本呈现。
3. 8 字段逐项 computed style，亮暗回退、祖先覆盖、嵌套与动态撤销恢复。
4. 320px 容器／375px 视口／200% 字号：页面不溢出，长 header 与反馈换行可用；
   nowrap 内部可滚动，wrap 全文断行且两者复制原文一致。
5. 复制 hover／focus、键盘滚动与反馈可见性；实际剪贴板行为按 CB-B07 验证。
6. 真实 reduced-motion 下无过渡；不得用 Story 的模拟声明冒充真实媒体检查。
7. ToolCall 组合、业务限高与多实例作用域；所有断言限定目标实例，避免另一份
   CodeBlock 的正确外观掩盖当前实例失败。

真实 React 18.2/19 tarball 沿用类型／ESM／CJS／ref／CSS／Vite 构建与按需隔离
验证；关键溢出、主题、入口与复制失败断言须有针对性回归保护。
README 实现时同步真实公开用法与质量结果，不能把合同／预览写成已发布能力。
