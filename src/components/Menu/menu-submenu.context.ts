import { createContext } from 'react'

export type SubMenuContextValue = {
  registerItem: (value: string) => void
  unregisterItem: (value: string) => void
  closeAfterItemSelection: () => void
}

export const SubMenuContext = createContext<SubMenuContextValue | null>(null)
