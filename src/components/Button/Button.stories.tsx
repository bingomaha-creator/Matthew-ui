import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../../index'

const groupStyle = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
} as const

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs', 'test'],
  args: {
    children: '保存',
    variant: 'secondary',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div style={groupStyle}>
      <Button variant="primary">主要操作</Button>
      <Button variant="secondary">次要操作</Button>
      <Button variant="danger">危险操作</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={groupStyle}>
      <Button size="sm">小按钮</Button>
      <Button size="md">中按钮</Button>
      <Button size="lg">大按钮</Button>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    children: '不可用操作',
    disabled: true,
    variant: 'primary',
  },
}
