const assert = require('node:assert/strict')

const expectedExports = [
  'AutoComplete',
  'Button',
  'CodeBlock',
  'Dialog',
  'LinkButton',
  'Menu',
  'Select',
  'SourceList',
  'TaskList',
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
const taskListModule = require('matthew-ui/task-list')
const selectModule = require('matthew-ui/select')
const dialogModule = require('matthew-ui/dialog')
const sourceListModule = require('matthew-ui/source-list')
const codeBlockModule = require('matthew-ui/code-block')
const themeModule = require('matthew-ui/theme')

assert.deepEqual(Object.keys(ui).sort(), expectedExports)
assert.deepEqual(Object.keys(buttonModule).sort(), ['Button', 'LinkButton'])
assert.deepEqual(Object.keys(menuModule), ['Menu'])
assert.deepEqual(Object.keys(autoCompleteModule), ['AutoComplete'])
assert.deepEqual(Object.keys(thinkingModule), ['Thinking'])
assert.deepEqual(Object.keys(toolCallModule), ['ToolCall'])
assert.deepEqual(Object.keys(taskListModule), ['TaskList'])
assert.deepEqual(Object.keys(selectModule), ['Select'])
assert.deepEqual(Object.keys(dialogModule), ['Dialog'])
assert.deepEqual(Object.keys(sourceListModule), ['SourceList'])
assert.deepEqual(Object.keys(codeBlockModule), ['CodeBlock'])
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
  'matthew-ui/select/style.css',
  'matthew-ui/dialog/style.css',
  'matthew-ui/source-list/style.css',
  'matthew-ui/code-block/style.css',
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
