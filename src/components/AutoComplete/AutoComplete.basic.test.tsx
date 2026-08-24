import { createRef, useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AutoComplete } from '../../index'
import { waitForDebounce } from './AutoComplete.test-utils'

describe('AutoComplete basic and value selection', () => {
  test('renders a named combobox with native input attributes', async () => {
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => []}
        name="player"
        placeholder="输入球员姓名"
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await expect.element(input).toHaveAttribute('name', 'player')
    await expect.element(input).toHaveAttribute('placeholder', '输入球员姓名')
    await expect.element(input).toHaveAttribute('aria-expanded', 'false')
  })

  test('keeps text input semantics when type is omitted or bypassed at runtime', async () => {
    const unsupportedProps = { type: 'checkbox' as const }
    const screen = await render(
      <>
        <AutoComplete
          aria-label="Default text search"
          fetchSuggestions={() => []}
        />
        <AutoComplete
          aria-label="Native search input"
          fetchSuggestions={() => []}
          type="search"
        />
        <AutoComplete
          aria-label="Guarded text search"
          fetchSuggestions={() => []}
          {...(unsupportedProps as object)}
        />
      </>,
    )

    await expect
      .element(screen.getByRole('combobox', { name: 'Default text search' }))
      .toHaveAttribute('type', 'text')
    await expect
      .element(screen.getByRole('combobox', { name: 'Native search input' }))
      .toHaveAttribute('type', 'search')
    await expect
      .element(screen.getByRole('combobox', { name: 'Guarded text search' }))
      .toHaveAttribute('type', 'text')
  })

  test('merges caller className with the combobox input class', async () => {
    const screen = await render(
      <AutoComplete
        aria-label="Search players"
        className="custom-input"
        fetchSuggestions={() => []}
      />,
    )

    await expect
      .element(screen.getByRole('combobox', { name: 'Search players' }))
      .toHaveClass('matthew-auto-complete__input', 'custom-input')
  })

  test('forwards its ref to the native input', async () => {
    const inputRef = createRef<HTMLInputElement>()
    const screen = await render(
      <AutoComplete
        ref={inputRef}
        aria-label="搜索球员"
        fetchSuggestions={() => []}
      />,
    )

    expect(inputRef.current).toBe(
      screen.getByRole('combobox', { name: '搜索球员' }).element(),
    )
  })

  test('uses value and warns when controlled and uncontrolled props conflict', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        defaultValue="james"
        fetchSuggestions={() => []}
        readOnly
        value="caruso"
      />,
    )

    await expect
      .element(screen.getByRole('combobox', { name: '搜索球员' }))
      .toHaveValue('caruso')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('defaultValue will be ignored'),
    )

    warn.mockRestore()
  })

  test('initializes an uncontrolled input from defaultValue without searching', async () => {
    const fetchSuggestions = vi.fn(() => [{ value: 'james' }])
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        defaultValue="james"
        fetchSuggestions={fetchSuggestions}
      />,
    )

    await expect
      .element(screen.getByRole('combobox', { name: '搜索球员' }))
      .toHaveValue('james')
    await waitForDebounce()
    expect(fetchSuggestions).not.toHaveBeenCalled()
  })

  test('preserves raw input and searches the trimmed query after 300ms', async () => {
    vi.useFakeTimers()

    try {
      const onValueChange = vi.fn()
      const fetchSuggestions = vi.fn(() => [
        { value: 'james' },
        { value: 'jarvis' },
      ])
      const screen = await render(
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={fetchSuggestions}
          onValueChange={onValueChange}
        />,
      )
      const input = screen.getByRole('combobox', { name: '搜索球员' })

      await input.fill('  ja ')

      await expect.element(input).toHaveValue('  ja ')
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('  ja ')

      await vi.advanceTimersByTimeAsync(299)
      expect(fetchSuggestions).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      expect(fetchSuggestions).toHaveBeenCalledExactlyOnceWith('ja')

      vi.useRealTimers()
      await expect.element(screen.getByRole('listbox')).toBeInTheDocument()
      await expect
        .element(screen.getByRole('option', { name: 'james' }))
        .toBeInTheDocument()
      await expect
        .element(screen.getByRole('option', { name: 'jarvis' }))
        .toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  test('reflects external controlled values without searching them', async () => {
    const fetchSuggestions = vi.fn(() => [{ value: 'james' }])

    function ControlledAutoComplete() {
      const [value, setValue] = useState('')

      return (
        <>
          <button onClick={() => setValue('external')}>外部更新</button>
          <AutoComplete
            aria-label="搜索球员"
            fetchSuggestions={fetchSuggestions}
            onValueChange={setValue}
            value={value}
          />
        </>
      )
    }

    const screen = await render(<ControlledAutoComplete />)
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    await expect
      .element(screen.getByRole('option', { name: 'james' }))
      .toBeInTheDocument()

    await screen.getByRole('button', { name: '外部更新' }).click()

    await expect.element(input).toHaveValue('external')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
    await waitForDebounce()
    expect(fetchSuggestions).toHaveBeenCalledExactlyOnceWith('ja')
  })

  test('does not search a controlled value that the parent rejects', async () => {
    const onValueChange = vi.fn()
    const fetchSuggestions = vi.fn(() => [{ value: 'james' }])
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={fetchSuggestions}
        onValueChange={onValueChange}
        value="fixed"
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('ja')
    await expect.element(input).toHaveValue('fixed')
    await waitForDebounce()
    expect(fetchSuggestions).not.toHaveBeenCalled()
  })

  test('closes results and does not search a whitespace-only input', async () => {
    const fetchSuggestions = vi.fn(() => [{ value: 'james' }])
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={fetchSuggestions}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    await expect.element(screen.getByRole('listbox')).toBeInTheDocument()

    await input.fill('   ')

    await expect.element(input).toHaveValue('   ')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
    await waitForDebounce()
    expect(fetchSuggestions).toHaveBeenCalledExactlyOnceWith('ja')
  })

  test('keeps the popup closed when a synchronous search returns no results', async () => {
    const fetchSuggestions = vi.fn(() => [])
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={fetchSuggestions}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('unknown')
    await waitForDebounce()

    expect(fetchSuggestions).toHaveBeenCalledExactlyOnceWith('unknown')
    await expect.element(input).toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('fills the input and reports the complete option when a suggestion is clicked', async () => {
    const onValueChange = vi.fn()
    const onOptionSelect = vi.fn()
    const option = { value: 'ab', number: 11 }
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => [option]}
        onOptionSelect={onOptionSelect}
        onValueChange={onValueChange}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('a')
    await waitForDebounce()
    onValueChange.mockClear()

    await screen.getByRole('option', { name: 'ab' }).click()

    await expect.element(input).toHaveValue('ab')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('ab')
    expect(onOptionSelect).toHaveBeenCalledExactlyOnceWith(option)
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('reports a same-value option selection without reporting a value change', async () => {
    const onValueChange = vi.fn()
    const onOptionSelect = vi.fn()
    const option = { value: 'ab', number: 11 }
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        defaultValue="a"
        fetchSuggestions={() => [option]}
        onOptionSelect={onOptionSelect}
        onValueChange={onValueChange}
      />,
    )

    await screen.getByRole('combobox', { name: '搜索球员' }).fill('ab')
    await waitForDebounce()
    onValueChange.mockClear()

    await screen.getByRole('option', { name: 'ab' }).click()

    expect(onValueChange).not.toHaveBeenCalled()
    expect(onOptionSelect).toHaveBeenCalledExactlyOnceWith(option)
  })

  test('requests a controlled selection without replacing a value rejected by the parent', async () => {
    const onValueChange = vi.fn()
    const onOptionSelect = vi.fn()
    const option = { value: 'ab', number: 11 }

    function ControlledAutoComplete() {
      const [value, setValue] = useState('')

      return (
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={() => [option]}
          onOptionSelect={onOptionSelect}
          onValueChange={(nextValue) => {
            onValueChange(nextValue)

            if (nextValue === 'a') {
              setValue(nextValue)
            }
          }}
          value={value}
        />
      )
    }

    const screen = await render(<ControlledAutoComplete />)
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('a')
    await waitForDebounce()
    onValueChange.mockClear()
    await screen.getByRole('option', { name: 'ab' }).click()

    await expect.element(input).toHaveValue('a')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('ab')
    expect(onOptionSelect).toHaveBeenCalledExactlyOnceWith(option)
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('renders an option from the complete generic data object', async () => {
    const option = { value: 'james', number: 23 }
    const renderOption = vi.fn(
      (player: typeof option) => `${player.value} #${player.number}`,
    )
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => [option]}
        renderOption={renderOption}
      />,
    )

    await screen.getByRole('combobox', { name: '搜索球员' }).fill('ja')
    await waitForDebounce()

    await expect
      .element(screen.getByRole('option', { name: 'james #23' }))
      .toBeInTheDocument()
    expect(renderOption).toHaveBeenCalledWith(option)
  })
})
