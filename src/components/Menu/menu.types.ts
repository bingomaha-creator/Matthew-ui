import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export type MenuMode = 'horizontal' | 'vertical'

export type MenuProps = Omit<
  ComponentPropsWithoutRef<'ul'>,
  'defaultValue' | 'value' | 'mode'
> & {
  mode?: MenuMode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  openValues?: string[]
  defaultOpenValues?: string[]
  onOpenValuesChange?: (values: string[]) => void
}

export type MenuItemProps = Omit<ComponentPropsWithoutRef<'button'>, 'value'> & {
  children?: ReactNode
  value: string
}

export type MenuLinkItemProps = Omit<
  ComponentPropsWithoutRef<'a'>,
  'aria-disabled' | 'href' | 'role' | 'value'
> & {
  children?: ReactNode
  disabled?: boolean
  href: string
  value: string
}

export type MenuSubMenuProps = Omit<
  ComponentPropsWithoutRef<'li'>,
  'title' | 'value'
> & {
  children?: ReactNode
  title: ReactNode
  value: string
}
