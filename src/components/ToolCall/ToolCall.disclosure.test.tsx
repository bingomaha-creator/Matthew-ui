import { userEvent } from 'vitest/browser'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ToolCall } from '../../index'

const zhLabels = {
  pending: '排队中',
  running: '执行中',
  completed: '已完成',
  error: '失败',
  stopped: '已中止',
}

describe('ToolCall disclosure semantics', () => {
  test('exposes disclosure semantics with per-instance unique detail ids', async () => {
    const screen = await render(
      <>
        <ToolCall name="第一个工具" status="running">详情一</ToolCall>
        <ToolCall name="第二个工具" status="completed" defaultOpen>
          详情二
        </ToolCall>
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
    expect(document.getElementById(firstId!)).toHaveTextContent('详情一')
    expect(document.getElementById(secondId!)).toHaveTextContent('详情二')

    await expect
      .element(buttons[0])
      .toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(buttons[1])
      .toHaveAttribute('aria-expanded', 'true')

    const firstControls = firstId
    await screen.rerender(
      <>
        <ToolCall name="第一个工具" status="running">详情一</ToolCall>
        <ToolCall name="第二个工具" status="completed" defaultOpen>
          详情二
        </ToolCall>
      </>,
    )
    expect(
      screen.getByRole('button').elements()[0].getAttribute('aria-controls'),
    ).toBe(firstControls)
  })

  test('toggles with Enter and Space through native button behavior', async () => {
    const screen = await render(
      <ToolCall name="读取项目文件" status="running">详情</ToolCall>,
    )
    const header = screen.getByRole('button', { name: /读取项目文件/ })

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
      <ToolCall
        name="读取项目文件"
        status="running"
        onOpenChange={onOpenChange}
      >
        详情
      </ToolCall>,
    )
    const header = screen.getByRole('button', { name: /读取项目文件/ })

    await userEvent.keyboard('{Tab}{Enter}')
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')

    await screen.rerender(
      <ToolCall
        name="读取项目文件"
        status="error"
        onOpenChange={onOpenChange}
      >
        详情
      </ToolCall>,
    )
    await expect.element(header).toHaveFocus()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    await expect
      .element(
        screen.container.querySelector<HTMLElement>('.matthew-tool-call')!,
      )
      .toHaveAttribute('data-status', 'error')
  })

  test('turns into a disclosure when details appear and back into a status row when removed', async () => {
    const view = (withDetails: boolean, open?: boolean) => (
      <ToolCall name="读取项目文件" status="running" open={open}>
        {withDetails ? '详情内容' : undefined}
      </ToolCall>
    )
    // 受控 open 一直为 true：详情出现时立即可见。
    const screen = await render(view(false, true))
    expect(screen.container.querySelector('button')).toBeNull()

    await screen.rerender(view(true, true))
    const header = screen.getByRole('button', { name: /读取项目文件/ })
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    const detail = document.getElementById(
      header.element().getAttribute('aria-controls')!,
    )
    await expect.element(detail!).toHaveTextContent('详情内容')

    // 反向移除详情恢复非交互状态行。
    await screen.rerender(view(false, true))
    expect(screen.container.querySelector('button')).toBeNull()
    expect(screen.container.querySelector('[aria-controls]')).toBeNull()
  })

  test('keeps focus and open state while details update dynamically', async () => {
    const screen = await render(
      <ToolCall name="读取项目文件" status="running" defaultOpen>
        第一步
      </ToolCall>,
    )
    const header = screen.getByRole('button', { name: /读取项目文件/ })

    await userEvent.keyboard('{Tab}')
    await expect.element(header).toHaveFocus()

    await screen.rerender(
      <ToolCall name="读取项目文件" status="running" defaultOpen>
        第二步
      </ToolCall>,
    )
    await expect.element(header).toHaveFocus()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect.element(screen.container).toHaveTextContent('第二步')
  })

  test('joins the provided status label to the accessible name and hides the graphic', async () => {
    const screen = await render(
      <ToolCall
        name="读取项目文件"
        status="running"
        statusLabels={zhLabels}
        summary="正在执行…"
      >
        详情
      </ToolCall>,
    )

    const header = screen.getByRole('button', {
      name: /读取项目文件\s*正在执行…\s*执行中/,
    })
    expect(
      header
        .element()
        .querySelector('.matthew-tool-call__status')
        ?.getAttribute('aria-hidden'),
    ).toBe('true')
  })

  test('does not fall back to built-in status text without statusLabels', async () => {
    const screen = await render(
      <ToolCall name="读取项目文件" status="running">详情</ToolCall>,
    )
    const header = screen.getByRole('button', { name: /读取项目文件/ })

    expect(header.element().textContent).not.toContain('执行中')
    expect(header.element().textContent).not.toContain('Running')
  })

  test('does not intercept global keyboard events aimed outside its header', async () => {
    const screen = await render(
      <>
        <button type="button">外部按钮</button>
        <ToolCall name="读取项目文件" status="running">详情</ToolCall>
      </>,
    )
    const header = screen.getByRole('button', { name: /读取项目文件/ })

    await userEvent.keyboard('{Tab}{Enter}')
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
  })
})
