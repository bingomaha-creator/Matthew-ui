import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import { AutoComplete } from 'matthew-ui/auto-complete'
import { ThemeProvider, darkTheme } from 'matthew-ui/theme'

// 通过公开fetchSuggestions发起异步请求，检查器在网络边界控制返回时机。
const options = [{ value: 'Alpha' }, { value: 'Beta' }]
function sample(name, extra = {}) {
  return h(AutoComplete, { 'aria-label': name, fetchSuggestions: () => options, ...extra })
}
const custom = { components: { AutoComplete: {
  fontSize: 18, inputMinHeight: 48, inputBorderRadius: 12, inputPaddingBlock: 6, inputPaddingInline: 20,
  inputBackground: '#fafafa', inputColor: '#14532d', borderColor: '#166534', inputHoverBorderColor: '#052e16',
  optionColor: '#14532d', optionActiveBackground: '#dcfce7', optionActiveColor: '#166534',
  optionBorderRadius: 4, optionPaddingBlock: 8, optionPaddingInline: 16,
  popupBackground: '#f0fdf4', popupShadow: 'none',
} } }
const frame = { width: '280px', minHeight: '220px' }
createRoot(document.getElementById('app')).render(h('main', null,
  h('section', { 'data-ac-default': '', style: frame }, sample('Default')),
  h(ThemeProvider, { theme: custom, 'data-ac-custom': '', style: frame },
    sample('Configured', { fetchSuggestions: () => fetch('/suggestions').then(response => response.json()) })),
  h(ThemeProvider, { theme: custom, 'data-ac-restricted': '', style: frame },
    sample('Disabled', { disabled: true }), sample('Read only', { readOnly: true })),
  h(ThemeProvider, { theme: darkTheme, 'data-ac-dark': '', style: frame }, sample('Dark')),
))
