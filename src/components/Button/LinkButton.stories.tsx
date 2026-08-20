import type { Meta, StoryObj } from '@storybook/react-vite'
import { LinkButton } from '../../index'

const groupStyle = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
} as const

const meta = {
  title: 'Components/LinkButton',
  component: LinkButton,
  tags: ['autodocs', 'test'],
  args: {
    children: '查看文档',
    href: '#docs',
    variant: 'primary',
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
} satisfies Meta<typeof LinkButton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div style={groupStyle}>
      <LinkButton href="#primary" variant="primary">
        主要链接
      </LinkButton>
      <LinkButton href="#secondary" variant="secondary">
        次要链接
      </LinkButton>
      <LinkButton href="#danger" variant="danger">
        危险链接
      </LinkButton>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={groupStyle}>
      <LinkButton href="#small" size="sm">
        小链接
      </LinkButton>
      <LinkButton href="#medium" size="md">
        中链接
      </LinkButton>
      <LinkButton href="#large" size="lg">
        大链接
      </LinkButton>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    children: '不可用链接',
    disabled: true,
  },
}
