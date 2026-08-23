import { userEvent } from 'vitest/browser'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AutoComplete } from '../../index'
import { waitForDebounce } from './AutoComplete.test-utils'

describe('AutoComplete interaction', () => {
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

  test.each(['disabled', 'readOnly'] as const)(
    'does not restore cached results after it is re-enabled from %s',
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
      await waitForDebounce()
      await userEvent.keyboard('{ArrowDown}')
      await screen.rerender(
        <AutoComplete
          aria-label="搜索球员"
          disabled={restriction === 'disabled'}
          fetchSuggestions={fetchSuggestions}
          readOnly={restriction === 'readOnly'}
        />,
      )
      await screen.rerender(
        <AutoComplete
          aria-label="搜索球员"
          fetchSuggestions={fetchSuggestions}
        />,
      )

      ;(input.element() as HTMLInputElement).focus()
      await userEvent.keyboard('{ArrowDown}')

      await expect
        .element(screen.getByRole('listbox'))
        .not.toBeInTheDocument()
      await expect.element(input).not.toHaveAttribute('aria-activedescendant')
      expect(fetchSuggestions).toHaveBeenCalledTimes(1)

      await waitForDebounce()

      expect(fetchSuggestions).toHaveBeenCalledTimes(2)
      await expect
        .element(screen.getByRole('option', { name: 'james' }))
        .toBeInTheDocument()
    },
  )

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
})
