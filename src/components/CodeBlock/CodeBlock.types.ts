import type { ComponentPropsWithoutRef } from 'react'

export interface CodeBlockCopyConfig {
  label: string
  copiedLabel: string
  errorLabel: string
}

export type CodeBlockProps = Omit<ComponentPropsWithoutRef<'div'>,
  'children' | 'title' | 'dangerouslySetInnerHTML'
> & {
  code: string
  title?: string
  language?: string
  wrap?: boolean
  copy?: CodeBlockCopyConfig
}
