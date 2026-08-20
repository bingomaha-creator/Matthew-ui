# matthew-ui

一个用于系统学习现代 React 组件库设计的项目。

## 当前工具链

- React 19
- TypeScript 6
- Vite 7 library mode
- Vitest 4 browser mode + Playwright
- Storybook 10（docs、component test、a11y）
- Sass
- Oxlint

React 和 React DOM 同时作为开发依赖与 peer dependencies：项目本身需要它们来开发和测试，但发布后的库不会把自己的 React 副本打进产物。

Vite 暂时固定在 7.3.6。Vite 8 的 Rolldown 依赖优化器目前会破坏 Storybook + Vitest browser mode 使用的 CommonJS 互操作，问题记录见 [vitejs/vite#23030](https://github.com/vitejs/vite/issues/23030)。

## 使用 Button

组件逻辑和样式分别导入：

```tsx
import { Button, LinkButton } from 'matthew-ui'
import 'matthew-ui/styles.css'

export function Actions() {
  return (
    <>
      <Button variant="primary" size="lg">
        保存
      </Button>
      <LinkButton href="/docs" variant="secondary">
        查看文档
      </LinkButton>
    </>
  )
}
```

`variant` 支持 `primary | secondary | danger`，`size` 支持 `sm | md | lg`。

`LinkButton` 始终保持链接语义，不允许通过 `role` 将其改成按钮或其他角色。禁用时仍需传入 `href` 作为组件的导航目标，但最终 DOM 会移除 `href`，设置 `aria-disabled="true"` 和 `tabIndex={-1}`，并阻止用户传入的 `onClick`。重新启用后，`href` 会恢复。

## 常用命令

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run test:run
npm run test:stories
npm run build
npm run build-storybook
```

`npm run test` 进入单元测试监听模式；`npm run test:run` 单次运行。单元测试与 Storybook 测试都使用真实 Chromium，而不是 JSDOM。

## TDD 约定

测试只经过公开 interface，观察最终 DOM、用户交互和关键视觉类，不直接调用私有函数或内部类名生成工具：

```text
失败测试（Red）
        ↓
最小实现（Green）
        ↓
下一条公开行为
```

## 目录约定

```text
src/
  index.ts
  styles/
    _tokens.scss
    _mixins.scss
    index.scss
  components/
    Button/
      Button.tsx
      LinkButton.tsx
      Button.scss
      *.test.tsx
      *.type-test.tsx
      *.stories.tsx

.storybook/
vite.config.ts
vitest.config.ts
tsconfig.build.json
```

项目暂时保持 `private: true`，防止学习过程中误发布；准备发布时再显式移除。
