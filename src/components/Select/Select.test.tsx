import { createRef, type CSSProperties } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { Select } from './index'
import '../../styles/index.scss'

const options = [
  { value: '', label: 'All' },
  { value: 'a', label: 'Alpha' },
  { value: 'blocked', label: 'Blocked', disabled: true },
  { value: 'b', label: 'Beta' },
]

test('exposes a button combobox ref and displays the controlled label including empty string', async () => {
  const ref = createRef<HTMLButtonElement>()
  const screen = await render(<Select ref={ref} value="" onValueChange={vi.fn()} options={options}
    aria-label="Choice" title="Hint" className="local" />)
  const button = screen.getByRole('combobox', { name: 'Choice' })
  await expect.element(button).toHaveTextContent('All')
  expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  expect(ref.current).toHaveAttribute('type', 'button')
  expect(ref.current).toHaveAttribute('title', 'Hint')
  expect(ref.current).toHaveClass('local')
})

test('keeps source CSS theme and trigger geometry when its popup is portalled to body', async () => {
  const screen = await render(<div style={{ width: 240, fontFamily: 'monospace',
    '--matthew-ui-color-surface': '#101820', '--matthew-ui-color-text': '#eeeeee',
  } as CSSProperties}>
    <Select value="a" options={options} onValueChange={vi.fn()} aria-label="Choice" />
  </div>)
  const button = screen.getByRole('combobox')
  await button.click()
  const list = document.querySelector<HTMLElement>('[role="listbox"]')!
  await expect.poll(() => getComputedStyle(list).backgroundColor).toBe('rgb(16, 24, 32)')
  expect(getComputedStyle(list).fontFamily).toBe('monospace')
  expect(getComputedStyle(button.element()).minHeight).toBe('40px')
  expect(Math.abs(list.getBoundingClientRect().width - button.element().getBoundingClientRect().width)).toBeLessThan(1)
  expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(button.element().getBoundingClientRect().bottom)
})

test('Escape, Tab and outside clicks close without commitment or stealing outside focus', async () => {
  const change = vi.fn()
  const screen = await render(<><Select value="a" options={options} onValueChange={change} aria-label="Choice" />
    <button type="button" style={{ display: 'block', marginTop: 250 }}>Outside</button></>)
  const button = screen.getByRole('combobox')
  await button.click(); await userEvent.keyboard('{ArrowDown}{Escape}')
  expect(change).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(button.element())
  await button.click(); await userEvent.keyboard('{ArrowDown}{Tab}')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Outside' }).element())
  await expect.element(button).toHaveAttribute('aria-expanded', 'false')
  await button.click(); await screen.getByRole('button', { name: 'Outside' }).click()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Outside' }).element())
  expect(change).not.toHaveBeenCalled()
})

test('Home, End, cycling and same-value confirmation use enabled options only', async () => {
  const change = vi.fn()
  const screen = await render(<Select value="a" options={options} onValueChange={change} aria-label="Choice" />)
  const button = screen.getByRole('combobox')
  await button.click(); await userEvent.keyboard('{Home}{ArrowUp}')
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('Beta')
  await userEvent.keyboard('{ArrowDown}')
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('All')
  await userEvent.keyboard('{End}{ArrowUp}{Enter}')
  expect(change).not.toHaveBeenCalled()
  await expect.element(button).toHaveAttribute('aria-expanded', 'false')
})

test('empty options disable but all-disabled options still open without an active descendant', async () => {
  const change = vi.fn()
  const screen = await render(<Select value="bad" placeholder="Choose" options={[]} onValueChange={change} />)
  const button = screen.getByRole('combobox')
  await expect.element(button).toBeDisabled()
  await expect.element(button).toHaveTextContent('Choose')
  await screen.rerender(<Select value="a" options={options.map(option => ({ ...option, disabled: true }))} onValueChange={change} />)
  await button.click()
  expect(button.element().hasAttribute('aria-activedescendant')).toBe(false)
  await userEvent.keyboard('{ArrowDown}{End}{Enter}')
  expect(change).not.toHaveBeenCalled()
  expect(document.querySelectorAll('[role="option"]')).toHaveLength(4)
  await screen.rerender(<Select value="a" options={[]} onValueChange={change} />)
  await expect.element(button).toBeDisabled()
  expect(document.querySelector('[role="listbox"]')).toBeNull()
})

test('dynamic options preserve value identity, fall back immediately and close on explicit disable', async () => {
  const change = vi.fn()
  const view = (items = options, disabled = false) => <Select value="a" options={items} disabled={disabled} onValueChange={change} />
  const screen = await render(view())
  const button = screen.getByRole('combobox')
  await button.click(); await userEvent.keyboard('{ArrowDown}')
  const activeId = button.element().getAttribute('aria-activedescendant')!
  const beta = document.getElementById(activeId)
  await screen.rerender(view([...options].reverse()))
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toBe(beta)
  await screen.rerender(view(options.filter(option => option.value !== 'b')))
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('Alpha')
  await screen.rerender(view(options, true))
  await expect.element(button).toHaveAttribute('aria-expanded', 'false')
  expect(change).not.toHaveBeenCalled()
})

test('pointer selection preserves focus, supports empty values and forwards each event once', async () => {
  const change = vi.fn(); const click = vi.fn(); const key = vi.fn()
  const screen = await render(<Select value="a" options={options} onValueChange={change} onClick={click} onKeyDown={key} />)
  const button = screen.getByRole('combobox')
  await button.click()
  const list = document.querySelector('[role="listbox"]')!
  ;(list.querySelector('[role="option"]') as HTMLElement).click()
  await expect.poll(() => change.mock.calls.length).toBe(1)
  expect(change).toHaveBeenCalledWith('')
  expect(click).toHaveBeenCalledTimes(1)
  expect(document.activeElement).toBe(button.element())
  await userEvent.keyboard('{ArrowUp}')
  expect(key).toHaveBeenCalledTimes(1)
})

test('unique instances have no dangling ARIA references and do not submit their enclosing form', async () => {
  const submit = vi.fn(event => event.preventDefault())
  const screen = await render(<form onSubmit={submit} style={{ display: 'flex', gap: 100 }}>
    <Select value="a" options={options} onValueChange={vi.fn()} aria-label="First" />
    <Select value="b" options={options} onValueChange={vi.fn()} aria-label="Second" />
  </form>)
  const first = screen.getByRole('combobox', { name: 'First' })
  const second = screen.getByRole('combobox', { name: 'Second' })
  await first.click()
  const firstId = first.element().getAttribute('aria-controls')
  await second.click()
  expect(second.element().getAttribute('aria-controls')).not.toBe(firstId)
  expect(document.getElementById(second.element().getAttribute('aria-activedescendant')!)).not.toBeNull()
  expect(first.element().hasAttribute('aria-controls')).toBe(false)
  expect(submit).not.toHaveBeenCalled()
})

test('a clipping transformed host constrains popup height instead of cutting off its options', async () => {
  const hostRef = createRef<HTMLDivElement>()
  const screen = await render(<div ref={hostRef} style={{ transform: 'translateX(20px)', height: 200, overflow: 'hidden', width: 240, paddingTop: 120 }}>
    <Select value="a" options={options} onValueChange={vi.fn()} popupHost={() => hostRef.current} />
  </div>)
  await screen.getByRole('combobox').click()
  const list = hostRef.current!.querySelector<HTMLElement>('[role="listbox"]')!
  await expect.poll(() => list.getBoundingClientRect().bottom).toBeLessThanOrEqual(hostRef.current!.getBoundingClientRect().bottom)
  expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(hostRef.current!.getBoundingClientRect().top)
})

test('invalid value shows only placeholder and disabled selected options retain the check but not active color', async () => {
  const screen = await render(<Select value="unknown" options={options} placeholder="Choose" onValueChange={vi.fn()} />)
  const button = screen.getByRole('combobox')
  await expect.element(button).toHaveTextContent('Choose')
  await screen.rerender(<Select value="blocked" options={options} onValueChange={vi.fn()} />)
  await button.click()
  const selected = document.querySelector<HTMLElement>('[aria-selected="true"]')!
  expect(selected).toHaveTextContent('Blocked')
  expect(getComputedStyle(selected).color).toBe('rgb(100, 116, 139)')
  expect(getComputedStyle(selected.querySelector('.matthew-select__check')!).visibility).toBe('visible')
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('All')
})

test('transformed scrolling host positions the popup in the same viewport coordinates as its trigger', async () => {
  const hostRef = createRef<HTMLDivElement>()
  const screen = await render(<div ref={hostRef} style={{ transform: 'translate(50px, 20px) scale(0.9)', width: 260, padding: 16 }}>
    <Select value="a" options={options} onValueChange={vi.fn()} popupHost={() => hostRef.current} />
  </div>)
  const button = screen.getByRole('combobox')
  await button.click()
  const list = hostRef.current!.querySelector<HTMLElement>('[role="listbox"]')!
  expect(list).not.toBeNull()
  await expect.poll(() => Math.abs(list.getBoundingClientRect().left - button.element().getBoundingClientRect().left)).toBeLessThan(1)
  expect(Math.abs(list.getBoundingClientRect().width - button.element().getBoundingClientRect().width)).toBeLessThan(1)
})

test('an open Portal follows ancestor data attribute theme changes and removal without rerendering', async () => {
  const screen = await render(<div data-select-theme="light" style={{ width: 240 }}>
    <style>{`
      [data-select-theme="light"] { --matthew-ui-select-popup-background: rgb(240, 241, 242); }
      [data-select-theme="dark"] { --matthew-ui-select-popup-background: rgb(10, 20, 30); }
    `}</style>
    <Select value="a" options={options} onValueChange={vi.fn()} aria-label="Attribute theme" />
  </div>)
  const button = screen.getByRole('combobox')
  await button.click()
  const list = document.getElementById(button.element().getAttribute('aria-controls')!)!
  await expect.poll(() => getComputedStyle(list).backgroundColor).toBe('rgb(240, 241, 242)')
  // 等首次 ResizeObserver 通知完成，避免它意外替代属性观察而让旧实现通过。
  await new Promise(resolve => setTimeout(resolve, 100))
  const ancestor = button.element().parentElement!
  ancestor.setAttribute('data-select-theme', 'dark')
  await expect.poll(() => getComputedStyle(list).backgroundColor).toBe('rgb(10, 20, 30)')
  ancestor.removeAttribute('data-select-theme')
  await expect.poll(() => getComputedStyle(list).backgroundColor).toBe('rgb(255, 255, 255)')
  expect(document.getElementById(button.element().getAttribute('aria-controls')!)).toBe(list)
  expect(document.activeElement).toBe(button.element())
})

test('native modal dialog receives only the second Escape and uses an internal popupHost', async () => {
  const dialogRef = createRef<HTMLDialogElement>()
  const screen = await render(<dialog ref={dialogRef} style={{ width: 280 }}>
    <Select value="a" options={options} onValueChange={vi.fn()} popupHost={() => dialogRef.current} />
  </dialog>)
  dialogRef.current!.showModal()
  const button = screen.getByRole('combobox')
  await button.click()
  expect(dialogRef.current!.querySelector('[role="listbox"]')).not.toBeNull()
  await userEvent.keyboard('{Escape}')
  await expect.element(button).toHaveAttribute('aria-expanded', 'false')
  expect(dialogRef.current!.open).toBe(true)
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => dialogRef.current!.open).toBe(false)
})

test('closed Enter and Space open only once and a second trigger click cancels candidates', async () => {
  const change = vi.fn()
  const screen = await render(<Select value="a" options={options} onValueChange={change} />)
  const button = screen.getByRole('combobox')
  button.element().focus()
  await userEvent.keyboard('{Enter}')
  await expect.element(button).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{ArrowDown}')
  await button.click()
  await expect.element(button).toHaveAttribute('aria-expanded', 'false')
  expect(change).not.toHaveBeenCalled()
  await userEvent.keyboard(' ')
  await expect.element(button).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard(' ')
  await expect.element(button).toHaveAttribute('aria-expanded', 'false')
  expect(change).not.toHaveBeenCalled()
})

test('prefix typing, repeated characters and shortcuts preserve the distinction between activity and value', async () => {
  const change = vi.fn()
  const screen = await render(<Select value="a" options={[
    { value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Bravo' },
  ]} onValueChange={change} />)
  const button = screen.getByRole('combobox')
  await button.click(); await userEvent.keyboard('br')
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('Bravo')
  await userEvent.keyboard('z')
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('Bravo')
  await userEvent.keyboard('{Escape}')
  button.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }))
  await expect.element(button).toHaveAttribute('aria-expanded', 'false')
  expect(change).not.toHaveBeenCalled()
})

test('a new typing session after Escape does not reuse the previous prefix', async () => {
  const screen = await render(<Select value="a" options={options} onValueChange={vi.fn()} />)
  const button = screen.getByRole('combobox')
  await button.click(); await userEvent.keyboard('b{Escape}a')
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('All')
})

test('React 19 callback ref cleanup is honored on unmount', async () => {
  const cleanup = vi.fn()
  const ref = vi.fn(() => cleanup)
  const screen = await render(<Select ref={ref} value="a" options={options} onValueChange={vi.fn()} />)
  expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
  await screen.unmount()
  expect(cleanup).toHaveBeenCalledTimes(1)
})

test('arbitrary string identities including lone surrogates do not throw while creating option ids', async () => {
  const screen = await render(<Select value={'\ud800'} options={[{ value: '\ud800', label: 'Surrogate' }]}
    onValueChange={vi.fn()} />)
  const button = screen.getByRole('combobox')
  await button.click()
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('Surrogate')
})

test('typeahead locates candidates without filtering or committing and ignores composition', async () => {
  const change = vi.fn()
  const screen = await render(<Select value="a" options={options} onValueChange={change} aria-label="Choice" />)
  const button = screen.getByRole('combobox')
  button.element().focus()
  await userEvent.keyboard('b')
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('Beta')
  expect(document.querySelectorAll('[role="option"]')).toHaveLength(4)
  expect(change).not.toHaveBeenCalled()
  button.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'a', isComposing: true, bubbles: true }))
  expect(document.getElementById(button.element().getAttribute('aria-activedescendant')!)).toHaveTextContent('Beta')
  await userEvent.keyboard('{Escape}')
  expect(change).not.toHaveBeenCalled()
})

test('navigates enabled candidates in a body Portal and only requests a controlled value on confirmation', async () => {
  const change = vi.fn()
  const screen = await render(<Select value="a" options={options} onValueChange={change} aria-label="Choice" />)
  const button = screen.getByRole('combobox')
  await button.click()
  expect(document.querySelector('[role="listbox"]')?.parentElement).toBe(document.body)
  await userEvent.keyboard('{ArrowDown}')
  const activeId = button.element().getAttribute('aria-activedescendant')!
  expect(document.getElementById(activeId)).toHaveTextContent('Beta')
  expect(document.querySelector('[aria-selected="true"]')).toHaveTextContent('Alpha')
  expect(change).not.toHaveBeenCalled()
  await userEvent.keyboard('{Enter}')
  expect(change).toHaveBeenCalledExactlyOnceWith('b')
  await expect.element(button).toHaveTextContent('Alpha')
  await expect.element(button).toHaveAttribute('aria-expanded', 'false')
  expect(document.activeElement).toBe(button.element())
})
