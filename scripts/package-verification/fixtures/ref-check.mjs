import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
})
const { window } = dom

for (const key of [
  'document',
  'Element',
  'Event',
  'HTMLElement',
  'HTMLAnchorElement',
  'HTMLButtonElement',
  'HTMLInputElement',
  'MutationObserver',
  'Node',
  'navigator',
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: window[key],
  })
}

globalThis.self = window
globalThis.window = window
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window)
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)

const React = await import('react')
const { createRoot } = await import('react-dom/client')
const { flushSync } = await import('react-dom')
const {
  AutoComplete,
  Button,
  darkTheme,
  LinkButton,
  Menu,
  ThemeProvider,
} = await import('matthew-ui')
const { createElement, createRef } = React

const buttonRef = createRef()
const anchorRef = createRef()
const inputRef = createRef()
const container = document.querySelector('#root')
const root = createRoot(container)

flushSync(() => {
  root.render(
    createElement(
      'div',
      null,
      createElement(
        ThemeProvider,
        { 'data-theme-root': 'true', theme: darkTheme },
        createElement(
          Button,
          { 'data-ref-target': 'button', ref: buttonRef },
          'Save',
        ),
      ),
      createElement(
        LinkButton,
        { 'data-ref-target': 'link', href: '/docs', ref: anchorRef },
        'Docs',
      ),
      createElement(AutoComplete, {
        'aria-label': 'Search',
        'data-ref-target': 'input',
        fetchSuggestions: () => [],
        ref: inputRef,
      }),
      createElement(
        Menu,
        { 'aria-label': 'Navigation' },
        createElement(Menu.Item, { value: 'home' }, 'Home'),
      ),
    ),
  )
})

assert.ok(buttonRef.current instanceof window.HTMLButtonElement)
assert.ok(anchorRef.current instanceof window.HTMLAnchorElement)
assert.ok(inputRef.current instanceof window.HTMLInputElement)
assert.strictEqual(
  buttonRef.current,
  container.querySelector('[data-ref-target="button"]'),
)
assert.strictEqual(
  anchorRef.current,
  container.querySelector('[data-ref-target="link"]'),
)
assert.strictEqual(
  inputRef.current,
  container.querySelector('[data-ref-target="input"]'),
)
assert.ok(buttonRef.current.isConnected)
assert.ok(anchorRef.current.isConnected)
assert.ok(inputRef.current.isConnected)
assert.equal(container.querySelector('.matthew-menu')?.tagName, 'UL')
assert.equal(
  container
    .querySelector('[data-theme-root="true"]')
    ?.style.getPropertyValue('--matthew-ui-color-surface'),
  '#1e293b',
)

flushSync(() => root.unmount())
dom.window.close()
