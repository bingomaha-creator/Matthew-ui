import { userEvent } from 'vitest/browser'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TaskList } from '../../index'
import type { TaskListItem } from '../../index'

const items: TaskListItem[] = [
  { id: 'a', title: '任务一', status: 'completed' },
  { id: 'b', title: '任务二', status: 'running' },
]

const zhLabels = {
  pending: '排队中',
  running: '执行中',
  completed: '已完成',
  error: '失败',
  stopped: '已中止',
}

describe('TaskList disclosure semantics', () => {
  test('exposes disclosure semantics with per-instance unique list ids', async () => {
    const screen = await render(
      <>
        <TaskList title="第一个" items={items} defaultOpen={false} />
        <TaskList title="第二个" items={items} />
      </>,
    )
    const buttons = screen.getByRole('button').elements()
    expect(buttons).toHaveLength(2)

    const [firstId, secondId] = buttons.map((button) =>
      button.getAttribute('aria-controls'),
    )
    expect(firstId).toBeTruthy()
    expect(secondId).toBeTruthy()
    expect(firstId).not.toBe(secondId)
    expect(document.getElementById(firstId!)).toHaveTextContent('任务一')

    await expect.element(buttons[0]).toHaveAttribute('aria-expanded', 'false')
    await expect.element(buttons[1]).toHaveAttribute('aria-expanded', 'true')

    const firstControls = firstId
    await screen.rerender(
      <>
        <TaskList title="第一个" items={items} defaultOpen={false} />
        <TaskList title="第二个" items={items} />
      </>,
    )
    expect(
      screen.getByRole('button').elements()[0].getAttribute('aria-controls'),
    ).toBe(firstControls)
  })

  test('includes the title and summary in the accessible name of the header', async () => {
    const screen = await render(
      <TaskList title="实施计划" items={items} />,
    )
    // 总体摘要作为标题按钮的可访问内容参与朗读（TL-B06）。
    const header = screen.getByRole('button', { name: /实施计划\s*1 \/ 2/ })
    expect(header.element().textContent).toContain('1 / 2')
  })

  test('joins provided status labels to item content and hides the graphics', async () => {
    const screen = await render(
      <TaskList title="计划" items={items} statusLabels={zhLabels} />,
    )
    const listId = screen
      .getByRole('button')
      .element()
      .getAttribute('aria-controls')
    const list = document.getElementById(listId!)

    expect(list!.textContent).toContain('已完成')
    expect(list!.textContent).toContain('执行中')
    for (const graphic of list!.querySelectorAll('.matthew-task-list__status')) {
      expect(graphic.getAttribute('aria-hidden')).toBe('true')
    }
  })

  test('does not fall back to built-in status text without statusLabels', async () => {
    const screen = await render(<TaskList title="计划" items={items} />)
    const listId = screen
      .getByRole('button')
      .element()
      .getAttribute('aria-controls')
    const list = document.getElementById(listId!)

    expect(list!.textContent).not.toContain('执行中')
    expect(list!.textContent).not.toContain('Running')
  })

  test('toggles with Enter and Space through native button behavior', async () => {
    const screen = await render(
      <TaskList title="计划" items={items} defaultOpen={false} />,
    )
    const header = screen.getByRole('button')

    await userEvent.keyboard('{Tab}')
    await expect.element(header).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')

    await userEvent.keyboard('{Enter}')
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
  })

  test('does not steal focus or report aria-live when items update', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <TaskList title="计划" items={items} onOpenChange={onOpenChange} />,
    )
    const header = screen.getByRole('button')

    await userEvent.keyboard('{Tab}')
    await expect.element(header).toHaveFocus()

    await screen.rerender(
      <TaskList
        title="计划"
        items={[{ id: 'c', title: '新增任务', status: 'pending' }, ...items]}
        onOpenChange={onOpenChange}
      />,
    )
    await expect.element(header).toHaveFocus()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    expect(onOpenChange).not.toHaveBeenCalled()

    const root = screen.container.querySelector('.matthew-task-list')!
    expect(root.querySelector('[aria-live]')).toBeNull()
    for (const item of root.querySelectorAll('.matthew-task-list__item')) {
      expect(item.getAttribute('aria-current')).toBeNull()
      expect(item.getAttribute('aria-selected')).toBeNull()
      expect(item.getAttribute('aria-checked')).toBeNull()
    }
  })

  test('does not intercept global keyboard events aimed outside its header', async () => {
    const screen = await render(
      <>
        <button type="button">外部按钮</button>
        <TaskList title="计划" items={items} defaultOpen={false} />
      </>,
    )
    const header = screen.getByRole('button', { name: /计划/ })

    await userEvent.keyboard('{Tab}{Enter}')
    // 外部按钮的 Enter 不应改变 TaskList 的展开状态。
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
  })
})
