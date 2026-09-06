import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { TaskList, ThemeProvider, darkTheme, lightTheme } from '../../index'
import type { MatthewThemeConfig, TaskListItem } from '../../index'
import '../../styles/_tokens.scss'
import './TaskList.scss'

let rootSize: string
beforeEach(() => {
  rootSize = document.documentElement.style.fontSize
  document.documentElement.style.fontSize = '16px'
})
afterEach(() => {
  document.documentElement.style.fontSize = rootSize
})

const harness = (children: ReactNode) => (
  <div style={{ width: 640, fontSize: 20, fontFamily: 'monospace' }}>{children}</div>
)
const sampleItems: TaskListItem[] = [
  { id: 'a', title: '任务一', status: 'completed' as const, summary: '31 个测试' },
  { id: 'b', title: '任务二', status: 'running' as const },
  { id: 'c', title: '任务三', status: 'pending' as const },
  { id: 'd', title: '任务四', status: 'error' as const },
  { id: 'e', title: '任务五', status: 'stopped' as const },
]
const getRoot = (screen: { container: HTMLElement }) =>
  screen.container.querySelector<HTMLElement>('.matthew-task-list')!
const styleOf = (element: Element, pseudoElement?: string) =>
  getComputedStyle(element, pseudoElement)

describe('TaskList visual contract', () => {
  test('uses a compact bordered panel without shadow or full width', async () => {
    const screen = await render(harness(
      <TaskList title="实施计划" items={sampleItems} />,
    ))
    const root = getRoot(screen)
    const rootStyle = styleOf(root)

    expect(rootStyle.boxShadow).toBe('none')
    expect(rootStyle.borderTopWidth).toBe('1px')
    expect(rootStyle.borderTopColor).toBe('rgb(203, 213, 225)')
    expect(rootStyle.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(rootStyle.borderRadius).toBe('8px')
    // 稳定宽度：宽容器中固定为 480px，不铺满也不随内容变化（TL-V01）。
    expect(rootStyle.width).toBe('480px')
    expect(root.getBoundingClientRect().width).toBe(480)
    expect(root.getBoundingClientRect().width).toBeLessThan(640)

    const header = screen.getByRole('button', { name: /实施计划/ }).element()
    const headerStyle = styleOf(header)
    expect(headerStyle.minHeight).toBe('40px')
    expect(headerStyle.fontSize).toBe('14px')
    expect(headerStyle.fontWeight).toBe('500')
    expect(headerStyle.color).toBe('rgb(15, 23, 42)')

    const progress = root.querySelector('.matthew-task-list__progress')!
    const progressStyle = styleOf(progress)
    expect(progressStyle.fontSize).toBe('12px')
    expect(progressStyle.color).toBe('rgb(100, 116, 139)')
    expect(progressStyle.fontVariantNumeric).toContain('tabular-nums')
  })

  test('styles task rows lighter than the header with weak completed titles', async () => {
    const screen = await render(harness(
      <TaskList title="实施计划" items={sampleItems} />,
    ))
    const root = getRoot(screen)
    const rows = root.querySelectorAll('.matthew-task-list__item')

    // 行最小高度 34px 低于标题栏 40px；行是只读 li。
    for (const row of rows) {
      expect(styleOf(row).minHeight).toBe('34px')
      expect(styleOf(row).cursor).toBe('auto')
      expect(styleOf(row).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    }

    const completedTitle = rows[0].querySelector('.matthew-task-list__item-title')!
    expect(styleOf(completedTitle).fontSize).toBe('13px')
    expect(styleOf(completedTitle).fontWeight).toBe('400')
    expect(styleOf(completedTitle).color).toBe('rgb(100, 116, 139)')
    // completed 不使用删除线或整行 opacity。
    expect(styleOf(completedTitle).textDecorationLine).not.toContain('line-through')
    expect(styleOf(rows[0]).opacity).toBe('1')

    const runningTitle = rows[1].querySelector('.matthew-task-list__item-title')!
    expect(styleOf(runningTitle).fontWeight).toBe('500')
    expect(styleOf(runningTitle).color).toBe('rgb(15, 23, 42)')

    const summary = root.querySelector('.matthew-task-list__summary')!
    expect(styleOf(summary).fontSize).toBe('12px')
    expect(styleOf(summary).color).toBe('rgb(100, 116, 139)')
  })

  test('renders five distinct status shapes with contract default colors', async () => {
    const screen = await render(harness(
      <TaskList title="实施计划" items={sampleItems} />,
    ))
    const root = getRoot(screen)
    const rows = root.querySelectorAll('.matthew-task-list__item')

    expect(rows[0].querySelector('.matthew-task-list__check')).not.toBeNull()
    expect(rows[1].querySelector('.matthew-task-list__ring')).not.toBeNull()
    expect(rows[2].querySelector('.matthew-task-list__hollow')).not.toBeNull()
    expect(rows[3].querySelector('.matthew-task-list__bang')).not.toBeNull()
    expect(rows[4].querySelector('.matthew-task-list__square')).not.toBeNull()

    expect(styleOf(rows[0].querySelector('.matthew-task-list__check')!).color)
      .toBe('rgb(30, 64, 175)')
    const ring = rows[1].querySelector('.matthew-task-list__ring')!
    expect(styleOf(ring).borderTopColor).toBe('rgb(37, 99, 235)')
    expect(styleOf(ring).borderBottomColor).toBe('rgba(0, 0, 0, 0)')
    expect(styleOf(rows[2].querySelector('.matthew-task-list__hollow')!).borderTopColor)
      .toBe('rgb(100, 116, 139)')
    expect(styleOf(rows[3].querySelector('.matthew-task-list__bang')!).color)
      .toBe('rgb(220, 38, 38)')
    expect(styleOf(rows[4].querySelector('.matthew-task-list__square')!).backgroundColor)
      .toBe('rgb(100, 116, 139)')
  })

  test('draws connection lines only between adjacent indicators', async () => {
    const screen = await render(harness(
      <>
        <TaskList title="多条" items={sampleItems} />
        <TaskList title="单条" items={[{ id: 'only', title: '唯一任务', status: 'pending' }]} />
        <TaskList title="空" items={[]} />
      </>,
    ))
    const containers = screen.container.querySelectorAll('.matthew-task-list')
    const first = containers[0].querySelectorAll('.matthew-task-list__item')

    // 相邻条目之间有线段：前段的下半部分与后段的上半部分。
    for (let index = 0; index < first.length; index += 1) {
      const row = first[index]
      const before = styleOf(row, '::before')
      const after = styleOf(row, '::after')
      if (index === 0) {
        expect(before.content).not.toBe('""')
      } else {
        expect(before.content).toBe('""')
        expect(before.backgroundColor).toBe('rgb(203, 213, 225)')
      }
      if (index === first.length - 1) {
        expect(after.content).not.toBe('""')
      } else {
        expect(after.content).toBe('""')
      }
    }

    // 单条与空列表不绘制连接线。
    const single = containers[1].querySelectorAll('.matthew-task-list__item')
    expect(styleOf(single[0], '::before').content).not.toBe('""')
    expect(styleOf(single[0], '::after').content).not.toBe('""')
    expect(containers[2].querySelectorAll('.matthew-task-list__item')).toHaveLength(0)
  })

  test('hides the dangling separator for an expanded empty list', async () => {
    const screen = await render(harness(
      <>
        <TaskList title="空计划" items={[]} />
        <TaskList title="有任务" items={[{ id: 'a', title: '任务一', status: 'pending' }]} />
      </>,
    ))
    const lists = screen.container.querySelectorAll('.matthew-task-list__list')
    expect(styleOf(lists[0]).borderTopWidth).toBe('0px')
    expect(styleOf(lists[1]).borderTopWidth).toBe('1px')
  })

  test('applies components.TaskList overrides for colors, radius and heights', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={{ components: { TaskList: {
        background: 'rgb(250 250 250)', borderColor: 'rgb(0 0 255)', titleColor: 'rgb(20 20 20)',
        progressColor: 'rgb(90 90 90)', itemColor: 'rgb(0 128 0)', summaryColor: 'rgb(128 128 128)',
        headerHoverBackground: 'rgb(255 255 0)', pendingColor: 'rgb(0 0 0)',
        runningColor: 'rgb(255 0 255)', completedColor: 'rgb(0 255 255)',
        errorColor: 'rgb(255 0 0)', stoppedColor: 'rgb(128 128 128)',
        borderRadius: 0, headerMinHeight: 48, itemMinHeight: 40,
      } } }}>
        <TaskList title="定制面板" items={sampleItems} />
      </ThemeProvider>,
    ))
    const root = getRoot(screen)
    const header = screen.getByRole('button', { name: /定制面板/ }).element()

    expect(styleOf(root).backgroundColor).toBe('rgb(250, 250, 250)')
    expect(styleOf(root).borderTopColor).toBe('rgb(0, 0, 255)')
    expect(styleOf(root).borderRadius).toBe('0px')
    expect(styleOf(header).minHeight).toBe('48px')
    expect(styleOf(header).color).toBe('rgb(20, 20, 20)')
    expect(styleOf(root.querySelector('.matthew-task-list__progress')!).color).toBe('rgb(90, 90, 90)')

    const rows = root.querySelectorAll('.matthew-task-list__item')
    for (const row of rows) {
      expect(styleOf(row).minHeight).toBe('40px')
    }
    expect(styleOf(rows[0].querySelector('.matthew-task-list__check')!).color).toBe('rgb(0, 255, 255)')
    expect(styleOf(rows[1].querySelector('.matthew-task-list__ring')!).borderTopColor).toBe('rgb(255, 0, 255)')
    expect(styleOf(rows[0].querySelector('.matthew-task-list__item-title')!).color).toBe('rgb(128, 128, 128)')
    expect(styleOf(rows[2].querySelector('.matthew-task-list__hollow')!).borderTopColor).toBe('rgb(0, 0, 0)')
  })

  test('follows dark preset defaults and restores after nested overrides are removed', async () => {
    const view = (parent: MatthewThemeConfig, child: MatthewThemeConfig) => harness(
      <ThemeProvider theme={parent}>
        <ThemeProvider theme={child}>
          <TaskList title="动态" items={sampleItems} />
        </ThemeProvider>
      </ThemeProvider>,
    )
    const parent: MatthewThemeConfig = { ...darkTheme, components: { TaskList: { runningColor: 'rgb(255 0 0)' } } }
    const screen = await render(view(parent, { components: { TaskList: { background: 'rgb(0 255 0)' } } }))
    const root = getRoot(screen)
    const ring = root.querySelector('.matthew-task-list__ring')!

    // 暗色默认回退 + 父级覆盖同时生效。
    expect(styleOf(root).backgroundColor).toBe('rgb(0, 255, 0)')
    expect(styleOf(ring).borderTopColor).toBe('rgb(255, 0, 0)')
    expect(styleOf(root.querySelector('.matthew-task-list__progress')!).color).toBe('rgb(148, 163, 184)')

    await screen.rerender(view(parent, {}))
    expect(styleOf(root).backgroundColor).toBe('rgb(30, 41, 59)')

    await screen.rerender(view(lightTheme, {}))
    expect(styleOf(ring).borderTopColor).toBe('rgb(37, 99, 235)')
  })

  test('animates only the running ring and ships a reduced-motion stylesheet rule', async () => {
    const screen = await render(harness(
      <TaskList title="计划" items={sampleItems} />,
    ))
    const ring = getRoot(screen).querySelector('.matthew-task-list__ring')!
    const ringStyle = styleOf(ring)
    expect(ringStyle.animationName).toContain('matthew-task-list-ring-spin')
    expect(ringStyle.animationIterationCount).toBe('infinite')

    const hasReducedMotionRule = Array.from(document.styleSheets).some((sheet) => {
      try {
        return Array.from(sheet.cssRules).some((rule) =>
          rule instanceof CSSMediaRule &&
          rule.conditionText.includes('prefers-reduced-motion: reduce') &&
          rule.cssText.includes('matthew-task-list'))
      } catch {
        return false
      }
    })
    expect(hasReducedMotionRule).toBe(true)
  })

  test('keeps the panel width stable across content updates', async () => {
    const view = (items: typeof sampleItems, title: string) => (
      <TaskList title={title} items={items} />
    )
    const screen = await render(harness(view(sampleItems, '实施计划')))
    const root = getRoot(screen)
    const widthBefore = root.getBoundingClientRect().width
    expect(widthBefore).toBe(480)

    // 长标题、长摘要和更多任务不改变面板宽度。
    const longItems: TaskListItem[] = [
      ...sampleItems,
      {
        id: 'extra',
        title: '一个故意写得非常长的任务条目标题用来验证宽度稳定性',
        status: 'pending' as const,
        summary: '一段同样非常长的行内摘要文本用来验证宽度稳定性表现',
      },
    ]
    await screen.rerender(harness(view(longItems, '一个故意写得非常长的任务标题用来验证宽度稳定性表现')))
    expect(root.getBoundingClientRect().width).toBe(widthBefore)
    expect(getRoot(screen)).toBe(root)
  })

  test('visually hides summaries in a narrow container even in a wide viewport', async () => {
    // 容器查询基于组件可用宽度：宽视口中的 320px 窄容器同样生效（TL-V08）。
    const screen = await render(
      <div style={{ width: 300 }}>
        <TaskList title="窄容器" items={sampleItems} />
      </div>,
    )
    const root = getRoot(screen)
    expect(root.getBoundingClientRect().width).toBe(300)

    const summary = root.querySelector('.matthew-task-list__summary')!
    const summaryStyle = styleOf(summary)
    expect(summaryStyle.position).toBe('absolute')
    expect(summaryStyle.clipPath).toBe('inset(50%)')
    expect(summaryStyle.width).toBe('1px')
    // 辅助技术内容保留：文本仍在 DOM 中。
    expect(summary.textContent).toBe('31 个测试')

    // 宽容器中摘要正常显示。
    const wide = await render(harness(<TaskList title="宽容器" items={sampleItems} />))
    const wideSummary = getRoot(wide).querySelector('.matthew-task-list__summary')!
    expect(styleOf(wideSummary).position).toBe('static')
    expect(styleOf(wideSummary).clipPath).toBe('none')
  })

  test('uses instance-level variables on the root style', async () => {
    const screen = await render(harness(
      <TaskList
        title="实例级"
        items={sampleItems}
        style={{ '--matthew-ui-task-list-error-color': 'rgb(0 255 255)' } as CSSProperties}
      />,
    ))
    const bang = getRoot(screen).querySelector('.matthew-task-list__bang')!
    expect(styleOf(bang).color).toBe('rgb(0, 255, 255)')
  })
})
