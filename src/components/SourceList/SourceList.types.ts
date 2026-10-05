import type { ComponentPropsWithoutRef } from 'react'

export interface SourceListItem {
  /** 稳定的数据身份，当前列表内唯一；不是 DOM id。 */
  id: string
  title: string
  summary?: string
  source?: string
  href?: string
  target?: '_self' | '_blank'
  /** 调用方保证页面内唯一；提供后条目支持程序化聚焦。 */
  domId?: string
}

export type SourceListProps = Omit<ComponentPropsWithoutRef<'div'>,
  'children' | 'title' | 'dangerouslySetInnerHTML'
> & {
  items: readonly SourceListItem[]
  title?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}
