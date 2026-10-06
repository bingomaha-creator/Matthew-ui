import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { ThemeProvider } from './ThemeProvider'
import { CodeBlock } from '../components/CodeBlock'
import { darkTheme } from './presets'
import { codeBlockTokensToCssVars } from './codeBlockComponentTokens'
import '../styles/index.scss'

const fields = { background: '#112233', color: '#aabbcc', borderColor: '#223344', headerBackground: '#334455', headerColor: '#ddeeff', borderRadius: 16, paddingBlock: 8, paddingInline: 20 }
test('eight fields use sparse mappings, finite nonnegative sizing and stable error messages', () => {
  expect(codeBlockTokensToCssVars()).toEqual({})
  expect(codeBlockTokensToCssVars({ background: undefined })).toEqual({})
  expect(codeBlockTokensToCssVars(fields)).toEqual({
    '--matthew-ui-code-block-background': '#112233', '--matthew-ui-code-block-color': '#aabbcc',
    '--matthew-ui-code-block-border-color': '#223344', '--matthew-ui-code-block-header-background': '#334455',
    '--matthew-ui-code-block-header-color': '#ddeeff', '--matthew-ui-code-block-radius': '1rem',
    '--matthew-ui-code-block-padding-block': '0.5rem', '--matthew-ui-code-block-padding-inline': '1.25rem',
  })
  for (const field of ['background', 'color', 'borderColor', 'headerBackground', 'headerColor'] as const) {
    expect(() => codeBlockTokensToCssVars({ [field]: null } as never)).toThrow(`components.CodeBlock.${field} must be a CSS string`)
  }
  for (const field of ['borderRadius', 'paddingBlock', 'paddingInline'] as const) {
    expect(codeBlockTokensToCssVars({ [field]: 0 })).toEqual({ [`--matthew-ui-code-block-${field === 'borderRadius' ? 'radius' : field === 'paddingBlock' ? 'padding-block' : 'padding-inline'}`]: '0rem' })
    for (const value of [-1, NaN, Infinity]) expect(() => codeBlockTokensToCssVars({ [field]: value })).toThrow(`components.CodeBlock.${field} must be finite and greater than or equal to 0`)
    expect(() => codeBlockTokensToCssVars({ [field]: '1' } as never)).toThrow(TypeError)
  }
})

test('overrides reach final styles and dynamic removal restores parent or default without losing other components', async () => {
  const view = (enabled: boolean) => <ThemeProvider theme={{ components: { CodeBlock: { color: '#abcdef' }, Thinking: { titleColor: 'green' } } }}><ThemeProvider theme={{ components: { CodeBlock: enabled ? fields : { color: undefined } } }}><CodeBlock code="raw" title="Source" /></ThemeProvider></ThemeProvider>
  const screen = await render(view(true))
  const root = screen.container.querySelector('.matthew-code-block')!
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(17, 34, 51)')
  expect(getComputedStyle(root).borderTopColor).toBe('rgb(34, 51, 68)')
  expect(getComputedStyle(root).borderRadius).toBe('16px')
  expect(getComputedStyle(root.querySelector('pre')!).padding).toBe('8px 20px')
  expect(getComputedStyle(root.querySelector('.matthew-code-block__header')!).backgroundColor).toBe('rgb(51, 68, 85)')
  expect(getComputedStyle(root.querySelector('.matthew-code-block__title')!).color).toBe('rgb(221, 238, 255)')
  await screen.rerender(view(false))
  expect(getComputedStyle(root).borderRadius).toBe('8px')
  expect(getComputedStyle(root.querySelector('pre')!).color).toBe('rgb(171, 205, 239)')
  expect(getComputedStyle(root).getPropertyValue('--matthew-ui-thinking-title-color').trim()).toBe('green')
  await screen.rerender(view(true))
  expect(getComputedStyle(root).borderRadius).toBe('16px')
})

test('dark fallback follows current surface text and border tokens', async () => {
  const screen = await render(<ThemeProvider theme={darkTheme}><CodeBlock code="raw" title="Source" /></ThemeProvider>)
  const root = screen.container.querySelector('.matthew-code-block')!
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(30, 41, 59)')
  expect(getComputedStyle(root).color).toBe('rgb(248, 250, 252)')
  expect(getComputedStyle(root).borderTopColor).toBe('rgb(51, 65, 85)')
})
