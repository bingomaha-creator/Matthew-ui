# Matthew UI

[![npm version](https://img.shields.io/npm/v/matthew-ui?label=npm)](https://www.npmjs.com/package/matthew-ui)
[![CI](https://github.com/bingomaha-creator/Matthew-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/bingomaha-creator/Matthew-ui/actions/workflows/ci.yml)
[![Storybook](https://img.shields.io/badge/Storybook-online-ff4785?logo=storybook&logoColor=white)](https://bingomaha-creator.github.io/Matthew-ui/)
[![License](https://img.shields.io/npm/l/matthew-ui)](./LICENSE)

Matthew UI 是一个使用 React 和 TypeScript 构建并发布到 npm 的 Web 端 UI 组件库，目前提供 Button、Menu 和 AutoComplete。项目处于 `0.x` 迭代阶段，公开 API 仍可能调整。

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
覆盖，不会反向重算其他 Token。第一版局部主题不保证覆盖挂载到 wrapper 外部的 Portal
内容；当前组件不使用 Portal。

### Button 组件定制

以下能力对应当前源码，尚未发布为新的 npm 版本。

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

当前源码已完成 `theme.components.Menu` 的配置、样式接线与真实包验收，
此能力尚未发布新 npm 版本。

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

当前源码支持 `theme.components.AutoComplete` 的17字段配置、校验、嵌套继承和样式消费；
此能力尚未发布新 npm 版本。

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

## 公开入口

| 入口 | 内容 |
| --- | --- |
| `matthew-ui` | 组件、ThemeProvider、Token API 及 TypeScript 类型 |
| `matthew-ui/button` | Button/LinkButton 及对应类型 |
| `matthew-ui/menu` | Menu 及对应类型 |
| `matthew-ui/auto-complete` | AutoComplete 及对应类型 |
| `matthew-ui/theme` | ThemeProvider、主题预设、Token API 及对应类型 |
| `matthew-ui/tokens.css` | 默认亮色 `:root` Token |
| `matthew-ui/button/style.css` | Button/LinkButton 样式 |
| `matthew-ui/menu/style.css` | Menu 样式 |
| `matthew-ui/auto-complete/style.css` | AutoComplete 样式 |
| `matthew-ui/styles.css` | Token 与全部组件样式 |

组件内部文件不属于公开入口，请不要通过 `matthew-ui/dist/*` 或源码路径导入。

## 质量验证

- 227 个单元与浏览器测试用例，覆盖 Token、主题作用域、组件配置与实际样式、DOM 语义、受控状态、键盘与指针交互、IME 输入及异步竞态。
- 33 个 Story 场景，用于验证公开示例、亮暗主题、组件定制、交互行为和可访问性规则。
- 34 个发布验证器回归用例，覆盖多层依赖、完整发布树孤儿文件和默认/定制浏览器样式异常。
- 真实 `npm pack` tarball 会分别安装到 React 18.2 与 React 19 临时消费端，验证 ESM、CommonJS、类型、CSS、DOM ref、公开入口边界和 Vite Tree Shaking。
- Chromium 验证无 Provider 的默认 Token 回退，以及按需/全量 CSS 的 Button/LinkButton 定制尺寸、颜色、真实 hover/active 与作用域隔离。
- Menu还经过真实挂载，验证两种CSS模式的默认/定制尺寸、选中悬停、父标题和浮层；不以SSR静态标记代替子菜单注册与展开。
- AutoComplete同样从真实安装包挂载，验证两种CSS模式的默认/定制输入、异步加载、候选高亮与回填、禁用/只读及暗色浮层；不以变量输出代替最终样式。

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
