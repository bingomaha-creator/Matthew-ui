import type { MouseEvent, ReactElement } from 'react'
import clsx from 'clsx'
import type { MenuLinkItemProps } from './menu.types'
import { useMenuItemState } from './use-menu-item-state'

export function MenuLinkItem({
  children,
  disabled,
  href,
  onClick,
  value,
  className,
  ...restProps
}: MenuLinkItemProps): ReactElement {
  const { isSelected, selectItem } = useMenuItemState(value)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }

    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    selectItem()
  }

  return (
    <li>
      <a
        {...restProps}
        aria-current={isSelected ? 'true' : undefined}
        aria-disabled={disabled ? 'true' : undefined}
        className={clsx('matthew-menu__item', isSelected && 'matthew-menu__item--selected', disabled && 'matthew-menu__item--disabled', className)}
        href={disabled ? undefined : href}
        onClick={handleClick}
        role="link"
        tabIndex={disabled ? -1 : restProps.tabIndex}
      >
        {children}
      </a>
    </li>
  )
}
