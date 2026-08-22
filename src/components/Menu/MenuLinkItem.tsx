import { useContext, useEffect, type MouseEvent } from 'react'
import clsx from 'clsx'
import { MenuContext } from './menu.context'
import { SubMenuContext } from './menu-submenu.context'
import type { MenuLinkItemProps } from './menu.types'

export function MenuLinkItem({
  children,
  disabled,
  href,
  onClick,
  value,
  className,
  ...restProps
}: MenuLinkItemProps) {
  const menu = useContext(MenuContext)
  const subMenu = useContext(SubMenuContext)
  const registerItem = subMenu?.registerItem
  const unregisterItem = subMenu?.unregisterItem
  const isSelected = menu?.selectedValue === value

  useEffect(() => {
    registerItem?.(value)

    return () => unregisterItem?.(value)
  }, [registerItem, unregisterItem, value])

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)

    if (disabled || event.defaultPrevented) {
      event.preventDefault()
      return
    }

    if (menu?.selectValue(value)) {
      subMenu?.closeAfterItemSelection()
    }
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
        tabIndex={disabled ? -1 : restProps.tabIndex}
      >
        {children}
      </a>
    </li>
  )
}
