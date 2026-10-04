import { createRef } from 'react'
import { Select } from '../../index'
import type { MatthewThemeConfig, SelectOption, SelectProps } from '../../index'

const options: SelectOption[] = [{ value: '', label: 'All' }]
const props: SelectProps = { value: '', options, onValueChange: value => value.toUpperCase() }
const valid = <Select {...props} ref={createRef<HTMLButtonElement>()} title="Hint" />
// @ts-expect-error Select is controlled-only.
const missingValue = <Select options={options} onValueChange={() => {}} />
// @ts-expect-error ReactNode labels are outside the first version.
const richLabel: SelectOption = { value: 'a', label: <b>Alpha</b> }
// @ts-expect-error Not an input ref.
const wrongRef = <Select {...props} ref={createRef<HTMLInputElement>()} />
// @ts-expect-error No public controlled popup state.
const controlledOpen = <Select {...props} open />
// @ts-expect-error No children slot.
const children = <Select {...props}>Alpha</Select>
// @ts-expect-error Design dimensions are numbers.
const invalidTheme: MatthewThemeConfig = { components: { Select: { triggerMinHeight: '40px' } } }
// @ts-expect-error No arbitrary layout token.
const layoutTheme: MatthewThemeConfig = { components: { Select: { zIndex: 60 } } }
void [valid, missingValue, richLabel, wrongRef, controlledOpen, children, invalidTheme, layoutTheme]
