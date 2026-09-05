import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Thinking, ThemeProvider, darkTheme, lightTheme } from '../../index'
import type { MatthewThemeConfig } from '../../index'
import '../../styles/_tokens.scss'
import './Thinking.scss'

let rootSize: string
beforeEach(() => {
  rootSize = document.documentElement.style.fontSize
  document.documentElement.style.fontSize = '16px'
})
afterEach(() => {
  document.documentElement.style.fontSize = rootSize
})

const harness = (children: ReactNode) => (
  <div style={{ width: 320, fontSize: 20, fontFamily: 'monospace' }}>{children}</div>
)
const sample = () => <Thinking title="正在分析项目">读取项目结构</Thinking>
const getRoot = (screen: { container: HTMLElement }) =>
  screen.container.querySelector<HTMLElement>('.matthew-thinking')!
const styleOf = (element: Element) => getComputedStyle(element)

describe('Thinking visual contract', () => {
  test('uses global token defaults without Provider and keeps the root transparent', async () => {
    const screen = await render(harness(sample()))
    const root = getRoot(screen)
    const header = screen.getByRole('button').element()
    const headerStyle = styleOf(header)

    // 根节点透明，无外层边框和阴影。
    expect(styleOf(root).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(styleOf(root).boxShadow).toBe('none')
    expect(headerStyle.minHeight).toBe('40px')
    expect(headerStyle.fontSize).toBe('14px')
    expect(headerStyle.fontWeight).toBe('500')
    expect(headerStyle.borderRadius).toBe('8px')
    expect(headerStyle.color).toBe('rgb(15, 23, 42)')
    expect(headerStyle.paddingBlock).toBe('8px')
    expect(headerStyle.paddingInline).toBe('12px')

    const content = document.getElementById(header.getAttribute('aria-controls')!)
    const contentStyle = styleOf(content!)
    expect(contentStyle.fontSize).toBe('13px')
    expect(contentStyle.color).toBe('rgb(100, 116, 139)')
    expect(contentStyle.borderLeftWidth).toBe('1px')
    expect(contentStyle.borderLeftColor).toBe('rgb(203, 213, 225)')
    expect(contentStyle.maxHeight).toBe('none')

    const dot = root.querySelector('.matthew-thinking__dots span')!
    expect(styleOf(dot).backgroundColor).toBe('rgb(37, 99, 235)')
  })

  test('renders four distinct status shapes with contract default colors', async () => {
    const screen = await render(harness(
      <>
        <Thinking title="运行中" status="running" defaultOpen data-testid="running">内容</Thinking>
        <Thinking title="已完成" status="completed" defaultOpen data-testid="completed">内容</Thinking>
        <Thinking title="已中止" status="stopped" defaultOpen data-testid="stopped">内容</Thinking>
        <Thinking title="失败" status="error" defaultOpen data-testid="error">内容</Thinking>
      </>,
    ))

    const statusShape = (testId: string) =>
      screen.getByTestId(testId).element().querySelector('.matthew-thinking__status')!
    const running = statusShape('running')
    const completed = statusShape('completed')
    const stopped = statusShape('stopped')
    const error = statusShape('error')

    // 四种状态图形不同：圆点组、对勾、方块、感叹号。
    expect(running.querySelectorAll('.matthew-thinking__dots span')).toHaveLength(3)
    expect(completed.querySelector('.matthew-thinking__check')).not.toBeNull()
    expect(stopped.querySelector('.matthew-thinking__square')).not.toBeNull()
    expect(error.querySelector('.matthew-thinking__bang')).not.toBeNull()

    expect(styleOf(running.querySelector('.matthew-thinking__dots span')!).backgroundColor)
      .toBe('rgb(37, 99, 235)')
    expect(styleOf(completed.querySelector('.matthew-thinking__check')!).color)
      .toBe('rgb(30, 64, 175)')
    expect(styleOf(stopped.querySelector('.matthew-thinking__square')!).backgroundColor)
      .toBe('rgb(100, 116, 139)')
    expect(styleOf(error.querySelector('.matthew-thinking__bang')!).color)
      .toBe('rgb(220, 38, 38)')
  })

  test('applies components.Thinking overrides for colors, radius and min height', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={{ components: { Thinking: {
        titleColor: 'rgb(20 20 20)', contentColor: 'rgb(0 128 0)', borderColor: 'rgb(0 0 255)',
        headerHoverBackground: 'rgb(255 255 0)', runningColor: 'rgb(255 0 255)',
        completedColor: 'rgb(0 255 255)', stoppedColor: 'rgb(128 128 128)',
        errorColor: 'rgb(255 0 0)', borderRadius: 0, headerMinHeight: 48,
      } } }}>
        <Thinking title="定制" status="error" defaultOpen>内容</Thinking>
      </ThemeProvider>,
    ))
    const root = getRoot(screen)
    const header = screen.getByRole('button').element()
    const headerStyle = styleOf(header)

    expect(headerStyle.color).toBe('rgb(20, 20, 20)')
    expect(headerStyle.borderRadius).toBe('0px')
    expect(headerStyle.minHeight).toBe('48px')

    const content = document.getElementById(header.getAttribute('aria-controls')!)
    expect(styleOf(content!).color).toBe('rgb(0, 128, 0)')
    expect(styleOf(content!).borderLeftColor).toBe('rgb(0, 0, 255)')

    expect(styleOf(root.querySelector('.matthew-thinking__bang')!).color).toBe('rgb(255, 0, 0)')
  })

  test('follows dark preset defaults and restores after nested overrides are removed', async () => {
    const view = (parent: MatthewThemeConfig, child: MatthewThemeConfig) => harness(
      <ThemeProvider theme={parent}>
        <ThemeProvider theme={child}>
          <Thinking title="运行中" data-testid="running">内容</Thinking>
          <Thinking title="已中止" status="stopped" data-testid="stopped">内容</Thinking>
        </ThemeProvider>
      </ThemeProvider>,
    )
    const parent: MatthewThemeConfig = { ...darkTheme, components: { Thinking: { runningColor: 'rgb(255 0 0)' } } }
    const screen = await render(view(parent, { components: { Thinking: { stoppedColor: 'rgb(0 255 0)' } } }))
    const dot = screen.getByTestId('running').element().querySelector('.matthew-thinking__dots span')!
    const square = () =>
      screen.getByTestId('stopped').element().querySelector('.matthew-thinking__square')!

    // 暗色默认回退 + 父级覆盖同时生效。
    expect(styleOf(screen.getByRole('button').elements()[0]).color).toBe('rgb(248, 250, 252)')
    expect(styleOf(dot).backgroundColor).toBe('rgb(255, 0, 0)')
    expect(styleOf(square()).backgroundColor).toBe('rgb(0, 255, 0)')

    await screen.rerender(view(parent, {}))
    expect(styleOf(square()).backgroundColor).toBe('rgb(148, 163, 184)')

    await screen.rerender(view(lightTheme, {}))
    expect(styleOf(dot).backgroundColor).toBe('rgb(37, 99, 235)')
    expect(styleOf(screen.getByRole('button').elements()[0]).color).toBe('rgb(15, 23, 42)')
  })

  test('animates running dots and ships a reduced-motion stylesheet rule', async () => {
    const screen = await render(harness(<Thinking title="分析中">内容</Thinking>))
    const dot = getRoot(screen).querySelector('.matthew-thinking__dots span')!

    expect(styleOf(dot).animationName).toContain('matthew-thinking-dot-bounce')
    expect(styleOf(dot).animationIterationCount).toBe('infinite')

    const hasThinkingReducedMotionRule = Array.from(document.styleSheets).some((sheet) => {
      try {
        return Array.from(sheet.cssRules).some((rule) =>
          rule instanceof CSSMediaRule &&
          rule.conditionText.includes('prefers-reduced-motion: reduce') &&
          rule.cssText.includes('matthew-thinking'))
      } catch {
        return false
      }
    })
    expect(hasThinkingReducedMotionRule).toBe(true)
  })

  test('uses component variables on the root style for a single instance', async () => {
    const screen = await render(harness(
      <Thinking
        title="实例级"
        status="completed"
        style={{ '--matthew-ui-thinking-completed-color': 'rgb(0 255 255)' } as CSSProperties}
      >
        内容
      </Thinking>,
    ))
    const check = getRoot(screen).querySelector('.matthew-thinking__check')!
    expect(styleOf(check).color).toBe('rgb(0, 255, 255)')
  })
})
