import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { SourceList, ThemeProvider, darkTheme } from '../../index'
import type { SourceListItem } from './SourceList.types'

const items: readonly SourceListItem[] = [
  { id: 'doc', title: '项目架构文档', summary: '组件仅负责通用来源展示。\n数据检索、引用编号与内容选择由业务负责。', source: '本地知识文档' },
  { id: 'web', title: 'React 文档', href: 'https://react.dev', target: '_blank', summary: '保持标准 HTML 列表与链接语义。', source: 'react.dev' },
]
const meta: Meta<typeof SourceList> = {
  title: 'Components/SourceList', component: SourceList, tags: ['autodocs', 'test'],
  args: { title: '参考来源', items },
  parameters: { docs: { description: { component: '文本来源列表：有标题默认折叠，无标题始终展示。引用和定位时机由调用方管理。' } } },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: '参考来源 2' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(canvasElement.querySelectorAll('li')).toHaveLength(2)
    await userEvent.click(button)
    expect(canvas.getByRole('list')).toBeVisible()
    await userEvent.click(button)
    expect(canvasElement.querySelector('ul')).not.toBeVisible()
  },
}
export const Open: Story = { args: { defaultOpen: true }, play: async ({ canvasElement }) => { expect(within(canvasElement).getByRole('list')).toBeVisible() } }
export const Plain: Story = { args: { title: undefined }, play: async ({ canvasElement }) => {
  expect(within(canvasElement).queryByRole('button')).toBeNull()
  expect(getComputedStyle(canvasElement.querySelector('.matthew-source-list')!).borderTopWidth).toBe('0px')
} }
export const EmptyAndSingle: Story = {
  render: () => <><SourceList title="空来源" items={[]} defaultOpen /><SourceList title="单个来源" items={[items[0]]} defaultOpen /></>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('button', { name: '空来源' })).toBeVisible()
    expect(canvas.getByRole('button', { name: '单个来源 1' })).toBeVisible()
    expect(getComputedStyle(canvasElement.querySelector('ul')!).borderTopWidth).toBe('0px')
  },
}
export const SafeLinks: Story = {
  args: { defaultOpen: true, items: [items[1], { id: 'relative', title: '当前页内部引用', href: '#source-example' }, { id: 'bad', title: '无效地址按文本展示', href: 'javascript:alert(1)' }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getAllByRole('link')).toHaveLength(2)
    expect(canvas.getByRole('link', { name: 'React 文档' })).toHaveAttribute('rel', 'noopener noreferrer')
    expect(canvas.getByText('无效地址按文本展示').tagName).toBe('SPAN')
  },
}
export const LongText: Story = {
  render: () => <div style={{ width: 320, maxWidth: '100%' }}><SourceList title={'长标题'.repeat(20)} defaultOpen items={[{ id: 'long', title: 'https://example.com/' + 'path'.repeat(50), summary: '长摘要全文换行，不默认截断。'.repeat(40), source: '来源信息'.repeat(25) }]} /></div>,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('.matthew-source-list')!
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
  },
}
function ControlledDemo() {
  const [open, setOpen] = useState(false)
  const [calls, setCalls] = useState(0)
  return <><button onClick={() => setOpen(true)}>允许展开</button><span data-calls>{calls}</span><SourceList title="受控来源" items={items} open={open} onOpenChange={() => setCalls(c => c + 1)} /></>
}
export const Controlled: Story = {
  render: () => <ControlledDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole('button', { name: '受控来源 2' })
    await userEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(canvasElement.querySelector('[data-calls]')).toHaveTextContent('1')
    await userEvent.click(canvas.getByRole('button', { name: '允许展开' }))
    expect(header).toHaveAttribute('aria-expanded', 'true')
  },
}
function DynamicDemo() {
  const [data, setData] = useState(items)
  return <><button onClick={() => setData(list => [...list, { id: 'new', title: '新增证据' }])}>新增</button>
    <button onClick={() => setData(list => [...list].reverse())}>重排</button>
    <button onClick={() => setData(list => list.map(item => ({ ...item, summary: '最新证据' })))}>更新</button>
    <button onClick={() => setData([])}>清空</button><SourceList title="动态来源" items={data} defaultOpen /></>
}
export const DynamicItems: Story = {
  render: () => <DynamicDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const original = canvas.getByText('项目架构文档').closest('li')
    await userEvent.click(canvas.getByRole('button', { name: '新增' }))
    expect(canvas.getByRole('button', { name: '动态来源 3' })).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(canvas.getByRole('button', { name: '重排' }))
    expect(canvas.getByText('项目架构文档').closest('li')).toBe(original)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    expect(canvas.getAllByText('最新证据')).toHaveLength(3)
    await userEvent.click(canvas.getByRole('button', { name: '清空' }))
    expect(canvas.getByRole('button', { name: '动态来源' })).toHaveAttribute('aria-expanded', 'true')
  },
}
function LocateDemo() {
  const [open, setOpen] = useState(false)
  const pendingFocus = useRef(false)
  const focusEvidence = () => {
    const item = document.getElementById('source-story-evidence')
    item?.scrollIntoView({ block: 'nearest' })
    item?.focus({ preventScroll: true })
  }
  useEffect(() => {
    if (open && pendingFocus.current) {
      focusEvidence()
      pendingFocus.current = false
    }
  }, [open])
  return <><button onClick={() => {
    if (open) focusEvidence()
    else { pendingFocus.current = true; setOpen(true) }
  }}>定位证据</button><SourceList title="证据来源" open={open} onOpenChange={setOpen} items={[{ ...items[0], domId: 'source-story-evidence' }]} /></>
}
export const BusinessOwnedFocus: Story = {
  render: () => <LocateDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '定位证据' }))
    await waitFor(() => expect(canvasElement.querySelector('li')).toHaveFocus())
    await userEvent.click(canvas.getByRole('button', { name: '证据来源 1' }))
    expect(canvasElement.querySelector('ul')).not.toBeVisible()
  },
}
export const Dark: Story = { decorators: [Story => <ThemeProvider theme={darkTheme}><Story /></ThemeProvider>], args: { defaultOpen: true }, play: async ({ canvasElement }) => {
  expect(getComputedStyle(canvasElement.querySelector('.matthew-source-list')!).backgroundColor).toBe('rgb(30, 41, 59)')
  expect(getComputedStyle(canvasElement.querySelector('a')!).color).toBe('rgb(191, 219, 254)')
} }
function ThemeDemo() {
  const [custom, setCustom] = useState(true)
  return <ThemeProvider theme={{ components: { SourceList: { linkColor: '#166534' } } }}><button onClick={() => setCustom(value => !value)}>切换覆盖</button>
    <ThemeProvider theme={{ components: { SourceList: custom ? {
      background: '#fff7ed', borderColor: '#fed7aa', headerColor: '#9a3412', headerHoverBackground: '#ffedd5', itemTitleColor: '#7c2d12', summaryColor: '#431407', sourceColor: '#9a3412', linkColor: '#800080', borderRadius: 12, headerMinHeight: 48, itemPaddingBlock: 16, itemPaddingInline: 20,
    } : {} } }}><SourceList title="主题来源" items={items} defaultOpen /><SourceList items={items} /></ThemeProvider>
  </ThemeProvider>
}
export const ThemeOverrides: Story = {
  render: () => <ThemeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector('.matthew-source-list')!
    expect(getComputedStyle(root).borderRadius).toBe('12px')
    await userEvent.click(canvas.getByRole('button', { name: '切换覆盖' }))
    expect(getComputedStyle(root).borderRadius).toBe('8px')
    expect(getComputedStyle(root.querySelector('a')!).color).toBe('rgb(22, 101, 52)')
    await userEvent.click(canvas.getByRole('button', { name: '切换覆盖' }))
    expect(getComputedStyle(root).borderRadius).toBe('12px')
  },
}
export const ReducedMotion: Story = {
  args: { defaultOpen: true },
  parameters: { docs: { description: { story: '装饰器模拟减少动效终态；真实 prefers-reduced-motion 由 tarball Chromium 验证。' } } },
  decorators: [Story => <div className="source-list-reduced-motion-story"><style>{'.source-list-reduced-motion-story .matthew-source-list__header,.source-list-reduced-motion-story .matthew-source-list__arrow{transition:none}'}</style><Story /></div>],
  play: async ({ canvasElement }) => {
    expect(getComputedStyle(canvasElement.querySelector('.matthew-source-list__arrow')!).transitionDuration).toBe('0s')
  },
}
