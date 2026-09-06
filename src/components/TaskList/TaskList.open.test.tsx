import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TaskList } from '../../index'
import type { TaskListItem } from '../../index'

const items: TaskListItem[] = [
  { id: 'a', title: '任务一', status: 'completed' },
  { id: 'b', title: '任务二', status: 'running' },
]

const getList = (screen: unknown) => {
  const header = (screen as { getByRole: (role: string) => { element: () => Element } })
    .getByRole('button')
  const listId = header.element().getAttribute('aria-controls')
  return document.getElementById(listId!)
}

describe('TaskList open state', () => {
  test('is expanded by default and keeps the list mounted behind hidden when collapsed', async () => {
    const screen = await render(<TaskList title="计划" items={items} />)
    const header = screen.getByRole('button')

    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    const list = getList(screen)
    expect(list).not.toBeNull()
    await expect.element(list!).not.toHaveAttribute('hidden')

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    await expect.element(list!).toHaveAttribute('hidden')
    await expect.element(list!).toHaveTextContent('任务一')
  })

  test('toggles uncontrolled open state and reports each requested change', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <TaskList title="计划" items={items} onOpenChange={onOpenChange} />,
    )
    const header = screen.getByRole('button')

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    expect(onOpenChange).toHaveBeenCalledWith(false)

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  test('uses defaultOpen={false} only as the initial value and ignores later changes', async () => {
    const screen = await render(
      <TaskList title="计划" items={items} defaultOpen={false} />,
    )
    const header = screen.getByRole('button')

    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    await screen.rerender(<TaskList title="计划" items={items} defaultOpen />)
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
  })

  test('stays on the controlled value until the parent applies the request', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <TaskList title="计划" items={items} open onOpenChange={onOpenChange} />,
    )
    const header = screen.getByRole('button')

    await header.click()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect.element(getList(screen)!).not.toHaveAttribute('hidden')
  })

  test('follows the parent update in a fully controlled composition', async () => {
    function ControlledTaskList() {
      const [open, setOpen] = useState(false)
      return (
        <TaskList title="计划" items={items} open={open} onOpenChange={setOpen} />
      )
    }
    const screen = await render(<ControlledTaskList />)
    const header = screen.getByRole('button')

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect.element(getList(screen)!).not.toHaveAttribute('hidden')
  })

  test('warns once in dev when open and defaultOpen conflict and open wins', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const view = () => (
      <TaskList title="计划" items={items} open={false} defaultOpen />
    )
    const screen = await render(view())
    const header = screen.getByRole('button')

    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('defaultOpen will be ignored'),
    )
    await screen.rerender(view())
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  test('supports collapsing and expanding an empty list without a summary', async () => {
    const screen = await render(<TaskList title="空计划" items={[]} />)
    const header = screen.getByRole('button')

    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(getList(screen)!)
      .not.toHaveAttribute('hidden')

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    await expect.element(getList(screen)!).toHaveAttribute('hidden')

    await header.click()
    const list = getList(screen)
    expect(list!.querySelectorAll('li')).toHaveLength(0)
    expect(screen.container.textContent).not.toContain('0 / 0')
  })
})
