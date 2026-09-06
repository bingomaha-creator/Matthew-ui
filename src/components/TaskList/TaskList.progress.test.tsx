import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TaskList } from '../../index'
import type { TaskListItem } from '../../index'

const sampleItems: TaskListItem[] = [
  { id: 'contract', title: '确认合同', status: 'completed' },
  { id: 'implement', title: '实现组件', status: 'running' },
  { id: 'quality', title: '质量检查', status: 'running' },
  { id: 'verify', title: '复核发布包', status: 'pending' },
  { id: 'release', title: '提交检查点', status: 'error' },
]

const getProgress = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('.matthew-task-list__progress')

describe('TaskList progress and items', () => {
  test('computes completed / total from the current items', async () => {
    const screen = await render(
      <TaskList title="实施计划" items={sampleItems} />,
    )

    await expect.element(getProgress(screen.container)!).toHaveTextContent('1 / 5')
  })

  test('counts only completed items and updates with the latest items', async () => {
    const view = (items: TaskListItem[]) => (
      <TaskList title="实施计划" items={items} />
    )
    const screen = await render(view(sampleItems))
    await expect.element(getProgress(screen.container)!).toHaveTextContent('1 / 5')

    // error 与 stopped 是终态但不计为完成。
    await screen.rerender(
      view([
        { id: 'a', title: '任务一', status: 'error' },
        { id: 'b', title: '任务二', status: 'stopped' },
        { id: 'c', title: '任务三', status: 'completed' },
      ]),
    )
    await expect.element(getProgress(screen.container)!).toHaveTextContent('1 / 3')

    // 状态更新后摘要同步重算。
    await screen.rerender(
      view([
        { id: 'a', title: '任务一', status: 'completed' },
        { id: 'b', title: '任务二', status: 'completed' },
        { id: 'c', title: '任务三', status: 'completed' },
      ]),
    )
    await expect.element(getProgress(screen.container)!).toHaveTextContent('3 / 3')
  })

  test('hides the summary for an empty list while keeping the title and list', async () => {
    const screen = await render(<TaskList title="空计划" items={[]} />)
    const root = screen.container.querySelector<HTMLElement>('.matthew-task-list')!

    expect(getProgress(screen.container)).toBeNull()
    expect(root.querySelector('ol')).not.toBeNull()
    expect(root.querySelectorAll('ol > li')).toHaveLength(0)
    await expect.element(root).toHaveTextContent('空计划')
    expect(root.textContent).not.toContain('0 / 0')
  })

  test('renders multiple running items in caller order', async () => {
    const screen = await render(
      <TaskList title="并行" items={sampleItems} />,
    )
    const statuses = Array.from(
      screen.container.querySelectorAll('.matthew-task-list__item'),
    ).map((item) => item.getAttribute('data-status'))

    expect(statuses).toEqual(['completed', 'running', 'running', 'pending', 'error'])
  })

  test('keeps item identity through add, remove, reorder and update', async () => {
    const view = (items: TaskListItem[]) => <TaskList title="动态" items={items} />
    const screen = await render(view(sampleItems))
    const itemBefore = screen.container.querySelector<HTMLElement>(
      '.matthew-task-list__item[data-status="completed"]',
    )

    // 更新标题 + 重排：同一 id 的条目保持 DOM 身份。
    await screen.rerender(
      view([
        { id: 'quality', title: '质量检查', status: 'running' },
        { id: 'implement', title: '实现组件（更新）', status: 'running' },
        { id: 'contract', title: '确认合同', status: 'completed', summary: '已评审' },
        { id: 'verify', title: '复核发布包', status: 'pending' },
      ]),
    )
    const itemAfter = screen.container.querySelector<HTMLElement>(
      '.matthew-task-list__item[data-status="completed"]',
    )
    expect(itemAfter).toBe(itemBefore)

    const titles = Array.from(
      screen.container.querySelectorAll('.matthew-task-list__item-title'),
    ).map((item) => item.textContent)
    expect(titles).toEqual([
      '质量检查',
      '实现组件（更新）',
      '确认合同',
      '复核发布包',
    ])
    await expect
      .element(getProgress(screen.container)!)
      .toHaveTextContent('1 / 4')

    // 删除条目：移除旧任务。
    await screen.rerender(
      view([
        { id: 'quality', title: '质量检查', status: 'running' },
        { id: 'verify', title: '复核发布包', status: 'pending' },
      ]),
    )
    expect(screen.container.querySelectorAll('.matthew-task-list__item')).toHaveLength(2)
  })

  test('does not toggle open state or call onOpenChange when items change', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <TaskList title="稳定" items={sampleItems} onOpenChange={onOpenChange} />,
    )
    const header = screen.getByRole('button', { name: /稳定/ })
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')

    await screen.rerender(
      <TaskList title="稳定" items={[...sampleItems, { id: 'extra', title: '新增任务', status: 'pending' }]} onOpenChange={onOpenChange} />,
    )
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
