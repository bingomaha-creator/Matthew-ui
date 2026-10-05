import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { SourceList } from './index'
import '../../styles/index.scss'
import './SourceList.scss'

const items = [{ id: 'one', title: 'Plain title', summary: 'Full summary\nSecond line', source: 'Local document' }, { id: 'two', title: 'Linked title', href: 'https://example.com' }]

test('framed layout preserves the fixed visual contract, plain mode stays lightweight', async () => {
  const screen = await render(<div style={{ width: 600 }}><SourceList items={items} title="Evidence" defaultOpen /><SourceList items={items} /></div>)
  const [root, plain] = screen.container.querySelectorAll('.matthew-source-list')
  const styles = getComputedStyle(root)
  expect(styles.borderTopWidth).toBe('1px')
  expect(styles.borderRadius).toBe('8px')
  expect(styles.backgroundColor).toBe('rgb(255, 255, 255)')
  expect(styles.boxShadow).toBe('none')
  expect(root.getBoundingClientRect().width).toBe(600)
  const header = getComputedStyle(root.querySelector('button')!)
  expect(header.minHeight).toBe('40px')
  expect(header.fontSize).toBe('14px')
  expect(header.fontWeight).toBe('500')
  const item = getComputedStyle(root.querySelector('li')!)
  expect(item.paddingBlockStart).toBe('12px')
  expect(item.paddingInlineStart).toBe('12px')
  expect(getComputedStyle(root.querySelector('a')!).color).toBe('rgb(30, 64, 175)')
  const summary = getComputedStyle(root.querySelector('p')!)
  expect(summary.fontSize).toBe('13px')
  expect(summary.whiteSpace).toBe('pre-wrap')
  expect(summary.overflowWrap).toBe('anywhere')
  expect(getComputedStyle(plain).borderTopWidth).toBe('0px')
  expect(getComputedStyle(plain).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  expect(getComputedStyle(plain.querySelector('li')!).paddingInlineStart).toBe('0px')
})

test('long text wraps in a narrow parent at normal and enlarged root font sizes', async () => {
  const screen = await render(<div style={{ width: 320 }}><SourceList title={'Heading'.repeat(30)} items={[{ id: 'long', title: 'url'.repeat(100), summary: 'Evidence'.repeat(150), source: 'origin'.repeat(50) }]} defaultOpen /></div>)
  const root = screen.container.querySelector('.matthew-source-list') as HTMLElement
  const original = document.documentElement.style.fontSize
  try {
    for (const size of ['16px', '32px']) {
      document.documentElement.style.fontSize = size
      expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
      for (const text of root.querySelectorAll('span, p')) expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth + 1)
    }
  } finally { document.documentElement.style.fontSize = original }
})
