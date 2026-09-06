import type { ComponentPropsWithRef, ReactNode } from 'react'

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error'
  | 'stopped'

export interface TaskListItem {
  /** 调用方维护的稳定字符串身份，在当前 items 中必须唯一。 */
  id: string
  title: ReactNode
  status: TaskStatus
  /** 可选的行内辅助信息。 */
  summary?: ReactNode
}

export type TaskListProps = Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'title'
> & {
  /** 必填；面向用户的任务或计划标题，不内置语言文案。 */
  title: ReactNode
  /** 必填；可以为空的只读数组，TaskList 严格保持调用方顺序。 */
  items: readonly TaskListItem[]
  /** 可选；如提供必须给出五种状态的本地化文案，模块不内置语言回退。 */
  statusLabels?: Record<TaskStatus, string>
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}
