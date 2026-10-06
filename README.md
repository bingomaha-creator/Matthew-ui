# Matthew UI

[![npm version](https://img.shields.io/npm/v/matthew-ui?label=npm)](https://www.npmjs.com/package/matthew-ui)
[![CI](https://github.com/bingomaha-creator/Matthew-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/bingomaha-creator/Matthew-ui/actions/workflows/ci.yml)
[![Storybook](https://img.shields.io/badge/Storybook-online-ff4785?logo=storybook&logoColor=white)](https://bingomaha-creator.github.io/Matthew-ui/)
[![License](https://img.shields.io/npm/l/matthew-ui)](./LICENSE)

Matthew UI 是一个使用 React 和 TypeScript 构建并发布到 npm 的 Web 端 UI 组件库，目前提供 Button、Menu、AutoComplete，以及 agent 原生的 Thinking、ToolCall 和 TaskList 组件。项目处于 `0.x` 迭代阶段，公开 API 仍可能调整。

当前源码新增 Select、Dialog、SourceList 和 CodeBlock；这四个组件尚未发布，npm 的 `0.3.0` 不包含它们。下面的相关
示例用于本地构建或后续发布版本，不应直接用于已安装的 `0.3.0`。

- [npm 包：`matthew-ui`](https://www.npmjs.com/package/matthew-ui)
- [在线 Storybook](https://bingomaha-creator.github.io/Matthew-ui/)

## 特性

- 支持 React 18.2 和 React 19。
- 提供 ESM、CommonJS 和 TypeScript 类型声明。
- 组件逻辑与样式入口分离，样式由使用者显式引入。
- 提供类型化 Design Token、亮暗预设和可嵌套的局部 ThemeProvider。
- 通过 Vitest Browser Mode、Playwright 和 Storybook 在真实 Chromium 中验证核心交互。
- 通过 GitHub Actions 执行持续集成并部署在线 Storybook。

## 安装

```bash
npm install matthew-ui
```

项目要求 React 与 React DOM 版本满足 `^18.2.0 || ^19.0.0`，Node.js 版本满足 `^20.19.0 || >=22.12.0`。

在应用入口引入一次组件样式：

```tsx
import 'matthew-ui/styles.css'
```

随后从包根入口引入组件：

```tsx
import { Button } from 'matthew-ui'

export function App() {
  return <Button variant="primary">保存</Button>
}
```

## 按需引入

小型应用可以继续使用包根和全量样式：

```tsx
import { Button, Menu } from 'matthew-ui'
import 'matthew-ui/styles.css'
```

需要同时按需拆分 JavaScript、类型和 CSS 时，使用小写子路径：

```tsx
import { Button } from 'matthew-ui/button'
import 'matthew-ui/tokens.css'
import 'matthew-ui/button/style.css'

export function App() {
  return <Button variant="primary">保存</Button>
}
```

`tokens.css` 只提供默认 `:root` CSS Variables，组件 `style.css` 只提供
自己的规则。如果组件始终位于 `ThemeProvider` 内，Provider 会通过
inline CSS Variables 提供 Token，因此可以只引入组件样式；但没有 Provider
的区域不会再获得默认 Token 回退。JavaScript 入口不会隐式加载样式。

## 主题

```tsx
import { Button, darkTheme, ThemeProvider } from 'matthew-ui'

export function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <Button variant="primary">保存</Button>
    </ThemeProvider>
  )
}
```

ThemeProvider 会渲染一个局部 `div` wrapper，并把完整 Token 序列化为
`--matthew-ui-*` CSS Variables。它不会修改全局 `:root`，因此同一页面可以同时存在
亮色、暗色和自定义主题区域。嵌套 Provider 默认继承父主题，只覆盖当前提供的字段。

```tsx
<ThemeProvider
  theme={{
    seed: { colorPrimary: '#00b96b' },
    tokens: { colorSurface: '#101820' },
  }}
>
  <Button>自定义主题</Button>
</ThemeProvider>
```

`theme.seed` 会重新派生对应颜色或尺寸家族；`theme.tokens` 是最高优先级的最终精确
覆盖，不会反向重算其他 Token。局部 CSS 继承本身不覆盖 wrapper 外部的 Portal。
当前源码中的 Select 会单独桥接触发器来源域的公开主题变量与字体。Dialog 使用
原生 top layer、不 Portal，保留原来的 CSS 继承；Provider 不为任意外部 Portal 自动提供桥接。

### Button 组件定制

以下能力已随 `matthew-ui@0.2.0` 发布。

```tsx
import { Button, LinkButton, ThemeProvider } from 'matthew-ui'
import 'matthew-ui/styles.css'

export function Checkout() {
  return (
    <ThemeProvider theme={{ components: { Button: {
      background: '#166534',
      backgroundHover: '#14532d',
      backgroundActive: '#052e16',
      color: '#ffffff',
      borderColor: '#166534',
      borderRadius: 20,
      minHeight: 48,
    } } }}>
      <Button>提交订单</Button>
      <LinkButton href="/docs">订单文档</LinkButton>
    </ThemeProvider>
  )
}
```

Button 与 LinkButton 共用下列10个可选字段；未配置的字段继续使用当前 variant/size
与全局 Token 的默认映射。组件配置不改变 `createTokens()` 的23个全局 Token。

| 配置字段 | 类型 | 对应公开 CSS 变量 |
| --- | --- | --- |
| background | string | --matthew-ui-button-background |
| backgroundHover | string | --matthew-ui-button-background-hover |
| backgroundActive | string | --matthew-ui-button-background-active |
| color | string | --matthew-ui-button-color |
| borderColor | string | --matthew-ui-button-border-color |
| borderRadius | number ≥ 0 | --matthew-ui-button-radius |
| minHeight | number > 0 | --matthew-ui-button-min-height |
| fontSize | number > 0 | --matthew-ui-button-font-size |
| paddingBlock | number ≥ 0 | --matthew-ui-button-padding-block |
| paddingInline | number ≥ 0 | --matthew-ui-button-padding-inline |

- 数字使用设计稿 px 单位，以16为基准转换为 rem；实际尺寸会随页面根字号缩放。
  不接受 NaN、Infinity、越界数字（RangeError）或字符串尺寸（TypeError）。
  minHeight 是最小高度，不限制内容撑高；padding 独立配置，不跟随高度自动缩放。
- 颜色字段接受 CSS 字符串，只检查字符串类型，不验证 CSS 语法，也不派生交互色。
  仅设置 background 不会改变 hover/active；这些状态仍使用各自的默认映射。
- 组件配置跨 variant/size 生效，包括 danger。若要保留危险操作的默认语义色，
  请让它处于定制范围之外；第一版不提供 variant 专属配置。
- 嵌套 Provider 按字段继承；空对象和 undefined 不清空父值。
  亮暗预设切换保留显式组件配置。撤销当前层的配置后，恢复父级配置或 CSS/default 回退。
- 同一 Provider 的配置优先于其 style 中的同名变量；后代按钮自身可以设置公开变量，
  制造局部例外。不要依赖内部 `--matthew-button-*` 变量。

例如对单个按钮使用 `className="pill-action"`，在业务 CSS 中定义：

```css
.pill-action {
  --matthew-ui-button-radius: 999px;
}
```

普通 CSS 的 background/border-radius 覆盖依然可用，但需要遵守级联优先级，
并自行处理 hover/active 等状态；“后加载”只在其他级联条件相同时决定结果。
公开变量的覆盖也可直接写在业务祖先容器上，不强制使用 Provider。
按需引入规则不变：通常引入 `tokens.css` + `button/style.css`，或直接引入 `styles.css`。

本地运行 `npm run storybook`，在 `Theme / ButtonTokens` 中体验尺寸联动、
区域定制、嵌套局部例外与亮暗切换/撤销。自动化样式检查不代替实际项目中的视觉判断。

### Menu 组件定制

`theme.components.Menu` 的配置、样式接线与真实包验收已随
`matthew-ui@0.2.0` 发布。

```tsx
import { Menu } from 'matthew-ui/menu'
import { ThemeProvider } from 'matthew-ui/theme'
import 'matthew-ui/tokens.css'
import 'matthew-ui/menu/style.css'
// 全量引入时，将上面两条CSS替换为 import 'matthew-ui/styles.css'

export function Navigation() {
  return (
    <ThemeProvider theme={{ components: { Menu: {
      itemSelectedBackground: '#dcfce7',
      itemSelectedColor: '#166534',
      itemBorderRadius: 8,
    } } }}>
      <Menu mode="vertical" defaultValue="home">
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.LinkItem value="docs" href="/docs">文档</Menu.LinkItem>
      </Menu>
    </ThemeProvider>
  )
}
```

13个字段均可选，作用于同域Menu的Item、LinkItem、SubMenu标题或横向浮层：

| 字段 | 类型 | 公开 CSS 变量 |
| --- | --- | --- |
| background | string | --matthew-ui-menu-background |
| borderColor | string | --matthew-ui-menu-border-color |
| itemColor | string | --matthew-ui-menu-item-color |
| itemHoverBackground | string | --matthew-ui-menu-item-hover-background |
| itemSelectedBackground | string | --matthew-ui-menu-item-selected-background |
| itemSelectedColor | string | --matthew-ui-menu-item-selected-color |
| itemMinHeight | number > 0 | --matthew-ui-menu-item-min-height |
| itemFontSize | number > 0 | --matthew-ui-menu-item-font-size |
| itemBorderRadius | number ≥ 0 | --matthew-ui-menu-item-radius |
| itemPaddingBlock | number ≥ 0 | --matthew-ui-menu-item-padding-block |
| itemPaddingInline | number ≥ 0 | --matthew-ui-menu-item-padding-inline |
| popupBackground | string | --matthew-ui-menu-popup-background |
| popupShadow | string | --matthew-ui-menu-popup-shadow |

- 数字是设计px，以16为基准转rem；类型/范围规则与Button配置一致。
  默认字号/最小高度读取全局Token，根字号16px时默认14px/40px；
  padding默认8px/12px，独立配置、不随高度派生。最小高度允许内容撑高。
- 配色字段互不派生：仅改选中背景不会自动改选中文字色。
  选中项和有选中后代的标题，悬停时保留选中配色；仅展开不算选中。
- background只控制Menu根区域，popupBackground/popupShadow只控制横向浮层。
  未覆盖时浮层读取全局surface/shadowOverlay；纵向子列表不变成浮层。
- 父子Provider按字段继承，Button/Menu配置分别合并；空对象和undefined不清空父值。
  亮暗切换保留显式定制；撤销当前层配置后恢复父值或CSS默认回退。
- 后代元素可用公开变量做局部例外，例如在自定义class中设置
  `--matthew-ui-menu-item-radius: 999px`。SubMenu的className/style位于li，
  后代标题与菜单项按CSS规则继承；不会改变外部Menu或Button。
- Provider不引入CSS；按需/全量引入方式不变。全局Token仍为23个，
  `tokens.css`不包含组件覆盖表。

本地运行 `npm run storybook`，在 `Theme / MenuTokens` 中体验尺寸联动、
区域定制、嵌套局部例外与亮暗切换/撤销。配色舒适度仍需使用者实际观察。

### AutoComplete 组件定制

`theme.components.AutoComplete` 的17字段配置、校验、嵌套继承和样式消费已随
`matthew-ui@0.2.0` 发布。

```tsx
import { AutoComplete } from 'matthew-ui/auto-complete'
import { ThemeProvider } from 'matthew-ui/theme'
import 'matthew-ui/tokens.css'
import 'matthew-ui/auto-complete/style.css'
// 全量引入时，将上面两条CSS替换为 import 'matthew-ui/styles.css'

const suggestions = [{ value: 'React' }, { value: 'React Router' }]

export function Search() {
  return (
    <ThemeProvider theme={{ components: { AutoComplete: {
      inputBorderRadius: 12,
      optionActiveBackground: '#dcfce7',
      optionActiveColor: '#166534',
    } } }}>
      <AutoComplete
        aria-label="搜索文档"
        fetchSuggestions={query =>
          suggestions.filter(item => item.value.toLowerCase().includes(query.toLowerCase()))
        }
      />
    </ThemeProvider>
  )
}
```

以下字段均可选，变量统一以 `--matthew-ui-auto-complete-` 为前缀：

| 字段 | 类型 | CSS变量后缀 |
| --- | --- | --- |
| fontSize | number > 0 | font-size |
| inputBackground | string | input-background |
| inputColor | string | input-color |
| borderColor | string | border-color |
| inputHoverBorderColor | string | input-hover-border-color |
| inputMinHeight | number > 0 | input-min-height |
| inputBorderRadius | number ≥ 0 | input-radius |
| inputPaddingBlock | number ≥ 0 | input-padding-block |
| inputPaddingInline | number ≥ 0 | input-padding-inline |
| optionColor | string | option-color |
| optionActiveBackground | string | option-active-background |
| optionActiveColor | string | option-active-color |
| optionBorderRadius | number ≥ 0 | option-radius |
| optionPaddingBlock | number ≥ 0 | option-padding-block |
| optionPaddingInline | number ≥ 0 | option-padding-inline |
| popupBackground | string | popup-background |
| popupShadow | string | popup-shadow |

- 数字为设计px，按16基准转rem；只接受有限数字，字号/最小高度须大于0，圆角/padding可为0。
  默认输入/建议/加载字号14px，输入最小高度40px；跟随全局fontSizeMd/controlHeightMd，
  显式组件字段优先。输入padding默认8/12px，建议/加载为10/12px，独立于高度。
- 颜色/阴影只校验string，不派生相关状态色，也不校验完整CSS语法。使用者负责有效值与对比度。
  普通输入背景由inputBackground控制；disabled/readOnly仍用全局colorSurfaceHover，
  保留inputColor与普通边框，且不应用hover边框。占位/加载文字仍为colorTextMuted。
- optionActive表示hover或键盘当前候选，不是已提交值；只有aria-selected=true加粗。
  指针停在另一项时，两项可能同时有颜色。Enter或点击才提交选择。
- borderColor同时控制输入和浮层普通边框；inputHoverBorderColor只控制可编辑输入hover。
  popupBackground/popupShadow独立于输入背景，未配置时跟随全局surface/shadowOverlay。
- 父子Provider按字段继承，三种组件配置独立合并；undefined与空对象不清空父值。
  切换亮暗保留显式配置，撤销当前层配置后恢复父级或CSS默认回退。
- `className/style` 仍位于input；输入与ul是兄弟，input上的变量不会传给浮层。
  定制整个实例用外层Provider，或在业务祖先class中声明公开变量；例如
  `--matthew-ui-auto-complete-popup-background: #f0fdf4`。
  renderOption内部样式仍按正常CSS级联，不强制覆盖。
- Provider不隐式加载CSS，按需/全量入口不变；全局23Token与组件稀疏变量分离。
  未配置组件字段不会在Provider或tokens.css中生成默认组件变量表。

本地运行 `npm run storybook`，在 `Theme / AutoCompleteTokens` 体验尺寸、区域定制、
嵌套输入例外、亮暗切换/撤销与异步加载。自动化检查不代替实际页面的观感判断。

### Thinking 组件定制

Thinking 可以从包根入口引入，也可以同时按需拆分 JavaScript 和 CSS：

```tsx
import { Thinking } from 'matthew-ui/thinking'
import { ThemeProvider } from 'matthew-ui/theme'
import 'matthew-ui/tokens.css'
import 'matthew-ui/thinking/style.css'

export function AgentProgress() {
  return (
    <ThemeProvider theme={{ components: { Thinking: {
      runningColor: '#7c3aed',
      completedColor: '#15803d',
      borderRadius: 10,
    } } }}>
      <Thinking title="正在分析项目" status="running">
        <p>读取项目结构</p>
      </Thinking>
    </ThemeProvider>
  )
}
```

`theme.components.Thinking` 的10个字段均可选：

| 字段 | 类型 | 公开 CSS 变量 |
| --- | --- | --- |
| titleColor | string | --matthew-ui-thinking-title-color |
| contentColor | string | --matthew-ui-thinking-content-color |
| borderColor | string | --matthew-ui-thinking-border-color |
| headerHoverBackground | string | --matthew-ui-thinking-header-hover-background |
| runningColor | string | --matthew-ui-thinking-running-color |
| completedColor | string | --matthew-ui-thinking-completed-color |
| stoppedColor | string | --matthew-ui-thinking-stopped-color |
| errorColor | string | --matthew-ui-thinking-error-color |
| borderRadius | number ≥ 0 | --matthew-ui-thinking-radius |
| headerMinHeight | number > 0 | --matthew-ui-thinking-header-min-height |

- 数字是设计 px，以16为基准转换为 rem；类型、有限数与范围校验规则与其他组件 Token 一致。
- 颜色字段只接受 CSS 字符串，彼此不派生；未提供的字段继续读取当前全局 Token。
- 父子 Provider 按字段继承；空对象和 `undefined` 不擦除父值，撤销当前层覆盖后恢复父值或 CSS 默认回退。
- 业务祖先或 Thinking 根节点也可以直接设置上表中的公开变量，按正常 CSS 级联和继承生效。

本地运行 `npm run storybook`，在 `Components / Thinking` 查看默认折叠、
四种状态、受控用法、亮暗主题、窄宽长标题与 reduced-motion 降级效果。

### ToolCall 组件定制

ToolCall 可以从包根入口引入，也可以同时按需拆分 JavaScript 和 CSS：

```tsx
import { ToolCall } from 'matthew-ui/tool-call'
import { ThemeProvider } from 'matthew-ui/theme'
import 'matthew-ui/tokens.css'
import 'matthew-ui/tool-call/style.css'
// 全量引入时，将上面两条CSS替换为 import 'matthew-ui/styles.css'

export function AgentToolCalls() {
  return (
    <ThemeProvider theme={{ components: { ToolCall: {
      runningColor: '#7c3aed',
      errorColor: '#b91c1c',
      borderRadius: 6,
    } } }}>
      <ToolCall name="运行类型检查" status="running" summary="正在执行…">
        <p>npx tsc --build</p>
      </ToolCall>
    </ThemeProvider>
  )
}
```

`theme.components.ToolCall` 的12个字段均可选：

| 字段 | 类型 | 公开 CSS 变量 |
| --- | --- | --- |
| nameColor | string | --matthew-ui-tool-call-name-color |
| summaryColor | string | --matthew-ui-tool-call-summary-color |
| detailColor | string | --matthew-ui-tool-call-detail-color |
| borderColor | string | --matthew-ui-tool-call-border-color |
| headerHoverBackground | string | --matthew-ui-tool-call-header-hover-background |
| pendingColor | string | --matthew-ui-tool-call-pending-color |
| runningColor | string | --matthew-ui-tool-call-running-color |
| completedColor | string | --matthew-ui-tool-call-completed-color |
| errorColor | string | --matthew-ui-tool-call-error-color |
| stoppedColor | string | --matthew-ui-tool-call-stopped-color |
| borderRadius | number ≥ 0 | --matthew-ui-tool-call-radius |
| headerMinHeight | number > 0 | --matthew-ui-tool-call-header-min-height |

- 数字是设计 px，以16为基准转换为 rem；类型、有限数与范围校验规则与其他组件 Token
  一致；圆角可为 0，标题行最小高度必须大于 0。当前源码的默认标题行最小高度为
  40px（controlHeightMd），名称与摘要 14px（fontSizeMd），名称字重 500、摘要 400，
  字体族继承宿主。标题 padding 8px/12px、间距 10px、状态占位 12px、收起朝下／
  展开朝上的箭头与 Thinking 一致；显式组件字段优先。
- 摘要靠右排列在箭头前，最多占可分配文本宽度的 40%，长名称与长摘要单行省略。
  组件宽度 ≤320px 时通过容器查询视觉隐藏摘要，仍保留辅助技术文本；宽视口中的
  窄容器同样生效。不支持容器查询的浏览器继续展示摘要并省略长文本。
- 上述标题栏是 v0.3.0 之后的视觉调整，尚未发布；已发布 v0.3.0 使用 32px 标题行、
  13px 名称、12px 摘要以及右／下箭头。公开 props、详情布局和展开行为保持一致。
- 颜色字段只接受 CSS 字符串，彼此不派生；未提供的字段继续读取当前全局 Token：
  名称 colorText，摘要/详情/pending/stopped colorTextMuted，running colorPrimary，
  completed colorPrimaryActive，error colorDanger，分隔线 colorBorder，hover colorSurfaceHover。
- 不开放根背景与详情背景 Token；根节点透明是 ToolCall 的视觉定位，不是可配置的卡片模式。
- 父子 Provider 按字段继承；空对象和 `undefined` 不擦除父值，撤销当前层覆盖后恢复
  父值或 CSS 默认回退。
- 业务祖先或 ToolCall 根节点也可以直接设置上表中的公开变量，按正常 CSS 级联和继承生效。

本地运行 `npm run storybook`，在 `Components / ToolCall` 查看无详情状态行、
五种状态图形、与 Thinking 组合的视觉层级、亮暗主题、12 字段精确覆盖、
动态启用/撤销主题作用域、320px 窄宽摘要隐藏与 reduced-motion 降级效果。

### TaskList 组件定制

TaskList 可以从包根入口引入，也可以同时按需拆分 JavaScript 和 CSS：

```tsx
import { TaskList } from 'matthew-ui/task-list'
import { ThemeProvider } from 'matthew-ui/theme'
import 'matthew-ui/tokens.css'
import 'matthew-ui/task-list/style.css'
// 全量引入时，将上面两条CSS替换为 import 'matthew-ui/styles.css'

const items = [
  { id: 'contract', title: '确认合同', status: 'completed', summary: '已评审' },
  { id: 'quality', title: '质量检查', status: 'running', summary: '正在执行…' },
  { id: 'verify', title: '复核发布包', status: 'pending' },
]

export function AgentPlan() {
  return (
    <ThemeProvider theme={{ components: { TaskList: {
      runningColor: '#7c3aed',
      errorColor: '#b91c1c',
      borderRadius: 6,
    } } }}>
      <TaskList title="实施计划" items={items} />
    </ThemeProvider>
  )
}
```

`theme.components.TaskList` 的15个字段均可选：

| 字段 | 类型 | 公开 CSS 变量 |
| --- | --- | --- |
| background | string | --matthew-ui-task-list-background |
| borderColor | string | --matthew-ui-task-list-border-color |
| titleColor | string | --matthew-ui-task-list-title-color |
| progressColor | string | --matthew-ui-task-list-progress-color |
| itemColor | string | --matthew-ui-task-list-item-color |
| summaryColor | string | --matthew-ui-task-list-summary-color |
| headerHoverBackground | string | --matthew-ui-task-list-header-hover-background |
| pendingColor | string | --matthew-ui-task-list-pending-color |
| runningColor | string | --matthew-ui-task-list-running-color |
| completedColor | string | --matthew-ui-task-list-completed-color |
| errorColor | string | --matthew-ui-task-list-error-color |
| stoppedColor | string | --matthew-ui-task-list-stopped-color |
| borderRadius | number ≥ 0 | --matthew-ui-task-list-radius |
| headerMinHeight | number > 0 | --matthew-ui-task-list-header-min-height |
| itemMinHeight | number > 0 | --matthew-ui-task-list-item-min-height |

- 数字是设计 px，以16为基准转换为 rem；类型、有限数与范围校验规则与其他组件 Token
  一致；圆角可为 0，标题栏与任务行最小高度必须大于 0。默认标题栏 40px
  （controlHeightMd）、任务行 34px、标题 14px、任务标题 13px、摘要 12px，跟随全局
  Token，显式组件字段优先。
- 颜色字段只接受 CSS 字符串，彼此不派生；未提供的字段继续读取当前全局 Token：
  背景 colorSurface，外框/分隔线/连接线 colorBorder，标题/任务 colorText，总体摘要/
  行摘要/完成标题 colorTextMuted，running colorPrimary，completed colorPrimaryActive，
  error colorDanger，pending/stopped colorTextMuted。
- 面板默认宽度稳定为 `width: min(30rem, 100%)`（根字号 16px 时 320–480px），
  不随标题、摘要或任务数量变化；窄容器响应式（如 320px 及更窄时隐藏任务行摘要）
  基于容器查询按组件可用宽度判断，而非浏览器视口。不开放宽度 Token，调用方可用
  正常 CSS 覆盖。
- 父子 Provider 按字段继承；空对象和 `undefined` 不擦除父值，撤销当前层覆盖后恢复
  父值或 CSS 默认回退。
- 业务祖先或 TaskList 根节点也可以直接设置上表中的公开变量，按正常 CSS 级联和继承生效。

本地运行 `npm run storybook`，在 `Components / TaskList` 查看默认展开与折叠、
空列表、五种状态图形与并行 running、动态增删重排、与 Thinking/ToolCall 的
三层组合、亮暗主题、15 字段精确覆盖、动态启用/撤销主题作用域、320px 窄宽
摘要隐藏与 reduced-motion 降级效果。

### Select 组件定制（当前源码，尚未发布）

```tsx
import { Select } from 'matthew-ui/select'
import { ThemeProvider } from 'matthew-ui/theme'
import 'matthew-ui/tokens.css'
import 'matthew-ui/select/style.css'

export function CategoryFilter() {
  return (
    <ThemeProvider theme={{ components: { Select: {
      triggerMinHeight: 48, optionSelectedColor: '#166534', borderRadius: 12,
    } } }}>
      <Select value="" onValueChange={value => console.log(value)}
        options={[{ value: '', label: '全部分类' }, { value: 'docs', label: '文档' }]}
        aria-label="分类" />
    </ThemeProvider>
  )
}
```

`theme.components.Select` 的 16 个字段均可选；变量以 `--matthew-ui-select-` 为前缀：

| 字段 | 类型 | CSS 变量后缀 | 默认回退 |
| --- | --- | --- | --- |
| fontSize | number > 0 | font-size | fontSizeMd |
| triggerBackground | string | trigger-background | colorSurface |
| triggerColor | string | trigger-color | colorText |
| placeholderColor | string | placeholder-color | colorTextMuted |
| borderColor | string | border-color | colorBorder |
| triggerHoverBorderColor | string | trigger-hover-border-color | colorPrimary |
| triggerMinHeight | number > 0 | trigger-min-height | controlHeightMd |
| borderRadius | number ≥ 0 | radius | radiusMd |
| triggerPaddingBlock | number ≥ 0 | trigger-padding-block | 8px / 0.5rem |
| triggerPaddingInline | number ≥ 0 | trigger-padding-inline | 12px / 0.75rem |
| optionColor | string | option-color | colorText |
| optionActiveBackground | string | option-active-background | colorSurfaceHover |
| optionSelectedColor | string | option-selected-color | colorPrimaryActive |
| optionMinHeight | number > 0 | option-min-height | 36px / 2.25rem |
| popupBackground | string | popup-background | colorSurface |
| popupShadow | string | popup-shadow | shadowOverlay |

- 字号用于触发器与选项；圆角、普通边框颜色用于触发器与弹层。hover 边框只用于
  触发器悬停／展开态；popup 背景和阴影独立，不改变触发器。
- 活动项用背景提示，已选项用文字颜色与对勾，两者可同时存在。选中前景默认读取
  colorPrimaryActive，与 Menu 一致，避免暗色主色文字对比度不足。
- 禁用触发器背景／文字优先使用全局 colorSurfaceHover/colorTextMuted；禁用选项
  文字与对勾优先使用 colorTextMuted。普通／选中颜色覆盖不改变禁用语义；尺寸、
  普通边框定制仍保留，不开放独立 disabled Token。
- 数字是设计 px，以16为基准转 rem；类型、有限数、正尺寸、非负圆角／padding 与
  string 校验沿用现有组件。最小高度允许内容撑高，padding 不随高度自动派生。
- 只输出显式字段；空对象和 undefined 继承父值，null 字段进入校验。亮暗切换保留
  定制，撤销子层后恢复父级或默认回退；不新增全局 Token 或包级组件 Token 类型导出。
- Portal 桥接来源域变量，包括祖先 CSS 和触发器 style，并跟随主题更新。
  className/style 位于触发器；祖先后代选择器不能跨 Portal 命中弹层。
- 不开放宽度、层级、坐标、箭头角度或动画速度 Token。普通 CSS 管布局，
  自定义模态场景通过 popupHost 提供语义范围内的宿主。

### Dialog 组件定制（当前源码，尚未发布）

`theme.components.Dialog` 的12个字段均可选，变量前缀为 `--matthew-ui-dialog-`：

| 字段 | 类型 | CSS 变量后缀 | 默认回退 |
| --- | --- | --- | --- |
| background | string | background | colorSurface |
| color | string | color | colorText |
| borderColor | string | border-color | colorBorder |
| backdropBackground | string | backdrop-background | rgb(15 23 42 / 45%) |
| titleColor | string | title-color | colorText |
| closeColor | string | close-color | colorTextMuted |
| closeHoverBackground | string | close-hover-background | colorSurfaceHover |
| shadow | string | shadow | shadowOverlay |
| borderRadius | number ≥0 | radius | radiusMd |
| titleFontSize | number >0 | title-font-size | fontSizeLg |
| contentPaddingBlock | number ≥0 | content-padding-block | 20px / 1.25rem |
| contentPaddingInline | number ≥0 | content-padding-inline | 20px / 1.25rem |

- 数字按设计 px／16转rem，有限数、正尺寸、非负圆角／padding 和 string 校验沿用现有规则。
- 背景／边框／阴影作用于 dialog，backdropBackground 作用于原生 `::backdrop`；内容颜色与
  标题颜色独立，颜色之间不派生。禁用关闭图标仍使用全局 colorTextMuted。
- 父子 Provider 按字段继承；空对象／undefined 不擦除父值，撤销恢复父层或 CSS 回退。
  祖先 CSS 和 dialog 的 style 同样可以设置公开变量；不额外复制主题或建立 Portal。
- 默认宽度 `min(32rem, calc(100% - 2rem))`（16px根字号时最大512px）、圆角8px，标题16px、
  正文14px。长内容区独立滚动，标题和 footer 保持可见；宽度由普通 CSS 覆盖，不开放宽度 Token。

```tsx
<ThemeProvider theme={{ components: { Dialog: { borderRadius: 12, titleColor: '#166534' } } }}>
  <Dialog open={open} onOpenChange={setOpen} title="编辑" closeLabel="关闭编辑">内容</Dialog>
</ThemeProvider>
```

### SourceList 组件定制（当前源码，尚未发布）

`theme.components.SourceList` 的12个字段均可选，变量前缀为 `--matthew-ui-source-list-`：

| 字段 | 类型 | CSS 变量后缀 | 默认回退 |
| --- | --- | --- | --- |
| background | string | background | colorSurface，仅带标题模式 |
| borderColor | string | border-color | colorBorder，外框和分隔线 |
| headerColor | string | header-color | colorText，标题和箭头 |
| headerHoverBackground | string | header-hover-background | colorSurfaceHover |
| itemTitleColor | string | item-title-color | colorText，非链接标题 |
| summaryColor | string | summary-color | colorText |
| sourceColor | string | source-color | colorTextMuted |
| linkColor | string | link-color | colorPrimaryActive |
| borderRadius | number ≥0 | radius | radiusMd，仅带标题模式 |
| headerMinHeight | number >0 | header-min-height | controlHeightMd |
| itemPaddingBlock | number ≥0 | item-padding-block | 12px / 0.75rem |
| itemPaddingInline | number ≥0 | item-padding-inline | 带标题12px；无标题0 |

数字按设计 px／16 转 rem，只接受有限数；颜色只校验 string 类型，不派生其他字段。
undefined 不输出，null 字段报错。父子 Provider 按字段继承，撤销覆盖恢复父值或 CSS 回退。
无标题始终透明、无外框；background 不改变这个模式，显式 itemPaddingInline 覆盖两种模式。
字号跟随全局 Token，不开放独立宽度、字体、箭头或动画 Token，也不单独导出组件 Token 类型。

```tsx
<ThemeProvider theme={{ components: { SourceList: { linkColor: '#166534', itemPaddingBlock: 16 } } }}>
  <SourceList title="参考来源" items={sources} />
</ThemeProvider>
```

### CodeBlock 组件定制（当前源码，尚未发布）

`theme.components.CodeBlock` 提供 8 个稀疏覆盖字段，不改变 23 个全局 Token：

| 字段 | 类型 | CSS 变量后缀（前缀 `--matthew-ui-code-block-`） |
| --- | --- | --- |
| background | string | background |
| color | string | color |
| borderColor | string | border-color |
| headerBackground | string | header-background |
| headerColor | string | header-color |
| borderRadius | number ≥ 0 | radius |
| paddingBlock | number ≥ 0 | padding-block |
| paddingInline | number ≥ 0 | padding-inline |

颜色仅校验字符串类型，不派生其他色；尺寸为有限非负设计 px，按 16 基准转 rem。
未配置字段读取当前全局 Token，空对象／undefined 继承父字段；撤销子层覆盖恢复父值
或默认回退。`color` 控制正文，`headerColor` 只控制标题；语言、复制按钮和反馈默认
使用全局 `colorText` 保证标题栏上的小字对比度。padding 只控制正文，不改变标题栏。
公开变量也可在业务祖先或根节点覆盖；不开放宽度、限高或字体 Token。

## 组件

### Button 与 LinkButton

```tsx
import { Button, LinkButton } from 'matthew-ui'

export function Actions() {
  return (
    <>
      <Button size="lg" variant="primary">
        保存
      </Button>
      <LinkButton href="/docs" variant="secondary">
        查看文档
      </LinkButton>
    </>
  )
}
```

`variant` 支持 `primary | secondary | danger`，`size` 支持 `sm | md | lg`。`Button` 默认使用安全的 `type="button"`；`LinkButton` 的 `href` 必填，禁用时会保持链接语义并阻止导航。

### Menu

```tsx
import { Menu } from 'matthew-ui'

export function Navigation() {
  return (
    <Menu
      aria-label="组件导航"
      defaultOpenValues={['components']}
      defaultValue="button"
      mode="vertical"
    >
      <Menu.LinkItem href="/" value="home">
        首页
      </Menu.LinkItem>
      <Menu.SubMenu title="组件" value="components">
        <Menu.LinkItem href="/components/button" value="button">
          Button
        </Menu.LinkItem>
        <Menu.Item value="refresh" onClick={() => console.log('refresh')}>
          刷新
        </Menu.Item>
      </Menu.SubMenu>
    </Menu>
  )
}
```

`Menu.Item`、`Menu.LinkItem` 和 `Menu.SubMenu` 都使用稳定的字符串 `value` 标识身份。`mode` 默认为 `horizontal`：横向模式最多展开一个 SubMenu，`vertical` 模式允许同时展开多个。选择状态支持 `value/onValueChange` 或 `defaultValue`，展开状态支持 `openValues/onOpenValuesChange` 或 `defaultOpenValues`。

### AutoComplete

```tsx
import { AutoComplete } from 'matthew-ui'

type Player = {
  value: string
  number: number
}

const players: Player[] = [
  { value: 'james', number: 23 },
  { value: 'caruso', number: 4 },
]

export function PlayerSearch() {
  return (
    <AutoComplete<Player>
      aria-label="搜索球员"
      fetchSuggestions={(query) =>
        players.filter((player) =>
          player.value.includes(query.toLowerCase()),
        )
      }
      onOptionSelect={(player) => console.log(player.number)}
      renderOption={(player) => `${player.value} #${player.number}`}
    />
  )
}
```

每个建议项至少需要唯一的字符串 `value`。`fetchSuggestions` 可以返回数组或 Promise；`onValueChange` 接收输入字符串，`onOptionSelect` 接收完整建议对象。组件支持 `value/onValueChange` 受控模式或 `defaultValue` 非受控模式，并内置 300ms 查询防抖。

### Thinking

```tsx
import { Thinking } from 'matthew-ui'

const statusLabels = {
  running: '运行中',
  completed: '已完成',
  stopped: '已中止',
  error: '失败',
}

export function AnalysisProgress() {
  return (
    <Thinking
      title="分析项目"
      status="running"
      statusLabels={statusLabels}
    >
      <p>读取项目结构</p>
      <p>检查组件入口</p>
    </Thinking>
  )
}
```

Thinking 默认为 `running` 且处于折叠状态。`status` 支持
`running | completed | stopped | error`；展开状态可以使用
`open/onOpenChange` 受控，或使用 `defaultOpen` 非受控。折叠时内容保持挂载。
`statusLabels` 可选，只向辅助技术表达当前状态；组件不内置语言文案，
也不使用 `aria-live` 主动播报状态变化。

### ToolCall

```tsx
import { ToolCall } from 'matthew-ui'

const statusLabels = {
  pending: '排队中',
  running: '执行中',
  completed: '已完成',
  error: '失败',
  stopped: '已中止',
}

export function ToolActivity() {
  return (
    <ToolCall
      name="运行类型检查"
      status="running"
      statusLabels={statusLabels}
      summary="正在执行…"
    >
      <p>npx tsc --build</p>
    </ToolCall>
  )
}
```

`name` 与 `status` 必填：`name` 是面向用户的工具名称，`status` 支持
`pending | running | completed | error | stopped`。`summary` 可选，用于展示短结果、
当前动作或调用方已计算好的耗时。提供 `children` 时是可展开的 disclosure：默认折叠，
`open/onOpenChange` 受控或 `defaultOpen` 非受控，折叠时详情保持挂载；未提供
`children` 时退化为非交互状态行，不渲染展开按钮，布尔值、空字符串、空数组等
渲染为空的子节点不算详情。`statusLabels` 可选，必须提供五种状态的本地化文案，
以视觉隐藏文本加入可访问名称；组件不内置语言文案。原生 `div` 属性（含 `title`）
保持透传。

### TaskList

```tsx
import { TaskList } from 'matthew-ui'

const items = [
  { id: 'contract', title: '确认合同', status: 'completed', summary: '已评审' },
  { id: 'quality', title: '质量检查', status: 'running', summary: '正在执行…' },
  { id: 'verify', title: '复核发布包', status: 'pending' },
]

export function AgentPlan() {
  return <TaskList title="实施计划" items={items} />
}
```

`title` 与 `items` 必填：`title` 是面向用户的任务标题，`items` 是只读条目数组，
每个条目的 `id`、`title`、`status` 必填（`summary` 可选），`id` 是调用方维护的
稳定唯一身份。模块自动显示语言无关的 `completed / total` 摘要（只统计
`completed`），空列表不显示摘要。默认展开，`open/onOpenChange` 受控或
`defaultOpen` 非受控，折叠后列表保持挂载；条目严格按数组顺序渲染，支持动态
增删、重排和状态更新。`statusLabels` 可选，必须提供五种状态的本地化文案，
以视觉隐藏文本加入条目可访问内容。条目是只读 `li`，模块不内置编辑、重试、
取消或行内操作。

### Select（当前源码，尚未发布）

```tsx
import { useState } from 'react'
import { Select } from 'matthew-ui'

export function ThemeChoice() {
  const [value, setValue] = useState('')
  return <Select value={value} onValueChange={setValue} aria-label="主题"
    placeholder="请选择主题" options={[
      { value: '', label: '跟随系统' }, { value: 'light', label: '亮色' },
      { value: 'dark', label: '暗色' }, { value: 'contrast', label: '高对比度', disabled: true },
    ]} />
}
```

第一版只做受控单选、不可编辑选择：value/onValueChange/options 必填，每项 value
唯一、label 为字符串。空字符串是合法值；非法 value 显示 placeholder，不自动选中
或纠正。相同值确认只关闭，不重复回调；调用方不更新 value 时展示不变。
空 options 自动禁用、不打开弹层；全禁用 options 仍可展开查看。动态选项按 value
维护身份，新增／删除／重排不提交选择。

触发器为 type="button" 的 combobox，ref 指向 HTMLButtonElement。title、
className/style、data 属性和 aria-label/aria-labelledby 可透传。字符前缀定位不筛选
列表，不提供搜索、多选或非受控 value。方向键／Home/End 导航，Enter/Space 确认；
Escape、Tab、外部点击关闭但不提交，外部点击不抢焦点；关闭态 Escape 留给父级。

默认 Portal 到 body，跟随滚动／resize、向上翻转和限高。模态 Dialog／侧栏使用
`popupHost={() => dialogRef.current}` 指定内部宿主；调用方须确保打开时 ref 已有效。
首个 Escape 仅关闭 Select，下一次留给原生 Dialog；默认关闭时不渲染 listbox。
name/form 属性不代表支持原生 select 的表单值提交、校验或重置，由业务处理。

### Dialog（当前源码，尚未发布）

```tsx
import { useRef, useState } from 'react'
import { Button, Dialog, Select } from 'matthew-ui'

export function EditNote() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('fact')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  return <>
    <Button onClick={() => setOpen(true)}>新建记忆</Button>
    <Dialog ref={dialogRef} open={open} onOpenChange={setOpen}
      title="新建记忆" closeLabel="关闭新建记忆" initialFocus={() => inputRef.current}
      footer={<Button onClick={() => setOpen(false)}>取消</Button>}>
      <label>标题<input ref={inputRef} defaultValue="" /></label>
      <Select value={value} onValueChange={setValue} aria-label="类型"
        options={[{ value: 'fact', label: '事实' }, { value: 'preference', label: '偏好' }]}
        popupHost={() => dialogRef.current} />
    </Dialog>
  </>
}
```

`open/onOpenChange/title/closeLabel/children` 必填，仅受控模态；ref 指向 HTMLDialogElement。
默认 Escape 与关闭按钮请求 `onOpenChange(false)`，调用方不更新 open 时保持模态；
调用方主动改 open 不重复回调。遮罩默认不关闭，`closeOnBackdrop` 可启用；内容拖到遮罩
释放不误关闭。`dismissible={false}` 统一禁用图标、Escape 和遮罩关闭，保存状态仍由业务管理。

`footer` 可省略，不内置确定／取消／保存按钮。关闭后内容保持挂载且隐藏，草稿与子模块
状态保留；需要销毁由父层条件渲染，Dialog 不 reset。表单与正常 submit 不被接管，不应
用 `method="dialog"` 或 ref.close/showModal 绕过受控状态，也不要手动传非模态语义属性。

打开时 `initialFocus` 返回的有效内部节点优先，否则使用原生 autofocus 属性或标题；
React autoFocus 不保证重开后再次定位，表单建议传 input ref。原生模态限制背景交互，
关闭／卸载还原仍有效的打开前焦点与文档滚动样式。Dialog 内 Select 的第一次 Escape
只关闭列表，再次才请求关闭 Dialog；必须给 Select 提供 dialog 内部 popupHost。
SSR 输出关闭 shell，客户端再按 open 建立模态；仅支持具有原生 dialog/showModal 的现代浏览器。

按需使用引入 `matthew-ui/dialog`、`tokens.css`、`dialog/style.css`；组合 Button、Select 时
也显式引入各自样式，或使用全量 `styles.css`。输入框与业务表单布局由调用方负责。

### SourceList（当前源码，尚未发布）

```tsx
import { useState } from 'react'
import { SourceList } from 'matthew-ui'
import type { SourceListItem } from 'matthew-ui'

const sources: readonly SourceListItem[] = [
  { id: 'doc-1', title: '项目架构文档', summary: '调用方提供的证据内容。\n全文换行，不默认截断。', source: '本地文档', domId: 'chat-run-1-doc-1' },
  { id: 'web-1', title: 'React 文档', href: 'https://react.dev', target: '_blank', source: 'react.dev' },
]
export function Sources() {
  const [open, setOpen] = useState(false)
  return <SourceList title="参考来源" items={sources} open={open} onOpenChange={setOpen} />
}
```

items 必填，id/title 必填；id 在当前列表内唯一且稳定，严格按数组顺序展示。
title、summary、source 都是纯文本，不解析 HTML／Markdown，不接受 children/renderItem。
有标题默认收起，可用 defaultOpen 指定初始值；open 表示受控，按钮只上报请求，外部改变
open 不触发回调。无标题（含空白标题）始终展示，无按钮；空列表保留语义列表但不显示数量。
数量只计条目，不代表独立来源数。动态更新不重置展开态；跨虚拟列表重挂载应由业务保存 open。

仅标题链接可点击，默认当前页 `_self`；`_blank` 自动设置 `noopener noreferrer`。
URL 解析后只允许 HTTP(S) 及正常相对链接，其他协议／无效地址退化为普通文本。
协议许可不保证目标内容可信，业务仍可实施更严格的来源策略；组件不联网或获取正文。

折叠保留挂载，通过 hidden 排除键盘导航和可访问树。外部折叠时内部焦点回到标题，
外部焦点不被抢走。domId 原样用于 li id 与 tabIndex=-1，调用方保证整个页面唯一；
Research 定位由业务请求展开、等待提交，再 scrollIntoView 和 focus，不由组件自动执行。
不提供引用编号、逐条折叠、业务路由、代码渲染或证据管理。

默认宽度100%跟随容器，业务用正常 CSS 限宽；正文全文换行，明暗跟随主题，无 Portal。
按需使用：

```tsx
import { SourceList } from 'matthew-ui/source-list'
import 'matthew-ui/tokens.css'
import 'matthew-ui/source-list/style.css'
```

### CodeBlock（当前源码，尚未发布）

```tsx
import { CodeBlock } from 'matthew-ui'

export function ToolArguments() {
  return <CodeBlock title="调用参数" language="JSON"
    code={JSON.stringify({ query: '项目架构' }, null, 2)}
    copy={{ label: '复制', copiedLabel: '已复制', errorLabel: '复制失败' }} />
}
```

`code` 必填且只接受原始字符串；`title`／`language` 为可选纯文本，language 仅作标签，
不触发高亮。默认保留行结构、代码区内部横向滚动，`wrap` 可启用自动换行。
三项标题栏信息（title、language、copy）都不提供时不显示标题栏。空 code 是合法值。

copy 不提供时没有按钮；提供时三个本地化文案都必填。点击只复制当时的 code，
不包含标题或反馈，不做 trim／格式化；原生 Clipboard API 成功后才报告成功，
不支持、权限拒绝或异常报告失败，可手动选中文本复制。反馈约 2 秒后消失，
pending 阻止重复写入且保留焦点。文本／文案变化、移除 copy 或卸载隔离旧异步完成；
等值的新 copy 对象不会重置反馈。复制依赖消费环境的安全上下文与权限，不保证总成功。

ref 指向根 div；className/style/data/aria 与适用事件透传。title 是显示标题而非原生
title 提示。HTML 字符串安全显示为文本，不接受 children/dangerouslySetInnerHTML。
默认不设最大高度，不内置折叠；可放进 ToolCall 详情。代码区支持键盘聚焦／滚动，
建议提供有意义的 title 或 aria-label。业务负责序列化、脱敏、截断与限高；例如：

```css
.material-code .matthew-code-block__pre { max-height: 24rem; }
```

按需使用：

```tsx
import { CodeBlock } from 'matthew-ui/code-block'
import 'matthew-ui/tokens.css'
import 'matthew-ui/code-block/style.css'
```

本批不替换业务 SafeMarkdown 的 HTML 渲染管线、不做语法高亮、行号或 Diff 编辑。

## 公开入口

| 入口 | 内容 |
| --- | --- |
| `matthew-ui` | 组件、ThemeProvider、Token API 及 TypeScript 类型 |
| `matthew-ui/button` | Button/LinkButton 及对应类型 |
| `matthew-ui/menu` | Menu 及对应类型 |
| `matthew-ui/auto-complete` | AutoComplete 及对应类型 |
| `matthew-ui/thinking` | Thinking 及对应类型 |
| `matthew-ui/tool-call` | ToolCall 及对应类型 |
| `matthew-ui/task-list` | TaskList/TaskStatus/TaskListItem 及对应类型 |
| `matthew-ui/select` | Select/SelectOption/SelectProps（当前源码，尚未发布） |
| `matthew-ui/dialog` | Dialog/DialogProps（当前源码，尚未发布） |
| `matthew-ui/source-list` | SourceList/SourceListItem/SourceListProps（当前源码，尚未发布） |
| `matthew-ui/code-block` | CodeBlock/CodeBlockProps/CodeBlockCopyConfig（当前源码，尚未发布） |
| `matthew-ui/theme` | ThemeProvider、主题预设、Token API 及对应类型 |
| `matthew-ui/tokens.css` | 默认亮色 `:root` Token |
| `matthew-ui/button/style.css` | Button/LinkButton 样式 |
| `matthew-ui/menu/style.css` | Menu 样式 |
| `matthew-ui/auto-complete/style.css` | AutoComplete 样式 |
| `matthew-ui/thinking/style.css` | Thinking 样式 |
| `matthew-ui/tool-call/style.css` | ToolCall 样式 |
| `matthew-ui/task-list/style.css` | TaskList 样式 |
| `matthew-ui/select/style.css` | Select 样式（当前源码，尚未发布） |
| `matthew-ui/dialog/style.css` | Dialog 样式（当前源码，尚未发布） |
| `matthew-ui/source-list/style.css` | SourceList 样式（当前源码，尚未发布） |
| `matthew-ui/code-block/style.css` | CodeBlock 样式（当前源码，尚未发布） |
| `matthew-ui/styles.css` | Token 与全部组件样式 |

组件内部文件不属于公开入口，请不要通过 `matthew-ui/dist/*` 或源码路径导入。

## 质量验证

- 426 个单元与浏览器测试用例，覆盖 Token、主题作用域、组件配置与实际样式、DOM 语义、受控状态、键盘与指针交互、IME 输入及异步竞态。
- 100 个 Story 场景，用于验证公开示例、亮暗主题、组件定制、交互行为和可访问性规则。
- 104 个发布验证器回归用例，覆盖多层依赖、完整发布树孤儿文件、dry-run 打包/安装和默认/定制浏览器样式异常。
- 真实 `npm pack` tarball 会分别安装到 React 18.2 与 React 19 临时消费端，验证 ESM、CommonJS、类型、CSS、DOM ref、公开入口边界和 Vite Tree Shaking。
- Chromium 验证无 Provider 的默认 Token 回退，以及按需/全量 CSS 的 Button/LinkButton 定制尺寸、颜色、真实 hover/active 与作用域隔离。
- Menu还经过真实挂载，验证两种CSS模式的默认/定制尺寸、选中悬停、父标题和浮层；不以SSR静态标记代替子菜单注册与展开。
- AutoComplete同样从真实安装包挂载，验证两种CSS模式的默认/定制输入、异步加载、候选高亮与回填、禁用/只读及暗色浮层；不以变量输出代替最终样式。
- Thinking 从真实安装包验证默认/定制样式、四种状态、明暗与嵌套主题、展开交互及 reduced-motion 降级。
- ToolCall 从真实安装包验证默认/定制标题栏、五种状态图形与颜色、无详情状态行、明暗与嵌套主题、宽视口中的窄容器摘要隐藏与恢复、40% 文本空间上限及 reduced-motion 圆环降级。
- TaskList 从真实安装包验证默认/定制面板样式、宽度约束、五种状态图形与连接线、明暗与嵌套主题、折叠挂载、320px 窄宽摘要隐藏及 reduced-motion 圆环降级。
- Select 从真实安装包验证两种 CSS 模式、16 字段定制、来源域 Portal 主题桥接、动态撤销、滚动与尺寸跟随、边界翻转、窄视口、变换宿主与原生 Dialog 的两次 Escape。
- Dialog 从真实安装包验证原生模态、受控关闭、焦点与滚动恢复、保留草稿、12字段主题与遮罩、375px窄视口、200%字体、reduced-motion及 Select 两次 Escape。
- SourceList 从真实安装包验证两种 CSS 模式、折叠挂载与 Tab 排除、链接安全、焦点回退、12字段定制与动态撤销、320px容器／375px视口、200%字体和真实 reduced-motion。
- CodeBlock 从真实安装包验证两种 CSS 模式、原文剪贴板写入／失败重试、8字段定制与撤销、亮暗、320px容器／375px视口、200%字体、滚动／换行、焦点与真实 reduced-motion。

## 本地开发

```bash
npm run dev
npm run typecheck
npm run lint
npm run test:run
npm run test:stories
npm run build
npm run test:package-checks
npm run verify:package
```

`npm run test:package-checks` 会先构建再运行验证器回归测试；首次使用浏览器测试前运行 `npx playwright install chromium`。
`npm run verify:package` 包含这些回归测试，再构建真实 npm tarball，并在临时 React 18.2 与 React 19 项目中验证安装、类型、入口、DOM ref、生产构建和默认计算样式；它不会执行 `npm publish`。

## License

[MIT](./LICENSE)
