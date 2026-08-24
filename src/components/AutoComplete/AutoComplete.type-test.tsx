import { createRef } from 'react'
import { AutoComplete } from '../../index'
import type { AutoCompleteProps } from '../../index'

type PlayerOption = {
  value: string
  number: number
}

const players: PlayerOption[] = [
  { value: 'james', number: 23 },
  { value: 'caruso', number: 4 },
]
const inputRef = createRef<HTMLInputElement>()
const divRef = createRef<HTMLDivElement>()

type OtherInputTypeProp =
  | 'accept'
  | 'alt'
  | 'capture'
  | 'formAction'
  | 'formEncType'
  | 'formMethod'
  | 'formNoValidate'
  | 'formTarget'
  | 'height'
  | 'max'
  | 'min'
  | 'multiple'
  | 'src'
  | 'step'
  | 'width'

const excludesOtherInputTypeProps: Extract<
  keyof AutoCompleteProps,
  OtherInputTypeProp
> extends never
  ? true
  : false = true

const genericAutoComplete = (
  <AutoComplete<PlayerOption>
    fetchSuggestions={(query) =>
      players.filter((player) => player.value.includes(query))
    }
    renderOption={(player) => `${player.value} #${player.number}`}
    onOptionSelect={(player) => {
      const selectedNumber: number = player.number
      void selectedNumber
    }}
  />
)

const inferredGenericAutoComplete = (
  <AutoComplete
    fetchSuggestions={() => players}
    onOptionSelect={(player) => {
      const selectedNumber: number = player.number
      // @ts-expect-error 泛型推导保留 number，而不是退化为 any
      player.number.toUpperCase()
      void selectedNumber
    }}
  />
)

const autoCompleteWithoutOptionValue = (
  // @ts-expect-error 建议类型必须包含用于身份和回填的 value
  <AutoComplete<{ label: string }>
    fetchSuggestions={() => [{ label: 'James' }]}
  />
)

const autoCompleteWithNumericValue = (
  // @ts-expect-error AutoComplete value 只接收字符串
  <AutoComplete value={23} fetchSuggestions={() => []} />
)

const autoCompleteWithNumericDefaultValue = (
  // @ts-expect-error AutoComplete defaultValue 只接收字符串
  <AutoComplete defaultValue={23} fetchSuggestions={() => []} />
)

const autoCompleteWithNativeOnChange = (
  <AutoComplete
    fetchSuggestions={() => []}
    // @ts-expect-error 输入变化通过 onValueChange 接收字符串
    onChange={() => undefined}
  />
)

const autoCompleteWithNativeOnSelect = (
  <AutoComplete
    fetchSuggestions={() => []}
    // @ts-expect-error 建议选择通过 onOptionSelect 接收完整对象
    onSelect={() => undefined}
  />
)

const autoCompleteWithInputRef = (
  <AutoComplete ref={inputRef} fetchSuggestions={() => []} />
)

const autoCompleteWithDivRef = (
  // @ts-expect-error AutoComplete ref 必须指向 HTMLInputElement
  <AutoComplete ref={divRef} fetchSuggestions={() => []} />
)

const textAutoComplete = (
  <AutoComplete type="text" fetchSuggestions={() => []} />
)

const searchAutoComplete = (
  <AutoComplete type="search" fetchSuggestions={() => []} />
)

const autoCompleteWithCheckboxType = (
  // @ts-expect-error AutoComplete 只支持文本与搜索输入类型
  <AutoComplete type="checkbox" fetchSuggestions={() => []} />
)

const autoCompleteWithChecked = (
  // @ts-expect-error AutoComplete 不公开 checkbox 的 checked 状态
  <AutoComplete checked fetchSuggestions={() => []} />
)

const autoCompleteWithDefaultChecked = (
  // @ts-expect-error AutoComplete 不公开 checkbox 的 defaultChecked 状态
  <AutoComplete defaultChecked fetchSuggestions={() => []} />
)

const autoCompleteWithChildren = (
  // @ts-expect-error 原生 input 是 void element，不能接收 children
  <AutoComplete fetchSuggestions={() => []}>suggestion</AutoComplete>
)

const autoCompleteWithDangerousHtml = (
  <AutoComplete
    // @ts-expect-error 原生 input 不能接收 dangerouslySetInnerHTML
    dangerouslySetInnerHTML={{ __html: 'suggestion' }}
    fetchSuggestions={() => []}
  />
)

void [
  genericAutoComplete,
  inferredGenericAutoComplete,
  autoCompleteWithoutOptionValue,
  autoCompleteWithNumericValue,
  autoCompleteWithNumericDefaultValue,
  autoCompleteWithNativeOnChange,
  autoCompleteWithNativeOnSelect,
  autoCompleteWithInputRef,
  autoCompleteWithDivRef,
  textAutoComplete,
  searchAutoComplete,
  autoCompleteWithCheckboxType,
  autoCompleteWithChecked,
  autoCompleteWithDefaultChecked,
  autoCompleteWithChildren,
  autoCompleteWithDangerousHtml,
  excludesOtherInputTypeProps,
]
