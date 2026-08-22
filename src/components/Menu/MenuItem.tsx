import { useContext, useEffect, type MouseEvent } from 'react'
import clsx from 'clsx'
import { MenuContext } from './menu.context'
import { SubMenuContext } from './menu-submenu.context'
import type { MenuItemProps } from './menu.types'

export function MenuItem({
  children,
  disabled,
  onClick,
  value,
  className,
  ...restProps
}: MenuItemProps) {
  const menu = useContext(MenuContext)
  const subMenu = useContext(SubMenuContext)
  const registerItem = subMenu?.registerItem
  const unregisterItem = subMenu?.unregisterItem
  const isSelected = menu?.selectedValue === value

  useEffect(() => {
    registerItem?.(value)

    return () => unregisterItem?.(value)
  }, [registerItem, unregisterItem, value])

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)

    if (disabled || event.defaultPrevented) {
      return
    }

    if (menu?.selectValue(value)) {
      subMenu?.closeAfterItemSelection()
    }
  }

  return (
    <li>
      <button
        {...restProps}
        aria-current={isSelected ? 'true' : undefined}
        className={clsx('matthew-menu__item', isSelected && 'matthew-menu__item--selected', disabled && 'matthew-menu__item--disabled', className)}
        disabled={disabled}
        onClick={handleClick}
      >
        {children}
      </button>
    </li>
  )
}
