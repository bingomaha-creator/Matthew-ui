import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { AutoComplete, Button, ThemeProvider, darkTheme, lightTheme } from '../index'
import type { MatthewThemeConfig } from '../index'

const stack: CSSProperties = { display: 'grid', gap: '1rem', minWidth: 0 }
const panel: CSSProperties = { ...stack, alignContent: 'start', padding: '1.25rem', minHeight: '25rem',
  color: 'var(--matthew-ui-color-text)', background: 'var(--matthew-ui-color-surface)',
  border: '1px solid var(--matthew-ui-color-border)', borderRadius: 'var(--matthew-ui-radius-md)' }
const options = [{ value: 'React' }, { value: 'React Router' }, { value: 'React Query' }]
const search = (query: string) => options.filter(item => item.value.toLowerCase().includes(query.toLowerCase()))
const activeTokens = { optionActiveBackground: '#dcfce7', optionActiveColor: '#166534', inputBorderRadius: 12 }
const regionalTheme: MatthewThemeConfig = { components: { AutoComplete: {
  ...activeTokens, fontSize: 18, inputMinHeight: 48, inputPaddingBlock: 6, inputPaddingInline: 20,
  inputBackground: '#fafafa', inputColor: '#14532d', borderColor: '#166534', inputHoverBorderColor: '#052e16',
  optionColor: '#14532d', optionBorderRadius: 4, optionPaddingBlock: 8, optionPaddingInline: 16,
  popupBackground: '#f0fdf4', popupShadow: 'none',
} } }
function Search({ label, style }: { label: string; style?: CSSProperties }) {
  return <AutoComplete aria-label={label} placeholder="输入 re，使用方向键选择" fetchSuggestions={search} style={style} />
}
function SeedPreview() {
  const [spacious, setSpacious] = useState(false)
  return <div style={stack}>
    <div><Button onClick={() => setSpacious(value => !value)}>{spacious ? '恢复默认尺寸' : '使用宽松尺寸'}</Button></div>
    <ThemeProvider theme={{ seed: spacious ? { controlHeight: 48, fontSize: 18 } : {} }}>
      <section style={panel}>
        <h2>输入与建议一起跟随 Seed</h2>
        <p>字号14 → 18px，输入最小高度40 → 48px；两处内边距各自保持不变。</p>
        <Search label="尺寸搜索" />
      </section>
    </ThemeProvider>
  </div>
}
function SwitchPreview() {
  const [dark, setDark] = useState(false)
  const [custom, setCustom] = useState(true)
  return <div style={stack}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Button onClick={() => setDark(value => !value)}>切换到{dark ? '亮色' : '暗色'}</Button>
      <Button onClick={() => setCustom(value => !value)}>{custom ? '撤销搜索定制' : '启用搜索定制'}</Button>
    </div>
    <ThemeProvider theme={{ ...(dark ? darkTheme : lightTheme), components: custom ? { AutoComplete: activeTokens } : undefined }}>
      <section style={panel}>
        <h2>亮暗切换与撤销</h2>
        <p aria-live="polite">当前：{dark ? '暗色' : '亮色'} / {custom ? '绿色候选' : '预设默认'}</p>
        <p>显式候选颜色不会随预设改变；撤销后恢复预设。点击上方按钮会关闭列表，重新输入即可观察。</p>
        <Search label="主题搜索" />
      </section>
    </ThemeProvider>
  </div>
}
const meta = { title: 'Theme/AutoCompleteTokens', component: ThemeProvider,
  tags: ['autodocs', 'test'], args: { children: null },
} satisfies Meta<typeof ThemeProvider>
export default meta
type Story = StoryObj<typeof meta>

// 复用用户动作而非组件内部命令；每次重新输入，真实触发防抖/搜索。
async function openSuggestions(canvas: ReturnType<typeof within>, label: string) {
  const input = canvas.getByRole('combobox', { name: label })
  await userEvent.clear(input)
  await userEvent.type(input, 're')
  await waitFor(() => expect(canvas.getByRole('option', { name: 'React' })).toBeVisible())
  return input
}
export const SeedScale: Story = {
  render: () => <SeedPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '使用宽松尺寸' }))
    const input = await openSuggestions(canvas, '尺寸搜索')
    expect(getComputedStyle(input).minHeight).toBe('48px')
    expect(getComputedStyle(input).fontSize).toBe('18px')
    expect(getComputedStyle(canvas.getByRole('option', { name: 'React' })).fontSize).toBe('18px')
    await userEvent.click(canvas.getByRole('button', { name: '恢复默认尺寸' }))
    await waitFor(() => expect(getComputedStyle(input).fontSize).toBe('14px'))
  },
}
export const ScopedTokens: Story = {
  render: () => <div style={{ ...stack, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 24rem), 1fr))' }}>
    <ThemeProvider theme={regionalTheme}><section style={panel} aria-label="定制区域">
      <h2>独立的输入、候选与浮层</h2>
      <p>输入 re，再按方向键。绿色高亮只是候选；Enter或点击后才回填。</p>
      {/* 演示页为绝对定位列表预留空间，方便同时比较禁用/只读状态。 */}
      <div style={{ minHeight: '12rem' }}><Search label="定制搜索" /></div>
      <label>禁用<AutoComplete disabled placeholder="暂不可用" fetchSuggestions={search} /></label>
      <label>只读<AutoComplete readOnly defaultValue="React" fetchSuggestions={search} /></label>
    </section></ThemeProvider>
    <section style={panel} aria-label="外部区域">
      <h2>区域外仍用默认样式</h2>
      <p>组件变量不会污染其他实例；禁用/只读背景仍使用全局状态色。</p>
      <Search label="外部搜索" />
    </section>
  </div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await openSuggestions(canvas, '定制搜索')
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(getComputedStyle(canvas.getByRole('option', { name: 'React' })).backgroundColor).toBe('rgb(220, 252, 231)'))
    expect(input).toHaveValue('re')
    expect(getComputedStyle(input).borderRadius).toBe('12px')
    expect(getComputedStyle(canvas.getByRole('listbox')).backgroundColor).toBe('rgb(240, 253, 244)')
    expect(getComputedStyle(canvas.getByRole('combobox', { name: '外部搜索' })).fontSize).toBe('14px')
    expect(getComputedStyle(canvas.getByRole('combobox', { name: '只读' })).backgroundColor).toBe('rgb(241, 245, 249)')
    await userEvent.keyboard('{Escape}')
  },
}
export const NestedOverrides: Story = {
  render: () => <ThemeProvider theme={{ components: { AutoComplete: activeTokens } }}>
    <section style={panel}>
      <h2>父级配置 → 暗色子级 → 输入局部例外</h2>
      <p>子级继承绿色候选与12px输入圆角。局部字号24px只在input上，建议仍为18px。</p>
      <Search label="父级搜索" />
      <ThemeProvider theme={{ ...darkTheme, components: { AutoComplete: { fontSize: 18 } } }}>
        <section style={panel}>
          <h3>暗色子级</h3>
          {/* style仍落在input；popup变量写在这里不会传给兄弟ul。 */}
          <Search label="子级搜索" style={{ '--matthew-ui-auto-complete-font-size': '24px',
            '--matthew-ui-auto-complete-popup-background': 'red' } as CSSProperties} />
        </section>
      </ThemeProvider>
    </section>
  </ThemeProvider>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await openSuggestions(canvas, '子级搜索')
    expect(getComputedStyle(input).fontSize).toBe('24px')
    expect(getComputedStyle(input).borderRadius).toBe('12px')
    expect(getComputedStyle(canvas.getByRole('option', { name: 'React' })).fontSize).toBe('18px')
    expect(getComputedStyle(canvas.getByRole('listbox')).backgroundColor).toBe('rgb(30, 41, 59)')
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(getComputedStyle(canvas.getByRole('option', { name: 'React' })).color).toBe('rgb(22, 101, 52)'))
    expect(getComputedStyle(canvas.getByRole('combobox', { name: '父级搜索' })).fontSize).toBe('14px')
  },
}
export const ThemeSwitchAndReset: Story = {
  render: () => <SwitchPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '切换到暗色' }))
    await openSuggestions(canvas, '主题搜索')
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(getComputedStyle(canvas.getByRole('option', { name: 'React' })).backgroundColor).toBe('rgb(220, 252, 231)'))
    expect(getComputedStyle(canvas.getByRole('listbox')).boxShadow).toBe('rgba(255, 255, 255, 0.12) 0px 12px 24px 0px')
    await userEvent.click(canvas.getByRole('button', { name: '撤销搜索定制' }))
    await openSuggestions(canvas, '主题搜索')
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(getComputedStyle(canvas.getByRole('option', { name: 'React' })).backgroundColor).toBe('rgb(71, 85, 105)'))
    await userEvent.click(canvas.getByRole('button', { name: '启用搜索定制' }))
    await userEvent.click(canvas.getByRole('button', { name: '切换到亮色' }))
  },
}
export const AsyncLoading: Story = {
  render: () => <ThemeProvider theme={regionalTheme}><section style={panel}>
    <h2>加载行与候选共用几何，不共用高亮颜色</h2>
    <p>输入 re，模拟请求耗时1秒；加载文字保持弱化色。请求完成后才能选择候选。</p>
    <AutoComplete aria-label="异步搜索" placeholder="输入 re 查看加载态"
      fetchSuggestions={query => new Promise<typeof options>(resolve => window.setTimeout(() => resolve(search(query)), 1000))} />
  </section></ThemeProvider>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('combobox', { name: '异步搜索' }), 're')
    await waitFor(() => expect(canvas.getByRole('status')).toBeVisible())
    const loading = canvas.getByRole('status').closest('li')!
    expect(getComputedStyle(loading).color).toBe('rgb(100, 116, 139)')
    expect(getComputedStyle(loading).paddingBlock).toBe('8px')
    await waitFor(() => expect(canvas.getByRole('option', { name: 'React' })).toBeVisible(), { timeout: 2000 })
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(canvas.getByRole('combobox', { name: '异步搜索' })).toHaveValue('React')
  },
}
