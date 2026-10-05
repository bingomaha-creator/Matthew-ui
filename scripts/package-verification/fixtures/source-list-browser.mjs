import { createElement as h, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SourceList } from 'matthew-ui/source-list'
import { ThemeProvider, darkTheme } from 'matthew-ui/theme'

const items = [
  { id: 'doc', title: 'Document', summary: 'Evidence summary\nSecond line', source: 'Local document', domId: 'fixture-evidence' },
  { id: 'web', title: 'Web source', href: 'https://example.com', target: '_blank', summary: 'Web evidence', source: 'example.com' },
  { id: 'bad', title: 'Invalid link', href: 'java\nscript:alert(1)' },
]
const custom = {
  background: '#fff7ed', borderColor: '#0000ff', headerColor: '#800080', headerHoverBackground: '#ffff00',
  itemTitleColor: '#008000', summaryColor: '#222222', sourceColor: '#555555', linkColor: '#800080',
  borderRadius: 12, headerMinHeight: 48, itemPaddingBlock: 8, itemPaddingInline: 20,
}
// 同一数据 id 可复用，但显式定位 id 由业务按实例隔离。
const secondaryItems = items.map(({ domId: _domId, ...item }) => item)
function App() {
  const [open, setOpen] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [data, setData] = useState(items)
  return h('div', { style: { width: '100%' } },
    h('button', { onClick: () => setOpen(value => !value), 'data-toggle': '' }, 'External toggle'),
    h('button', { 'data-after': '' }, 'Outside'),
    h('button', { onClick: () => setData(list => [...list].reverse()), 'data-reorder': '' }, 'Reorder'),
    h(SourceList, { ref: node => { node?.setAttribute('data-ref-mounted', 'true') }, 'data-default': '', title: 'Sources', items: data, open, onOpenChange: setOpen }),
    h(SourceList, { 'data-plain': '', items: secondaryItems }),
    h(SourceList, { 'data-empty': '', title: 'Empty', items: [], defaultOpen: true }),
    h(SourceList, { 'data-single': '', items: [secondaryItems[0]] }),
    h(ThemeProvider, { theme: darkTheme }, h(SourceList, { 'data-dark': '', title: 'Dark sources', defaultOpen: true, items: secondaryItems })),
    h(ThemeProvider, { theme: { components: { SourceList: { linkColor: '#166534' } } } },
      h('button', { 'data-theme-toggle': '', onClick: () => setConfigured(value => !value) }, 'Toggle overrides'),
      h(ThemeProvider, { theme: { components: { SourceList: configured ? custom : {} } } },
        h(SourceList, { 'data-configured': '', title: 'Configured sources', items: secondaryItems, defaultOpen: true }),
        h(SourceList, { 'data-configured-plain': '', items: secondaryItems }),
      ),
    ),
    h('div', { style: { fontFamily: 'monospace', '--matthew-ui-source-list-link-color': '#abcdef' } },
      h(SourceList, { 'data-inherited': '', items: [secondaryItems[1]] })),
    h('div', { 'data-narrow-container': '', style: { width: 320, maxWidth: '100%' } },
      h(SourceList, { 'data-narrow': '', title: 'Heading '.repeat(25), items: [{ id: 'long', title: 'https://example.com/' + 'path'.repeat(100), href: 'https://example.com', summary: 'Long evidence '.repeat(100), source: 'Origin'.repeat(80), domId: 'narrow-evidence' }], defaultOpen: true })),
  )
}
createRoot(document.getElementById('app')).render(h(App))
