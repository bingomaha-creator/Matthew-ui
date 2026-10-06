# ToolCall 视觉合同

> 创建日期：2026-09-05；P0 修订日期：2026-10-05
>
> 状态：已实现；P0 标题栏调整已通过完整质量检查，已随 v0.4.0 发布。
>
> 适用范围：ToolCall 默认视觉、主题覆盖与浏览器验收。
>
> 行为依据：现有 ToolCall 公开类型、README 与实现；本地补充合同位于
> `docs/learning/reference/tool-call-behavior-contract.md`，后续单独迁移。
>
> 预览仅用于确认 Thinking 与 ToolCall 的视觉层级，不是可复制的正式实现或像素级验收基线。

本次修订将 v0.3.0 的 32px 标题行、13px 名称、12px 摘要以及右／下箭头，
调整为与 Thinking 一致的标题栏。这是已确认的产品视觉变化，不是旧实现缺陷。
本文定义当前源码目标；已发布 v0.3.0 的公开表现仍以该版本 README 和实现为准。
代码实施已获用户确认；本文不构成版本变更、提交、推送或发布授权。

## 1. 视觉定位

ToolCall 使用“轻量工具记录”形态，表达一次具体外部能力调用。标题栏与 Thinking
统一默认排版，仍通过不同的运行图形和详情结构区分职责；可以独立使用或普通组合。

- 默认宽度跟随容器；
- 根节点透明，无完整卡片边框、背景和阴影；
- 标题行紧凑，名称和状态是主要信息，摘要进一步弱化；
- 展开后通过缩进与细分隔线建立详情层级；
- 独立使用时仍保持轻量，不因脱离 Thinking 自动升级为卡片；
- 多个 ToolCall 连续出现时应形成安静的过程记录列表，不争夺 Chat 正文主视觉。

布局意图：

```text
••• 正在检查组件库结构                         ⌄  Thinking
  │ 我先读取现有组件与主题实现
  │
  │ ✓ 读取项目文件                已读取 3 个文件 ⌄  ToolCall
  │ ◔ 运行类型检查                      执行中 ⌄  ToolCall
```

其中图形只是结构示意，正式状态图形以第 3 节为准。

## 2. 标题行与详情区（TC-V01）

### 标题行

- 有详情时使用四列紧凑布局：状态标识、可收缩名称、可选摘要、展开箭头。
- 无详情时不渲染展开箭头，标题行保持非交互状态，不出现 hover 背景或手型光标。
- 默认最小高度读取 `controlHeightMd`（默认 40px），与 Thinking 一致；现有
  `headerMinHeight` 显式覆盖仍优先。
- 字体族继承宿主，不内置 Agent 的字体栈；名称默认读取 `fontSizeMd`（默认
  14px），字重为 500，过长时单行省略。
- 摘要同样读取 `fontSizeMd`，字重为 400，颜色弱化；靠右排列在箭头之前。
  未提供摘要时，名称占用剩余文本空间，不预留空摘要列。
- 摘要按内容占位，允许收缩，最多占可分配文本宽度的 40%；名称占其余空间。
  可分配文本宽度指标题内宽减去状态占位、存在的箭头占位及列间距；不是根节点
  总宽度。长名称和长摘要均允许收缩并单行省略，不撑破容器。
- 默认内边距为 8px/12px，列间距为 10px，与 Thinking 一致；不新增这些
  细颗粒值的 Token 或 props。
- 有详情时 hover 使用 `colorSurfaceHover` 回退，focus-visible 复用现有
  focus ring。
- 展开箭头收起朝下、展开朝上，与 Thinking 一致；图形盒为 8px，线宽为
  1.5px，过渡读取 `durationFast`。不新增箭头配置接口。

### 详情区

- 位于标题行下方，保持透明，不增加完整边框、阴影或独立卡片背景。
- 保留现有详情缩进和一条 1px 左侧细分隔线，不随标题栏统一而扩大到 Thinking
  的内容区尺寸，不形成封闭边框。
- 默认字号读取 `fontSizeSm`，文字颜色读取 `colorTextMuted`。
- 使用普通继承字体，不把整个详情区强制设为等宽字体；调用方传入的 `code`、
  `pre` 或其他后代保留自己的字体和样式。
- 内容自然换行和撑高，不设置最大高度、内部滚动、文本截断或渐变遮罩。
- 不强制覆盖后代模块的布局、颜色和排版合同。

## 3. 状态标识（TC-V02）

| 状态 | 图形 | 默认颜色回退 | 动效 |
| --- | --- | --- | --- |
| `pending` | 空心圆 | `colorTextMuted` | 无 |
| `running` | 缺口圆环 | `colorPrimary` | 匀速轻量旋转 |
| `completed` | 对勾 | `colorPrimaryActive` | 无 |
| `error` | 感叹号 | `colorDanger` | 无 |
| `stopped` | 方形停止标识 | `colorTextMuted` | 无 |

- 状态标识占位固定为 12px/12px，与 Thinking 的状态占位一致；对勾等 SVG
  使用该占位，运行圆环、空心圆及停止方块保持各自可辨识形状，不要求所有图形
  填满占位。切换状态不改变名称起始位置。
- `pending` 明确使用空心圆，不使用浅色实心圆。
- `running` 使用单个缺口圆环，与 Thinking 的三个跳动圆点形成可辨识差异。
- 五种状态不能只依赖颜色区分；`pending` 与 `stopped` 即使共享默认颜色，
  也必须通过圆形与方形区分。
- 不引入图标或动画运行时依赖。静态图形可使用内部 SVG 或 CSS，缺口圆环使用
  CSS 实现；第一版不开放替换状态图形的 prop。

## 4. 动效与 reduced motion（TC-V03）

- 只有 `running` 缺口圆环使用持续旋转；其他状态图形全部静止。
- 旋转保持匀速、轻量，不产生缩放、闪烁或布局位移。
- `prefers-reduced-motion: reduce` 下停止圆环旋转，保留静态缺口，使运行状态仍可识别。
- reduced motion 下同时停止展开箭头过渡。
- 动效不影响布局、点击区域、焦点或回调时机；展开行为不依赖
  `transitionend` 或动画完成。
- keyframes 名称使用 `matthew-tool-call` 前缀，避免污染消费端全局命名空间。
- 动画速度、缺口角度、圆环线宽和箭头角度属于内部视觉决策，第一版不开放 Token。

## 5. 组件 Token interface（TC-V04）

ToolCall 第一版开放 12 个具有明确主题价值的颜色与基本几何字段：

```ts
export interface ToolCallComponentTokens {
  nameColor?: string
  summaryColor?: string
  detailColor?: string
  borderColor?: string
  headerHoverBackground?: string
  pendingColor?: string
  runningColor?: string
  completedColor?: string
  errorColor?: string
  stoppedColor?: string
  borderRadius?: number
  headerMinHeight?: number
}
```

| 字段 | 类型 | 公开 CSS Variable | 默认回退 |
| --- | --- | --- | --- |
| `nameColor` | string | `--matthew-ui-tool-call-name-color` | `colorText` |
| `summaryColor` | string | `--matthew-ui-tool-call-summary-color` | `colorTextMuted` |
| `detailColor` | string | `--matthew-ui-tool-call-detail-color` | `colorTextMuted` |
| `borderColor` | string | `--matthew-ui-tool-call-border-color` | `colorBorder` |
| `headerHoverBackground` | string | `--matthew-ui-tool-call-header-hover-background` | `colorSurfaceHover` |
| `pendingColor` | string | `--matthew-ui-tool-call-pending-color` | `colorTextMuted` |
| `runningColor` | string | `--matthew-ui-tool-call-running-color` | `colorPrimary` |
| `completedColor` | string | `--matthew-ui-tool-call-completed-color` | `colorPrimaryActive` |
| `errorColor` | string | `--matthew-ui-tool-call-error-color` | `colorDanger` |
| `stoppedColor` | string | `--matthew-ui-tool-call-stopped-color` | `colorTextMuted` |
| `borderRadius` | number ≥ 0 | `--matthew-ui-tool-call-radius` | `radiusMd` |
| `headerMinHeight` | number > 0 | `--matthew-ui-tool-call-header-min-height` | `controlHeightMd` |

规则沿用现有组件 Token 合同和已建立的通用转换实现：

- 数字为设计 px，按 16 为基准转 rem；`borderRadius` 允许 0，
  `headerMinHeight` 必须大于 0。
- 非 number 数字字段抛 `TypeError`；NaN、±Infinity 或越界数字抛 `RangeError`。
- 颜色字段只接受 string，不验证完整 CSS 语法，不派生其他状态颜色。
- `undefined` 表示未提供；错误的 `null` 继续进入运行时校验。
- Provider 只序列化明确配置的字段，不生成默认组件变量表。
- 子 Provider 按字段继承；空对象或 `undefined` 不擦除父级配置。
- 不开放根背景与详情背景 Token，默认透明是 ToolCall 的视觉定位，而不是一个
  可由主题配置切换的卡片模式。
- 不新增 success/warning 全局 Token；本批使用现有全局颜色回退和 ToolCall
  精确覆盖。

`ToolCallComponentTokens` 按现有惯例只挂在 `MatthewThemeConfig.components.ToolCall`
下使用，不要求新增包级独立类型导出。

## 6. CSS 作用域与级联（TC-V05）

- 根 class 使用 `matthew-tool-call`，后代命名使用同一 BEM 前缀。
- 公开变量只在消费位置读取回退，不在组件根节点填写第二份默认表。
- `ThemeProvider` 的 `components.ToolCall` 输出、业务祖先 CSS Variable 和后代
  局部覆盖继续按 CSS 继承工作。
- `className` 与 `style` 位于根节点；根 `style` 中的公开变量可定制单个实例。
- 普通业务 CSS 可以覆盖具体实例，但需遵守正常级联与优先级规则。
- ToolCall 嵌套在 Thinking 中时，不依赖 Thinking 私有 class 或内部变量；两者只通过
  普通 React 组合和公开全局/组件变量共同工作。

## 7. 亮暗、嵌套、响应式与内容稳定（TC-V06）

- 未配置组件字段时，所有默认颜色跟随当前亮/暗全局 Token。
- 显式组件配置在亮暗预设切换时保留；撤销当前层后恢复父级配置或 CSS 回退。
- 嵌套在 Thinking 内容区时，ToolCall 的根节点保持透明，且不继承 Thinking 对普通
  文本的弱化颜色作为最终名称颜色；名称按自己的公开变量与全局回退读取。
- 组件可用宽度 ≤320px 时视觉隐藏摘要，按容器查询判断，不按浏览器视口。
  宽视口中的窄容器同样生效；宽度 >320px 时摘要恢复正常布局。
  名称、状态标识和展开能力优先保留；名称可收缩并单行省略，状态占位和箭头
  不得被挤压。引入容器查询不得造成根节点宽度塌缩或随内容更新跳变。
- 摘要隐藏只影响视觉呈现；若摘要属于标题按钮可访问名称，实现需避免产生重复或
  意外丢失的辅助技术文本。
- 详情区不主动制造水平滚动；调用方自带的宽内容不由 ToolCall 跨模块强制改写。
- 名称、摘要、详情和状态更新不应造成标题行高度变化或明显布局抖动。

## 8. 与 Thinking 的视觉层级（TC-V07）

- Thinking 与 ToolCall 标题行默认最小高度均为 40px；标题／名称均为 14px、
  字重 500，ToolCall 摘要为 14px、字重 400、弱化颜色。
- 默认 padding、间距、状态占位和箭头一致；不要求组件在某一方显式定制 Token
  后仍保持像素一致，不让 ToolCall 读取 Thinking 私有样式或组件 Token。
- Thinking 使用三个运行中圆点，ToolCall 使用旋转缺口圆环。
- Thinking 展开内容使用贯穿过程的左侧细线；ToolCall 详情只使用更短、更局部的
  缩进与分隔线。
- Thinking 可以容纳说明文字和多个 ToolCall；ToolCall 不反向模仿 Thinking 的
  外层结构，也不通过额外背景或边框抬高自身层级。
- 两者同时出现时，用户应先识别“agent 正在做什么”，再看到其中发生的具体工具调用。

## 9. Story 与视觉验收（TC-V08）

至少包含：

- 无详情的非交互状态行；
- 有详情的默认折叠与手动展开；
- 五种状态，图形均可辨识，`pending` 为空心圆；
- 与 Thinking 同级和嵌套组合，验证默认标题栏一致、运行图形和详情层级不同；
- 名称、摘要和详情的动态更新；
- 亮色、暗色与 `ThemeProvider` 12 字段精确覆盖；
- 短／长名称、短／长摘要、无摘要、有／无详情，验证右对齐、40% 文本空间上限
  和省略行为；
- 宽视口中的 300px/320px 窄容器及 >320px 对照，验证摘要视觉隐藏与恢复、
  辅助技术文本保留、固定图标占位及无横向溢出；
- reduced-motion 下静止的缺口圆环与无过渡箭头；
- 嵌套 Provider 的字段继承、局部覆盖与动态撤销恢复。

浏览器自动化检查 computed style、DOM 属性、状态图形差异、动画降级和响应式结果，
但不代替人工观察标题栏一致性、名称与摘要的信息层级，以及亮暗模式下的对比度。
验收沿用组件浏览器测试、Story 与真实 npm tarball 两种 CSS 模式及 React 18.2/19
消费验证；更新旧默认值断言，保留 12 字段覆盖、主题继承、动态撤销恢复和行为回归。
预览不作为永久像素截图基线。

## 10. 非目标

- 完整外框、根背景、厚重卡片或阴影；
- 与 Thinking 相同运行图形，或自动继承其展开状态、执行状态；
- Beautiful UI、Codex 或其他产品的源码、类名、具体像素与动效参数移植；
- 根背景、详情背景、字体大小、各方向 padding、列间距、图标尺寸、线宽或动画速度 Token；
- 可替换状态图标、任意装饰插槽或图标运行时依赖；
- 详情最大高度、虚拟列表、内部滚动、渐变遮罩或内置代码样式系统；
- 无详情状态行的 hover、focus ring、展开箭头或其他虚假交互提示。
- 新增尺寸／视觉变体、共享标题组件或任意布局配置集合；
- Agent 的中文文案、状态映射、Run 查询、参数结果格式化或虚拟列表展开状态管理；
- 本批改造 Agent 的 Thinking/ToolCall 嵌套展示。

## 11. 已确认视觉决策

- ToolCall 标题栏与 Thinking 一致，详情仍是轻量工具调用记录。
- 根节点透明，无完整边框、背景和阴影。
- 默认最小高度读取 `controlHeightMd`，名称和摘要读取 `fontSizeMd`；名称 500、
  摘要 400，摘要靠右且最多占可分配文本宽度的 40%。
- 默认 padding 8px/12px、间距 10px、状态占位 12px；箭头收起朝下、展开朝上。
- 组件宽度 ≤320px 时隐藏摘要，按容器查询判断，保留辅助技术文本。
- 展开详情通过缩进和一条非封闭细分隔线建立层级，不形成卡片。
- 详情使用普通字体，不强制等宽。
- `pending` 使用空心圆；`running` 使用旋转缺口圆环；完成、失败和停止使用
  互不相同的静态图形。
- reduced motion 下停止圆环旋转和箭头过渡。
- 第一版支持 12 个组件 Token，不开放背景、字体、间距与动画细节配置。
- 预览只确认视觉方向，不作为正式实现或永久像素基线。

## 12. 消费端归属与联调

- `summary` 是调用方提供的辅助信息；“状态靠右”不意味着新增状态文字生成逻辑。
  `statusLabels` 保持原有辅助技术用途，公开 props 和展开行为不变。
- Agent 的 GlobalStyles 继续通过公开变量提供字体尺寸、亮暗颜色、圆角和完成色；
  不为 Agent 添加 ThemeProvider，不将绿色成功色改成组件库全局默认。
- 库完成构建后，通过现有 npm link 在独立 Agent 仓库验证实际效果。消费端后续可
  删除对应标题字体、padding、间距、summary、状态占位和箭头的内部 class 覆盖，
  保留业务容器宽度、间距及参数／结果样式。该删除属于独立消费端接入任务。
- 本地链接不代替真实包验收；本批不更改两个仓库的正式依赖、lockfile 或发布状态。

## 13. P0 实施验收记录（2026-10-05）

- `npm run quality:check` 严格退出码 0：347 项单元／浏览器测试、58 个 Story
  场景、69 条验证器回归通过；Storybook 构建和 React 18.2/19 真实 tarball
  类型、入口、ref、两种 CSS 模式与生产构建消费验证通过。
- 新增长文本 40% 上限、300/320/321px 容器动态恢复、直接 flex 子项宽度保护；
  真实包检查覆盖 300/320/321/480px 容器、箭头方向与摘要可访问名称。
- 无新增运行时依赖，无公开 props／包入口变更；`git diff --check` 通过。
- Agent 只读核对确认 ToolCall JS/CSS 解析到本地库 `dist`；开发服务返回 HTTP 200，
  但内置浏览器页面空白，未完成 Agent 实际页面视觉验收。业务端内部 class 覆盖
  尚未删除，仍需消费端单独接入、验证无覆盖时的效果。
