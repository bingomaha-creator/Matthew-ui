import { createElement as h, createRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Dialog } from 'matthew-ui/dialog'
import { Select } from 'matthew-ui/select'
import { Button } from 'matthew-ui/button'
import { ThemeProvider, darkTheme } from 'matthew-ui/theme'

const configured = {
  background: '#fff7ed', color: '#222222', borderColor: '#0000ff', backdropBackground: 'rgba(0, 0, 0, 0.7)',
  titleColor: '#800080', closeColor: '#008000', closeHoverBackground: '#ffff00', shadow: 'none',
  borderRadius: 12, titleFontSize: 20, contentPaddingBlock: 8, contentPaddingInline: 24,
}

function Demo({ name, reject = false, backdrop = false, long = false, custom = false, select = false, busyInitially = false }) {
  const [open, setOpen] = useState(false)
  const [calls, setCalls] = useState(0)
  const [override, setOverride] = useState(true)
  const [busy, setBusy] = useState(busyInitially)
  const [value, setValue] = useState('a')
  const dialog = createRef()
  const input = createRef()
  const content = h(Dialog, {
    ref: node => { dialog.current = node; node?.setAttribute('data-ref-mounted', 'true') },
    open, onOpenChange: next => { setCalls(count => count + 1); if (!reject) setOpen(next) },
    title: name, closeLabel: 'Close ' + name, closeOnBackdrop: backdrop, dismissible: !busy,
    initialFocus: name === 'Initial focus' ? () => input.current : undefined,
    footer: h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
      custom && h(Button, { onClick: () => setOverride(flag => !flag) }, 'Remove overrides'),
      busyInitially && h(Button, { onClick: () => setBusy(false) }, 'Finish saving'),
      h(Button, { onClick: () => setOpen(false) }, 'Cancel'),
      h(Button, { variant: 'primary', onClick: () => setOpen(false) }, 'Save')),
  },
  h('label', null, 'Note title', h('input', { ref: input, 'aria-label': 'Note title', defaultValue: 'Draft', style: { display: 'block', width: '100%', boxSizing: 'border-box', font: 'inherit' } })),
  select && h(Select, { value, onValueChange: setValue, options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }],
    'aria-label': 'Category', popupHost: () => dialog.current }),
  long && Array.from({ length: 24 }, (_, i) => h('p', { key: i }, 'Long form section ' + (i + 1) + ': ' + 'Readable content with a long label. '.repeat(4))),
  h('output', { 'data-calls': name }, String(calls)))
  return h('div', null,
    h('button', { onClick: () => setOpen(true) }, 'Open ' + name),
    custom ? h(ThemeProvider, { theme: { components: { Dialog: { titleColor: 'green' } } } },
      h(ThemeProvider, { theme: { components: { Dialog: override ? configured : {} } } }, content)) : content,
  )
}
function App() {
  return h('div', { style: { padding: 24, display: 'grid', gap: 12 } },
    h(Demo, { name: 'Default' }),
    h(ThemeProvider, { theme: darkTheme }, h(Demo, { name: 'Dark' })),
    h(Demo, { name: 'Configured', custom: true }),
    h(Demo, { name: 'Reject', reject: true, backdrop: true }),
    h(Demo, { name: 'Backdrop', backdrop: true }),
    h(Demo, { name: 'Busy', busyInitially: true, backdrop: true }),
    h(Demo, { name: 'Long', long: true }),
    h(Demo, { name: 'Select', select: true }),
    h(Demo, { name: 'Initial focus' }),
    h('div', { style: { fontFamily: 'monospace', '--matthew-ui-dialog-background': '#132030', '--matthew-ui-dialog-title-color': '#eeeeee' } }, h(Demo, { name: 'Source CSS' })),
    h('div', { style: { height: 1500 }, 'aria-hidden': 'true' }),
  )
}
createRoot(document.getElementById('app')).render(h(App))
