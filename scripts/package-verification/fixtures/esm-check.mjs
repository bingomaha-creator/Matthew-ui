import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'

const expectedExports = [
  'AutoComplete',
  'Button',
  'LinkButton',
  'Menu',
  'TaskList',
  'ThemeProvider',
  'Thinking',
  'ToolCall',
  'createTokens',
  'darkTheme',
  'lightTheme',
  'tokensToCssVars',
]
const ui = await import('matthew-ui')
const buttonModule = await import('matthew-ui/button')
const menuModule = await import('matthew-ui/menu')
const autoCompleteModule = await import('matthew-ui/auto-complete')
const thinkingModule = await import('matthew-ui/thinking')
const toolCallModule = await import('matthew-ui/tool-call')
const taskListModule = await import('matthew-ui/task-list')
const themeModule = await import('matthew-ui/theme')

// 在 React 18/19 各自的真实安装环境验证新配置；不依赖浏览器 effect 才输出变量。
for (const provider of [ui.ThemeProvider, themeModule.ThemeProvider]) {
  const html = renderToStaticMarkup(createElement(provider, {
    theme: { components: { Button: { borderRadius: 8 } } },
  }, 'Configured theme'))
  assert.match(html, /--matthew-ui-button-radius:0.5rem/)
  assert.doesNotMatch(html, /--matthew-ui-button-background:/)

  // 三种组件配置独立合并；这里验证SSR变量，不代替各组件的最终CSS验收。
  const nested = renderToStaticMarkup(createElement(provider, {
    theme: { components: {
      Button: { borderRadius: 8 }, Menu: { itemBorderRadius: 6 },
      AutoComplete: { inputMinHeight: 48, inputBorderRadius: 8, optionActiveColor: '#166534' },
    } },
  }, createElement(provider, {
    'data-consumer-child': '',
    theme: { components: {
      Menu: { itemColor: 'green', popupShadow: 'none' },
      AutoComplete: { inputBorderRadius: 12, inputMinHeight: undefined, popupShadow: 'none' },
    } },
  }, 'Component configuration')))
  const dom = new JSDOM(nested)
  try {
    const style = dom.window.document.querySelector('[data-consumer-child]').style
    assert.equal(style.getPropertyValue('--matthew-ui-menu-item-radius'), '0.375rem')
    assert.equal(style.getPropertyValue('--matthew-ui-menu-item-color'), 'green')
    assert.equal(style.getPropertyValue('--matthew-ui-menu-popup-shadow'), 'none')
    assert.equal(style.getPropertyValue('--matthew-ui-button-radius'), '0.5rem')
    assert.equal(style.getPropertyValue('--matthew-ui-menu-background'), '')
    assert.equal(style.getPropertyValue('--matthew-ui-font-size-md'), '0.875rem')
    assert.equal(style.getPropertyValue('--matthew-ui-auto-complete-input-min-height'), '3rem')
    assert.equal(style.getPropertyValue('--matthew-ui-auto-complete-input-radius'), '0.75rem')
    assert.equal(style.getPropertyValue('--matthew-ui-auto-complete-option-active-color'), '#166534')
    assert.equal(style.getPropertyValue('--matthew-ui-auto-complete-popup-shadow'), 'none')
    assert.equal(style.getPropertyValue('--matthew-ui-auto-complete-input-background'), '')
  } finally {
    dom.window.close()
  }
  assert.throws(() => renderToStaticMarkup(createElement(provider, {
    theme: { components: { Menu: { itemMinHeight: 0 } } },
  }, 'Invalid Menu dimension')), RangeError)
  assert.throws(() => renderToStaticMarkup(createElement(provider, {
    theme: { components: { AutoComplete: { inputMinHeight: 0 } } },
  }, 'Invalid AutoComplete dimension')), RangeError)
  assert.throws(() => renderToStaticMarkup(createElement(provider, {
    theme: { components: { AutoComplete: { popupShadow: 8 } } },
  }, 'Invalid AutoComplete shadow')), TypeError)
  assert.throws(() => renderToStaticMarkup(createElement(provider, {
    theme: { components: { Thinking: { headerMinHeight: 0 } } },
  }, 'Invalid Thinking dimension')), RangeError)
  assert.throws(() => renderToStaticMarkup(createElement(provider, {
    theme: { components: { Thinking: { runningColor: 8 } } },
  }, 'Invalid Thinking color')), TypeError)
  assert.throws(() => renderToStaticMarkup(createElement(provider, {
    theme: { components: { ToolCall: { headerMinHeight: 0 } } },
  }, 'Invalid ToolCall dimension')), RangeError)
  assert.throws(() => renderToStaticMarkup(createElement(provider, {
    theme: { components: { ToolCall: { nameColor: 8 } } },
  }, 'Invalid ToolCall color')), TypeError)
  assert.throws(() => renderToStaticMarkup(createElement(provider, {
    theme: { components: { TaskList: { itemMinHeight: 0 } } },
  }, 'Invalid TaskList dimension')), RangeError)
  assert.throws(() => renderToStaticMarkup(createElement(provider, {
    theme: { components: { TaskList: { titleColor: 8 } } },
  }, 'Invalid TaskList color')), TypeError)
}

assert.deepEqual(Object.keys(ui).sort(), expectedExports)
assert.deepEqual(Object.keys(buttonModule).sort(), ['Button', 'LinkButton'])
assert.deepEqual(Object.keys(menuModule), ['Menu'])
assert.deepEqual(Object.keys(autoCompleteModule), ['AutoComplete'])
assert.deepEqual(Object.keys(thinkingModule), ['Thinking'])
assert.deepEqual(Object.keys(toolCallModule), ['ToolCall'])
assert.deepEqual(Object.keys(taskListModule).sort(), ['TaskList'])
assert.deepEqual(Object.keys(themeModule).sort(), [
  'ThemeProvider',
  'createTokens',
  'darkTheme',
  'lightTheme',
  'tokensToCssVars',
])
for (const cssEntry of [
  'matthew-ui/tokens.css',
  'matthew-ui/button/style.css',
  'matthew-ui/menu/style.css',
  'matthew-ui/auto-complete/style.css',
  'matthew-ui/thinking/style.css',
  'matthew-ui/tool-call/style.css',
  'matthew-ui/task-list/style.css',
  'matthew-ui/styles.css',
]) {
  assert.match(import.meta.resolve(cssEntry), /\.css$/)
}
for (const privateEntry of [
  'matthew-ui/Button',
  'matthew-ui/AutoComplete',
  'matthew-ui/dist/index.js',
  'matthew-ui/src/theme/tokens',
  'matthew-ui/button/index.js',
  'matthew-ui/button/Button',
]) {
  await assert.rejects(
    () => import(privateEntry),
    { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' },
  )
}
