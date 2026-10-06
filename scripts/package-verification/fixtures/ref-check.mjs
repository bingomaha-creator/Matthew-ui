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
  CodeBlock,
  Dialog,
  darkTheme,
  LinkButton,
  Menu,
  Select,
  SourceList,
  TaskList,
  ThemeProvider,
  Thinking,
  ToolCall,
} = await import('matthew-ui')
const { createElement, createRef } = React

const buttonRef = createRef()
const anchorRef = createRef()
const inputRef = createRef()
const thinkingRef = createRef()
const toolCallRef = createRef()
const taskListRef = createRef()
const selectRef = createRef()
const dialogRef = createRef()
const sourceListRef = createRef()
const codeBlockRef = createRef()
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
      createElement(Thinking, {
        title: '分析中',
        'data-ref-target': 'thinking',
        ref: thinkingRef,
      }, '步骤'),
      createElement(ToolCall, {
        name: '读取项目文件',
        status: 'running',
        'data-ref-target': 'tool-call',
        ref: toolCallRef,
      }, '步骤'),
      createElement(TaskList, {
        title: '实施计划',
        items: [{ id: 'a', title: '任务一', status: 'running' }],
        'data-ref-target': 'task-list',
        ref: taskListRef,
      }),
      createElement(Select, {
        ref: selectRef, value: '', options: [{ value: '', label: 'All' }],
        onValueChange: () => {}, 'aria-label': 'Select ref',
      }),
      createElement(Dialog, { ref: dialogRef, open: false, title: 'Dialog ref', closeLabel: 'Close', onOpenChange: () => {} }, 'Content'),
      createElement(SourceList, { ref: sourceListRef, items: [{ id: 'one', title: 'Document' }], 'data-ref-target': 'source-list' }),
      createElement(CodeBlock, { ref: codeBlockRef, code: 'Raw', 'data-ref-target': 'code-block' }),
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
assert.ok(thinkingRef.current instanceof window.HTMLDivElement)
assert.strictEqual(
  thinkingRef.current,
  container.querySelector('[data-ref-target="thinking"]'),
)
assert.ok(thinkingRef.current.isConnected)
assert.ok(toolCallRef.current instanceof window.HTMLDivElement)
assert.strictEqual(
  toolCallRef.current,
  container.querySelector('[data-ref-target="tool-call"]'),
)
assert.ok(toolCallRef.current.isConnected)
assert.ok(taskListRef.current instanceof window.HTMLDivElement)
assert.ok(selectRef.current instanceof window.HTMLButtonElement)
assert.ok(dialogRef.current instanceof window.HTMLDialogElement)
assert.ok(dialogRef.current.isConnected)
assert.ok(sourceListRef.current instanceof window.HTMLDivElement)
assert.equal(sourceListRef.current, container.querySelector('[data-ref-target="source-list"]'))
assert.ok(sourceListRef.current.isConnected)
assert.ok(codeBlockRef.current instanceof window.HTMLDivElement)
assert.equal(codeBlockRef.current, container.querySelector('[data-ref-target="code-block"]'))
assert.ok(codeBlockRef.current.isConnected)
assert.equal(dialogRef.current.open, false)
assert.equal(selectRef.current.getAttribute('role'), 'combobox')
assert.strictEqual(
  taskListRef.current,
  container.querySelector('[data-ref-target="task-list"]'),
)
assert.ok(taskListRef.current.isConnected)
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
