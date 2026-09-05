import { userEvent } from 'vitest/browser'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Thinking } from '../../index'

describe('Thinking disclosure semantics', () => {
  test('uses optional localized status labels without creating a live region', async () => {
    const statusLabels = {
      running: '运行中',
      completed: '已完成',
      stopped: '已中止',
      error: '失败',
    }
    const screen = await render(
      <Thinking title="分析项目" statusLabels={statusLabels}>
        内容
      </Thinking>,
    )

    await expect.element(
      screen.getByRole('button', { name: /分析项目.*运行中/ }),
    ).toBeVisible()
    expect(screen.container.querySelector('[aria-live]')).toBeNull()

    await screen.rerender(
      <Thinking title="分析项目" status="error" statusLabels={statusLabels}>
        内容
      </Thinking>,
    )
    await expect.element(
      screen.getByRole('button', { name: /分析项目.*失败/ }),
    ).toBeVisible()
  })

  test('exposes disclosure semantics with per-instance unique content ids', async () => {
    const screen = await render(
      <>
        <Thinking title="第一">内容一</Thinking>
        <Thinking title="第二" defaultOpen>
          内容二
        </Thinking>
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
    expect(document.getElementById(firstId!)).toHaveTextContent('内容一')
    expect(document.getElementById(secondId!)).toHaveTextContent('内容二')

    await expect
      .element(buttons[0])
      .toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(buttons[1])
      .toHaveAttribute('aria-expanded', 'true')

    const firstControls = firstId
    await screen.rerender(
      <>
        <Thinking title="第一">内容一</Thinking>
        <Thinking title="第二" defaultOpen>
          内容二
        </Thinking>
      </>,
    )
    expect(
      screen.getByRole('button').elements()[0].getAttribute('aria-controls'),
    ).toBe(firstControls)
  })

  test('toggles with Enter and Space through native button behavior', async () => {
    const screen = await render(<Thinking title="标题">内容</Thinking>)
    const header = screen.getByRole('button')

    await userEvent.keyboard('{Tab}')
    await expect.element(header).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')

    await userEvent.keyboard('{Enter}')
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
  })

  test('status changes do not alter open state or steal focus', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <Thinking title="标题" status="running" onOpenChange={onOpenChange}>
        内容
      </Thinking>,
    )
    const header = screen.getByRole('button')

    await userEvent.keyboard('{Tab}{Enter}')
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')

    await screen.rerender(
      <Thinking title="标题" status="error" onOpenChange={onOpenChange}>
        内容
      </Thinking>,
    )
    await expect.element(header).toHaveFocus()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    expect(onOpenChange).toHaveBeenCalledTimes(1)
  })

  test('dynamic children update without stealing focus or toggling open', async () => {
    const screen = await render(
      <Thinking title="标题" defaultOpen>
        第一步
      </Thinking>,
    )
    const header = screen.getByRole('button')

    await userEvent.keyboard('{Tab}')
    await expect.element(header).toHaveFocus()

    await screen.rerender(
      <Thinking title="标题" defaultOpen>
        第二步
      </Thinking>,
    )
    await expect.element(header).toHaveFocus()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect.element(screen.container).toHaveTextContent('第二步')
  })

  test('does not intercept global keyboard events aimed outside its header', async () => {
    const screen = await render(
      <>
        <button type="button">外部按钮</button>
        <Thinking title="标题">内容</Thinking>
      </>,
    )
    const header = screen.getByRole('button', { name: '标题' })

    await userEvent.keyboard('{Tab}{Enter}')
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
  })
})
