import type { ComponentPropsWithRef, ReactNode } from 'react'

export type ToolCallStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error'
  | 'stopped'

export type ToolCallProps = Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> & {
  /** 必填；面向当前用户的工具名称，不要求等于内部函数名。 */
  name: ReactNode
  /** 必填；状态完全由调用方提供，模块不自动推导。 */
  status: ToolCallStatus
  /** 可选；短结果、当前动作或调用方已计算好的耗时等辅助信息。 */
  summary?: ReactNode
  /** 可选；如提供必须给出五种状态的本地化文案，模块不内置任何语言回退。 */
  statusLabels?: Record<ToolCallStatus, string>
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** 可选；由调用方提供已格式化、适合展示的详情内容。 */
  children?: ReactNode
}
