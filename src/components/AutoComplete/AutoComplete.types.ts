import type { ComponentPropsWithRef, ReactNode } from 'react'

export type AutoCompleteOption = {
  value: string
}

export type AutoCompleteProps<
  T extends AutoCompleteOption = AutoCompleteOption,
> = Omit<
  ComponentPropsWithRef<'input'>,
  | 'accept'
  | 'alt'
  | 'capture'
  | 'checked'
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'defaultChecked'
  | 'defaultValue'
  | 'formAction'
  | 'formEncType'
  | 'formMethod'
  | 'formNoValidate'
  | 'formTarget'
  | 'height'
  | 'max'
  | 'min'
  | 'multiple'
  | 'onChange'
  | 'onSelect'
  | 'src'
  | 'step'
  | 'type'
  | 'value'
  | 'width'
> & {
  type?: 'text' | 'search'
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onOptionSelect?: (option: T) => void
  renderOption?: (option: T) => ReactNode
  fetchSuggestions: (query: string) => T[] | PromiseLike<T[]>
}
