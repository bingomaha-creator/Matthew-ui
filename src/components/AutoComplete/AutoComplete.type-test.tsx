import { createRef } from 'react'
import { AutoComplete } from '../../index'

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

void [
  genericAutoComplete,
  autoCompleteWithoutOptionValue,
  autoCompleteWithNumericValue,
  autoCompleteWithNumericDefaultValue,
  autoCompleteWithNativeOnChange,
  autoCompleteWithNativeOnSelect,
  autoCompleteWithInputRef,
  autoCompleteWithDivRef,
]
