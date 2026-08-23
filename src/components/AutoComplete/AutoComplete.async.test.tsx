import { useState } from 'react'
import { userEvent } from 'vitest/browser'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AutoComplete } from '../../index'
import {
  createDeferred,
  waitForDebounce,
} from './AutoComplete.test-utils'

describe('AutoComplete async search', () => {
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

  test.each(['disabled', 'readOnly'] as const)(
    'clears an in-flight request while %s and searches again only after re-enabling debounce',
    async (restriction) => {
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
          disabled={restriction === 'disabled'}
          fetchSuggestions={fetchSuggestions}
          readOnly={restriction === 'readOnly'}
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
        .element(screen.getByRole('listbox'))
        .not.toBeInTheDocument()
      expect(fetchSuggestions).toHaveBeenCalledTimes(1)
      await waitForDebounce()
      await expect
        .element(screen.getByRole('listbox'))
        .toHaveAttribute('aria-busy', 'true')
      expect(fetchSuggestions).toHaveBeenCalledTimes(2)

      secondRequest.resolve([])
      await expect
        .element(screen.getByRole('listbox'))
        .not.toBeInTheDocument()
    },
  )
})
