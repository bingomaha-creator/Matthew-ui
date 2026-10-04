import { createRef, StrictMode, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { Dialog } from './index'
import '../../styles/index.scss'
import { Select } from '../Select'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { darkTheme } from '../../theme'
import { renderToStaticMarkup } from 'react-dom/server'

test('opens a native modal with a named title and dialog DOM ref, retaining its children when closed', async () => {
  const ref = createRef<HTMLDialogElement>()
  const change = vi.fn()
  const view = (open: boolean) => <Dialog ref={ref} open={open} onOpenChange={change}
    title="Edit note" closeLabel="Close note" data-example="true"><input defaultValue="Draft" aria-label="Draft" /></Dialog>
  const screen = await render(view(true))
  await expect.element(screen.getByRole('dialog', { name: 'Edit note' })).toBeVisible()
  expect(ref.current).toBeInstanceOf(HTMLDialogElement)
  expect(ref.current!.matches(':modal')).toBe(true)
  expect(ref.current).toHaveAttribute('data-example', 'true')
  const input = screen.getByRole('textbox').element()
  await screen.rerender(view(false))
  expect(ref.current!.open).toBe(false)
  expect(ref.current!.querySelector('input')).toBe(input)
  expect(change).not.toHaveBeenCalled()
})

test('Escape and the close button request closure without bypassing a refusing controlled parent', async () => {
  const change = vi.fn()
  const screen = await render(<Dialog open onOpenChange={change} title="Controlled" closeLabel="Close">Content</Dialog>)
  await userEvent.keyboard('{Escape}')
  expect(change).toHaveBeenLastCalledWith(false)
  expect(screen.getByRole('dialog').element().matches(':modal')).toBe(true)
  await screen.getByRole('button', { name: 'Close', exact: true }).click()
  expect(change).toHaveBeenCalledTimes(2)
  expect(screen.getByRole('dialog').element().matches(':modal')).toBe(true)
})

test('places initial focus at the title or an explicit internal target and restores the opener', async () => {
  const ref = createRef<HTMLDialogElement>()
  const input = createRef<HTMLInputElement>()
  const view = (open: boolean, explicit = false) => <><button type="button">Open</button>
    <Dialog ref={ref} open={open} onOpenChange={() => {}} title="Focus" closeLabel="Close"
      initialFocus={explicit ? () => input.current : undefined}><input ref={input} aria-label="Edit" /></Dialog></>
  const screen = await render(view(false))
  await screen.getByRole('button', { name: 'Open', exact: true }).click()
  await screen.rerender(view(true))
  expect(document.activeElement).toBe(ref.current!.querySelector('h2'))
  await screen.rerender(view(false))
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open', exact: true }).element())
  await screen.rerender(view(true, true))
  expect(document.activeElement).toBe(input.current)
  await screen.unmount()
  expect(document.querySelector(':modal')).toBeNull()
})

test('backdrop dismissal is opt-in and requires both ends of the pointer gesture outside the panel', async () => {
  const ref = createRef<HTMLDialogElement>()
  const change = vi.fn()
  const view = (allow = false, dismissible = true) => <Dialog ref={ref} open title="Backdrop" closeLabel="Close"
    closeOnBackdrop={allow} dismissible={dismissible} onOpenChange={change}><p>Content</p></Dialog>
  const screen = await render(view())
  const outside = (type: string) => {
    const r = ref.current!.getBoundingClientRect()
    ref.current!.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, clientX: r.left - 5, clientY: r.top - 5 }))
  }
  outside('pointerdown'); outside('pointerup')
  expect(change).not.toHaveBeenCalled()
  await screen.rerender(view(true))
  outside('pointerdown'); outside('pointerup')
  expect(change).toHaveBeenCalledTimes(1)
  change.mockClear()
  ref.current!.querySelector('p')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }))
  outside('pointerup')
  expect(change).not.toHaveBeenCalled()
  await screen.rerender(view(true, false))
  outside('pointerdown'); outside('pointerup'); await userEvent.keyboard('{Escape}')
  expect(change).not.toHaveBeenCalled()
  await expect.element(screen.getByRole('button', { name: 'Close', exact: true })).toBeDisabled()
})

test('locks document scrolling while any modal remains open and restores the exact original style', async () => {
  const root = document.documentElement
  const value = root.style.getPropertyValue('overflow')
  const priority = root.style.getPropertyPriority('overflow')
  root.style.setProperty('overflow', 'scroll', 'important')
  try {
    const view = (first: boolean, second: boolean) => <>
      <Dialog open={first} title="One" closeLabel="Close one" onOpenChange={() => {}}>One</Dialog>
      <Dialog open={second} title="Two" closeLabel="Close two" onOpenChange={() => {}}>Two</Dialog>
    </>
    const screen = await render(view(true, true))
    expect(root.style.overflow).toBe('hidden')
    await screen.rerender(view(false, true))
    expect(root.style.overflow).toBe('hidden')
    await screen.unmount()
    expect(root.style.overflow).toBe('scroll')
    expect(root.style.getPropertyPriority('overflow')).toBe('important')
  } finally {
    if (value) root.style.setProperty('overflow', value, priority)
    else root.style.removeProperty('overflow')
  }
})

test('uses the agreed default panel, typography, padding and independent scrolling layout', async () => {
  const ref = createRef<HTMLDialogElement>()
  await render(<Dialog ref={ref} open title="Style" closeLabel="Close" onOpenChange={() => {}}
    footer={<button type="button">Save</button>}><p>Body</p></Dialog>)
  const node = ref.current!
  const style = getComputedStyle(node)
  // Vitest 的真实浏览器 iframe 默认是窄视口；512px 固定值另由打包端宽视口验收。
  expect(node.getBoundingClientRect().width).toBeLessThanOrEqual(512)
  expect(node.getBoundingClientRect().left).toBeGreaterThanOrEqual(16)
  expect(style.backgroundColor).toBe('rgb(255, 255, 255)')
  expect(style.fontSize).toBe('14px')
  expect(style.borderRadius).toBe('8px')
  expect(style.borderTopWidth).toBe('1px')
  expect(getComputedStyle(node.querySelector('h2')!).fontSize).toBe('16px')
  expect(getComputedStyle(node.querySelector('h2')!).fontWeight).toBe('500')
  expect(getComputedStyle(node.querySelector('.matthew-dialog__content')!).padding).toBe('20px')
  expect(getComputedStyle(node.querySelector('.matthew-dialog__content')!).overflowY).toBe('auto')
  expect(getComputedStyle(node, '::backdrop').backgroundColor).toBe('rgba(15, 23, 42, 0.45)')
})

test('uses native tab containment and blocks focus moving to background elements', async () => {
  const ref = createRef<HTMLDialogElement>()
  const screen = await render(<><button type="button">Background</button><Dialog ref={ref} open title="Tab"
    closeLabel="Close" onOpenChange={() => {}} footer={<button type="button">Last</button>}><input aria-label="Edit" /></Dialog></>)
  const outside = screen.getByRole('button', { name: 'Background', exact: true }).element()
  outside.focus()
  expect(ref.current!.contains(document.activeElement)).toBe(true)
  await screen.getByRole('button', { name: 'Last', exact: true }).click()
  await userEvent.keyboard('{Tab}')
  // Chromium 的原生模态可经过浏览器 chrome，但不能进入背景文档。
  expect(document.activeElement).not.toBe(outside)
  await userEvent.keyboard('{Tab}')
  expect(ref.current!.contains(document.activeElement)).toBe(true)
  await screen.getByRole('button', { name: 'Close', exact: true }).click()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(document.activeElement).not.toBe(outside)
})

test('a Select hosted inside Dialog consumes the first Escape and Dialog receives the second', async () => {
  const ref = createRef<HTMLDialogElement>()
  const change = vi.fn()
  const screen = await render(<Dialog ref={ref} open title="Select modal" closeLabel="Close" onOpenChange={change}>
    <Select value="a" options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]}
      onValueChange={() => {}} aria-label="Choice" popupHost={() => ref.current} />
  </Dialog>)
  await screen.getByRole('combobox').click()
  expect(ref.current!.contains(document.querySelector('[role="listbox"]'))).toBe(true)
  await userEvent.keyboard('{Escape}')
  expect(change).not.toHaveBeenCalled()
  expect(document.querySelector('[role="listbox"]')).toBeNull()
  await userEvent.keyboard('{Escape}')
  expect(change).toHaveBeenCalledExactlyOnceWith(false)
  expect(ref.current!.matches(':modal')).toBe(true)
})

test('closing and reopening preserves a user-edited draft and never invents footer buttons', async () => {
  function Demo() {
    const [open, setOpen] = useState(true)
    return <><button type="button" onClick={() => setOpen(true)}>Reopen</button>
      <Dialog open={open} onOpenChange={setOpen} title="Draft" closeLabel="Close"><input defaultValue="Original" aria-label="Draft" /></Dialog></>
  }
  const screen = await render(<Demo />)
  await screen.getByRole('textbox').fill('Edited draft')
  expect(screen.getByRole('dialog').element().querySelector('footer')).toBeNull()
  await screen.getByRole('button', { name: 'Close', exact: true }).click()
  await screen.getByRole('button', { name: 'Reopen', exact: true }).click()
  await expect.element(screen.getByRole('textbox')).toHaveValue('Edited draft')
})

test('StrictMode cleanup releases modality and scrolling without reporting user closure', async () => {
  const change = vi.fn()
  const previous = document.documentElement.style.overflow
  const screen = await render(<StrictMode><Dialog open onOpenChange={change} title="Strict" closeLabel="Close">Content</Dialog></StrictMode>)
  expect(document.querySelector(':modal')).not.toBeNull()
  await screen.unmount()
  expect(document.querySelector(':modal')).toBeNull()
  expect(document.documentElement.style.overflow).toBe(previous)
  expect(change).not.toHaveBeenCalled()
})

test('separate instances own their labels and explicit accessible names can replace the default title', async () => {
  const first = createRef<HTMLDialogElement>(); const second = createRef<HTMLDialogElement>()
  const screen = await render(<><Dialog ref={first} open={false} title="One" closeLabel="Close" onOpenChange={() => {}}>A</Dialog>
    <Dialog ref={second} open title={<span>Two</span>} aria-label="Custom" closeLabel="Close" onOpenChange={() => {}}>B</Dialog></>)
  expect(first.current!.getAttribute('aria-labelledby')).not.toBe(second.current!.querySelector('h2')!.id)
  expect(document.getElementById(first.current!.getAttribute('aria-labelledby')!)).toBe(first.current!.querySelector('h2'))
  await expect.element(screen.getByRole('dialog', { name: 'Custom' })).toBeVisible()
  expect(second.current!.hasAttribute('tabindex')).toBe(false)
})

test('SSR retains a closed shell and children even when the caller requests an initially open modal', () => {
  const html = renderToStaticMarkup(<Dialog open title="SSR" closeLabel="Close" onOpenChange={() => {}}>Content</Dialog>)
  expect(html).toContain('<dialog')
  expect(html).toContain('Content')
  expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/)
})

test('a native autofocus attribute is honored and invalid explicit targets fall back safely', async () => {
  const outside = document.createElement('button'); document.body.append(outside)
  const input = createRef<HTMLInputElement>()
  try {
    const view = (open: boolean, invalid = false) => <Dialog open={open} title="Initial" closeLabel="Close"
      onOpenChange={() => {}} initialFocus={invalid ? () => outside : undefined}><input ref={input} aria-label="Auto" /></Dialog>
    const screen = await render(view(false))
    // React autoFocus 是 mount 时的 focus 请求，不保证生成原生 attribute；验证两者不混淆。
    input.current!.setAttribute('autofocus', '')
    await screen.rerender(view(true))
    expect(document.activeElement).toBe(screen.getByRole('textbox').element())
    await screen.rerender(view(false)); await screen.rerender(view(true, true))
    expect(document.activeElement).toBe(screen.getByRole('heading').element())
  } finally { outside.remove() }
})

test('component colors, dimensions and backdrop custom properties work in a dark inherited source scope', async () => {
  const ref = createRef<HTMLDialogElement>()
  const view = (override: boolean) => <ThemeProvider theme={{ ...darkTheme, components: { Dialog: { titleColor: 'green' } } }}>
    <ThemeProvider theme={{ components: { Dialog: override ? {
      background: '#112233', color: '#eeeeee', borderColor: 'blue', backdropBackground: 'rgba(0, 0, 0, 0.7)',
      titleColor: 'purple', closeColor: 'cyan', closeHoverBackground: '#334455', shadow: 'none',
      borderRadius: 12, titleFontSize: 20, contentPaddingBlock: 8, contentPaddingInline: 24,
    } : {} } }}><Dialog ref={ref} open title="Theme" closeLabel="Close" onOpenChange={() => {}}>Body</Dialog></ThemeProvider>
  </ThemeProvider>
  const screen = await render(view(true))
  const node = ref.current!
  expect(getComputedStyle(node).backgroundColor).toBe('rgb(17, 34, 51)')
  expect(getComputedStyle(node).color).toBe('rgb(238, 238, 238)')
  expect(getComputedStyle(node).borderTopColor).toBe('rgb(0, 0, 255)')
  expect(getComputedStyle(node).boxShadow).toBe('none')
  expect(getComputedStyle(node).borderRadius).toBe('12px')
  expect(getComputedStyle(node.querySelector('h2')!).fontSize).toBe('20px')
  expect(getComputedStyle(node.querySelector('h2')!).color).toBe('rgb(128, 0, 128)')
  expect(getComputedStyle(node.querySelector('.matthew-dialog__content')!).padding).toBe('8px 24px')
  expect(getComputedStyle(node, '::backdrop').backgroundColor).toBe('rgba(0, 0, 0, 0.7)')
  const close = screen.getByRole('button', { name: 'Close', exact: true })
  expect(getComputedStyle(close.element()).color).toBe('rgb(0, 255, 255)')
  await close.hover()
  await expect.poll(() => getComputedStyle(close.element()).backgroundColor).toBe('rgb(51, 68, 85)')
  await screen.rerender(view(false))
  expect(ref.current).toBe(node)
  expect(getComputedStyle(node).backgroundColor).toBe('rgb(30, 41, 59)')
  expect(getComputedStyle(node.querySelector('h2')!).color).toBe('rgb(0, 128, 0)')
})

test('a backdrop pointer gesture cannot survive closing and reopening the modal', async () => {
  const ref = createRef<HTMLDialogElement>()
  const change = vi.fn()
  const view = (open: boolean) => <Dialog ref={ref} open={open} closeOnBackdrop title="Pointer lifetime" closeLabel="Close" onOpenChange={change}>Content</Dialog>
  const screen = await render(view(true))
  const dispatch = (type: string) => {
    const r = ref.current!.getBoundingClientRect()
    ref.current!.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, pointerId: 2, clientX: r.left - 5, clientY: r.top - 5 }))
  }
  dispatch('pointerdown')
  await screen.rerender(view(false)); await screen.rerender(view(true))
  dispatch('pointerup')
  expect(change).not.toHaveBeenCalled()
})

test('rerenders use the latest close callback without moving the current editing focus', async () => {
  const first = vi.fn(); const latest = vi.fn(); const input = createRef<HTMLInputElement>()
  const view = (callback: (value: boolean) => void) => <Dialog open title="Latest" closeLabel="Close"
    onOpenChange={callback} initialFocus={() => input.current}><input ref={input} aria-label="Edit" /></Dialog>
  const screen = await render(view(first))
  await screen.getByRole('textbox').fill('Editing')
  await screen.rerender(view(latest))
  expect(document.activeElement).toBe(input.current)
  await userEvent.keyboard('{Escape}')
  expect(first).not.toHaveBeenCalled()
  expect(latest).toHaveBeenCalledExactlyOnceWith(false)
  expect(document.activeElement).toBe(input.current)
})

test('normal form submission belongs to the caller rather than closing or resetting Dialog', async () => {
  const submit = vi.fn(); const close = vi.fn()
  const screen = await render(<Dialog open title="Form" closeLabel="Close" onOpenChange={close}
    footer={<button type="submit" form="dialog-test-form">Submit</button>}>
    <form id="dialog-test-form" onSubmit={event => { event.preventDefault(); submit() }}><input aria-label="Edit" defaultValue="Draft" /></form>
  </Dialog>)
  await screen.getByRole('button', { name: 'Submit', exact: true }).click()
  expect(submit).toHaveBeenCalledOnce()
  expect(close).not.toHaveBeenCalled()
  expect(screen.getByRole('dialog').element().matches(':modal')).toBe(true)
  await expect.element(screen.getByRole('textbox')).toHaveValue('Draft')
})
