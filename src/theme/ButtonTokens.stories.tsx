import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button, LinkButton, ThemeProvider, darkTheme, lightTheme } from '../index'
import type { MatthewThemeConfig } from '../index'

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }
const stack: CSSProperties = { display: 'grid', gap: '1rem', minWidth: 0 }
const panel: CSSProperties = {
  ...stack, alignContent: 'start', padding: '1.5rem',
  background: 'var(--matthew-ui-color-surface)', color: 'var(--matthew-ui-color-text)',
  border: '1px solid var(--matthew-ui-color-border)', borderRadius: 'var(--matthew-ui-radius-md)',
}
// 演示只给明确覆盖值，不复制任何组件默认表；状态色需要各自配置。
const checkoutTheme: MatthewThemeConfig = { components: { Button: {
  background: '#166534', backgroundHover: '#14532d', backgroundActive: '#052e16',
  color: '#ffffff', borderColor: '#166534', borderRadius: 20,
} } }

function SeedScalePreview() {
  const [spacious, setSpacious] = useState(false)
  return (
    <div style={stack}>
      <div><Button onClick={() => setSpacious(value => !value)}>
        {spacious ? '恢复默认尺寸' : '使用宽松尺寸'}
      </Button></div>
      <ThemeProvider theme={{ seed: spacious ? { controlHeight: 48, fontSize: 18 } : {} }}>
        <section style={panel} aria-label="尺寸联动">
          <h2>Seed 驱动三个尺寸档位</h2>
          <p>高度与字号按家族变化；padding 保持原档位，并不跟随 Seed 自动缩放。</p>
          <div style={row}>
            <Button size="sm">小号</Button><Button>中号</Button><Button size="lg">大号</Button>
            <LinkButton href="#seed-docs">尺寸文档</LinkButton>
          </div>
          <p aria-live="polite">{spacious ? '宽松：高度 40 / 48 / 56px' : '默认：高度 32 / 40 / 48px'}</p>
        </section>
      </ThemeProvider>
    </div>
  )
}

function ThemeSwitchPreview() {
  const [dark, setDark] = useState(false)
  const [custom, setCustom] = useState(true)
  return (
    <div style={stack}>
      <div style={row}>
        <Button onClick={() => setDark(value => !value)}>切换到{dark ? '亮色' : '暗色'}</Button>
        <Button onClick={() => setCustom(value => !value)}>{custom ? '撤销按钮定制' : '启用按钮定制'}</Button>
      </div>
      {/* 这是根 Provider：移除配置才会回到预设。嵌套时 undefined 会继续继承父级。 */}
      <ThemeProvider theme={{
        ...(dark ? darkTheme : lightTheme),
        components: custom ? checkoutTheme.components : undefined,
      }}>
        <section style={panel} aria-label="动态定制">
          <h2>主题切换与撤销配置</h2>
          <p aria-live="polite">当前：{dark ? '暗色' : '亮色'} / {custom ? '绿色定制' : '预设默认'}</p>
          <div style={row}>
            <Button variant="primary">预览按钮</Button>
            <LinkButton variant="primary" href="#preview-docs">预览链接</LinkButton>
          </div>
          <p>切换亮暗不会覆盖显式组件配置；撤销后才恢复当前预设的 primary 色。</p>
        </section>
      </ThemeProvider>
    </div>
  )
}

const meta = {
  title: 'Theme/ButtonTokens',
  component: ThemeProvider,
  tags: ['autodocs', 'test'],
  args: { children: null },
} satisfies Meta<typeof ThemeProvider>
export default meta
type Story = StoryObj<typeof meta>

export const SeedScale: Story = {
  render: () => <SeedScalePreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '使用宽松尺寸' }))
    await waitFor(() => {
      const actual = ['小号', '中号', '大号'].map(name => {
        const style = getComputedStyle(canvas.getByRole('button', { name }))
        return [style.minHeight, style.fontSize]
      })
      expect(actual).toEqual([['40px', '17px'], ['48px', '18px'], ['56px', '20px']])
    })
    await userEvent.click(canvas.getByRole('button', { name: '恢复默认尺寸' }))
    await waitFor(() => expect(getComputedStyle(canvas.getByRole('button', { name: '中号' })).minHeight).toBe('40px'))
  },
}

export const ScopedTokens: Story = {
  render: () => (
    <div style={{ ...stack, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 24rem), 1fr))' }}>
      <ThemeProvider theme={checkoutTheme}>
        <section style={panel} aria-label="定制区域">
          <h2>结算区：统一绿色</h2>
          <p>Button 与 LinkButton 共用配置。悬停、按住按钮，观察独立配置的状态色。</p>
          <div style={row}>
            <Button variant="primary">提交订单</Button>
            <Button variant="secondary">保存草稿</Button>
            <LinkButton href="#order-docs">订单文档</LinkButton>
          </div>
          <div style={row}>
            <Button disabled>禁用操作</Button>
            <LinkButton href="#disabled-docs" disabled>禁用链接</LinkButton>
          </div>
          <p>统一颜色覆盖也会影响 danger；需要保留危险语义时，请缩小定制作用域。</p>
        </section>
      </ThemeProvider>
      <section style={panel} aria-label="默认区域">
        <h2>区域之外：保留默认</h2>
        <p>Provider 不修改 :root，外部按钮继续使用默认主题。</p>
        <div style={row}>
          <Button>外部按钮</Button><Button variant="danger">删除记录</Button>
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(getComputedStyle(canvas.getByRole('button', { name: '提交订单' })).backgroundColor).toBe('rgb(22, 101, 52)')
      expect(getComputedStyle(canvas.getByRole('link', { name: '订单文档' })).borderRadius).toBe('20px')
      expect(getComputedStyle(canvas.getByRole('button', { name: '外部按钮' })).backgroundColor).toBe('rgb(255, 255, 255)')
    })
    expect(canvas.getByRole('button', { name: '禁用操作' })).toBeDisabled()
    expect(canvas.getByRole('link', { name: '禁用链接' })).not.toHaveAttribute('href')
  },
}

export const NestedOverrides: Story = {
  render: () => (
    <ThemeProvider theme={{ components: { Button: { ...checkoutTheme.components?.Button, borderRadius: 8 } } }}>
      <section style={panel} aria-label="父级定制">
        <h2>父级：颜色与圆角</h2>
        <div><Button>父级按钮</Button></div>
        <ThemeProvider theme={darkTheme}>
          <section style={panel} aria-label="嵌套暗色">
            <h3>子级：暗色背景，继承 Button 配置</h3>
            <p>左侧继承 8px 圆角，右侧在按钮自身覆盖为胶囊；两者仍继承绿色。</p>
            <div style={row}>
              <Button>继承按钮</Button>
              {/* 元素自身的变量优先于从 Provider 继承的变量；普通 CSS class 也能这样写。 */}
              <Button style={{ '--matthew-ui-button-radius': '999px' } as CSSProperties}>局部胶囊</Button>
            </div>
          </section>
        </ThemeProvider>
      </section>
    </ThemeProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      const inherited = getComputedStyle(canvas.getByRole('button', { name: '继承按钮' }))
      expect(inherited.backgroundColor).toBe('rgb(22, 101, 52)')
      expect(inherited.borderRadius).toBe('8px')
      expect(getComputedStyle(canvas.getByRole('button', { name: '局部胶囊' })).borderRadius).toBe('999px')
    })
  },
}

export const ThemeSwitchAndReset: Story = {
  render: () => <ThemeSwitchPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: '预览按钮' })
    await userEvent.click(canvas.getByRole('button', { name: '切换到暗色' }))
    await waitFor(() => expect(getComputedStyle(button).backgroundColor).toBe('rgb(22, 101, 52)'))
    await userEvent.click(canvas.getByRole('button', { name: '撤销按钮定制' }))
    await waitFor(() => expect(getComputedStyle(button).backgroundColor).toBe('rgb(59, 130, 246)'))
    // 恢复演示起点，让打开 Story 的人可以亲手完成同样的切换。
    await userEvent.click(canvas.getByRole('button', { name: '启用按钮定制' }))
    await userEvent.click(canvas.getByRole('button', { name: '切换到亮色' }))
    await waitFor(() => expect(getComputedStyle(button).backgroundColor).toBe('rgb(22, 101, 52)'))
  },
}
