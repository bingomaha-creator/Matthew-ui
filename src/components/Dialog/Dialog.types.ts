import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export type DialogProps = Omit<ComponentPropsWithoutRef<'dialog'>,
  'open' | 'title' | 'children' | 'onCancel' | 'onClose' | 'tabIndex' |
  'autoFocus' | 'closedby' | 'closedBy' | 'role' | 'aria-modal' | 'dangerouslySetInnerHTML'
> & {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  closeLabel: string
  children: ReactNode
  footer?: ReactNode
  dismissible?: boolean
  closeOnBackdrop?: boolean
  initialFocus?: () => HTMLElement | null
}
