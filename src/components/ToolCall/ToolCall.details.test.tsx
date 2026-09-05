import { Suspense, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ToolCall } from '../../index'

type ToolCallScreen = Awaited<ReturnType<typeof render>>

const getHeader = (screen: ToolCallScreen) => screen.getByRole('button')

const getDetail = (screen: ToolCallScreen) => {
  const detailId = getHeader(screen).element().getAttribute('aria-controls')
  return document.getElementById(detailId!)
}

const FragmentNoContent = () => <>{null}</>

describe('ToolCall detail presence', () => {
  test('degrades to a non-interactive status row without details', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <ToolCall
        name="读取项目文件"
        status="completed"
        summary="已读取 3 个文件"
        onOpenChange={onOpenChange}
      />,
    )
    const root = screen.container.querySelector<HTMLElement>('.matthew-tool-call')!

    await expect.element(root).toHaveTextContent('读取项目文件')
    await expect.element(root).toHaveTextContent('已读取 3 个文件')
    expect(screen.container.querySelector('button')).toBeNull()
    expect(root.querySelector('[aria-expanded]')).toBeNull()
    expect(root.querySelector('[aria-controls]')).toBeNull()
  })

  test('treats React renderable empty values as no details', async () => {
    const cases = [
      { key: 'false', children: false as const },
      { key: 'empty-string', children: '' },
      { key: 'empty-array', children: [] as ReactNode[] },
      { key: 'nested-empty-array', children: [null, false, []] as ReactNode[] },
      { key: 'empty-set', children: new Set([null, false, '']) },
      { key: 'set-of-empty-iterables', children: new Set([[], new Set<ReactNode>()]) },
    ]
    for (const { key, children } of cases) {
      const screen = await render(
        <ToolCall name="读取项目文件" status="completed" data-testid={key}>
          {children}
        </ToolCall>,
      )
      expect(screen.container.querySelector('button'), key).toBeNull()
    }
  })

  test('treats bigint, portals, promises and one-shot iterables as details', async () => {
    function* innerGenerator() {
      yield '嵌套内容'
    }
    function* outerGenerator() {
      yield innerGenerator()
    }
    // 只能遍历一次的 generator 实例。
    const oneShot = (function* oneShotGenerator() {
      yield '一次性'
      yield '内容'
    })()

    // portal 挂载点。
    const portalTarget = document.createElement('div')
    document.body.appendChild(portalTarget)

    try {
      const screen = await render(
        <>
          <ToolCall name="bigint" status="running" defaultOpen data-testid="bigint">
            {0n}
          </ToolCall>
          <ToolCall name="portal" status="running" defaultOpen data-testid="portal">
            {createPortal(<p>传送门内容</p>, portalTarget)}
          </ToolCall>
          <ToolCall name="一次性" status="running" defaultOpen data-testid="generator">
            {oneShot}
          </ToolCall>
          <ToolCall name="嵌套" status="running" defaultOpen data-testid="nested-generator">
            {outerGenerator()}
          </ToolCall>
        </>,
      )

      // bigint 与两个 generator 都判定为详情（存在标题按钮）。
      for (const id of ['bigint', 'portal', 'generator', 'nested-generator']) {
        expect(
          screen.getByTestId(id).element().querySelector('button'),
          id,
        ).not.toBeNull()
      }
      await expect.element(screen.getByTestId('bigint')).toHaveTextContent('0')
      expect(portalTarget).toHaveTextContent('传送门内容')
      await expect.element(screen.getByTestId('generator')).toHaveTextContent('一次性')
      await expect.element(screen.getByTestId('generator')).toHaveTextContent('内容')
      await expect.element(screen.getByTestId('nested-generator')).toHaveTextContent('嵌套内容')
    } finally {
      portalTarget.remove()
    }
  })

  test('renders a Suspense-carried promise as details', async () => {
    const promise = new Promise<string>((resolve) => {
      window.setTimeout(() => resolve('异步详情'), 20)
    })
    const screen = await render(
      <Suspense fallback="加载中">
        <ToolCall name="异步工具" status="running" defaultOpen>
          {promise}
        </ToolCall>
      </Suspense>,
    )
    const header = screen.getByRole('button', { name: /异步工具/ })
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect.element(screen.container).toHaveTextContent('异步详情')
  })

  test('keeps one-shot generator content across ordinary re-renders', async () => {
    // 相同 children 引用重渲染时必须复用已物化结果，不能再次消费。
    const oneShot = (function* reusableGenerator() {
      yield '第一次'
      yield '仍然存在'
    })()
    const view = () => (
      <ToolCall name="复用" status="running" defaultOpen>
        {oneShot}
      </ToolCall>
    )
    const screen = await render(view())
    const header = screen.getByRole('button', { name: /复用/ })
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect.element(screen.container).toHaveTextContent('第一次')

    await screen.rerender(view())
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect.element(screen.container).toHaveTextContent('第一次')
    await expect.element(screen.container).toHaveTextContent('仍然存在')
  })

  test('treats renderable nodes as details and fixes the boundary cases', async () => {
    const cases = [
      { key: 'zero', children: 0 },
      { key: 'whitespace', children: ' ' },
      { key: 'element', children: <p>步骤</p> },
      // 调用方提供了元素即视为提供了详情，即使 Fragment 当前渲染为空。
      { key: 'empty-fragment', children: <FragmentNoContent /> },
      { key: 'set-with-content', children: new Set([null, <p key="p">步骤</p>]) },
      { key: 'set-with-number', children: new Set<ReactNode>([0]) },
      // Iterable 嵌套：数组内 Set、Set 内数组都参与浅层展开判定。
      { key: 'array-with-set', children: [null, new Set<ReactNode>(['x'])] as ReactNode[] },
      { key: 'set-with-array', children: new Set<ReactNode>([[] as ReactNode[], 'x']) },
    ]
    for (const { key, children } of cases) {
      const screen = await render(
        <ToolCall name="读取项目文件" status="completed" data-testid={key}>
          {children}
        </ToolCall>,
      )
      expect(screen.container.querySelector('button'), key).not.toBeNull()
    }
  })

  test('collapses by default and keeps details mounted behind hidden', async () => {
    const screen = await render(
      <ToolCall name="读取项目文件" status="running">
        <p>读取项目结构</p>
      </ToolCall>,
    )
    const header = getHeader(screen)

    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    const detail = getDetail(screen)
    expect(detail).not.toBeNull()
    await expect.element(detail!).toHaveAttribute('hidden')
    await expect.element(detail!).toHaveTextContent('读取项目结构')
  })

  test('toggles uncontrolled open state on click and reports each requested change', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <ToolCall name="读取项目文件" status="running" onOpenChange={onOpenChange}>
        详情
      </ToolCall>,
    )
    const header = getHeader(screen)

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect.element(getDetail(screen)!).not.toHaveAttribute('hidden')
    expect(onOpenChange).toHaveBeenCalledWith(true)

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    await expect.element(getDetail(screen)!).toHaveAttribute('hidden')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('uses defaultOpen only as the initial value and ignores later prop changes', async () => {
    const screen = await render(
      <ToolCall name="读取项目文件" status="running" defaultOpen>
        详情
      </ToolCall>,
    )
    const header = getHeader(screen)

    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await screen.rerender(
      <ToolCall name="读取项目文件" status="running" defaultOpen={false}>
        详情
      </ToolCall>,
    )
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
  })

  test('stays on the controlled value until the parent applies the request', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <ToolCall
        name="读取项目文件"
        status="running"
        open={false}
        onOpenChange={onOpenChange}
      >
        详情
      </ToolCall>,
    )
    const header = getHeader(screen)

    await header.click()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    await expect.element(getDetail(screen)!).toHaveAttribute('hidden')
  })

  test('follows the parent update in a fully controlled composition', async () => {
    function ControlledToolCall() {
      const [open, setOpen] = useState(false)
      return (
        <ToolCall
          name="读取项目文件"
          status="running"
          open={open}
          onOpenChange={setOpen}
        >
          详情
        </ToolCall>
      )
    }
    const screen = await render(<ControlledToolCall />)
    const header = getHeader(screen)

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect.element(getDetail(screen)!).not.toHaveAttribute('hidden')
  })

  test('warns once in dev only when details exist and open wins', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const view = () => (
      <ToolCall name="读取项目文件" status="running" open={false} defaultOpen>
        详情
      </ToolCall>
    )
    const screen = await render(view())
    const header = getHeader(screen)

    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('defaultOpen will be ignored'),
    )
    await screen.rerender(view())
    expect(warn).toHaveBeenCalledTimes(1)

    // 无详情时两个展开 prop 均无效，不产生冲突警告。
    await screen.rerender(
      <ToolCall name="读取项目文件" status="running" open={false} defaultOpen />,
    )
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
