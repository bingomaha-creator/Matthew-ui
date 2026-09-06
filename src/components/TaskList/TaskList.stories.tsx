import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { TaskList, ThemeProvider, ToolCall, Thinking, darkTheme } from '../../index'
import type { TaskListItem } from '../../index'

const stackStyle = {
  display: 'grid',
  gap: '1rem',
  maxWidth: '30rem',
} as const

const statusLabels = {
  pending: '排队中',
  running: '执行中',
  completed: '已完成',
  error: '失败',
  stopped: '已中止',
} satisfies Record<TaskListItem['status'], string>

const sampleItems: TaskListItem[] = [
  { id: 'contract', title: '确认行为与视觉合同', status: 'completed' },
  { id: 'implement', title: '实现组件与主题 Token', status: 'completed', summary: '31 个测试' },
  { id: 'quality', title: '运行完整质量检查', status: 'running', summary: '正在执行…' },
  { id: 'verify', title: '复核真实发布包', status: 'pending' },
  { id: 'release', title: '提交并推送稳定检查点', status: 'stopped' },
]

const meta: Meta<typeof TaskList> = {
  title: 'Components/TaskList',
  component: TaskList,
  tags: ['autodocs', 'test'],
}

export default meta
type Story = StoryObj<typeof meta>

export const DefaultExpanded: Story = {
  render: () => <TaskList title="实施 ToolCall 组件" items={sampleItems} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole('button', { name: /实施 ToolCall 组件/ })

    // 默认展开；折叠后只保留标题、总体摘要和箭头。
    expect(header).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
    const list = document.getElementById(header.getAttribute('aria-controls')!)!
    expect(list).toHaveAttribute('hidden')
    expect(list.textContent).toContain('确认行为与视觉合同')

    // 总体摘要与折叠标题一起保留。
    expect(canvas.getByText('2 / 5')).toBeVisible()
  },
}

export const EmptyList: Story = {
  render: () => <TaskList title="空计划" items={[]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 空列表：标题存在，不显示 0 / 0，没有悬空分隔线。
    await expect(canvas.getByText('空计划')).toBeVisible()
    expect(canvasElement.textContent).not.toContain('0 / 0')
    expect(canvasElement.querySelector('.matthew-task-list__list')).not.toBeNull()
  },
}

export const StatusGallery: Story = {
  render: () => (
    <div style={stackStyle}>
      <TaskList
        title="五种状态"
        statusLabels={statusLabels}
        items={[
          { id: 'completed', title: '任务-完成', status: 'completed' },
          { id: 'running', title: '任务-执行', status: 'running' },
          { id: 'running2', title: '任务-并行执行', status: 'running' },
          { id: 'pending', title: '任务-排队', status: 'pending' },
          { id: 'error', title: '任务-失败', status: 'error' },
          { id: 'stopped', title: '任务-中止', status: 'stopped' },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('.matthew-task-list__item')

    // 五种状态图形互不相同；允许同时多个 running（TL-B04/TL-V04）。
    expect(rows[0].querySelector('.matthew-task-list__check')).not.toBeNull()
    expect(rows[1].querySelector('.matthew-task-list__ring')).not.toBeNull()
    expect(rows[2].querySelector('.matthew-task-list__ring')).not.toBeNull()
    expect(rows[3].querySelector('.matthew-task-list__hollow')).not.toBeNull()
    expect(rows[4].querySelector('.matthew-task-list__bang')).not.toBeNull()
    expect(rows[5].querySelector('.matthew-task-list__square')).not.toBeNull()
  },
}

function DynamicItemsDemo() {
  const [items, setItems] = useState<TaskListItem[]>(sampleItems)
  return (
    <div style={stackStyle}>
      <TaskList title="动态计划" items={items} statusLabels={statusLabels} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() =>
            setItems((current) =>
              current.map((item) =>
                item.status === 'running'
                  ? { ...item, status: 'completed' as const }
                  : item,
              ),
            )
          }
        >
          完成 running
        </button>
        <button
          type="button"
          onClick={() =>
            setItems((current) => [
              ...current,
              {
                id: `extra-${current.length}`,
                title: `新增任务 ${current.length}`,
                status: 'pending' as const,
              },
            ])
          }
        >
          新增任务
        </button>
        <button
          type="button"
          onClick={() =>
            setItems((current) => [...current].slice().reverse())
          }
        >
          重排
        </button>
        <button
          type="button"
          onClick={() => setItems((current) => current.slice(1))}
        >
          移除首个
        </button>
      </div>
    </div>
  )
}

export const DynamicItems: Story = {
  render: () => <DynamicItemsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole('button', { name: /动态计划/ })
    const root = canvasElement.querySelector('.matthew-task-list') as HTMLElement

    const progress = root.querySelector('.matthew-task-list__progress') as HTMLElement

    await userEvent.click(canvas.getByRole('button', { name: '完成 running' }))
    // 当前只有 quality 一项 running：2 → 3 completed。
    expect(progress.textContent).toContain('3 / 5')

    await userEvent.click(canvas.getByRole('button', { name: '重排' }))
    const statuses = Array.from(root.querySelectorAll('.matthew-task-list__item')).map(
      (item) => item.getAttribute('data-status'),
    )
    expect(statuses[0]).toBe('stopped')

    await userEvent.click(canvas.getByRole('button', { name: '移除首个' }))
    expect(progress.textContent).toContain('3 / 4')

    // 新增任务：总数与列表同步变化。
    await userEvent.click(canvas.getByRole('button', { name: '新增任务' }))
    expect(progress.textContent).toContain('3 / 5')
    expect(canvas.getByText('新增任务 4')).toBeVisible()
    expect(header).toHaveAttribute('aria-expanded', 'true')
  },
}

export const ComposedWithThinkingAndToolCall: Story = {
  render: () => (
    <div style={stackStyle}>
      <TaskList title="实施 ToolCall 组件" items={sampleItems} />
      <Thinking title="正在检查组件库结构" status="running" defaultOpen>
        <p>我先读取现有组件与主题实现</p>
      </Thinking>
      <ToolCall
        name="运行类型检查"
        status="running"
        summary="正在执行…"
        defaultOpen
      >
        <p>npx tsc --build</p>
      </ToolCall>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 任务级、阶段级与调用级三层同屏且互不嵌套（TL-V09）。
    const taskList = canvasElement.querySelector('.matthew-task-list')
    const thinking = canvasElement.querySelector('.matthew-thinking')
    const toolCall = canvasElement.querySelector('.matthew-tool-call')
    expect(taskList).not.toBeNull()
    expect(thinking).not.toBeNull()
    expect(toolCall).not.toBeNull()
    expect(taskList!.contains(thinking!)).toBe(false)
    expect(taskList!.contains(toolCall!)).toBe(false)
    expect(thinking!.contains(toolCall!)).toBe(false)
    expect(toolCall!.contains(thinking!)).toBe(false)
    const taskHeader = canvas.getByRole('button', { name: /实施 ToolCall 组件/ })
    expect(getComputedStyle(taskHeader).minHeight).toBe('40px')
  },
}

export const ThemeScopes: Story = {
  render: () => (
    <div style={stackStyle}>
      <TaskList title="亮色默认" items={sampleItems} />
      <div style={{ background: '#1e293b', padding: '0.25rem', borderRadius: 8 }}>
        <ThemeProvider theme={darkTheme}>
          <TaskList title="暗色默认" items={sampleItems} />
        </ThemeProvider>
      </div>
      <ThemeProvider
        theme={{
          components: {
            TaskList: {
              background: '#fff7ed',
              borderColor: '#ea580c',
              titleColor: '#7c2d12',
              progressColor: '#9a3412',
              itemColor: '#431407',
              summaryColor: '#9a3412',
              headerHoverBackground: '#ffedd5',
              pendingColor: '#a16207',
              runningColor: '#c2410c',
              completedColor: '#15803d',
              errorColor: '#b91c1c',
              stoppedColor: '#57534e',
              borderRadius: 0,
              headerMinHeight: 48,
              itemMinHeight: 40,
            },
          },
        }}
      >
        <TaskList title="精确覆盖" items={sampleItems} />
      </ThemeProvider>
    </div>
  ),
}

function DynamicThemeDemo() {
  const [enabled, setEnabled] = useState(true)
  const taskList = <TaskList title="动态主题" items={sampleItems} />
  return (
    <div style={stackStyle}>
      {/* 父层配置始终生效；子层配置可动态启用，撤销后恢复父层或默认回退。 */}
      <ThemeProvider theme={{ components: { TaskList: { runningColor: 'rgb(255 0 0)' } } }}>
        {enabled ? (
          <ThemeProvider
            theme={{
              components: {
                TaskList: {
                  background: 'rgb(0 255 0)',
                  progressColor: '#14532d',
                  summaryColor: '#14532d',
                  headerMinHeight: 48,
                },
              },
            }}
          >
            {taskList}
          </ThemeProvider>
        ) : (
          taskList
        )}
      </ThemeProvider>
      <button type="button" onClick={() => setEnabled((value) => !value)}>
        {enabled ? '撤销子层配置' : '启用子层配置'}
      </button>
    </div>
  )
}

export const DynamicThemeScopes: Story = {
  render: () => <DynamicThemeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // 子层启用/撤销会重建面板节点，每次断言前重新查询。
    const background = () =>
      getComputedStyle(
        canvasElement.querySelector('.matthew-task-list') as HTMLElement,
      ).backgroundColor
    const headerMinHeight = () =>
      getComputedStyle(
        canvas.getByRole('button', { name: /动态主题/ }),
      ).minHeight

    // 子层启用：覆盖生效。
    expect(background()).toBe('rgb(0, 255, 0)')
    expect(headerMinHeight()).toBe('48px')

    await userEvent.click(canvas.getByRole('button', { name: '撤销子层配置' }))

    // 撤销子层：恢复父层配置或默认回退。
    expect(background()).toBe('rgb(255, 255, 255)')
    expect(headerMinHeight()).toBe('40px')

    await userEvent.click(canvas.getByRole('button', { name: '启用子层配置' }))
    expect(background()).toBe('rgb(0, 255, 0)')
  },
}

export const CustomWidthOverride: Story = {
  render: () => (
    <div style={{ width: 720 }}>
      {/* 提高优先级并放在组件样式之后，模拟调用方外部 CSS 的正常级联。 */}
      <style>{'.matthew-task-list.wide-task-list { width: 720px; }'}</style>
      <TaskList
        title="默认宽度"
        items={sampleItems}
        data-testid="default-width"
      />
      <TaskList
        title="调用方放宽宽度"
        className="wide-task-list"
        items={sampleItems}
        data-testid="custom-width"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const defaultRoot = canvasElement.querySelector(
      '[data-testid="default-width"]',
    ) as HTMLElement
    const wideRoot = canvasElement.querySelector(
      '[data-testid="custom-width"]',
    ) as HTMLElement

    // 调用方 CSS 覆盖默认稳定宽度（TL-V01/TL-V07）：覆盖有效且仍受容器约束。
    expect(getComputedStyle(defaultRoot).width).toBe('480px')
    expect(getComputedStyle(wideRoot).width).toBe('720px')
  },
}

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '模拟 prefers-reduced-motion: reduce 的视觉效果（Story 测试环境无法模拟媒体特性）：装饰器注入与组件样式表 reduced-motion 规则相同的声明，并断言圆环静止、箭头无过渡；同时断言真实媒体规则存在于组件样式表中。',
      },
    },
  },
  decorators: [
    // 模拟装饰器：注入与 TaskList.scss 的 reduced-motion 块等价的声明。
    (Story) => (
      <div data-testid="reduced-motion-simulated">
        <style>{`[data-testid="reduced-motion-simulated"] .matthew-task-list__ring { animation: none; } [data-testid="reduced-motion-simulated"] .matthew-task-list__arrow { transition: none; }`}</style>
        <Story />
      </div>
    ),
  ],
  render: () => <TaskList title="运行中计划" items={sampleItems} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('.matthew-task-list') as HTMLElement
    const ring = root.querySelector('.matthew-task-list__ring') as HTMLElement
    const arrow = root.querySelector('.matthew-task-list__arrow') as HTMLElement

    // 模拟后的可视终态：圆环静止但保留静态缺口，箭头无过渡。
    expect(getComputedStyle(ring).animationName).toBe('none')
    expect(getComputedStyle(ring).borderBottomColor).toBe('rgba(0, 0, 0, 0)')
    expect(getComputedStyle(arrow).transitionDuration).toBe('0s')

    // 组件样式表中存在真实的 prefers-reduced-motion 规则。
    const hasRealReducedMotionRule = Array.from(document.styleSheets).some(
      (sheet) => {
        try {
          return Array.from(sheet.cssRules).some(
            (rule) =>
              rule instanceof CSSMediaRule &&
              rule.conditionText.includes('prefers-reduced-motion: reduce') &&
              rule.cssText.includes('matthew-task-list'),
          )
        } catch {
          return false
        }
      },
    )
    expect(hasRealReducedMotionRule).toBe(true)
  },
}

export const LongTitleInNarrowContainer: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <TaskList
        title="一个故意写得非常长的任务标题用来验证单行省略与窄宽表现"
        statusLabels={statusLabels}
        items={[
          {
            id: 'long',
            title: '一个同样很长的任务条目标题用来验证行内省略行为',
            status: 'running',
            summary: '一段同样比较长的行内摘要用来验证窄宽下的隐藏行为',
          },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = canvas.getByText(/一个故意写得非常长的任务标题/)

    // 长标题单行省略（TL-V02）。
    expect(getComputedStyle(title).textOverflow).toBe('ellipsis')

    // 320px 窄容器：行摘要按容器查询视觉隐藏，标题与面板完整保留（TL-V08）。
    const summary = canvasElement.querySelector('.matthew-task-list__summary') as HTMLElement
    expect(getComputedStyle(summary).position).toBe('absolute')
    expect(getComputedStyle(summary).clipPath).toBe('inset(50%)')
    const root = canvasElement.querySelector('.matthew-task-list') as HTMLElement
    expect(root.getBoundingClientRect().width).toBe(320)
  },
}
