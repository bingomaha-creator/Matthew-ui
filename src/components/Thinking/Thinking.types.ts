import type { ComponentPropsWithRef, ReactNode } from 'react'

export type ThinkingStatus = 'running' | 'completed' | 'stopped' | 'error'

export type ThinkingProps = Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'title'
> & {
  /** 必填；不内置英文标题，由调用方提供符合业务与语言环境的文案。 */
  title: ReactNode
  status?: ThinkingStatus
  /** 可选的四状态本地化文案，只向辅助技术表达当前状态。 */
  statusLabels?: Record<ThinkingStatus, string>
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** 必填；Thinking 不约束内容的标签与类型，由调用方组合。 */
  children: ReactNode
}
