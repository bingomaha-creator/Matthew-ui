import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import {
  Thinking,
  ToolCall,
  ThemeProvider,
  darkTheme,
  lightTheme,
} from '../../index'
import type { MatthewThemeConfig, ToolCallStatus } from '../../index'
import '../../styles/_tokens.scss'
import '../Thinking/Thinking.scss'
import './ToolCall.scss'

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
const getRoot = (screen: { container: HTMLElement }) =>
  screen.container.querySelector<HTMLElement>('.matthew-tool-call')!
const styleOf = (element: Element) => getComputedStyle(element)

describe('ToolCall visual contract', () => {
  test('uses global token defaults and keeps the root lighter than Thinking', async () => {
    const screen = await render(harness(
      <>
        <Thinking title="正在分析项目">过程内容</Thinking>
        <ToolCall name="读取项目文件" status="running" summary="正在执行…">
          详情
        </ToolCall>
      </>,
    ))
    const root = getRoot(screen)
    const header = screen.getByRole('button', { name: /读取项目文件/ }).element()
    const headerStyle = styleOf(header)

    // 根透明，无完整卡片观感（TC-V01）。
    expect(styleOf(root).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(styleOf(root).boxShadow).toBe('none')
    // 比 Thinking 更小：32px vs 40px（TC-V07）。
    expect(headerStyle.minHeight).toBe('32px')
    expect(styleOf(screen.container.querySelector('.matthew-thinking__header')!).minHeight).toBe('40px')
    expect(headerStyle.borderRadius).toBe('8px')

    const name = root.querySelector('.matthew-tool-call__name')!
    expect(styleOf(name).fontSize).toBe('13px')
    expect(styleOf(name).fontWeight).toBe('500')
    expect(styleOf(name).color).toBe('rgb(15, 23, 42)')
    const summary = root.querySelector('.matthew-tool-call__summary')!
    expect(styleOf(summary).fontSize).toBe('12px')
    expect(styleOf(summary).color).toBe('rgb(100, 116, 139)')

    const detail = document.getElementById(header.getAttribute('aria-controls')!)
    const detailStyle = styleOf(detail!)
    expect(detailStyle.fontSize).toBe('13px')
    expect(detailStyle.color).toBe('rgb(100, 116, 139)')
    expect(detailStyle.borderLeftWidth).toBe('1px')
    expect(detailStyle.borderLeftColor).toBe('rgb(203, 213, 225)')
    expect(detailStyle.maxHeight).toBe('none')
  })

  test('renders five distinct status shapes with contract default colors', async () => {
    const statuses: ToolCallStatus[] = ['pending', 'running', 'completed', 'error', 'stopped']
    const screen = await render(harness(
      <>
        {statuses.map((status) => (
          <ToolCall key={status} name={`工具-${status}`} status={status} data-testid={status} defaultOpen>
            详情
          </ToolCall>
        ))}
      </>,
    ))

    const statusShape = (testId: string) =>
      screen.getByTestId(testId).element().querySelector('.matthew-tool-call__status')!
    const pending = statusShape('pending')
    const running = statusShape('running')
    const completed = statusShape('completed')
    const error = statusShape('error')
    const stopped = statusShape('stopped')

    // 图形互不相同：空心圆、缺口圆环、对勾、感叹号、方块（TC-V02）。
    expect(pending.querySelector('.matthew-tool-call__hollow')).not.toBeNull()
    expect(running.querySelector('.matthew-tool-call__ring')).not.toBeNull()
    expect(completed.querySelector('.matthew-tool-call__check')).not.toBeNull()
    expect(error.querySelector('.matthew-tool-call__bang')).not.toBeNull()
    expect(stopped.querySelector('.matthew-tool-call__square')).not.toBeNull()

    expect(styleOf(pending.querySelector('.matthew-tool-call__hollow')!).borderTopColor)
      .toBe('rgb(100, 116, 139)')
    expect(styleOf(running.querySelector('.matthew-tool-call__ring')!).borderTopColor)
      .toBe('rgb(37, 99, 235)')
    expect(styleOf(completed.querySelector('.matthew-tool-call__check')!).color)
      .toBe('rgb(30, 64, 175)')
    expect(styleOf(error.querySelector('.matthew-tool-call__bang')!).color)
      .toBe('rgb(220, 38, 38)')
    expect(styleOf(stopped.querySelector('.matthew-tool-call__square')!).backgroundColor)
      .toBe('rgb(100, 116, 139)')
  })

  test('applies components.ToolCall overrides for colors, radius and min height', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={{ components: { ToolCall: {
        nameColor: 'rgb(20 20 20)', summaryColor: 'rgb(90 90 90)', detailColor: 'rgb(0 128 0)',
        borderColor: 'rgb(0 0 255)', headerHoverBackground: 'rgb(255 255 0)',
        pendingColor: 'rgb(0 0 0)', runningColor: 'rgb(255 0 255)',
        completedColor: 'rgb(0 255 255)', errorColor: 'rgb(255 0 0)',
        stoppedColor: 'rgb(128 128 128)', borderRadius: 0, headerMinHeight: 40,
      } } }}>
        <ToolCall name="定制工具" status="error" summary="定制摘要" defaultOpen>定制详情</ToolCall>
      </ThemeProvider>,
    ))
    const root = getRoot(screen)
    const header = screen.getByRole('button', { name: /定制工具/ }).element()
    const headerStyle = styleOf(header)

    expect(headerStyle.color).toBe('rgb(20, 20, 20)')
    expect(headerStyle.borderRadius).toBe('0px')
    expect(headerStyle.minHeight).toBe('40px')
    expect(styleOf(root.querySelector('.matthew-tool-call__summary')!).color).toBe('rgb(90, 90, 90)')

    const detail = document.getElementById(header.getAttribute('aria-controls')!)
    expect(styleOf(detail!).color).toBe('rgb(0, 128, 0)')
    expect(styleOf(detail!).borderLeftColor).toBe('rgb(0, 0, 255)')
    expect(styleOf(root.querySelector('.matthew-tool-call__bang')!).color).toBe('rgb(255, 0, 0)')
  })

  test('follows dark preset defaults and restores after nested overrides are removed', async () => {
    const view = (parent: MatthewThemeConfig, child: MatthewThemeConfig) => harness(
      <ThemeProvider theme={parent}>
        <ThemeProvider theme={child}>
          <ToolCall name="运行中" status="running" data-testid="running">详情</ToolCall>
          <ToolCall name="已中止" status="stopped" data-testid="stopped">详情</ToolCall>
        </ThemeProvider>
      </ThemeProvider>,
    )
    const parent: MatthewThemeConfig = { ...darkTheme, components: { ToolCall: { runningColor: 'rgb(255 0 0)' } } }
    const screen = await render(view(parent, { components: { ToolCall: { stoppedColor: 'rgb(0 255 0)' } } }))
    const ring = screen.getByTestId('running').element().querySelector('.matthew-tool-call__ring')!
    const square = () =>
      screen.getByTestId('stopped').element().querySelector('.matthew-tool-call__square')!

    // 暗色默认回退 + 父级覆盖同时生效。
    expect(styleOf(screen.getByRole('button').elements()[0]).color).toBe('rgb(248, 250, 252)')
    expect(styleOf(ring).borderTopColor).toBe('rgb(255, 0, 0)')
    expect(styleOf(square()).backgroundColor).toBe('rgb(0, 255, 0)')

    await screen.rerender(view(parent, {}))
    expect(styleOf(square()).backgroundColor).toBe('rgb(148, 163, 184)')

    await screen.rerender(view(lightTheme, {}))
    expect(styleOf(ring).borderTopColor).toBe('rgb(37, 99, 235)')
    expect(styleOf(screen.getByRole('button').elements()[0]).color).toBe('rgb(15, 23, 42)')
  })

  test('animates only the running ring and ships a reduced-motion stylesheet rule', async () => {
    const statuses: ToolCallStatus[] = ['pending', 'running', 'completed']
    const screen = await render(harness(
      <>
        {statuses.map((status) => (
          <ToolCall key={status} name={`工具-${status}`} status={status} defaultOpen>详情</ToolCall>
        ))}
      </>,
    ))

    const ring = screen.container.querySelector('.matthew-tool-call__ring')!
    const ringStyle = styleOf(ring)
    expect(ringStyle.animationName).toContain('matthew-tool-call-ring-spin')
    expect(ringStyle.animationIterationCount).toBe('infinite')
    // 缺口：圆环有一侧透明（TC-V02）。
    expect(ringStyle.borderBottomColor).toBe('rgba(0, 0, 0, 0)')

    const hasToolCallReducedMotionRule = Array.from(document.styleSheets).some((sheet) => {
      try {
        return Array.from(sheet.cssRules).some((rule) =>
          rule instanceof CSSMediaRule &&
          rule.conditionText.includes('prefers-reduced-motion: reduce') &&
          rule.cssText.includes('matthew-tool-call'))
      } catch {
        return false
      }
    })
    expect(hasToolCallReducedMotionRule).toBe(true)
  })

  test('keeps the status row non-interactive and honors instance-level variables', async () => {
    const screen = await render(harness(
      <>
        <ToolCall name="只读行" status="completed" />
        <ToolCall
          name="实例级"
          status="error"
          style={{ '--matthew-ui-tool-call-error-color': 'rgb(0 255 255)' } as CSSProperties}
          defaultOpen
        >
          详情
        </ToolCall>
      </>,
    ))

    // 无详情行没有手型光标等虚假交互提示（TC-V01）。
    const row = screen.container.querySelector('.matthew-tool-call__header')!
    expect(styleOf(row).cursor).toBe('auto')
    expect(styleOf(row).backgroundColor).toBe('rgba(0, 0, 0, 0)')

    const bang = screen.container.querySelector('.matthew-tool-call__bang')!
    expect(styleOf(bang).color).toBe('rgb(0, 255, 255)')
  })
})
