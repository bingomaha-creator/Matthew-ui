import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { CodeBlock } from './index'
import '../../styles/index.scss'

test('default panel follows the fixed visual contract and confines long lines', async () => {
  const screen = await render(<div style={{ width: 320 }}><CodeBlock code={'long'.repeat(100)} title="Arguments" language="JSON" /></div>)
  const root = screen.container.querySelector('.matthew-code-block') as HTMLElement
  const pre = root.querySelector('pre')!
  expect(getComputedStyle(root).borderTopWidth).toBe('1px')
  expect(getComputedStyle(root).borderRadius).toBe('8px')
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(255, 255, 255)')
  expect(getComputedStyle(pre).fontSize).toBe('13px')
  expect(getComputedStyle(pre).lineHeight).toBe('20.8px')
  expect(getComputedStyle(pre).padding).toBe('12px')
  expect(getComputedStyle(pre).whiteSpace).toBe('pre')
  expect(getComputedStyle(pre).overflowX).toBe('auto')
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
  expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth)
  expect(getComputedStyle(root.querySelector('.matthew-code-block__header')!).minHeight).toBe('38px')
})

test('wrap mode and long localized headers fit a narrow container even at 200% text', async () => {
  const screen = await render(<div style={{ width: 320 }}><CodeBlock code={'word'.repeat(100)} title={'标题'.repeat(30)} language={'Language'.repeat(20)} wrap copy={{ label: '复制'.repeat(30), copiedLabel: 'Copied', errorLabel: 'Failed' }} /></div>)
  const root = screen.container.querySelector('.matthew-code-block') as HTMLElement
  const oldSize = document.documentElement.style.fontSize
  try {
    for (const size of ['16px', '32px']) {
      document.documentElement.style.fontSize = size
      expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
      const pre = root.querySelector('pre')!
      expect(pre.scrollWidth).toBeLessThanOrEqual(pre.clientWidth)
      expect(getComputedStyle(pre).whiteSpace).toBe('pre-wrap')
      expect(root.querySelector('button')!.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right)
    }
  } finally { document.documentElement.style.fontSize = oldSize }
})

test('updates preserve the scrollable code node and do not reset its scroll position', async () => {
  const screen = await render(<div style={{ width: 320 }}><CodeBlock code={'long'.repeat(100)} /></div>)
  const pre = screen.container.querySelector('pre')!
  pre.scrollLeft = 100
  pre.focus()
  await screen.rerender(<div style={{ width: 320 }}><CodeBlock code={'new'.repeat(200)} title="Updated" /></div>)
  expect(screen.container.querySelector('pre')).toBe(pre)
  expect(pre.scrollLeft).toBe(100)
  expect(document.activeElement).toBe(pre)
})

test('the empty status region stays available to assistive technology before copy feedback arrives', async () => {
  const screen = await render(<CodeBlock code="raw" copy={{ label: 'Copy', copiedLabel: 'Copied', errorLabel: 'Failed' }} />)
  expect(screen.getByRole('status').element().textContent).toBe('')
})
