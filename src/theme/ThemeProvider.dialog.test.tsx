import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { ThemeProvider } from './ThemeProvider'
import { renderToStaticMarkup } from 'react-dom/server'

test('Dialog token fields inherit independently and removing a child override restores its parent', async () => {
  const view = (custom: boolean) => <ThemeProvider theme={{ components: {
    Dialog: { background: 'purple', borderRadius: 12 }, Button: { borderRadius: 6 },
  } }}><ThemeProvider data-child="true" theme={{ components: { Dialog: custom ? { background: 'green', contentPaddingInline: 0 } : {} } }}>
    Child
  </ThemeProvider></ThemeProvider>
  const screen = await render(view(true))
  const node = screen.container.querySelector<HTMLElement>('[data-child]')!
  expect(node.style.getPropertyValue('--matthew-ui-dialog-background')).toBe('green')
  expect(node.style.getPropertyValue('--matthew-ui-dialog-radius')).toBe('0.75rem')
  expect(node.style.getPropertyValue('--matthew-ui-button-radius')).toBe('0.375rem')
  await screen.rerender(view(false))
  expect(node.style.getPropertyValue('--matthew-ui-dialog-background')).toBe('purple')
  expect(node.style.getPropertyValue('--matthew-ui-dialog-content-padding-inline')).toBe('')
  expect(node.style.getPropertyValue('--matthew-ui-dialog-shadow')).toBe('')
})

test('Dialog token values validate every string and numeric category with the standard error messages', () => {
  const html = (config: Record<string, unknown>) => renderToStaticMarkup(<ThemeProvider theme={{ components: { Dialog: config } }}>Theme</ThemeProvider>)
  for (const field of ['background', 'color', 'borderColor', 'backdropBackground', 'titleColor', 'closeColor', 'closeHoverBackground', 'shadow']) {
    expect(() => html({ [field]: 12 })).toThrow(`components.Dialog.${field} must be a CSS string`)
    expect(() => html({ [field]: null })).toThrow(TypeError)
  }
  for (const field of ['borderRadius', 'titleFontSize', 'contentPaddingBlock', 'contentPaddingInline']) {
    expect(() => html({ [field]: '12px' })).toThrow(`components.Dialog.${field} must be a number`)
    for (const value of [-1, Infinity, NaN]) expect(() => html({ [field]: value })).toThrow(RangeError)
  }
  expect(() => html({ titleFontSize: 0 })).toThrow('components.Dialog.titleFontSize must be finite and greater than 0')
  expect(html({ borderRadius: 0, contentPaddingBlock: 0, titleFontSize: 16 })).toContain('--matthew-ui-dialog-radius:0rem')
})
