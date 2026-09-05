import { createRef } from 'react'
import { ToolCall } from '../../index'
import type { ToolCallProps, ToolCallStatus } from '../../index'

const rootRef = createRef<HTMLDivElement>()

const refIsRootDivElement: HTMLDivElement = rootRef.current!
void refIsRootDivElement

// name 与 status 均必填，缺一会产生编译错误；children 可选。
const requiredProps: ToolCallProps = { name: '读取项目文件', status: 'running' }
void requiredProps

// 原生 title 属性保持原生语义并可透传。
const nativeTitle: ToolCallProps = {
  name: '读取项目文件',
  status: 'running',
  title: '工具调用',
}
void nativeTitle

const statusValues: ToolCallStatus[] = [
  'pending',
  'running',
  'completed',
  'error',
  'stopped',
]
void statusValues

// statusLabels 如提供必须是五种状态的完整映射。
const fullLabels: Record<ToolCallStatus, string> = {
  pending: '排队中',
  running: '执行中',
  completed: '已完成',
  error: '失败',
  stopped: '已中止',
}
const withLabels = (
  <ToolCall name="读取项目文件" status="running" statusLabels={fullLabels}>
    详情
  </ToolCall>
)
void withLabels

const controlled = (
  <ToolCall
    name="读取项目文件"
    status="running"
    open
    onOpenChange={(nextOpen: boolean) => void nextOpen}
  >
    详情
  </ToolCall>
)
void controlled

const statusless = (
  <ToolCall
    name="读取项目文件"
    // @ts-expect-error status 是必填且只有五种状态
    status="queued"
  >
    详情
  </ToolCall>
)
void statusless
