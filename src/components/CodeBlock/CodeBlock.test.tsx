import { createRef, StrictMode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { CodeBlock } from './index'
import { userEvent } from 'vitest/browser'
import { renderToStaticMarkup } from 'react-dom/server'
import { ToolCall } from '../ToolCall'

const copy = { label: 'Copy', copiedLabel: 'Copied', errorLabel: 'Copy failed' }
afterEach(() => vi.restoreAllMocks())

test('renders original text safely without an empty header and exposes a div ref', async () => {
  const ref = createRef<HTMLDivElement>()
  const code = '  <script>bad()</script>\n\tend\n'
  const screen = await render(<CodeBlock ref={ref} code={code} data-example="yes" className="custom" />)
  expect(ref.current).toBeInstanceOf(HTMLDivElement)
  expect(ref.current).toHaveAttribute('data-example', 'yes')
  expect(ref.current).toHaveClass('custom')
  expect(screen.container.querySelector('pre code')?.textContent).toBe(code)
  expect(screen.container.querySelector('script, button, .matthew-code-block__header')).toBeNull()
})

test('header appears only for meaningful title, language or copy configuration', async () => {
  const screen = await render(<CodeBlock code="" title="  " language={'\t'} />)
  expect(screen.container.querySelector('.matthew-code-block__header')).toBeNull()
  expect(screen.container.querySelector('code')?.textContent).toBe('')
  await screen.rerender(<CodeBlock code="" language="TypeScript" />)
  await expect.element(screen.getByText('TypeScript')).toBeVisible()
  expect(screen.container.querySelector('button')).toBeNull()
  await screen.rerender(<CodeBlock code="" copy={copy} />)
  expect(screen.getByRole('button').element()).toHaveAccessibleName('Copy')
})

test('labels stay literal and regions have unique title associations or caller names', async () => {
  const screen = await render(<><CodeBlock code="one" title="<b>Raw</b>" language="<img>" /><CodeBlock code="two" title="Second" /><CodeBlock code="three" aria-label="Source text" /></>)
  const regions = screen.getByRole('region').elements()
  expect(regions).toHaveLength(3)
  expect(regions[0]).toHaveAccessibleName('<b>Raw</b>')
  expect(regions[2]).toHaveAccessibleName('Source text')
  expect(regions[0].getAttribute('aria-labelledby')).not.toBe(regions[1].getAttribute('aria-labelledby'))
  expect(screen.container.querySelector('b, img')).toBeNull()
})

test('copy failures from rejection or synchronous throws can be retried without moving focus', async () => {
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied')).mockImplementationOnce(() => { throw new Error('unavailable') }).mockResolvedValue(undefined)
  const screen = await render(<CodeBlock code="raw" copy={copy} />)
  const button = screen.getByRole('button')
  for (let i = 0; i < 2; i++) {
    await button.click()
    await expect.element(screen.getByRole('status')).toHaveTextContent('Copy failed')
    expect(document.activeElement).toBe(button.element())
  }
  await button.click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copied')
  expect(write).toHaveBeenCalledTimes(3)
})

test('missing Clipboard API reports failure and leaves original text selectable', async () => {
  vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(undefined as never)
  const screen = await render(<CodeBlock code="manual copy" copy={copy} />)
  await screen.getByRole('button').click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copy failed')
  expect(screen.container.querySelector('code')?.textContent).toBe('manual copy')
})

test('changing text invalidates pending writes even on A→B→A and preserves the latest request', async () => {
  const completions: Array<() => void> = []
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => new Promise<void>(resolve => { completions.push(resolve) }))
  const screen = await render(<StrictMode><CodeBlock code="A" copy={copy} /></StrictMode>)
  await screen.getByRole('button').click()
  await screen.rerender(<StrictMode><CodeBlock code="B" copy={copy} /></StrictMode>)
  await screen.rerender(<StrictMode><CodeBlock code="A" copy={copy} /></StrictMode>)
  await screen.getByRole('button').click()
  completions[0]()
  await expect.element(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByRole('status').element().textContent).toBe('')
  completions[1]()
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copied')
  expect(write.mock.calls).toEqual([['A'], ['A']])
  await screen.rerender(<StrictMode><CodeBlock code="B" copy={copy} /></StrictMode>)
  expect(screen.getByRole('status').element().textContent).toBe('')
})

test('late completion cannot overwrite a newer failure or recreate removed copy controls', async () => {
  let oldComplete!: () => void
  let removedComplete!: () => void
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementationOnce(() => new Promise<void>(resolve => { oldComplete = resolve })).mockRejectedValueOnce(new Error('denied')).mockImplementationOnce(() => new Promise<void>(resolve => { removedComplete = resolve }))
  const screen = await render(<CodeBlock code="old" copy={copy} />)
  await screen.getByRole('button').click()
  await screen.rerender(<CodeBlock code="new" copy={copy} />)
  await screen.getByRole('button').click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copy failed')
  oldComplete()
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copy failed')
  await screen.getByRole('button').click()
  await screen.rerender(<CodeBlock code="new" />)
  removedComplete()
  expect(screen.container.querySelector('button, [role=status]')).toBeNull()
})

test('equal copy objects preserve requests while changed labels invalidate them', async () => {
  const completions: Array<() => void> = []
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => new Promise<void>(resolve => { completions.push(resolve) }))
  const screen = await render(<CodeBlock code="text" copy={copy} />)
  await screen.getByRole('button').click()
  await screen.rerender(<CodeBlock code="text" copy={{ ...copy }} />)
  expect(screen.getByRole('button').element()).toHaveAttribute('aria-busy', 'true')
  completions[0]()
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copied')
  await screen.getByRole('button').click()
  await screen.rerender(<CodeBlock code="text" copy={{ ...copy, copiedLabel: 'Done' }} />)
  completions[1]()
  expect(screen.getByRole('status').element().textContent).toBe('')
})

test('unmount invalidates pending requests and clears success timers', async () => {
  let complete!: () => void
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => new Promise<void>(resolve => { complete = resolve }))
  const screen = await render(<CodeBlock code="text" copy={copy} />)
  await screen.getByRole('button').click()
  await screen.unmount()
  complete()
  const other = await render(<CodeBlock code="new" copy={copy} />)
  expect(other.getByRole('status').element().textContent).toBe('')
})

test('feedback expires after two seconds and each instance is independent', async () => {
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
  const screen = await render(<><CodeBlock code="" copy={copy} /><CodeBlock code="second" copy={copy} /></>)
  const buttons = screen.getByRole('button').elements()
  ;(buttons[0] as HTMLButtonElement).click()
  await expect.poll(() => screen.getByRole('status').elements()[0].textContent).toBe('Copied')
  expect(screen.getByRole('status').elements()[1].textContent).toBe('')
  await expect.poll(() => screen.getByRole('status').elements()[0].textContent, { timeout: 3000 }).toBe('')
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('')
})

test('keyboard copy inside ToolCall does not change expansion, focus or code identity', async () => {
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
  const screen = await render(<ToolCall name="Read" status="running" defaultOpen><CodeBlock code="raw" title="Result" copy={copy} /></ToolCall>)
  const button = screen.getByRole('button', { name: 'Copy', exact: true })
  button.element().focus()
  await userEvent.keyboard('{Enter}')
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copied')
  expect(screen.getByRole('button', { name: 'Read', exact: true }).element()).toHaveAttribute('aria-expanded', 'true')
  const pre = screen.container.querySelector('pre')!
  await screen.rerender(<ToolCall name="Read" status="running" defaultOpen><CodeBlock code="updated" title="Result" copy={copy} wrap /></ToolCall>)
  expect(screen.container.querySelector('pre')).toBe(pre)
  expect(document.activeElement).toBe(button.element())
  expect(screen.getByRole('status').element().textContent).toBe('')
})

test('SSR escapes text without writing the clipboard or relying on effects', () => {
  const write = vi.spyOn(navigator.clipboard, 'writeText')
  const html = renderToStaticMarkup(<CodeBlock code="<img onerror=bad()>" copy={copy} />)
  expect(html).toContain('&lt;img')
  expect(html).not.toContain('<img')
  expect(write).not.toHaveBeenCalled()
})

test('copies the exact click-time string and reports success only after completion', async () => {
  let complete!: () => void
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => new Promise<void>(resolve => { complete = resolve }))
  const code = ' \r\n\t<raw>\n '
  const screen = await render(<CodeBlock code={code} title="Arguments" language="JSON" copy={copy} />)
  const button = screen.getByRole('button', { name: 'Copy', exact: true })
  await button.click()
  expect(write).toHaveBeenCalledExactlyOnceWith(code)
  expect(button.element()).toHaveAttribute('aria-disabled', 'true')
  expect(screen.getByRole('status').element().textContent).toBe('')
  ;(button.element() as HTMLButtonElement).click()
  expect(write).toHaveBeenCalledTimes(1)
  complete()
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copied')
  expect(document.activeElement).toBe(button.element())
})
