import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  AutoComplete,
  Button,
  darkTheme,
  lightTheme,
  Menu,
  ThemeProvider,
} from '../index'

const suggestions = [
  { value: 'Button' },
  { value: 'Menu' },
  { value: 'AutoComplete' },
]

const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 24rem), 1fr))',
}

const panelStyle: CSSProperties = {
  display: 'grid',
  alignContent: 'start',
  gap: '1.25rem',
  minWidth: 0,
  padding: '1.5rem',
  color: 'var(--matthew-ui-color-text)',
  background: 'var(--matthew-ui-color-surface)',
  border: '1px solid var(--matthew-ui-color-border)',
  borderRadius: 'var(--matthew-ui-radius-md)',
  transition: 'background var(--matthew-ui-duration-fast)',
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
}

function ComponentPreview({ label }: { label: string }) {
  return (
    <section style={panelStyle} aria-label={`${label}组件预览`}>
      <header>
        <h2 style={{ margin: 0 }}>{label}</h2>
        <p style={{ color: 'var(--matthew-ui-color-text-muted)' }}>
          同一套静态组件样式，只切换作用域中的 CSS Variables。
        </p>
      </header>

      <div style={buttonRowStyle}>
        <Button variant="primary">主要操作</Button>
        <Button variant="secondary">次要操作</Button>
        <Button variant="danger">危险操作</Button>
        <Button disabled variant="primary">禁用操作</Button>
      </div>

      <Menu
        defaultOpenValues={['components']}
        defaultValue="button"
        mode="vertical"
      >
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.SubMenu title="组件" value="components">
          <Menu.LinkItem href="#button" value="button">Button</Menu.LinkItem>
          <Menu.Item value="menu">Menu</Menu.Item>
        </Menu.SubMenu>
        <Menu.Item disabled value="settings">设置</Menu.Item>
      </Menu>

      <AutoComplete
        aria-label={`${label}搜索组件`}
        fetchSuggestions={(query) =>
          suggestions.filter(({ value }) =>
            value.toLowerCase().includes(query.toLowerCase()),
          )
        }
        placeholder="输入组件名称"
      />
    </section>
  )
}

function ThemeSwitcher() {
  const [dark, setDark] = useState(false)

  return (
    <ThemeProvider theme={dark ? darkTheme : lightTheme}>
      <div style={panelStyle}>
        <Button onClick={() => setDark((current) => !current)}>
          切换到{dark ? '亮色' : '暗色'}
        </Button>
        <p aria-live="polite">当前主题：{dark ? '暗色' : '亮色'}</p>
      </div>
    </ThemeProvider>
  )
}

const meta = {
  title: 'Theme/ThemeProvider',
  component: ThemeProvider,
  tags: ['autodocs', 'test'],
  args: {
    children: null,
  },
} satisfies Meta<typeof ThemeProvider>

export default meta
type Story = StoryObj<typeof meta>

export const LightAndDark: Story = {
  render: () => (
    <div style={pageStyle}>
      <ThemeProvider theme={lightTheme}>
        <ComponentPreview label="亮色" />
      </ThemeProvider>
      <ThemeProvider theme={darkTheme}>
        <ComponentPreview label="暗色" />
      </ThemeProvider>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.getByRole('region', { name: '亮色组件预览' })).toBeVisible()
    expect(canvas.getByRole('region', { name: '暗色组件预览' })).toBeVisible()

    await userEvent.type(
      canvas.getByRole('combobox', { name: '暗色搜索组件' }),
      'm',
    )
    await waitFor(() => {
      expect(canvas.getByRole('option', { name: 'Menu' })).toBeVisible()
    })
  },
}

export const NestedLightInDark: Story = {
  render: () => (
    <ThemeProvider theme={darkTheme}>
      <div style={panelStyle}>
        <h2 style={{ margin: 0 }}>暗色父作用域</h2>
        <ThemeProvider theme={lightTheme}>
          <ComponentPreview label="嵌套亮色" />
        </ThemeProvider>
      </div>
    </ThemeProvider>
  ),
}

export const DynamicSwitch: Story = {
  render: () => <ThemeSwitcher />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.getByText('当前主题：亮色')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '切换到暗色' }))
    expect(canvas.getByText('当前主题：暗色')).toBeVisible()
  },
}
