import type { ComponentPropsWithRef, ReactNode } from 'react'
import type { ButtonVisualProps } from './Button.types'
import { createButtonClassName } from './buttonClassNames'

type ButtonOwnProps = {
  children: ReactNode
} & ButtonVisualProps

export type ButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof ButtonOwnProps>

export function Button({
  children,
  type = 'button',
  variant = 'secondary',
  size = 'md',
  className,
  disabled,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled}
      className={createButtonClassName({
        variant,
        size,
        disabled,
        className,
      })}
    >
      {children}
    </button>
  )
}
