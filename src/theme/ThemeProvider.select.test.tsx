import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ThemeProvider } from './ThemeProvider'
import type { MatthewThemeConfig } from './tokens'

test('Select configuration is sparse, inherited independently and removable', async () => {
  const view = (override: boolean) => <ThemeProvider theme={{ components: {
    Select: { optionSelectedColor: 'green', borderRadius: 12 }, Button: { minHeight: 48 },
  } }}><ThemeProvider data-testid="child" theme={{ components: { Select: override ? { borderRadius: 0, triggerMinHeight: 48 } : {} } }}>child</ThemeProvider></ThemeProvider>
  const screen = await render(view(true))
  const child = screen.getByTestId('child').element() as HTMLElement
  expect(child.style.getPropertyValue('--matthew-ui-select-radius')).toBe('0rem')
  expect(child.style.getPropertyValue('--matthew-ui-select-option-selected-color')).toBe('green')
  expect(child.style.getPropertyValue('--matthew-ui-button-min-height')).toBe('3rem')
  expect(child.style.getPropertyValue('--matthew-ui-select-popup-background')).toBe('')
  await screen.rerender(view(false))
  expect(child.style.getPropertyValue('--matthew-ui-select-radius')).toBe('0.75rem')
  expect(child.style.getPropertyValue('--matthew-ui-select-trigger-min-height')).toBe('')
})

test('all Select fields use the shared numeric and string validation with stable error messages', () => {
  const renderConfig = (config: object) => renderToStaticMarkup(<ThemeProvider
    theme={{ components: { Select: config } } as MatthewThemeConfig}>child</ThemeProvider>)
  for (const field of ['fontSize', 'triggerMinHeight', 'optionMinHeight']) {
    for (const value of [0, -1, NaN, Infinity]) {
      expect(() => renderConfig({ [field]: value })).toThrowError(new RangeError(`components.Select.${field} must be finite and greater than 0`))
    }
    expect(() => renderConfig({ [field]: '40px' })).toThrowError(new TypeError(`components.Select.${field} must be a number`))
  }
  for (const field of ['borderRadius', 'triggerPaddingBlock', 'triggerPaddingInline']) {
    expect(renderConfig({ [field]: 0 })).toContain('0rem')
    expect(() => renderConfig({ [field]: -1 })).toThrowError(new RangeError(`components.Select.${field} must be finite and greater than or equal to 0`))
  }
  for (const field of ['triggerBackground', 'triggerColor', 'placeholderColor', 'borderColor', 'triggerHoverBorderColor',
    'optionColor', 'optionActiveBackground', 'optionSelectedColor', 'popupBackground', 'popupShadow']) {
    expect(() => renderConfig({ [field]: null })).toThrowError(new TypeError(`components.Select.${field} must be a CSS string`))
  }
  expect(renderConfig({ triggerColor: undefined })).not.toContain('--matthew-ui-select-')
})
