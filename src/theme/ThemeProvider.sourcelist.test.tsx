import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { ThemeProvider } from './ThemeProvider'
import { SourceList } from '../components/SourceList'
import { sourceListTokensToCssVars } from './sourceListComponentTokens'
import { darkTheme } from './presets'
import '../styles/index.scss'
import '../components/SourceList/SourceList.scss'

const fields = { background: '#112233', borderColor: '#223344', headerColor: '#334455', headerHoverBackground: '#445566', itemTitleColor: '#556677', summaryColor: '#667788', sourceColor: '#778899', linkColor: '#8899aa', borderRadius: 16, headerMinHeight: 48, itemPaddingBlock: 8, itemPaddingInline: 20 }
const items = [{ id: 'one', title: 'Plain', summary: 'Summary', source: 'Origin' }, { id: 'two', title: 'Link', href: '/docs' }]

test('all twelve fields use sparse CSS mappings and shared numeric validation', () => {
  expect(sourceListTokensToCssVars()).toEqual({})
  expect(sourceListTokensToCssVars({ background: undefined })).toEqual({})
  expect(sourceListTokensToCssVars(fields)).toEqual({
    '--matthew-ui-source-list-background': '#112233', '--matthew-ui-source-list-border-color': '#223344',
    '--matthew-ui-source-list-header-color': '#334455', '--matthew-ui-source-list-header-hover-background': '#445566',
    '--matthew-ui-source-list-item-title-color': '#556677', '--matthew-ui-source-list-summary-color': '#667788',
    '--matthew-ui-source-list-source-color': '#778899', '--matthew-ui-source-list-link-color': '#8899aa',
    '--matthew-ui-source-list-radius': '1rem', '--matthew-ui-source-list-header-min-height': '3rem',
    '--matthew-ui-source-list-item-padding-block': '0.5rem', '--matthew-ui-source-list-item-padding-inline': '1.25rem',
  })
  expect(sourceListTokensToCssVars({ borderRadius: 0, itemPaddingBlock: 0, itemPaddingInline: 0 })).toEqual({ '--matthew-ui-source-list-radius': '0rem', '--matthew-ui-source-list-item-padding-block': '0rem', '--matthew-ui-source-list-item-padding-inline': '0rem' })
  for (const field of ['background', 'borderColor', 'headerColor', 'headerHoverBackground', 'itemTitleColor', 'summaryColor', 'sourceColor', 'linkColor'] as const) {
    expect(() => sourceListTokensToCssVars({ [field]: null } as never)).toThrow(TypeError)
    expect(() => sourceListTokensToCssVars({ [field]: 3 } as never)).toThrow(TypeError)
  }
  for (const field of ['borderRadius', 'headerMinHeight', 'itemPaddingBlock', 'itemPaddingInline'] as const) {
    for (const value of [-1, Infinity, NaN]) expect(() => sourceListTokensToCssVars({ [field]: value })).toThrow(RangeError)
    expect(() => sourceListTokensToCssVars({ [field]: null } as never)).toThrow(TypeError)
  }
  expect(() => sourceListTokensToCssVars({ headerMinHeight: 0 })).toThrow(RangeError)
})

test('ThemeProvider applies overrides, keeps plain mode unframed, and restores parent fields dynamically', async () => {
  const view = (enabled: boolean) => <ThemeProvider theme={{ components: { SourceList: { linkColor: '#abcdef' }, Thinking: { titleColor: '#123456' } } }}><ThemeProvider theme={{ components: { SourceList: enabled ? fields : { linkColor: undefined } } }}><SourceList items={items} title="Evidence" defaultOpen /><SourceList items={items} /></ThemeProvider></ThemeProvider>
  const screen = await render(view(true))
  const roots = screen.container.querySelectorAll('.matthew-source-list')
  expect(getComputedStyle(roots[0]).backgroundColor).toBe('rgb(17, 34, 51)')
  expect(getComputedStyle(roots[0]).borderRadius).toBe('16px')
  expect(getComputedStyle(roots[0].querySelector('button')!).minHeight).toBe('48px')
  expect(getComputedStyle(roots[0].querySelector('li')!).paddingInlineStart).toBe('20px')
  expect(getComputedStyle(roots[0].querySelector('p')!).color).toBe('rgb(102, 119, 136)')
  expect(getComputedStyle(roots[0].querySelector('a')!).color).toBe('rgb(136, 153, 170)')
  expect(getComputedStyle(roots[1]).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  expect(getComputedStyle(roots[1]).borderTopWidth).toBe('0px')
  expect(getComputedStyle(roots[1].querySelector('li')!).paddingInlineStart).toBe('20px')
  await screen.rerender(view(false))
  expect(getComputedStyle(roots[0]).borderRadius).toBe('8px')
  expect(getComputedStyle(roots[0].querySelector('a')!).color).toBe('rgb(171, 205, 239)')
  expect(getComputedStyle(roots[0]).getPropertyValue('--matthew-ui-thinking-title-color').trim()).toBe('#123456')
  await screen.rerender(view(true))
  expect(getComputedStyle(roots[0]).borderRadius).toBe('16px')
})

test('dark theme resolves global text, border, surface and active-primary link fallbacks', async () => {
  const screen = await render(<ThemeProvider theme={darkTheme}><SourceList items={items} title="Evidence" defaultOpen /></ThemeProvider>)
  const root = screen.container.querySelector('.matthew-source-list')!
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(30, 41, 59)')
  expect(getComputedStyle(root.querySelector('a')!).color).toBe('rgb(191, 219, 254)')
})
