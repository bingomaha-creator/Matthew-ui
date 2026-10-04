import type { Meta, StoryObj } from '@storybook/react-vite'
import { createRef, useState } from 'react'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Select, ThemeProvider, darkTheme } from '../../index'
import type { SelectOption } from '../../index'

const options: SelectOption[] = [
  { value: '', label: '跟随系统' }, { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' }, { value: 'contrast', label: '高对比度（暂不可用）', disabled: true },
]
const meta: Meta<typeof Select> = {
  title: 'Components/Select', component: Select, tags: ['autodocs', 'test'],
  decorators: [Story => <div style={{ width: 280, maxWidth: '100%' }}><Story /></div>],
}
export default meta
type Story = StoryObj<typeof meta>

function ControlledDemo() {
  const [value, setValue] = useState('')
  return <Select value={value} onValueChange={setValue} options={options} aria-label="主题" />
}
export const Controlled: Story = {
  render: () => <ControlledDemo />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('combobox')
    await userEvent.click(button)
    const list = within(document.getElementById(button.getAttribute('aria-controls')!)!)
    await userEvent.click(list.getByRole('option', { name: '暗色' }))
    await expect(button).toHaveTextContent('暗色')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  },
}
export const PlaceholderAndDisabled: Story = {
  render: () => <div style={{ display: 'grid', gap: 16 }}>
    <Select value="unknown" options={options} placeholder="请选择主题" onValueChange={() => {}} aria-label="占位" />
    <Select value="" options={options} disabled onValueChange={() => {}} aria-label="禁用" />
    <Select value="" options={[]} placeholder="暂无选项" onValueChange={() => {}} aria-label="空列表" />
    <Select value="" options={options.map(option => ({ ...option, disabled: true }))} onValueChange={() => {}} aria-label="全部禁用" />
  </div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('combobox', { name: '空列表' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('combobox', { name: '全部禁用' }))
    expect(canvas.getByRole('combobox', { name: '全部禁用' })).not.toHaveAttribute('aria-activedescendant')
    await userEvent.keyboard('{Escape}')
  },
}
export const ActiveVersusSelected: Story = {
  render: () => <ControlledDemo />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('combobox')
    await userEvent.click(button); await userEvent.keyboard('{End}')
    const list = within(document.getElementById(button.getAttribute('aria-controls')!)!)
    expect(list.getByRole('option', { name: '跟随系统' })).toHaveAttribute('aria-selected', 'true')
    expect(document.getElementById(button.getAttribute('aria-activedescendant')!)).toHaveTextContent('暗色')
  },
}
export const Dark: Story = {
  render: () => <ThemeProvider theme={darkTheme} style={{ background: '#1e293b', padding: 16 }}><ControlledDemo /></ThemeProvider>,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('combobox')
    await userEvent.click(button)
    const list = document.getElementById(button.getAttribute('aria-controls')!)!
    expect(getComputedStyle(list).backgroundColor).toBe('rgb(30, 41, 59)')
  },
}

export const ThemeTokens: Story = {
  render: () => <ThemeProvider theme={{ components: { Select: {
    fontSize: 16, triggerBackground: '#fafafa', triggerColor: '#111111', placeholderColor: '#555555',
    borderColor: '#0000ff', triggerHoverBorderColor: '#008000', triggerMinHeight: 48, borderRadius: 12,
    triggerPaddingBlock: 10, triggerPaddingInline: 20, optionColor: '#222222',
    optionActiveBackground: '#ffff00', optionSelectedColor: '#800080', optionMinHeight: 44,
    popupBackground: '#fff7ed', popupShadow: 'none',
  } } }}><ControlledDemo /></ThemeProvider>,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('combobox')
    expect(getComputedStyle(button).minHeight).toBe('48px')
    await userEvent.click(button)
    const list = document.getElementById(button.getAttribute('aria-controls')!)!
    expect(getComputedStyle(list).backgroundColor).toBe('rgb(255, 247, 237)')
    await waitFor(() => expect(getComputedStyle(list.querySelector('[aria-selected=true]')!).color).toBe('rgb(128, 0, 128)'))
  },
}

export const CharacterNavigation: Story = {
  render: () => <Select value="a" onValueChange={() => {}} aria-label="字符定位" options={[
    { value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Bravo' },
  ]} />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('combobox')
    await userEvent.click(button); await userEvent.keyboard('bb')
    expect(document.getElementById(button.getAttribute('aria-activedescendant')!)).toHaveTextContent('Bravo')
    expect(button).toHaveTextContent('Alpha')
  },
}

export const ReducedMotion: Story = {
  parameters: { docs: { description: { story: '明确模拟 reduced-motion 的终态；真实媒体查询由发布包 Chromium 验收。' } } },
  decorators: [Story => <div className="select-reduced-motion-story"><style>{`
    .select-reduced-motion-story .matthew-select,
    .select-reduced-motion-story .matthew-select__arrow { transition: none; }
  `}</style><Story /></div>],
  render: () => <ControlledDemo />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('combobox')
    expect(getComputedStyle(button.querySelector('.matthew-select__arrow')!).transitionDuration).toBe('0s')
  },
}
export const LongLabelInNarrowContainer: Story = {
  render: () => <div style={{ width: 200, maxWidth: '100%' }}><Select value="long" onValueChange={() => {}}
    aria-label="长标签" options={[{ value: 'long', label: '一个很长的选项标签，用于观察窄容器中的省略与箭头占位' }]} /></div>,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('combobox')
    expect(getComputedStyle(button.querySelector('.matthew-select__label')!).textOverflow).toBe('ellipsis')
    await userEvent.click(button)
  },
}
function DynamicDemo() {
  const [items, setItems] = useState(options)
  const [custom, setCustom] = useState(true)
  return <ThemeProvider theme={{ components: { Select: { optionSelectedColor: 'green' } } }}>
    <ThemeProvider theme={{ components: { Select: custom ? { triggerMinHeight: 48, optionSelectedColor: 'purple' } : {} } }}>
      <Select value="" options={items} onValueChange={() => {}} aria-label="动态" />
    </ThemeProvider>
    <button type="button" onClick={() => setItems(current => [...current].reverse().concat({ value: 'extra', label: '新增选项' }))}>重排并新增</button>
    <button type="button" onClick={() => setCustom(current => !current)}>切换覆盖</button>
  </ThemeProvider>
}
export const DynamicOptionsAndTheme: Story = {
  render: () => <DynamicDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '重排并新增' }))
    await userEvent.click(canvas.getByRole('button', { name: '切换覆盖' }))
    const button = canvas.getByRole('combobox')
    expect(getComputedStyle(button).minHeight).toBe('40px')
    await userEvent.click(button)
    const list = within(document.getElementById(button.getAttribute('aria-controls')!)!)
    expect(list.getByRole('option', { name: '新增选项' })).toBeVisible()
    await waitFor(() => expect(getComputedStyle(list.getByRole('option', { name: '跟随系统' })).color).toBe('rgb(0, 128, 0)'))
  },
}
export const ModalAndTransformedHost: Story = {
  render: () => {
    const dialog = createRef<HTMLDialogElement>()
    return <><button type="button" onClick={() => dialog.current?.showModal()}>打开弹窗</button>
      <dialog ref={dialog} style={{ width: 280 }}><div style={{ transform: 'translateX(0)', minHeight: 260 }}>
        <Select value="" options={options} onValueChange={() => {}} popupHost={() => dialog.current} aria-label="弹窗主题" />
      </div></dialog></>
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '打开弹窗' }))
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.keyboard('{Escape}')
    expect(canvasElement.querySelector('dialog')).toHaveAttribute('open')
    // Story 的 userEvent 是合成键盘事件，不执行原生 dialog 的浏览器 cancel 默认动作。
    // 第二次真实 Escape 由 Vitest browser 与真实包 Playwright 验证；此处只做清理。
    canvasElement.querySelector('dialog')!.close()
  },
}
