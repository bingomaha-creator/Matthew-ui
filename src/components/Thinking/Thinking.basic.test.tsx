import { createRef } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Thinking } from '../../index'

// 根 class 是视觉合同公开的 CSS 作用域（TH-V05），可作为 DOM 查询锚点。
const getRoot = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(':scope > .matthew-thinking')

describe('Thinking basic rendering', () => {
  test('renders required title and children with the default running status', async () => {
    const screen = await render(
      <Thinking title="正在分析项目">
        <p>读取项目结构</p>
      </Thinking>,
    )
    const root = getRoot(screen.container)

    expect(root).not.toBeNull()
    await expect.element(root!).toHaveTextContent('正在分析项目')
    await expect.element(root!).toHaveTextContent('读取项目结构')
    expect(root).toHaveAttribute('data-status', 'running')
  })

  test('renders a ReactNode title instead of the native title attribute', async () => {
    const screen = await render(
      <Thinking title={<strong>正在分析项目</strong>}>内容</Thinking>,
    )
    const root = getRoot(screen.container)

    await expect.element(root!).toHaveTextContent('正在分析项目')
    expect(root!.querySelector('strong')).not.toBeNull()
    expect(root!.hasAttribute('title')).toBe(false)
  })

  test('marks each of the four statuses on the root element', async () => {
    const screen = await render(
      <>
        <Thinking title="运行中" data-testid="running">
          内容
        </Thinking>
        <Thinking title="已完成" status="completed" data-testid="completed">
          内容
        </Thinking>
        <Thinking title="已中止" status="stopped" data-testid="stopped">
          内容
        </Thinking>
        <Thinking title="失败" status="error" data-testid="error">
          内容
        </Thinking>
      </>,
    )

    await expect
      .element(screen.getByTestId('running'))
      .toHaveAttribute('data-status', 'running')
    await expect
      .element(screen.getByTestId('completed'))
      .toHaveAttribute('data-status', 'completed')
    await expect
      .element(screen.getByTestId('stopped'))
      .toHaveAttribute('data-status', 'stopped')
    await expect
      .element(screen.getByTestId('error'))
      .toHaveAttribute('data-status', 'error')
  })

  test('forwards its ref to the root div element', async () => {
    const rootRef = createRef<HTMLDivElement>()
    await render(<Thinking ref={rootRef} title="标题">内容</Thinking>)

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement)
    expect(rootRef.current?.classList.contains('matthew-thinking')).toBe(true)
  })

  test('passes through native div props and merges caller className', async () => {
    await render(
      <Thinking
        title="标题"
        className="my-thinking"
        id="pipeline-thinking"
        aria-label="处理过程"
        data-track="agent"
      >
        内容
      </Thinking>,
    )
    const root = document.getElementById('pipeline-thinking')

    expect(root).not.toBeNull()
    expect(root).toHaveClass('matthew-thinking', 'my-thinking')
    expect(root).toHaveAttribute('aria-label', '处理过程')
    expect(root).toHaveAttribute('data-track', 'agent')
  })
})
