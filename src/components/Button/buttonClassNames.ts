import clsx from 'clsx'
import type { ButtonSize, ButtonVariant } from './Button.types'

type ButtonClassNameOptions = {
  variant: ButtonVariant
  size: ButtonSize
  disabled?: boolean
  className?: string
}

export function createButtonClassName({
  variant,
  size,
  disabled,
  className,
}: ButtonClassNameOptions) {
  return clsx(
    'matthew-button',
    `matthew-button--${variant}`,
    `matthew-button--${size}`,
    disabled && 'matthew-button--disabled',
    className,
  )
}
