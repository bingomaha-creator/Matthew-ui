import type { ComponentPropsWithRef, ReactNode } from 'react'

export type AutoCompleteOption = {
  value: string
}

export type AutoCompleteProps<
  T extends AutoCompleteOption = AutoCompleteOption,
> = Omit<
  ComponentPropsWithRef<'input'>,
  'defaultValue' | 'onChange' | 'onSelect' | 'value'
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onOptionSelect?: (option: T) => void
  renderOption?: (option: T) => ReactNode
  fetchSuggestions: (query: string) => T[] | PromiseLike<T[]>
}
