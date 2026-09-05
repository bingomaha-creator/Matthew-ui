import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { ThemeProvider, Thinking, ToolCall, darkTheme } from '../../index'
import type { ToolCallStatus } from '../../index'

const stackStyle = {
  display: 'grid',
  gap: '0.75rem',
  maxWidth: '24rem',
} as const

const statusLabels = {
  pending: '排队中',
  running: '执行中',
  completed: '已完成',
  error: '失败',
  stopped: '已中止',
} satisfies Record<ToolCallStatus, string>

const meta: Meta<typeof ToolCall> = {
  title: 'Components/ToolCall',
  component: ToolCall,
  tags: ['autodocs', 'test'],
}

export default meta
type Story = StoryObj<typeof meta>

export const StatusRowWithoutDetails: Story = {
  render: () => (
    <div style={stackStyle}>
      <ToolCall name="读取项目文件" status="completed" summary="已读取 3 个文件" />
      <ToolCall name="运行类型检查" status="running" statusLabels={statusLabels} />
      <ToolCall name="安装依赖" status="pending" summary="等待前序任务" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 无详情时退化为非交互状态行：没有按钮、没有展开语义（TC-B04）。
    expect(canvasElement.querySelector('button')).toBeNull()
    expect(canvasElement.querySelector('[aria-expanded]')).toBeNull()
    await expect(canvas.getByText('已读取 3 个文件')).toBeVisible()
  },
}

export const CollapsibleDetail: Story = {
  render: () => (
    <ToolCall
      name="运行类型检查"
      status="running"
      statusLabels={statusLabels}
      summary="正在执行…"
    >
      <p>npx tsc --build · tsconfig.app.json</p>
      <p>发现 0 个错误</p>
    </ToolCall>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole('button', { name: /运行类型检查/ })

    await expect(header).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(header)
    await expect(header).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByText('npx tsc --build · tsconfig.app.json')).toBeVisible()
  },
}

export const StatusGallery: Story = {
  render: () => (
    <div style={stackStyle}>
      {(['pending', 'running', 'completed', 'error', 'stopped'] as const).map((status) => (
        <ToolCall
          key={status}
          name={`工具-${status}`}
          status={status}
          statusLabels={statusLabels}
          defaultOpen
        >
          <p>{statusLabels[status]}</p>
        </ToolCall>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const roots = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.matthew-tool-call'),
    )

    // 五种状态标记齐全，且图形互不相同（TC-V02）。
    expect(roots.map((root) => root.getAttribute('data-status'))).toEqual([
      'pending',
      'running',
      'completed',
      'error',
      'stopped',
    ])
    expect(roots[0].querySelector('.matthew-tool-call__hollow')).not.toBeNull()
    expect(roots[1].querySelector('.matthew-tool-call__ring')).not.toBeNull()
    expect(roots[2].querySelector('.matthew-tool-call__check')).not.toBeNull()
    expect(roots[3].querySelector('.matthew-tool-call__bang')).not.toBeNull()
    expect(roots[4].querySelector('.matthew-tool-call__square')).not.toBeNull()
  },
}

function ComposedWithThinkingDemo() {
  return (
    <Thinking title="正在检查组件库结构" status="running" defaultOpen>
      <p>我先读取现有组件与主题实现</p>
      <div style={{ display: 'grid', gap: '0.375rem', marginTop: '0.5rem' }}>
        <ToolCall name="读取项目文件" status="completed" summary="已读取 3 个文件" />
        <ToolCall
          name="运行类型检查"
          status="running"
          statusLabels={statusLabels}
          summary="正在执行…"
        >
          <p>npx tsc --build · 发现 0 个错误</p>
        </ToolCall>
      </div>
    </Thinking>
  )
}

export const ComposedWithThinking: Story = {
  render: () => <ComposedWithThinkingDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 与 Thinking 组合：ToolCall 更小更浅，标题行 32px vs 40px（TC-V07）。
    const toolCallHeader = canvas.getByRole('button', { name: /运行类型检查/ })
    const thinkingHeader = canvas.getByRole('button', { name: /正在检查组件库结构/ })
    expect(getComputedStyle(toolCallHeader).minHeight).toBe('32px')
    expect(getComputedStyle(thinkingHeader).minHeight).toBe('40px')
  },
}

function DynamicContentDemo() {
  const [step, setStep] = useState(1)
  return (
    <div style={stackStyle}>
      <ToolCall
        name={`运行类型检查（第 ${step} 轮）`}
        status="running"
        statusLabels={statusLabels}
        summary={`已检查 ${step} 个文件`}
        defaultOpen
      >
        <p>第 {step} 轮检查：读取 tsconfig 与组件入口</p>
      </ToolCall>
      <button type="button" onClick={() => setStep((value) => value + 1)}>
        推进进度
      </button>
    </div>
  )
}

export const DynamicNameAndDetail: Story = {
  render: () => <DynamicContentDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: '推进进度' }))

    // name、summary 与详情同时动态更新（TC-V08）。
    const header = canvas.getByRole('button', { name: /运行类型检查（第 2 轮）/ })
    await expect(header).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByText('已检查 2 个文件')).toBeVisible()
    await expect(canvas.getByText(/第 2 轮检查/)).toBeVisible()
  },
}

export const ThemeScopes: Story = {
  render: () => (
    <div style={stackStyle}>
      <ToolCall name="亮色默认" status="completed" summary="跟随全局亮色 Token" defaultOpen>
        <p>亮色详情</p>
      </ToolCall>
      <div style={{ background: '#1e293b', padding: '0.25rem', borderRadius: 8 }}>
        <ThemeProvider theme={darkTheme}>
          <ToolCall name="暗色默认" status="completed" summary="跟随全局暗色 Token" defaultOpen>
            <p>暗色详情</p>
          </ToolCall>
        </ThemeProvider>
      </div>
      <ThemeProvider
        theme={{
          components: {
            ToolCall: {
              nameColor: '#7c2d12',
              summaryColor: '#9a3412',
              detailColor: '#9a3412',
              borderColor: '#ea580c',
              headerHoverBackground: '#ffedd5',
              pendingColor: '#a16207',
              runningColor: '#c2410c',
              completedColor: '#15803d',
              errorColor: '#b91c1c',
              stoppedColor: '#57534e',
              borderRadius: 0,
              headerMinHeight: 40,
            },
          },
        }}
      >
        <ToolCall name="精确覆盖-运行" status="running" summary="12 字段稀疏覆盖" defaultOpen>
          <p>components.ToolCall 覆盖</p>
        </ToolCall>
        <ToolCall name="精确覆盖-排队" status="pending" summary="pendingColor" />
        <ToolCall name="精确覆盖-完成" status="completed" summary="completedColor" />
        <ToolCall name="精确覆盖-失败" status="error" summary="errorColor" />
        <ToolCall name="精确覆盖-中止" status="stopped" summary="stoppedColor" />
      </ThemeProvider>
      <ThemeProvider theme={{ components: { ToolCall: { nameColor: '#1d4ed8' } } }}>
        <ThemeProvider theme={{ components: { ToolCall: { headerMinHeight: undefined } } }}>
          <ToolCall name="嵌套继承" status="completed" summary="父层字段 + 当前层非 undefined 字段" defaultOpen>
            <p>嵌套详情</p>
          </ToolCall>
        </ThemeProvider>
      </ThemeProvider>
    </div>
  ),
}

function DynamicThemeDemo() {
  const [enabled, setEnabled] = useState(true)
  const toolCall = (
    <ToolCall name="动态主题" status="running" defaultOpen>
      <p>详情内容</p>
    </ToolCall>
  )
  return (
    <div style={stackStyle}>
      {/* 父层配置始终生效；子层配置可动态启用，撤销后恢复父层或默认回退。 */}
      <ThemeProvider theme={{ components: { ToolCall: { runningColor: 'rgb(255 0 0)' } } }}>
        {enabled ? (
          <ThemeProvider
            theme={{
              components: {
                ToolCall: { runningColor: 'rgb(0 255 0)', headerMinHeight: 48 },
              },
            }}
          >
            {toolCall}
          </ThemeProvider>
        ) : (
          toolCall
        )}
      </ThemeProvider>
      <button type="button" onClick={() => setEnabled((value) => !value)}>
        {enabled ? '撤销子层配置' : '启用子层配置'}
      </button>
    </div>
  )
}

export const DynamicThemeScopes: Story = {
  render: () => <DynamicThemeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // 子层启用/撤销会重建 ToolCall 的 DOM 节点，每次断言前重新查询。
    const ringColor = () =>
      getComputedStyle(
        canvasElement.querySelector('.matthew-tool-call__ring') as HTMLElement,
      ).borderTopColor
    const headerMinHeight = () =>
      getComputedStyle(
        canvas.getByRole('button', { name: /动态主题/ }),
      ).minHeight

    // 子层启用：覆盖生效。
    expect(ringColor()).toBe('rgb(0, 255, 0)')
    expect(headerMinHeight()).toBe('48px')

    await userEvent.click(canvas.getByRole('button', { name: '撤销子层配置' }))

    // 撤销子层：恢复父层配置或默认回退。
    expect(ringColor()).toBe('rgb(255, 0, 0)')
    expect(headerMinHeight()).toBe('32px')

    await userEvent.click(canvas.getByRole('button', { name: '启用子层配置' }))
    expect(ringColor()).toBe('rgb(0, 255, 0)')
  },
}

export const LongNameInNarrowContainer: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <ToolCall
        name="一个故意写得非常长的工具名称用来验证单行省略与窄宽表现"
        status="running"
        statusLabels={statusLabels}
        summary="一段同样比较长的摘要文本用来验证窄宽下的隐藏行为"
        defaultOpen
      >
        <p>详情内容保持自然换行</p>
      </ToolCall>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const name = canvas.getByText(/一个故意写得非常长的工具名称/)

    // 长名称单行省略（TC-V01）。
    expect(getComputedStyle(name).textOverflow).toBe('ellipsis')
  },
}
