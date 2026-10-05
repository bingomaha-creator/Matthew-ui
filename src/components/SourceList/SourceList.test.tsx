import { createRef, StrictMode, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { renderToStaticMarkup } from 'react-dom/server'
import { SourceList, type SourceListItem } from './index'

const items: readonly SourceListItem[] = [
  { id: 'doc', title: 'Project document', summary: 'Full evidence\nSecond line', source: 'Local document' },
  { id: 'web', title: 'Web source', href: 'https://example.com', summary: 'Web evidence', source: 'example.com' },
]

test('plain mode renders text and semantic list with a div ref and root attributes', async () => {
  const ref = createRef<HTMLDivElement>()
  const screen = await render(<SourceList ref={ref} items={items} data-example="yes" aria-label="Sources" />)
  expect(ref.current).toBeInstanceOf(HTMLDivElement)
  expect(ref.current).toHaveAttribute('data-example', 'yes')
  expect(screen.getByRole('list').element().tagName).toBe('UL')
  expect(screen.getByRole('listitem').elements()).toHaveLength(2)
  await expect.element(screen.getByText('Full evidence', { exact: false })).toBeVisible()
  expect(ref.current!.querySelector('button')).toBeNull()
})

test('links allow only HTTP(S) and relative URLs, with safe new-tab relationships', async () => {
  const allowed = ['https://example.com', 'HTTP://example.com', '/docs', './docs', '../docs', '?q=x', '#evidence', '//example.com/docs']
  const rejected = ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,x', 'vbscript:x', 'file:///tmp/x', 'blob:https://example.com/x', 'mailto:a@example.com', 'tel:123', 'app:x', 'https://[', '', '   ']
  const screen = await render(<SourceList items={[
    ...allowed.map((href, i) => ({ id: `a${i}`, title: `safe ${i}`, href, target: '_blank' as const })),
    ...rejected.map((href, i) => ({ id: `r${i}`, title: `unsafe ${i}`, href })),
    { id: 'self', title: 'self', href: '/self' },
  ]} />)
  expect(screen.getByRole('link').elements()).toHaveLength(allowed.length + 1)
  for (let i = 0; i < allowed.length; i++) {
    expect(screen.getByRole('link', { name: `safe ${i}`, exact: true }).element()).toHaveAttribute('rel', 'noopener noreferrer')
  }
  for (let i = 0; i < rejected.length; i++) expect(screen.getByText(`unsafe ${i}`, { exact: true }).element().tagName).toBe('SPAN')
  expect(screen.getByRole('link', { name: 'self', exact: true }).element()).toHaveAttribute('target', '_self')
})

test('titled lists default to collapsed, keep content mounted, and toggle with native keyboard', async () => {
  const screen = await render(<SourceList items={items} title="Sources" />)
  const header = screen.getByRole('button', { name: 'Sources 2' })
  const list = screen.container.querySelector('ul')!
  expect(header.element()).toHaveAttribute('aria-expanded', 'false')
  expect(list).toHaveAttribute('hidden')
  expect(list.children).toHaveLength(2)
  header.element().focus()
  await userEvent.keyboard('{Enter}')
  await expect.element(header).toHaveAttribute('aria-expanded', 'true')
  expect(list.hidden).toBe(false)
  expect(header.element().getAttribute('aria-controls')).toBe(list.id)
  await userEvent.keyboard(' ')
  await expect.element(header).toHaveAttribute('aria-expanded', 'false')
})

test('controlled collapse returns focus from a linked or programmatically focused item, but not outside', async () => {
  const focusItems = [{ ...items[1], domId: 'source-focus-example' }]
  const screen = await render(<><button>Outside</button><SourceList items={focusItems} title="Evidence" open /></>)
  screen.getByRole('link').element().focus()
  await screen.rerender(<><button>Outside</button><SourceList items={focusItems} title="Evidence" open={false} /></>)
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Evidence 1' }).element())
  await screen.rerender(<><button>Outside</button><SourceList items={focusItems} title="Evidence" open /></>)
  const item = screen.container.querySelector('#source-focus-example') as HTMLElement
  expect(item.tabIndex).toBe(-1)
  item.focus()
  await screen.rerender(<><button>Outside</button><SourceList items={focusItems} title="Evidence" open={false} /></>)
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Evidence 1' }).element())
  screen.getByRole('button', { name: 'Outside', exact: true }).element().focus()
  await screen.rerender(<><button>Outside</button><SourceList items={focusItems} title="Evidence" open /></>)
  await screen.rerender(<><button>Outside</button><SourceList items={focusItems} title="Evidence" open={false} /></>)
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Outside', exact: true }).element())
})

test('controlled requests do not mutate display, while defaultOpen is initial-only', async () => {
  const changed = vi.fn()
  const screen = await render(<SourceList items={items} title="Sources" open={false} onOpenChange={changed} />)
  await screen.getByRole('button').click()
  expect(changed).toHaveBeenLastCalledWith(true)
  expect(screen.getByRole('button').element()).toHaveAttribute('aria-expanded', 'false')
  await screen.rerender(<SourceList items={items} title="Sources" open onOpenChange={changed} />)
  expect(changed).toHaveBeenCalledTimes(1)
  await screen.unmount()
  const uncontrolled = await render(<SourceList items={items} title="Sources" defaultOpen onOpenChange={changed} />)
  await uncontrolled.rerender(<SourceList items={items} title="Sources" defaultOpen={false} onOpenChange={changed} />)
  expect(uncontrolled.getByRole('button').element()).toHaveAttribute('aria-expanded', 'true')
  await uncontrolled.getByRole('button').click()
  expect(changed).toHaveBeenLastCalledWith(false)
})

test('empty and whitespace titles use plain mode without resetting expansion state', async () => {
  const changed = vi.fn()
  const screen = await render(<SourceList items={items} title="Sources" defaultOpen onOpenChange={changed} />)
  await screen.rerender(<SourceList items={items} title="  " open={false} onOpenChange={changed} />)
  expect(screen.container.querySelector('button')).toBeNull()
  await expect.element(screen.getByRole('list')).toBeVisible()
  await screen.rerender(<SourceList items={items} title="Sources" onOpenChange={changed} />)
  expect(screen.getByRole('button').element()).toHaveAttribute('aria-expanded', 'true')
  expect(changed).not.toHaveBeenCalled()
})

test('empty lists keep a toggle and list, omit count, and item changes preserve state and keyed nodes', async () => {
  const changed = vi.fn()
  const screen = await render(<SourceList items={items} title="Sources" defaultOpen onOpenChange={changed} />)
  const first = screen.container.querySelector('li')
  await screen.rerender(<SourceList items={[items[1], { ...items[0], title: 'Updated', href: '/new' }]} title="Sources" onOpenChange={changed} />)
  expect(screen.container.querySelectorAll('li')[1]).toBe(first)
  expect(screen.getByRole('listitem').elements().map(el => el.textContent)).toEqual([expect.stringContaining('Web source'), expect.stringContaining('Updated')])
  await screen.rerender(<SourceList items={[]} title="Sources" onOpenChange={changed} />)
  expect(screen.getByRole('button').element()).toHaveAccessibleName('Sources')
  expect(screen.getByRole('list').element().children).toHaveLength(0)
  await screen.rerender(<SourceList items={items} title="Sources" onOpenChange={changed} />)
  expect(screen.getByRole('button').element()).toHaveAttribute('aria-expanded', 'true')
  expect(changed).not.toHaveBeenCalled()
})

test('data IDs stay separate from DOM IDs and multiple lists have distinct disclosure IDs', async () => {
  const screen = await render(<><SourceList items={items} title="One" /><SourceList items={items} title="Two" /></>)
  const lists = [...screen.container.querySelectorAll('ul')]
  expect(new Set(lists.map(list => list.id)).size).toBe(2)
  for (const li of screen.container.querySelectorAll('li')) {
    expect(li.hasAttribute('id')).toBe(false)
    expect(li.hasAttribute('tabindex')).toBe(false)
  }
  expect(screen.container.querySelector('[aria-live], [aria-selected], [aria-current], [aria-checked]')).toBeNull()
})

test('conflicting open props warn once in StrictMode and controlled state wins', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    const screen = await render(<StrictMode><SourceList items={items} title="Sources" open={false} defaultOpen /></StrictMode>)
    await screen.rerender(<StrictMode><SourceList items={items} title="Sources" open defaultOpen /></StrictMode>)
    expect(warn).toHaveBeenCalledExactlyOnceWith('SourceList received both open and defaultOpen. defaultOpen will be ignored.')
    expect(screen.getByRole('button').element()).toHaveAttribute('aria-expanded', 'true')
  } finally { warn.mockRestore() }
})

test('plain text is escaped and SSR supports collapsed lists without a DOM', () => {
  const html = renderToStaticMarkup(<SourceList title="Evidence" items={[{ id: 'x', title: '<script>alert(1)</script>', summary: '<b>plain</b>', source: '<img>', href: 'javascript:alert(1)' }]} />)
  expect(html).toContain('hidden=""')
  expect(html).toContain('&lt;script&gt;')
  expect(html).not.toContain('<script>')
  expect(html).not.toContain('href=')
})

test('business-owned expand then focus works without automatic focus or scrolling', async () => {
  function Example() {
    const [open, setOpen] = useState(false)
    return <><button onClick={() => setOpen(true)}>Locate</button><SourceList title="Evidence" items={[{ id: 'x', title: 'Evidence one', domId: 'evidence-example' }]} open={open} onOpenChange={setOpen} /></>
  }
  const screen = await render(<Example />)
  await screen.getByRole('button', { name: 'Locate', exact: true }).click()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Locate', exact: true }).element())
  const evidence = screen.container.querySelector('#evidence-example') as HTMLElement
  evidence.focus()
  expect(document.activeElement).toBe(evidence)
})

test('removing focused items does not focus another item or report an expansion change', async () => {
  const changed = vi.fn()
  const screen = await render(<SourceList title="Evidence" defaultOpen items={[{ ...items[0], domId: 'removed-source' }, items[1]]} onOpenChange={changed} />)
  ;(screen.container.querySelector('#removed-source') as HTMLElement).focus()
  await screen.rerender(<SourceList title="Evidence" items={[items[1]]} onOpenChange={changed} />)
  expect(document.activeElement).not.toBe(screen.getByRole('link').element())
  expect(screen.getByRole('button').element()).toHaveAttribute('aria-expanded', 'true')
  expect(changed).not.toHaveBeenCalled()
})

test('root native events and styles are preserved; empty fields do not create paragraphs', async () => {
  const click = vi.fn()
  const screen = await render(<SourceList className="custom-source" style={{ maxWidth: 300 }} onClick={click} items={[{ id: 'one', title: 'Plain', summary: '', source: '' }]} />)
  await screen.getByText('Plain').click()
  expect(click).toHaveBeenCalledTimes(1)
  const root = screen.container.querySelector('.custom-source') as HTMLElement
  expect(root.style.maxWidth).toBe('300px')
  expect(root.querySelector('p')).toBeNull()
})
