import { createRef } from 'react'
import { TaskList } from '../../index'
import type { TaskListProps, TaskStatus } from '../../index'

const rootRef = createRef<HTMLDivElement>()

const refIsRootDivElement: HTMLDivElement = rootRef.current!
void refIsRootDivElement

// title 与 items 必填，缺一会产生编译错误。
const requiredProps: TaskListProps = {
  title: '实施计划',
  items: [{ id: 'a', title: '任务一', status: 'pending' }],
}
void requiredProps

const statusValues: TaskStatus[] = [
  'pending',
  'running',
  'completed',
  'error',
  'stopped',
]
void statusValues

// 条目的 id、title、status 必填。
const invalidItem: TaskListProps = {
  title: '实施计划',
  // @ts-expect-error 条目缺少 status
  items: [{ id: 'a', title: '任务一' }],
}
void invalidItem

// statusLabels 如提供必须是五种状态的完整映射。
const withLabels = (
  <TaskList
    title="实施计划"
    items={[]}
    statusLabels={{
      pending: '排队中',
      running: '执行中',
      completed: '已完成',
      error: '失败',
      stopped: '已中止',
    }}
  />
)
void withLabels

const controlled = (
  <TaskList
    title="实施计划"
    items={[]}
    open
    onOpenChange={(nextOpen: boolean) => void nextOpen}
    ref={rootRef}
  />
)
void controlled

const invalidStatus = (
  <TaskList
    title="实施计划"
    // @ts-expect-error 只有五种任务状态
    items={[{ id: 'a', title: '任务一', status: 'queued' }]}
  />
)
void invalidStatus
