import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Button, Dialog, Select, ThemeProvider, darkTheme } from '../../index'

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog', component: Dialog, tags: ['autodocs', 'test'],
  parameters: { docs: { description: { component: '原生受控模态。表单与保存由调用方管理；关闭后内容保持挂载。' } } },
}
export default meta
type Story = StoryObj<typeof meta>

function Demo({ long = false, busyInitially = false, narrow = false, withSelect = false }: {
  long?: boolean; busyInitially?: boolean; narrow?: boolean; withSelect?: boolean
}) {
  const [open, setOpen] = useState(true)
  const [busy, setBusy] = useState(busyInitially)
  const [value, setValue] = useState('preference')
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  return <>
    <Button onClick={() => setOpen(true)}>新建记忆</Button>
    <Dialog ref={dialog} open={open} onOpenChange={setOpen} title="新建记忆" closeLabel="关闭新建记忆"
      dismissible={!busy} initialFocus={() => input.current}
      style={narrow ? { width: 'min(22rem, calc(100% - 2rem))' } : undefined}
      footer={<>
        {busyInitially && <Button onClick={() => setBusy(false)}>结束保存</Button>}
        <Button disabled={busy} onClick={() => setOpen(false)}>取消</Button>
        <Button variant="primary" disabled={busy} onClick={() => setOpen(false)}>{busy ? '保存中…' : '保存'}</Button>
      </>}>
      <div style={{ display: 'grid', gap: 16 }}>
        {withSelect && <label>类型<Select value={value} onValueChange={setValue} aria-label="记忆类型"
          popupHost={() => dialog.current} options={[{ value: 'preference', label: '偏好' }, { value: 'fact', label: '事实' }]} /></label>}
        <label style={{ display: 'grid', gap: 6 }}>标题<input ref={input} defaultValue="代码解释偏好" aria-label="记忆标题"
          style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box', minHeight: 40, borderRadius: 8,
            border: '1px solid var(--matthew-ui-color-border)', color: 'var(--matthew-ui-color-text)',
            background: 'var(--matthew-ui-color-surface)', font: 'inherit' }} /></label>
        <p style={{ margin: 0 }}>解释代码时，先说明数据流，再解释关键实现。</p>
        {long && Array.from({ length: 18 }, (_, index) => <p key={index}>资料库说明 {index + 1}：{'长内容由内容区域滚动，标题和底部操作仍保持可见。'.repeat(3)}</p>)}
      </div>
    </Dialog>
  </>
}

export const Default: Story = {
  render: () => <Demo withSelect />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = await canvas.findByRole('dialog', { name: '新建记忆' })
    const form = within(dialog)
    expect(form.getByRole('textbox')).toHaveFocus()
    expect(getComputedStyle(form.getByRole('combobox')).paddingRight).toBe('12px')
    await userEvent.clear(form.getByRole('textbox')); await userEvent.type(form.getByRole('textbox'), '保留草稿')
    await userEvent.click(form.getByRole('button', { name: '取消' }))
    await userEvent.click(canvas.getByRole('button', { name: '新建记忆' }))
    expect(form.getByRole('textbox')).toHaveValue('保留草稿')
  },
}
export const Dark: Story = {
  render: () => <ThemeProvider theme={darkTheme}><Demo withSelect /></ThemeProvider>,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('dialog')
    expect(getComputedStyle(dialog).backgroundColor).toBe('rgb(30, 41, 59)')
    expect(getComputedStyle(dialog).color).toBe('rgb(248, 250, 252)')
  },
}
export const LongContent: Story = {
  render: () => <Demo long />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('dialog')
    const content = dialog.querySelector<HTMLElement>('.matthew-dialog__content')!
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
    content.scrollTop = content.scrollHeight
    expect(dialog.querySelector('header')).toBeVisible()
    expect(within(dialog).getByRole('button', { name: '保存' })).toBeVisible()
  },
}
export const NarrowPanel: Story = {
  parameters: { docs: { description: { story: '用正常 CSS 展示窄面板；真实375px视口和200%字体放大另由打包浏览器验收。' } } },
  render: () => <Demo narrow withSelect />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('dialog')
    expect(dialog.getBoundingClientRect().width).toBeLessThanOrEqual(352)
    expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth)
  },
}
export const Saving: Story = {
  render: () => <Demo busyInitially />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('dialog')
    const form = within(dialog)
    expect(form.getByRole('button', { name: '关闭新建记忆' })).toBeDisabled()
    await userEvent.click(form.getByRole('button', { name: '结束保存' }))
    expect(form.getByRole('button', { name: '关闭新建记忆' })).not.toBeDisabled()
  },
}
export const WithSelect: Story = {
  render: () => <Demo withSelect />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('dialog')
    const select = within(dialog).getByRole('combobox')
    await userEvent.click(select)
    expect(dialog.querySelector('[role=listbox]')).toBeVisible()
    await userEvent.keyboard('{Escape}')
    expect(select).toHaveAttribute('aria-expanded', 'false')
    expect(dialog).toBeVisible()
    // Story userEvent 是合成事件；第二次 native cancel 由真实 Chromium 检查覆盖。
    await userEvent.click(within(dialog).getByRole('button', { name: '关闭新建记忆' }))
  },
}
function ThemeDemo() {
  const [custom, setCustom] = useState(true)
  return <ThemeProvider theme={{ components: { Dialog: { titleColor: '#166534' } } }}>
    <ThemeProvider theme={{ components: { Dialog: custom ? {
      background: '#fff7ed', color: '#222222', borderColor: '#0000ff', backdropBackground: 'rgba(0,0,0,.7)',
      titleColor: '#800080', closeColor: '#008000', closeHoverBackground: '#ffff00', shadow: 'none',
      borderRadius: 12, titleFontSize: 20, contentPaddingBlock: 8, contentPaddingInline: 24,
    } : {} } }}><Dialog open onOpenChange={() => {}} title="主题定制" closeLabel="关闭主题示例"
      footer={<Button onClick={() => setCustom(flag => !flag)}>切换覆盖</Button>}>所有12字段精确覆盖，撤销后恢复父层和默认。</Dialog></ThemeProvider>
  </ThemeProvider>
}
export const ThemeOverrides: Story = {
  render: () => <ThemeDemo />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('dialog')
    expect(getComputedStyle(dialog).backgroundColor).toBe('rgb(255, 247, 237)')
    expect(getComputedStyle(dialog.querySelector('h2')!).fontSize).toBe('20px')
    await userEvent.click(within(dialog).getByRole('button', { name: '切换覆盖' }))
    await waitFor(() => expect(getComputedStyle(dialog).backgroundColor).toBe('rgb(255, 255, 255)'))
    expect(getComputedStyle(dialog.querySelector('h2')!).color).toBe('rgb(22, 101, 52)')
  },
}
export const ReducedMotion: Story = {
  parameters: { docs: { description: { story: '装饰器明确模拟减少动效终态；真实媒体查询由发布验证器覆盖。无开合缩放动画。' } } },
  decorators: [Story => <div className="dialog-reduced-motion-story"><style>{'.dialog-reduced-motion-story .matthew-dialog__close{transition:none}'}</style><Story /></div>],
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('dialog')
    expect(getComputedStyle(dialog.querySelector('.matthew-dialog__close')!).transitionDuration).toBe('0s')
  },
}
