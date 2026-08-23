import { useCallback, useContext, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import clsx from 'clsx'
import { MenuContext } from './menu.context'
import { SubMenuContext } from './menu-submenu.context'
import type { MenuSubMenuProps } from './menu.types'

const HOVER_DELAY = 300

export function MenuSubMenu({
  children,
  title,
  value,
  className,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  ...restProps
}: MenuSubMenuProps) {
  const context = useContext(MenuContext)
  const trigger = useRef<HTMLButtonElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [descendantValues, setDescendantValues] = useState<string[]>([])
  const isOpen = context?.openValues.includes(value) ?? false
  const registerSubMenu = context?.registerSubMenu
  const unregisterSubMenu = context?.unregisterSubMenu
  const hasSelectedDescendant =
    context?.selectedValue !== undefined &&
    descendantValues.includes(context.selectedValue)

  const registerItem = useCallback((itemValue: string) => {
    setDescendantValues((currentValues) =>
      currentValues.includes(itemValue)
        ? currentValues
        : [...currentValues, itemValue],
    )
  }, [])

  const unregisterItem = useCallback((itemValue: string) => {
    setDescendantValues((currentValues) =>
      currentValues.filter((currentValue) => currentValue !== itemValue),
    )
  }, [])

  const clearHoverTimer = () => {
    if (hoverTimer.current !== null) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }

  useEffect(() => {
    registerSubMenu?.(value)

    return () => {
      clearHoverTimer()
      unregisterSubMenu?.(value)
    }
  }, [registerSubMenu, unregisterSubMenu, value])

  const scheduleHoverChange = (shouldOpen: boolean, pointerType: string) => {
    if (context?.mode !== 'horizontal' || pointerType !== 'mouse') {
      return
    }

    clearHoverTimer()
    hoverTimer.current = setTimeout(() => {
      context.setOpenValue(value, shouldOpen)
      hoverTimer.current = null
    }, HOVER_DELAY)
  }

  const handleClick = () => {
    clearHoverTimer()
    context?.toggleOpenValue(value)
  }

  const handlePointerEnter = (event: PointerEvent<HTMLLIElement>) => {
    onPointerEnter?.(event)

    if (event.defaultPrevented) {
      return
    }

    scheduleHoverChange(true, event.pointerType)
  }

  const handlePointerLeave = (event: PointerEvent<HTMLLIElement>) => {
    onPointerLeave?.(event)

    if (event.defaultPrevented) {
      return
    }

    scheduleHoverChange(false, event.pointerType)
  }

  const closeAfterItemSelection = () => {
    if (context?.mode === 'horizontal') {
      context.setOpenValue(value, false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    onKeyDown?.(event)

    if (event.defaultPrevented) {
      return
    }

    if (event.key !== 'Escape' || context?.mode !== 'horizontal' || !isOpen) {
      return
    }

    event.preventDefault()
    context.setOpenValue(value, false)
    trigger.current?.focus()
  }

  return (
    <li
      {...restProps}
      className={clsx('matthew-menu__submenu', isOpen && 'matthew-menu__submenu--open', hasSelectedDescendant && 'matthew-menu__submenu--descendant-active', className)}
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <button
        aria-expanded={isOpen}
        className="matthew-menu__submenu-trigger"
        data-descendant-active={hasSelectedDescendant ? 'true' : undefined}
        onClick={handleClick}
        ref={trigger}
        type="button"
      >
        {title}
      </button>
      <SubMenuContext.Provider
        value={{ registerItem, unregisterItem, closeAfterItemSelection }}
      >
        <ul className="matthew-menu__submenu-list" hidden={!isOpen}>
          {children}
        </ul>
      </SubMenuContext.Provider>
    </li>
  )
}
