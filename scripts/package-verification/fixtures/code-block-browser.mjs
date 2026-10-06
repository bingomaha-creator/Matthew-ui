import { createElement as h, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CodeBlock } from 'matthew-ui/code-block'
import { ThemeProvider, darkTheme } from 'matthew-ui/theme'

const copy = { label: 'Copy', copiedLabel: 'Copied', errorLabel: 'Copy failed' }
const custom = { background: '#fff7ed', color: '#222222', borderColor: '#0000ff', headerBackground: '#ffedd5', headerColor: '#800080', borderRadius: 12, paddingBlock: 8, paddingInline: 20 }
function App() {
  const [configured, setConfigured] = useState(true)
  const [code, setCode] = useState('  synthetic <raw>\n\tvalue\n ')
  return h('main', null,
    h('button', { 'data-update-code': '', onClick: () => setCode('updated synthetic text') }, 'Update text'),
    h(CodeBlock, { ref: node => node?.setAttribute('data-ref-mounted', 'true'), 'data-default': '', title: 'Arguments', language: 'JSON', code, copy }),
    h(CodeBlock, { 'data-plain': '', code: '<script>plain text</script>' }),
    h(CodeBlock, { 'data-empty': '', code: '', copy }),
    h(ThemeProvider, { theme: darkTheme }, h(CodeBlock, { 'data-dark': '', code: 'dark text', title: 'Dark source', copy })),
    h(ThemeProvider, { theme: { components: { CodeBlock: { color: '#166534' } } } },
      h('button', { 'data-theme-toggle': '', onClick: () => setConfigured(!configured) }, 'Toggle theme'),
      h(ThemeProvider, { theme: { components: { CodeBlock: configured ? custom : {} } } },
        h(CodeBlock, { 'data-configured': '', title: 'Configured source', code: 'configured', copy }))),
    h('div', { style: { '--matthew-ui-code-block-radius': '20px' } }, h(CodeBlock, { 'data-inherited': '', code: 'inherited' })),
    h('div', { style: { width: 320, maxWidth: '100%' } },
      h(CodeBlock, { 'data-narrow': '', title: 'Heading'.repeat(30), language: 'Language'.repeat(20), code: 'long'.repeat(200), copy }),
      h(CodeBlock, { 'data-wrapped': '', title: 'Wrapped', code: 'long'.repeat(200), wrap: true, copy })),
    h('div', { className: 'limited' }, h(CodeBlock, { 'data-limited': '', code: 'line\n'.repeat(100) })),
  )
}
createRoot(document.getElementById('app')).render(h(App))
