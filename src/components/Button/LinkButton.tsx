import { forwardRef } from 'react'
import type {
  ComponentPropsWithRef,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react'
import type { ButtonVisualProps } from './Button.types'
import { createButtonClassName } from './buttonClassNames'

type LinkButtonOwnProps = {
  children: ReactNode
  href: string
  disabled?: boolean
} & ButtonVisualProps

export type LinkButtonProps = LinkButtonOwnProps &
  Omit<
    ComponentPropsWithRef<'a'>,
    keyof LinkButtonOwnProps | 'aria-disabled' | 'role'
  >

type LinkButtonRenderProps = Omit<LinkButtonProps, 'ref'>

export const LinkButton = forwardRef<
  HTMLAnchorElement,
  LinkButtonRenderProps
>(function LinkButton(
  {
    children,
    href,
    disabled = false,
    variant = 'secondary',
    size = 'md',
    className,
    onClick,
    tabIndex,
    ...anchorProps
  },
  ref,
) {
  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }

    onClick?.(event)
  }

  return (
    <a
      {...anchorProps}
      ref={ref}
      className={createButtonClassName({
        variant,
        size,
        disabled,
        className,
      })}
      role={disabled ? 'link' : undefined}
      href={disabled ? undefined : href}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      onClick={handleClick}
    >
      {children}
    </a>
  )
})
