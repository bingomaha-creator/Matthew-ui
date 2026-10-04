import type { ComponentPropsWithoutRef } from 'react'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'dangerouslySetInnerHTML' | 'value' | 'defaultValue' | 'onChange' | 'type'
> & {
  children?: never
  dangerouslySetInnerHTML?: never
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  popupHost?: () => HTMLElement | null
}
