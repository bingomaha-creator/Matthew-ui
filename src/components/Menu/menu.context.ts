import { createContext } from 'react'
import type { MenuMode } from './menu.types'

export type MenuContextValue = {
  selectedValue: string | undefined
  selectValue: (value: string) => boolean
  mode: MenuMode
  openValues: string[]
  toggleOpenValue: (value: string) => void
  setOpenValue: (value: string, shouldOpen: boolean) => void
  registerSubMenu: (value: string) => void
  unregisterSubMenu: (value: string) => void
}

export const MenuContext = createContext<MenuContextValue | null>(null)
