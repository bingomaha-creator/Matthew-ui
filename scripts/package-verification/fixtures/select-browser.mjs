import { createElement as h, createRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Select } from 'matthew-ui/select'
import { ThemeProvider, darkTheme } from 'matthew-ui/theme'

const options = [
  { value: '', label: 'All' }, { value: 'a', label: 'Alpha' },
  { value: 'blocked', label: 'Blocked', disabled: true }, { value: 'b', label: 'Beta' },
]
const configured = {
  fontSize: 16, triggerBackground: '#fafafa', triggerColor: '#111111', placeholderColor: '#555555',
  borderColor: '#0000ff', triggerHoverBorderColor: '#008000', triggerMinHeight: 48, borderRadius: 12,
  triggerPaddingBlock: 10, triggerPaddingInline: 20, optionColor: '#222222',
  optionActiveBackground: '#ffff00', optionSelectedColor: '#800080', optionMinHeight: 44,
  popupBackground: '#fff7ed', popupShadow: 'none',
}
function Demo({ name, ...props }) {
  const [value, setValue] = useState('a')
  return h(Select, { value, onValueChange: setValue, options, 'aria-label': name,
    ref: node => node?.setAttribute('data-ref-mounted', 'true'), ...props })
}
function App() {
  const [override, setOverride] = useState(true)
  const [items, setItems] = useState(options)
  const [wide, setWide] = useState(false)
  const host = createRef()
  const dialog = createRef()
  const source = createRef()
  return h('div', { style: { padding: 24, display: 'grid', gap: 24, width: 300 } },
    h(Demo, { name: 'Default' }),
    h(ThemeProvider, { theme: { components: { Select: configured } } },
      h(Demo, { name: 'Configured' }),
      h(Demo, { name: 'Placeholder', value: 'invalid', placeholder: 'Choose' }),
      h(Demo, { name: 'Disabled', disabled: true }),
    ),
    h(ThemeProvider, { theme: darkTheme }, h(Demo, { name: 'Dark' })),
    h(ThemeProvider, { theme: { components: { Select: { optionSelectedColor: 'green' } } } },
      h(ThemeProvider, { theme: { components: { Select: override ? { triggerMinHeight: 48, optionSelectedColor: 'purple' } : {} } } },
        h(Demo, { name: 'Nested' })),
      h('button', { onClick: () => setOverride(value => !value) }, 'Remove overrides')),
    h('div', { ref: source, style: { fontFamily: 'monospace', '--matthew-ui-color-surface': '#101820', '--matthew-ui-select-option-selected-color': '#ff00ff' } },
      h(Demo, { name: 'Source CSS', style: { '--matthew-ui-select-popup-background': '#132030' } }),
      h('button', { onClick: () => source.current.style.setProperty('--matthew-ui-color-text', '#00ffff') }, 'Change CSS')),
    h('div', { style: { width: wide ? 280 : 180 } }, h(Demo, { name: 'Resize', options: items }),
      h('button', { onClick: () => { setWide(true); setItems([...options].reverse()) } }, 'Resize and reorder')),
    h('div', { ref: host, style: { transform: 'translate(40px, 10px) scale(0.9)', overflow: 'auto', height: 260, width: 240, padding: 12, boxSizing: 'border-box' } },
      h('div', { style: { height: 100 } }),
      h(Demo, { name: 'Transformed', popupHost: () => host.current }),
      h('div', { style: { height: 400 } })),
    h('button', { onClick: () => dialog.current.showModal() }, 'Open modal'),
    h('dialog', { ref: dialog, style: { width: 280, height: 300 } },
      h(Demo, { name: 'Modal', popupHost: () => dialog.current })),
    h('div', { style: { position: 'fixed', bottom: 8, right: -16, width: 200 } }, h(Demo, { name: 'Boundary' })),
  )
}
createRoot(document.getElementById('app')).render(h(App))
