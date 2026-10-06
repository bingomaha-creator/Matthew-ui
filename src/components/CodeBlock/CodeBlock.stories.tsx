import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { CodeBlock, ThemeProvider, darkTheme, ToolCall } from '../../index'

const copy = { label: '复制', copiedLabel: '已复制', errorLabel: '复制失败' }
const code = '{\n  "query": "检查项目的工具调用与组件主题",\n  "source": "https://example.com/' + 'component-boundaries/'.repeat(8) + '"\n}'
// Story 仅演示反馈；真实剪贴板写入由隔离的发布验证浏览器检查。
function mockClipboard(writeText: (text: string) => Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  return () => {
    if (original) Object.defineProperty(navigator, 'clipboard', original)
    else Reflect.deleteProperty(navigator, 'clipboard')
  }
}
const custom = { background: '#fff7ed', color: '#222222', borderColor: '#0000ff', headerBackground: '#ffedd5', headerColor: '#800080', borderRadius: 12, paddingBlock: 8, paddingInline: 20 }
const meta = {
  title: 'Components/CodeBlock', component: CodeBlock,
  args: { code, title: '调用参数', language: 'JSON', copy },
  parameters: { docs: { description: { component: '只读原文块；复制交互 Story 使用模拟 Clipboard，正式实现使用原生 API。' } } },
  beforeEach: () => mockClipboard(() => Promise.resolve()),
} satisfies Meta<typeof CodeBlock>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^复制$/ }))
    await expect(canvas.getByRole('status')).toHaveTextContent('已复制')
    await expect(canvas.getByRole('region', { name: '调用参数' })).toHaveTextContent('component-boundaries')
  },
}
export const Plain: Story = {
  args: { title: undefined, language: undefined, copy: undefined, code: '<script>普通文本，不执行</script>\n\t保留缩进' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('button, .matthew-code-block__header, script')).toBeNull()
    await expect(canvasElement.querySelector('code')).toHaveTextContent('<script>普通文本，不执行</script>')
  },
}
export const Wrap: Story = { args: { wrap: true }, play: async ({ canvasElement }) => { await expect(getComputedStyle(canvasElement.querySelector('pre')!).whiteSpace).toBe('pre-wrap') } }
export const Narrow: Story = {
  args: { title: '窄容器中的调用参数'.repeat(12), language: 'TypeScript'.repeat(15), wrap: true },
  decorators: [Story => <div style={{ width: 320, maxWidth: '100%' }}><Story /></div>],
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('.matthew-code-block')!
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    await expect(within(canvasElement).getByRole('button')).toBeVisible()
  },
}
export const Appearance: Story = {
  render: args => <div style={{ display: 'grid', gap: 16 }}><CodeBlock {...args} /><ThemeProvider theme={darkTheme}><CodeBlock {...args} title="暗色原文" /></ThemeProvider></div>,
  play: async ({ canvasElement }) => {
    const roots = canvasElement.querySelectorAll('.matthew-code-block')
    await expect(getComputedStyle(roots[0]).backgroundColor).toBe('rgb(255, 255, 255)')
    await expect(getComputedStyle(roots[1]).backgroundColor).toBe('rgb(30, 41, 59)')
  },
}
export const ThemeScopes: Story = {
  render: args => <ThemeProvider theme={{ components: { CodeBlock: custom } }}><CodeBlock {...args} /></ThemeProvider>,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('.matthew-code-block')!
    await expect(getComputedStyle(root).borderRadius).toBe('12px')
    await expect(getComputedStyle(root.querySelector('pre')!).padding).toBe('8px 20px')
  },
}
export const DynamicTheme: Story = {
  render: function Example(args) {
    const [enabled, setEnabled] = useState(true)
    return <ThemeProvider theme={{ components: { CodeBlock: { color: '#166534' } } }}><button onClick={() => setEnabled(!enabled)}>切换子层覆盖</button><ThemeProvider theme={{ components: { CodeBlock: enabled ? custom : {} } }}><CodeBlock {...args} /></ThemeProvider></ThemeProvider>
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: '切换子层覆盖' })
    await userEvent.click(button)
    await expect(getComputedStyle(canvasElement.querySelector('pre')!).color).toBe('rgb(22, 101, 52)')
    await expect(getComputedStyle(canvasElement.querySelector('.matthew-code-block')!).borderRadius).toBe('8px')
    await userEvent.click(button)
    await expect(getComputedStyle(canvasElement.querySelector('.matthew-code-block')!).borderRadius).toBe('12px')
  },
}
export const CopyFailure: Story = {
  beforeEach: () => mockClipboard(() => Promise.reject(new Error('simulated denial'))),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '复制' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('复制失败')
  },
}
export const PendingChange: Story = {
  render: function Example(args) {
    const [value, setValue] = useState('旧内容')
    const [complete, setComplete] = useState<(() => void) | undefined>()
    return <><button onClick={() => setValue('新内容')}>更新原文</button><button onClick={() => complete?.()}>完成旧请求</button><CodeBlock {...args} code={value} /><button onClick={() => {
      mockClipboard(() => new Promise<void>(resolve => setComplete(() => resolve)))
    }}>启用待完成模拟</button></>
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '启用待完成模拟' }))
    await userEvent.click(canvas.getByRole('button', { name: /^复制$/ }))
    await expect(canvas.getByRole('button', { name: /^复制$/ })).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(canvas.getByRole('button', { name: '更新原文' }))
    await userEvent.click(canvas.getByRole('button', { name: '完成旧请求' }))
    await waitFor(() => expect(canvasElement.querySelector('[role=status]')!.textContent).toBe(''))
    await expect(canvasElement.querySelector('code')).toHaveTextContent('新内容')
  },
}
export const Composition: Story = {
  render: args => <ToolCall name="读取项目文件" status="completed" defaultOpen><CodeBlock {...args} title="读取结果" /></ToolCall>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^复制$/ }))
    await expect(canvas.getByRole('button', { name: /^读取项目文件$/ })).toHaveAttribute('aria-expanded', 'true')
  },
}
export const LimitedHeight: Story = {
  args: { code: 'business-owned line\n'.repeat(50) },
  decorators: [Story => <div className="code-block-height-demo"><style>{'.code-block-height-demo .matthew-code-block__pre{max-height:10rem}'}</style><Story /></div>],
  play: async ({ canvasElement }) => { const pre = canvasElement.querySelector('pre')!; await expect(pre.scrollHeight).toBeGreaterThan(pre.clientHeight) },
}
export const ReducedMotion: Story = {
  parameters: { docs: { description: { story: '装饰器注入等价声明模拟 reduced-motion；真实媒体行为由发布验证器检查。' } } },
  decorators: [Story => <div className="code-block-reduced-demo"><style>{'.code-block-reduced-demo .matthew-code-block__copy{transition:none}'}</style><Story /></div>],
  play: async ({ canvasElement }) => { await expect(getComputedStyle(canvasElement.querySelector('.matthew-code-block__copy')!).transitionDuration).toBe('0s') },
}
