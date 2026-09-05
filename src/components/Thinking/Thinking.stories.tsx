import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { ThemeProvider, Thinking, darkTheme } from '../../index'

const stackStyle = {
  display: 'grid',
  gap: '1rem',
  maxWidth: '24rem',
} as const

const meta: Meta<typeof Thinking> = {
  title: 'Components/Thinking',
  component: Thinking,
  tags: ['autodocs', 'test'],
  args: {
    title: '正在分析项目',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const DefaultCollapsed: Story = {
  render: () => (
    <Thinking title="正在分析项目">
      <p>读取项目结构</p>
      <p>检查组件入口</p>
      <p>准备实现方案</p>
    </Thinking>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole('button', { name: '正在分析项目' })

    await expect(header).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(header)
    await expect(header).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByText('读取项目结构')).toBeVisible()

    // 视觉合同：根节点透明，标题栏读取 controlHeightMd，内容区有左侧细线。
    const root = header.closest('.matthew-thinking') as HTMLElement
    const content = document.getElementById(
      header.getAttribute('aria-controls')!,
    ) as HTMLElement
    expect(getComputedStyle(root).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(getComputedStyle(header).minHeight).toBe('40px')
    expect(getComputedStyle(content).borderLeftWidth).toBe('1px')
  },
}

export const StatusGallery: Story = {
  render: () => (
    <div style={stackStyle}>
      <Thinking title="正在分析项目" status="running" defaultOpen>
        <p>读取项目结构</p>
      </Thinking>
      <Thinking title="已完成分析" status="completed" defaultOpen>
        <p>共 3 个步骤</p>
      </Thinking>
      <Thinking title="已中止分析" status="stopped" defaultOpen>
        <p>处理到第 2 步</p>
      </Thinking>
      <Thinking title="分析失败" status="error" defaultOpen>
        <p>无法读取入口文件</p>
      </Thinking>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const roots = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.matthew-thinking'),
    )

    // 四种状态标记齐全，且图形互不相同（TH-V02）。
    expect(roots.map((root) => root.getAttribute('data-status'))).toEqual([
      'running',
      'completed',
      'stopped',
      'error',
    ])
    expect(roots[0].querySelector('.matthew-thinking__dots')).not.toBeNull()
    expect(roots[1].querySelector('.matthew-thinking__check')).not.toBeNull()
    expect(roots[2].querySelector('.matthew-thinking__square')).not.toBeNull()
    expect(roots[3].querySelector('.matthew-thinking__bang')).not.toBeNull()
    expect(canvas.getByText('读取项目结构')).toBeVisible()
  },
}

function ControlledThinkingDemo() {
  const [open, setOpen] = useState(true)
  const [step, setStep] = useState(1)
  return (
    <div style={stackStyle}>
      <Thinking
        title="正在分析项目"
        status="running"
        open={open}
        onOpenChange={setOpen}
      >
        <p>已读取项目结构（步骤 {step}）</p>
      </Thinking>
      <button type="button" onClick={() => setStep((value) => value + 1)}>
        追加步骤
      </button>
    </div>
  )
}

export const ControlledWithDynamicChildren: Story = {
  render: () => <ControlledThinkingDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole('button', { name: '正在分析项目' })

    await userEvent.click(header)
    await expect(header).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(header)

    await userEvent.click(canvas.getByRole('button', { name: '追加步骤' }))
    await expect(canvas.getByText('已读取项目结构（步骤 2）')).toBeVisible()
    await expect(header).toHaveAttribute('aria-expanded', 'true')
  },
}

export const ThemeScopes: Story = {
  render: () => (
    <div style={stackStyle}>
      <Thinking title="亮色默认" status="completed" defaultOpen>
        <p>跟随全局亮色 Token</p>
      </Thinking>
      <div style={{ background: '#1e293b', padding: '0.25rem', borderRadius: 8 }}>
        <ThemeProvider theme={darkTheme}>
          <Thinking title="暗色默认" status="completed" defaultOpen>
            <p>跟随全局暗色 Token</p>
          </Thinking>
        </ThemeProvider>
      </div>
      <ThemeProvider
        theme={{
          components: {
            Thinking: {
              titleColor: '#7c2d12',
              borderColor: '#ea580c',
              completedColor: '#c2410c',
              borderRadius: 0,
              headerMinHeight: 48,
            },
          },
        }}
      >
        <Thinking title="精确覆盖" status="completed" defaultOpen>
          <p>components.Thinking 稀疏覆盖</p>
        </Thinking>
      </ThemeProvider>
    </div>
  ),
}

export const LongTitleInNarrowContainer: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <Thinking title="一个故意写得非常长的分析标题用来验证单行省略的表现" defaultOpen>
        <p>读取项目结构</p>
      </Thinking>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = canvas.getByText(/一个故意写得非常长的分析标题/)

    // 长标题单行省略，不换行不撑高标题栏。
    expect(getComputedStyle(title).textOverflow).toBe('ellipsis')
    expect(title.scrollWidth).toBeGreaterThanOrEqual(title.clientWidth)
  },
}

export const ReducedMotion: Story = {
  render: () => (
    <div data-reduced-motion-preview style={stackStyle}>
      <style>{`
        [data-reduced-motion-preview] .matthew-thinking__dots span {
          animation: none;
        }

        [data-reduced-motion-preview] .matthew-thinking__arrow {
          transition: none;
        }
      `}</style>
      <Thinking title="减少动态效果" status="running" defaultOpen>
        <p>三个运行中圆点保持可见，但不再跳动。</p>
      </Thinking>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '静态预览 prefers-reduced-motion: reduce 下的降级效果；真实媒体查询由 tarball Chromium 验收覆盖。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('.matthew-thinking')!
    const dots = root.querySelectorAll<HTMLElement>('.matthew-thinking__dots span')
    const arrow = root.querySelector<HTMLElement>('.matthew-thinking__arrow')!

    expect(dots).toHaveLength(3)
    dots.forEach((dot) => expect(getComputedStyle(dot).animationName).toBe('none'))
    expect(getComputedStyle(arrow).transitionDuration).toBe('0s')
    expect(canvas.getByText('三个运行中圆点保持可见，但不再跳动。')).toBeVisible()
  },
}
