import { createRef } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { TaskList } from '../../index'

// 根 class 是视觉合同公开的 CSS 作用域（TL-V07），可作为 DOM 查询锚点。
const getRoot = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('.matthew-task-list')

const sampleItems = [
  { id: 'contract', title: '确认合同', status: 'completed' as const },
  { id: 'implement', title: '实现组件', status: 'running' as const },
]

describe('TaskList basic rendering', () => {
  test('renders title and item rows with native list semantics', async () => {
    const screen = await render(
      <TaskList title="实施 ToolCall 组件" items={sampleItems} />,
    )
    const root = getRoot(screen.container)

    expect(root).not.toBeNull()
    await expect.element(root!).toHaveTextContent('实施 ToolCall 组件')
    expect(root!.querySelector('button')).not.toBeNull()
    const list = root!.querySelector('ol')
    expect(list).not.toBeNull()
    expect(root!.querySelectorAll('ol > li')).toHaveLength(2)
    await expect.element(root!).toHaveTextContent('确认合同')
    await expect.element(root!).toHaveTextContent('实现组件')
  })

  test('renders optional per-item summaries', async () => {
    const screen = await render(
      <TaskList
        title="计划"
        items={[
          { id: 'a', title: '任务一', status: 'completed', summary: '31 个测试' },
          { id: 'b', title: '任务二', status: 'pending' },
        ]}
      />,
    )
    const root = getRoot(screen.container)

    await expect.element(root!).toHaveTextContent('31 个测试')
    expect(root!.querySelectorAll('.matthew-task-list__summary')).toHaveLength(1)
  })

  test('marks each of the five statuses on the list item', async () => {
    const statuses = [
      'pending',
      'running',
      'completed',
      'error',
      'stopped',
    ] as const
    const screen = await render(
      <TaskList
        title="状态"
        items={statuses.map((status) => ({
          id: status,
          title: `任务-${status}`,
          status,
        }))}
      />,
    )

    for (const status of statuses) {
      const item = screen.container.querySelector(
        `.matthew-task-list__item[data-status="${status}"]`,
      )
      expect(item, status).not.toBeNull()
      expect(item).toHaveAttribute('data-status', status)
      expect(item).toHaveTextContent(`任务-${status}`)
    }
  })

  test('forwards its ref to the root div element', async () => {
    const rootRef = createRef<HTMLDivElement>()
    await render(<TaskList ref={rootRef} title="计划" items={sampleItems} />)

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement)
    expect(rootRef.current?.classList.contains('matthew-task-list')).toBe(true)
  })

  test('passes through native div props and merges caller className', async () => {
    await render(
      <TaskList
        title="计划"
        items={sampleItems}
        className="my-task-list"
        id="pipeline-tasks"
        aria-label="任务计划"
        data-track="agent"
      />,
    )
    const root = document.getElementById('pipeline-tasks')

    expect(root).not.toBeNull()
    expect(root).toHaveClass('matthew-task-list', 'my-task-list')
    expect(root).toHaveAttribute('aria-label', '任务计划')
    expect(root).toHaveAttribute('data-track', 'agent')
  })

  test('renders a ReactNode title instead of the native title attribute', async () => {
    const screen = await render(
      <TaskList title={<strong>实施计划</strong>} items={[]} />,
    )
    const root = getRoot(screen.container)

    await expect.element(root!).toHaveTextContent('实施计划')
    expect(root!.querySelector('strong')).not.toBeNull()
    expect(root!.hasAttribute('title')).toBe(false)
  })
})
