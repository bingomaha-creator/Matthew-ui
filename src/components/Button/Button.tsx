import { forwardRef } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import type { ButtonVisualProps } from './Button.types'
import { createButtonClassName } from './buttonClassNames'

type ButtonOwnProps = {
  children: ReactNode
} & ButtonVisualProps

export type ButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof ButtonOwnProps>

type ButtonRenderProps = Omit<ButtonProps, 'ref'>

export const Button = forwardRef<HTMLButtonElement, ButtonRenderProps>(
  function Button(
    {
      children,
      type = 'button',
      variant = 'secondary',
      size = 'md',
      className,
      disabled,
      ...buttonProps
    },
    ref,
  ) {
    return (
      <button
        {...buttonProps}
        ref={ref}
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
  },
)
