import { createRef } from 'react'
import { Thinking } from '../../index'
import type { ThinkingProps, ThinkingStatus } from '../../index'

const rootRef = createRef<HTMLDivElement>()

const refIsRootDivElement: HTMLDivElement = rootRef.current!
void refIsRootDivElement

// title 与 children 均必填，缺一会产生编译错误。
const requiredProps: ThinkingProps = { title: '分析中', children: <p>步骤</p> }
void requiredProps

// 原生 title 属性被 ReactNode 标题替代；字符串 title 合法，但语义是可见标题。
const nativeTitle: ThinkingProps = {
  title: '分析中',
  children: '内容',
}
void nativeTitle

const statusValues: ThinkingStatus[] = [
  'running',
  'completed',
  'stopped',
  'error',
]
void statusValues

const statusLabels: NonNullable<ThinkingProps['statusLabels']> = {
  running: '运行中',
  completed: '已完成',
  stopped: '已中止',
  error: '失败',
}
void statusLabels

const controlled = (
  <Thinking
    title="分析中"
    status="running"
    statusLabels={statusLabels}
    open
    onOpenChange={(nextOpen: boolean) => void nextOpen}
  >
    步骤
  </Thinking>
)
void controlled

const uncontrolled = (
  <Thinking title="分析中" defaultOpen={false}>
    步骤
  </Thinking>
)
void uncontrolled

// 其余合法 div 属性保持透传。
const passthrough = (
  <Thinking
    title="分析中"
    id="pipeline"
    aria-label="处理过程"
    data-track="agent"
    className="extra"
    ref={rootRef}
  >
    步骤
  </Thinking>
)
void passthrough

// status 越界值被拒绝。
const invalidStatus = (
  <Thinking
    title="分析中"
    // @ts-expect-error 只有四种状态
    status="pending"
  >
    步骤
  </Thinking>
)
void invalidStatus
