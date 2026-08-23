import type { MouseEvent } from 'react'
import clsx from 'clsx'
import type { MenuItemProps } from './menu.types'
import { useMenuItemState } from './use-menu-item-state'

export function MenuItem({
  children,
  disabled,
  onClick,
  type = 'button',
  value,
  className,
  ...restProps
}: MenuItemProps) {
  const { isSelected, selectItem } = useMenuItemState(value)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)

    if (disabled || event.defaultPrevented) {
      return
    }

    selectItem()
  }

  return (
    <li>
      <button
        {...restProps}
        aria-current={isSelected ? 'true' : undefined}
        className={clsx('matthew-menu__item', isSelected && 'matthew-menu__item--selected', disabled && 'matthew-menu__item--disabled', className)}
        disabled={disabled}
        onClick={handleClick}
        type={type}
      >
        {children}
      </button>
    </li>
  )
}
