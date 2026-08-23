import { createRef, useState } from 'react'
import { userEvent } from 'vitest/browser'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AutoComplete } from '../../index'

const waitForDebounce = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 350)
  })

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, reject, resolve }
}

describe('AutoComplete', () => {
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
    expect(fetchSuggestions).not.toHaveBeenCalled()

    await waitForDebounce()

    expect(fetchSuggestions).toHaveBeenCalledExactlyOnceWith('ja')
    await expect.element(screen.getByRole('listbox')).toBeInTheDocument()
    await expect
      .element(screen.getByRole('option', { name: 'james' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('option', { name: 'jarvis' }))
      .toBeInTheDocument()
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

  test('highlights suggestions with clamped arrow keys and pointer movement', async () => {
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => [{ value: 'james' }, { value: 'jarvis' }]}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    const james = screen.getByRole('option', { name: 'james' })
    const jarvis = screen.getByRole('option', { name: 'jarvis' })

    await userEvent.keyboard('{ArrowUp}')
    await expect
      .element(input)
      .toHaveAttribute('aria-activedescendant', james.element().id)
    await expect.element(james).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect
      .element(input)
      .toHaveAttribute('aria-activedescendant', jarvis.element().id)
    await expect.element(jarvis).toHaveAttribute('aria-selected', 'true')

    await james.hover()
    await expect
      .element(input)
      .toHaveAttribute('aria-activedescendant', james.element().id)
    await expect.element(input).toHaveFocus()
  })

  test('selects the active suggestion with Enter', async () => {
    const onValueChange = vi.fn()
    const onOptionSelect = vi.fn()
    const option = { value: 'james', number: 23 }
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => [option]}
        onOptionSelect={onOptionSelect}
        onValueChange={onValueChange}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    onValueChange.mockClear()
    await userEvent.keyboard('{ArrowDown}{Enter}')

    await expect.element(input).toHaveValue('james')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('james')
    expect(onOptionSelect).toHaveBeenCalledExactlyOnceWith(option)
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('closes with Escape while preserving the input value', async () => {
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => [{ value: 'james' }]}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    await userEvent.keyboard('{ArrowDown}{Escape}')

    await expect.element(input).toHaveValue('ja')
    await expect.element(input).toHaveAttribute('aria-expanded', 'false')
    await expect.element(input).not.toHaveAttribute('aria-activedescendant')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('closes without selecting when Tab moves focus away', async () => {
    const onOptionSelect = vi.fn()
    const screen = await render(
      <>
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={() => [{ value: 'james' }]}
          onOptionSelect={onOptionSelect}
        />
        <button>下一个操作</button>
      </>,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })
    const nextButton = screen.getByRole('button', { name: '下一个操作' })

    await input.fill('ja')
    await waitForDebounce()
    await userEvent.keyboard('{ArrowDown}{Tab}')

    await expect.element(nextButton).toHaveFocus()
    expect(onOptionSelect).not.toHaveBeenCalled()
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('closes when focus moves outside the component', async () => {
    const screen = await render(
      <>
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={() => [{ value: 'james' }]}
        />
        <button>页面操作</button>
      </>,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })
    const outsideButton = screen.getByRole('button', { name: '页面操作' })

    await input.fill('ja')
    await waitForDebounce()
    ;(outsideButton.element() as HTMLButtonElement).focus()

    await expect.element(outsideButton).toHaveFocus()
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('closes on an outside pointer interaction even when focus stays put', async () => {
    const screen = await render(
      <>
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={() => [{ value: 'james' }]}
        />
        <button
          style={{ marginTop: '4rem' }}
          onPointerDown={(event) => event.preventDefault()}
        >
          页面内容
        </button>
      </>,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    await screen.getByRole('button', { name: '页面内容' }).click()

    await expect.element(input).toHaveFocus()
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('reopens valid cached suggestions on focus or ArrowDown without searching again', async () => {
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
    await userEvent.keyboard('{Escape}')
    ;(input.element() as HTMLInputElement).blur()
    ;(input.element() as HTMLInputElement).focus()

    await expect.element(screen.getByRole('listbox')).toBeInTheDocument()
    expect(fetchSuggestions).toHaveBeenCalledExactlyOnceWith('ja')

    await userEvent.keyboard('{Escape}{ArrowDown}')

    const james = screen.getByRole('option', { name: 'james' })
    await expect.element(input).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(input)
      .toHaveAttribute('aria-activedescendant', james.element().id)
    expect(fetchSuggestions).toHaveBeenCalledExactlyOnceWith('ja')
  })

  test.each(['disabled', 'readOnly'] as const)(
    'cancels a pending search and stays closed when it becomes %s',
    async (restriction) => {
      const fetchSuggestions = vi.fn(() => [{ value: 'james' }])
      const screen = await render(
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={fetchSuggestions}
        />,
      )
      const input = screen.getByRole('combobox', { name: '搜索球员' })

      await input.fill('ja')
      await screen.rerender(
        <AutoComplete
          aria-label="搜索球员"
          disabled={restriction === 'disabled'}
          fetchSuggestions={fetchSuggestions}
          readOnly={restriction === 'readOnly'}
        />,
      )
      await waitForDebounce()

      expect(fetchSuggestions).not.toHaveBeenCalled()
      await expect.element(input).toHaveAttribute('aria-expanded', 'false')
      await expect
        .element(screen.getByRole('listbox'))
        .not.toBeInTheDocument()
    },
  )

  test('opens a busy listbox while an asynchronous search is pending', async () => {
    const request = createDeferred<{ value: string }[]>()
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => request.promise}
      />,
    )

    await screen.getByRole('combobox', { name: '搜索球员' }).fill('ja')
    await waitForDebounce()

    await expect
      .element(screen.getByRole('listbox'))
      .toHaveAttribute('aria-busy', 'true')
    await expect
      .element(screen.getByRole('status', { name: 'Loading suggestions' }))
      .toBeInTheDocument()

    request.resolve([])
  })

  test('commits suggestions from a fulfilled PromiseLike and ends loading', async () => {
    const request = createDeferred<{ value: string }[]>()
    const thenable: PromiseLike<{ value: string }[]> = {
      then: request.promise.then.bind(request.promise),
    }
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => thenable}
      />,
    )

    await screen.getByRole('combobox', { name: '搜索球员' }).fill('ja')
    await waitForDebounce()
    request.resolve([{ value: 'james' }])

    const listbox = screen.getByRole('listbox')
    await expect.element(listbox).toHaveAttribute('aria-busy', 'false')
    await expect
      .element(screen.getByRole('option', { name: 'james' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('status', { name: 'Loading suggestions' }))
      .not.toBeInTheDocument()
  })

  test('closes after an asynchronous search fulfills with no suggestions', async () => {
    const request = createDeferred<{ value: string }[]>()
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => request.promise}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('unknown')
    await waitForDebounce()
    request.resolve([])

    await expect.element(input).toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('safely closes when a synchronous search throws', async () => {
    const fetchSuggestions = vi.fn(() => {
      throw new Error('search failed')
    })
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={fetchSuggestions}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()

    expect(fetchSuggestions).toHaveBeenCalledExactlyOnceWith('ja')
    await expect.element(input).toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('safely closes when an asynchronous search rejects', async () => {
    const request = createDeferred<{ value: string }[]>()
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => request.promise}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    request.reject(new Error('search failed'))

    await expect.element(input).toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('keeps newer suggestions when an older request finishes last', async () => {
    const firstRequest = createDeferred<{ value: string }[]>()
    const secondRequest = createDeferred<{ value: string }[]>()
    const fetchSuggestions = vi.fn((query: string) =>
      query === 'a' ? firstRequest.promise : secondRequest.promise,
    )
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={fetchSuggestions}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('a')
    await waitForDebounce()
    await input.fill('ab')
    await waitForDebounce()
    secondRequest.resolve([{ value: 'about' }])

    await expect
      .element(screen.getByRole('option', { name: 'about' }))
      .toBeInTheDocument()

    firstRequest.resolve([{ value: 'apple' }])
    await new Promise((resolve) => setTimeout(resolve, 50))

    await expect
      .element(screen.getByRole('option', { name: 'about' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('option', { name: 'apple' }))
      .not.toBeInTheDocument()
  })

  test('ignores a pending request after an external controlled value update', async () => {
    const request = createDeferred<{ value: string }[]>()

    function ControlledAutoComplete() {
      const [value, setValue] = useState('')

      return (
        <>
          <button onClick={() => setValue('external')}>外部更新</button>
          <AutoComplete
            aria-label="搜索球员"
            fetchSuggestions={() => request.promise}
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
    await screen.getByRole('button', { name: '外部更新' }).click()
    request.resolve([{ value: 'james' }])
    await new Promise((resolve) => setTimeout(resolve, 50))

    await expect.element(input).toHaveValue('external')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('invalidates a pending request when Escape closes loading', async () => {
    const request = createDeferred<{ value: string }[]>()
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => request.promise}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    await userEvent.keyboard('{Escape}')
    request.resolve([{ value: 'james' }])
    await new Promise((resolve) => setTimeout(resolve, 50))

    await expect.element(input).toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('invalidates a pending request when Tab closes loading', async () => {
    const request = createDeferred<{ value: string }[]>()
    const screen = await render(
      <>
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={() => request.promise}
        />
        <button>下一个操作</button>
      </>,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })
    const nextButton = screen.getByRole('button', { name: '下一个操作' })

    await input.fill('ja')
    await waitForDebounce()
    await userEvent.keyboard('{Tab}')
    request.resolve([{ value: 'james' }])
    await new Promise((resolve) => setTimeout(resolve, 50))

    await expect.element(nextButton).toHaveFocus()
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('invalidates a pending request when focus leaves during loading', async () => {
    const request = createDeferred<{ value: string }[]>()
    const screen = await render(
      <>
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={() => request.promise}
        />
        <button>页面操作</button>
      </>,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })
    const outsideButton = screen.getByRole('button', { name: '页面操作' })

    await input.fill('ja')
    await waitForDebounce()
    ;(outsideButton.element() as HTMLButtonElement).focus()
    request.resolve([{ value: 'james' }])
    await new Promise((resolve) => setTimeout(resolve, 50))

    await expect.element(outsideButton).toHaveFocus()
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('invalidates a pending request on an outside pointer interaction', async () => {
    const request = createDeferred<{ value: string }[]>()
    const screen = await render(
      <>
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={() => request.promise}
        />
        <button
          style={{ marginTop: '4rem' }}
          onPointerDown={(event) => event.preventDefault()}
        >
          页面内容
        </button>
      </>,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    await screen.getByRole('button', { name: '页面内容' }).click()
    request.resolve([{ value: 'james' }])
    await new Promise((resolve) => setTimeout(resolve, 50))

    await expect.element(input).toHaveFocus()
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('invalidates a pending request when the input is cleared', async () => {
    const request = createDeferred<{ value: string }[]>()
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={() => request.promise}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })

    await input.fill('ja')
    await waitForDebounce()
    await input.fill('   ')
    request.resolve([{ value: 'james' }])
    await new Promise((resolve) => setTimeout(resolve, 50))

    await expect.element(input).toHaveValue('   ')
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('waits until composition ends before searching the final input', async () => {
    const onValueChange = vi.fn()
    const fetchSuggestions = vi.fn(() => [{ value: '詹姆斯' }])
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={fetchSuggestions}
        onValueChange={onValueChange}
      />,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })
    const inputElement = input.element() as HTMLInputElement

    inputElement.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true }),
    )
    await input.fill('詹')
    await input.fill('詹姆斯')
    await waitForDebounce()

    await expect.element(input).toHaveValue('詹姆斯')
    expect(onValueChange).toHaveBeenLastCalledWith('詹姆斯')
    expect(fetchSuggestions).not.toHaveBeenCalled()

    inputElement.dispatchEvent(
      new CompositionEvent('compositionend', {
        bubbles: true,
        data: '詹姆斯',
      }),
    )
    await waitForDebounce()

    expect(fetchSuggestions).toHaveBeenCalledExactlyOnceWith('詹姆斯')
  })

  test('does not search again when only fetchSuggestions identity changes', async () => {
    const firstFetch = vi.fn(() => [{ value: 'james' }])
    const secondFetch = vi.fn(() => [{ value: 'jarvis' }])
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={firstFetch}
      />,
    )

    await screen.getByRole('combobox', { name: '搜索球员' }).fill('ja')
    await waitForDebounce()
    await screen.rerender(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={secondFetch}
      />,
    )
    await waitForDebounce()

    expect(firstFetch).toHaveBeenCalledExactlyOnceWith('ja')
    expect(secondFetch).not.toHaveBeenCalled()
    await expect
      .element(screen.getByRole('option', { name: 'james' }))
      .toBeInTheDocument()
  })

  test('combines caller input events with internal combobox behavior', async () => {
    const onBlur = vi.fn()
    const onCompositionEnd = vi.fn()
    const onCompositionStart = vi.fn()
    const onFocus = vi.fn()
    const onKeyDown = vi.fn()
    const screen = await render(
      <>
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={() => [{ value: '詹姆斯' }]}
          onBlur={onBlur}
          onCompositionEnd={onCompositionEnd}
          onCompositionStart={onCompositionStart}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
        />
        <button>页面操作</button>
      </>,
    )
    const input = screen.getByRole('combobox', { name: '搜索球员' })
    const inputElement = input.element() as HTMLInputElement

    inputElement.focus()
    inputElement.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true }),
    )
    await input.fill('詹姆斯')
    inputElement.dispatchEvent(
      new CompositionEvent('compositionend', {
        bubbles: true,
        data: '詹姆斯',
      }),
    )
    await waitForDebounce()
    await userEvent.keyboard('{ArrowDown}')

    const option = screen.getByRole('option', { name: '詹姆斯' })
    await expect
      .element(input)
      .toHaveAttribute('aria-activedescendant', option.element().id)
    expect(onFocus).toHaveBeenCalled()
    expect(onCompositionStart).toHaveBeenCalled()
    expect(onCompositionEnd).toHaveBeenCalled()
    expect(onKeyDown).toHaveBeenCalled()

    ;(
      screen.getByRole('button', { name: '页面操作' }).element() as HTMLButtonElement
    ).focus()

    expect(onBlur).toHaveBeenCalled()
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })

  test('invalidates an in-flight request when interaction becomes disabled', async () => {
    const firstRequest = createDeferred<{ value: string }[]>()
    const secondRequest = createDeferred<{ value: string }[]>()
    const fetchSuggestions = vi
      .fn()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)
    const screen = await render(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={fetchSuggestions}
      />,
    )

    await screen.getByRole('combobox', { name: '搜索球员' }).fill('ja')
    await waitForDebounce()
    await screen.rerender(
      <AutoComplete
        aria-label="搜索球员"
        disabled
        fetchSuggestions={fetchSuggestions}
      />,
    )
    firstRequest.resolve([{ value: 'james' }])
    await new Promise((resolve) => setTimeout(resolve, 50))
    await screen.rerender(
      <AutoComplete
        aria-label="搜索球员"
        fetchSuggestions={fetchSuggestions}
      />,
    )

    await expect
      .element(screen.getByRole('option', { name: 'james' }))
      .not.toBeInTheDocument()
    await waitForDebounce()
    await expect
      .element(screen.getByRole('listbox'))
      .toHaveAttribute('aria-busy', 'true')
    expect(fetchSuggestions).toHaveBeenCalledTimes(2)

    secondRequest.resolve([])
    await expect
      .element(screen.getByRole('listbox'))
      .not.toBeInTheDocument()
  })
})
