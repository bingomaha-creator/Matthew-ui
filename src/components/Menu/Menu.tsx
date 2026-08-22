import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { MenuContext } from './menu.context'
import { MenuItem } from './MenuItem'
import { MenuLinkItem } from './MenuLinkItem'
import { MenuSubMenu } from './MenuSubMenu'
import type { MenuProps } from './menu.types'

const haveSameValues = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index])

function MenuRoot({
  children,
  mode = 'horizontal',
  value,
  defaultValue,
  onValueChange,
  openValues: controlledOpenValues,
  defaultOpenValues,
  onOpenValuesChange,
  className,
  ...restProps
}: MenuProps) {
  const menuElement = useRef<HTMLUListElement>(null)
  const [uncontrolledSelectedValue, setUncontrolledSelectedValue] =
    useState(defaultValue)
  const [uncontrolledOpenValues, setUncontrolledOpenValues] = useState(
    defaultOpenValues ?? [],
  )
  const [subMenuValues, setSubMenuValues] = useState<string[]>([])
  const hasWarnedAboutSelectionConflict = useRef(false)
  const hasWarnedAboutOpenConflict = useRef(false)
  const hasWarnedAboutHorizontalOpenValues = useRef(false)
  const isControlled = value !== undefined
  const isOpenControlled = controlledOpenValues !== undefined
  const selectedValue = isControlled ? value : uncontrolledSelectedValue
  const requestedOpenValues = isOpenControlled
    ? controlledOpenValues
    : uncontrolledOpenValues
  const validOpenValues = requestedOpenValues.filter((openValue) =>
    subMenuValues.includes(openValue),
  )
  const openValues =
    mode === 'horizontal' ? validOpenValues.slice(0, 1) : requestedOpenValues

  const registerSubMenu = useCallback((subMenuValue: string) => {
    setSubMenuValues((currentValues) =>
      currentValues.includes(subMenuValue)
        ? currentValues
        : [...currentValues, subMenuValue],
    )
  }, [])

  const unregisterSubMenu = useCallback((subMenuValue: string) => {
    setSubMenuValues((currentValues) =>
      currentValues.filter((value) => value !== subMenuValue),
    )
  }, [])

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      isControlled &&
      defaultValue !== undefined &&
      !hasWarnedAboutSelectionConflict.current
    ) {
      console.warn(
        'Menu received both value and defaultValue. defaultValue will be ignored.',
      )
      hasWarnedAboutSelectionConflict.current = true
    }
  }, [defaultValue, isControlled])

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      isOpenControlled &&
      defaultOpenValues !== undefined &&
      !hasWarnedAboutOpenConflict.current
    ) {
      console.warn(
        'Menu received both openValues and defaultOpenValues. defaultOpenValues will be ignored.',
      )
      hasWarnedAboutOpenConflict.current = true
    }
  }, [defaultOpenValues, isOpenControlled])

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      mode === 'horizontal' &&
      validOpenValues.length > 1 &&
      !hasWarnedAboutHorizontalOpenValues.current
    ) {
      console.warn(
        'Menu received multiple horizontal open values; only the first valid open value will be used.',
      )
      hasWarnedAboutHorizontalOpenValues.current = true
    }
  }, [mode, validOpenValues])

  const selectValue = (nextValue: string) => {
    if (nextValue === selectedValue) {
      return false
    }

    if (!isControlled) {
      setUncontrolledSelectedValue(nextValue)
    }

    onValueChange?.(nextValue)
    return true
  }

  const changeOpenValues = (nextOpenValues: string[]) => {
    if (haveSameValues(openValues, nextOpenValues)) {
      return
    }

    if (!isOpenControlled) {
      setUncontrolledOpenValues(nextOpenValues)
    }

    onOpenValuesChange?.(nextOpenValues)
  }

  const setOpenValue = (nextValue: string, shouldOpen: boolean) => {
    const isOpen = openValues.includes(nextValue)

    if (isOpen === shouldOpen) {
      return
    }

    const nextOpenValues = shouldOpen
      ? mode === 'horizontal'
        ? [nextValue]
        : [...openValues, nextValue]
      : openValues.filter((value) => value !== nextValue)

    changeOpenValues(nextOpenValues)
  }

  const toggleOpenValue = (nextValue: string) => {
    setOpenValue(nextValue, !openValues.includes(nextValue))
  }

  useEffect(() => {
    if (mode !== 'horizontal' || openValues.length === 0) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuElement.current?.contains(event.target)
      ) {
        if (!isOpenControlled) {
          setUncontrolledOpenValues([])
        }

        onOpenValuesChange?.([])
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpenControlled, mode, onOpenValuesChange, openValues.length])

  return (
    <MenuContext.Provider
      value={{
        selectedValue,
        selectValue,
        mode,
        openValues,
        toggleOpenValue,
        setOpenValue,
        registerSubMenu,
        unregisterSubMenu,
      }}
    >
      <ul
        {...restProps}
        className={clsx('matthew-menu', `matthew-menu--${mode}`, className)}
        ref={menuElement}
      >
        {children}
      </ul>
    </MenuContext.Provider>
  )
}

export const Menu = Object.assign(MenuRoot, {
  Item: MenuItem,
  LinkItem: MenuLinkItem,
  SubMenu: MenuSubMenu,
})
