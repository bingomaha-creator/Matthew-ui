import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Thinking } from '../../index'

type ThinkingScreen = Awaited<ReturnType<typeof render>>

const getHeader = (screen: ThinkingScreen) => screen.getByRole('button')

const getContent = (screen: ThinkingScreen) => {
  const contentId = getHeader(screen).element().getAttribute('aria-controls')
  return document.getElementById(contentId!)
}

describe('Thinking open state', () => {
  test('collapses by default and keeps content mounted behind hidden', async () => {
    const screen = await render(<Thinking title="标题">内容</Thinking>)
    const header = getHeader(screen)

    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    const content = getContent(screen)
    expect(content).not.toBeNull()
    await expect.element(content!).toHaveAttribute('hidden')
    await expect.element(content!).toHaveTextContent('内容')
  })

  test('toggles uncontrolled open state on click and reports each requested change', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <Thinking title="标题" onOpenChange={onOpenChange}>
        内容
      </Thinking>,
    )
    const header = getHeader(screen)

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(getContent(screen)!)
      .not.toHaveAttribute('hidden')
    expect(onOpenChange).toHaveBeenCalledWith(true)

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    await expect.element(getContent(screen)!).toHaveAttribute('hidden')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('uses defaultOpen only as the initial value and ignores later prop changes', async () => {
    const screen = await render(
      <Thinking title="标题" defaultOpen>
        内容
      </Thinking>,
    )
    const header = getHeader(screen)

    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(getContent(screen)!)
      .not.toHaveAttribute('hidden')

    await screen.rerender(
      <Thinking title="标题" defaultOpen={false}>
        内容
      </Thinking>,
    )
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
  })

  test('stays on the controlled value until the parent applies the request', async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <Thinking title="标题" open={false} onOpenChange={onOpenChange}>
        内容
      </Thinking>,
    )
    const header = getHeader(screen)

    await header.click()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    await expect.element(getContent(screen)!).toHaveAttribute('hidden')
  })

  test('follows the parent update in a fully controlled composition', async () => {
    function ControlledThinking() {
      const [open, setOpen] = useState(false)
      return (
        <Thinking title="标题" open={open} onOpenChange={setOpen}>
          内容
        </Thinking>
      )
    }
    const screen = await render(<ControlledThinking />)
    const header = getHeader(screen)

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(getContent(screen)!)
      .not.toHaveAttribute('hidden')
  })

  test('warns once in dev when open and defaultOpen conflict and open wins', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const screen = await render(
      <Thinking title="标题" open={false} defaultOpen>
        内容
      </Thinking>,
    )
    const header = getHeader(screen)

    await expect.element(header).toHaveAttribute('aria-expanded', 'false')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('defaultOpen will be ignored'),
    )

    await screen.rerender(
      <Thinking title="标题" open={false} defaultOpen>
        内容
      </Thinking>,
    )
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
