import { createRef } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { ToolCall } from '../../index'

// 根 class 是视觉合同公开的 CSS 作用域（TC-V05），可作为 DOM 查询锚点。
const getRoot = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('.matthew-tool-call')

describe('ToolCall basic rendering', () => {
  test('renders required name, optional summary and required status', async () => {
    const screen = await render(
      <ToolCall name="读取项目文件" status="running" summary="正在执行…">
        详情
      </ToolCall>,
    )
    const root = getRoot(screen.container)

    expect(root).not.toBeNull()
    await expect.element(root!).toHaveTextContent('读取项目文件')
    await expect.element(root!).toHaveTextContent('正在执行…')
    expect(root).toHaveAttribute('data-status', 'running')
  })

  test('renders without a summary when it is omitted', async () => {
    const screen = await render(
      <ToolCall name="读取项目文件" status="completed">
        详情
      </ToolCall>,
    )
    const root = getRoot(screen.container)

    await expect.element(root!).toHaveTextContent('读取项目文件')
    expect(root!.querySelector('.matthew-tool-call__summary')).toBeNull()
  })

  test('marks each of the five statuses on the root element', async () => {
    const screen = await render(
      <>
        <ToolCall name="排队" status="pending" data-testid="pending">
          详情
        </ToolCall>
        <ToolCall name="执行" status="running" data-testid="running">
          详情
        </ToolCall>
        <ToolCall name="完成" status="completed" data-testid="completed">
          详情
        </ToolCall>
        <ToolCall name="失败" status="error" data-testid="error">
          详情
        </ToolCall>
        <ToolCall name="中止" status="stopped" data-testid="stopped">
          详情
        </ToolCall>
      </>,
    )

    for (const status of ['pending', 'running', 'completed', 'error', 'stopped']) {
      await expect
        .element(screen.getByTestId(status))
        .toHaveAttribute('data-status', status)
    }
  })

  test('forwards its ref to the root div element', async () => {
    const rootRef = createRef<HTMLDivElement>()
    await render(
      <ToolCall ref={rootRef} name="读取项目文件" status="running">
        详情
      </ToolCall>,
    )

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement)
    expect(rootRef.current?.classList.contains('matthew-tool-call')).toBe(true)
  })

  test('passes through native div props and merges caller className', async () => {
    await render(
      <ToolCall
        name="读取项目文件"
        status="running"
        className="my-tool-call"
        id="pipeline-tool-call"
        aria-label="工具调用"
        title="原生提示"
        data-track="agent"
      >
        详情
      </ToolCall>,
    )
    const root = document.getElementById('pipeline-tool-call')

    expect(root).not.toBeNull()
    expect(root).toHaveClass('matthew-tool-call', 'my-tool-call')
    expect(root).toHaveAttribute('aria-label', '工具调用')
    expect(root).toHaveAttribute('title', '原生提示')
    expect(root).toHaveAttribute('data-track', 'agent')
  })
})
