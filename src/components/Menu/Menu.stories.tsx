import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Menu } from '../../index'

function ControlledMenuExample() {
  const [value, setValue] = useState('button')
  const [openValues, setOpenValues] = useState(['components'])

  return (
    <Menu
      mode="vertical"
      onOpenValuesChange={setOpenValues}
      onValueChange={setValue}
      openValues={openValues}
      value={value}
    >
      <Menu.Item value="home">首页</Menu.Item>
      <Menu.SubMenu title="组件" value="components">
        <Menu.LinkItem href="#button" value="button">Button</Menu.LinkItem>
        <Menu.Item value="menu">Menu</Menu.Item>
      </Menu.SubMenu>
      <Menu.SubMenu title="资源" value="resources">
        <Menu.LinkItem href="#guide" value="guide">使用指南</Menu.LinkItem>
      </Menu.SubMenu>
    </Menu>
  )
}

const meta = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs', 'test'],
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <Menu defaultValue="home" defaultOpenValues={['components']}>
      <Menu.Item value="home">首页</Menu.Item>
      <Menu.SubMenu title="组件" value="components">
        <Menu.LinkItem href="#button" value="button">Button</Menu.LinkItem>
        <Menu.Item value="menu">Menu</Menu.Item>
      </Menu.SubMenu>
      <Menu.Item value="about">关于</Menu.Item>
    </Menu>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Menu defaultOpenValues={['components']} defaultValue="button" mode="vertical">
      <Menu.Item value="home">首页</Menu.Item>
      <Menu.SubMenu title="组件" value="components">
        <Menu.LinkItem href="#button" value="button">Button</Menu.LinkItem>
        <Menu.Item value="menu">Menu</Menu.Item>
      </Menu.SubMenu>
      <Menu.SubMenu title="资源" value="resources">
        <Menu.LinkItem href="#guide" value="guide">使用指南</Menu.LinkItem>
      </Menu.SubMenu>
    </Menu>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Menu defaultValue="home" mode="vertical">
      <Menu.Item value="home">首页</Menu.Item>
      <Menu.Item disabled value="settings">设置</Menu.Item>
      <Menu.LinkItem disabled href="#guide" value="guide">禁用指南</Menu.LinkItem>
    </Menu>
  ),
}

export const Controlled: Story = {
  render: () => <ControlledMenuExample />,
}
