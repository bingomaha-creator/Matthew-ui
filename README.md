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
| `matthew-ui` | 组件及 TypeScript 类型 |
| `matthew-ui/styles.css` | 全部组件样式 |

组件内部文件不属于公开入口，请不要通过 `matthew-ui/dist/*` 或源码路径导入。

## 质量验证

- 104 个组件级浏览器测试用例，覆盖 DOM 语义、受控状态、键盘与指针交互、IME 输入及异步竞态。
- 17 个 Story 场景，用于验证公开示例、交互行为和可访问性规则。
- 真实 `npm pack` tarball 会分别安装到 React 18.2 与 React 19 临时消费端，验证 ESM、CommonJS、类型、CSS、DOM ref 和公开入口边界。

## 本地开发

```bash
npm run dev
npm run typecheck
npm run lint
npm run test:run
npm run test:stories
npm run build
npm run verify:package
```

`npm run verify:package` 会构建真实 npm tarball，并在临时 React 18.2 与 React 19 项目中验证安装、类型、入口和 DOM ref；它不会执行 `npm publish`。

## License

[MIT](./LICENSE)
