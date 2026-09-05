const assert = require('node:assert/strict')

const expectedExports = [
  'AutoComplete',
  'Button',
  'LinkButton',
  'Menu',
  'ThemeProvider',
  'Thinking',
  'ToolCall',
  'createTokens',
  'darkTheme',
  'lightTheme',
  'tokensToCssVars',
]
const ui = require('matthew-ui')
const buttonModule = require('matthew-ui/button')
const menuModule = require('matthew-ui/menu')
const autoCompleteModule = require('matthew-ui/auto-complete')
const thinkingModule = require('matthew-ui/thinking')
const toolCallModule = require('matthew-ui/tool-call')
const themeModule = require('matthew-ui/theme')

assert.deepEqual(Object.keys(ui).sort(), expectedExports)
assert.deepEqual(Object.keys(buttonModule).sort(), ['Button', 'LinkButton'])
assert.deepEqual(Object.keys(menuModule), ['Menu'])
assert.deepEqual(Object.keys(autoCompleteModule), ['AutoComplete'])
assert.deepEqual(Object.keys(thinkingModule), ['Thinking'])
assert.deepEqual(Object.keys(toolCallModule), ['ToolCall'])
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
  'matthew-ui/styles.css',
]) {
  assert.match(require.resolve(cssEntry), /\.css$/)
}
for (const privateEntry of [
  'matthew-ui/Button',
  'matthew-ui/AutoComplete',
  'matthew-ui/dist/index.js',
  'matthew-ui/src/theme/tokens',
  'matthew-ui/button/index.js',
  'matthew-ui/button/Button',
]) {
  assert.throws(
    () => require(privateEntry),
    { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' },
  )
}
