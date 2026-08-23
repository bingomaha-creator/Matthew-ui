import { useContext, useEffect } from 'react'
import { MenuContext } from './menu.context'
import { SubMenuContext } from './menu-submenu.context'

export function useMenuItemState(value: string) {
  const menu = useContext(MenuContext)
  const subMenu = useContext(SubMenuContext)
  const registerItem = subMenu?.registerItem
  const unregisterItem = subMenu?.unregisterItem

  useEffect(() => {
    registerItem?.(value)

    return () => unregisterItem?.(value)
  }, [registerItem, unregisterItem, value])

  const selectItem = () => {
    if (menu?.selectValue(value)) {
      subMenu?.closeAfterItemSelection()
    }
  }

  return {
    isSelected: menu?.selectedValue === value,
    selectItem,
  }
}
