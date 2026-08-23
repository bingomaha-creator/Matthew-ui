import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { AutoComplete } from '../../index'

const players = [
  { value: 'bradley', number: 11, position: 'Guard' },
  { value: 'caruso', number: 4, position: 'Guard' },
  { value: 'james', number: 23, position: 'Forward' },
  { value: 'jarvis', number: 8, position: 'Forward' },
]

const searchPlayers = (query: string) =>
  players.filter((player) => player.value.includes(query.toLowerCase()))

const stackStyle = {
  display: 'grid',
  gap: '1rem',
  maxWidth: '24rem',
} as const

const playerStyle = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: '1rem',
} as const

const storyFrameStyle = {
  width: 'min(32rem, 100%)',
} as const

const meta: Meta<typeof AutoComplete> = {
  title: 'Components/AutoComplete',
  component: AutoComplete,
  tags: ['autodocs', 'test'],
  decorators: [
    (Story) => (
      <div style={storyFrameStyle}>
        <Story />
      </div>
    ),
  ],
  args: {
    'aria-label': 'Search players',
    fetchSuggestions: searchPlayers,
    placeholder: 'Type a player name',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const BasicSearch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('combobox', { name: 'Search players' })

    await userEvent.type(input, 'ja')

    await waitFor(() => {
      expect(canvas.getByRole('option', { name: 'james' })).toBeVisible()
    })

    await userEvent.keyboard('{ArrowDown}')
    expect(canvas.getByRole('option', { name: 'james' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    const root = input.closest('.matthew-auto-complete') as HTMLElement
    const listbox = canvas.getByRole('listbox')
    const widthDifference = Math.abs(
      listbox.getBoundingClientRect().width - input.getBoundingClientRect().width,
    )

    expect(getComputedStyle(root).position).toBe('relative')
    expect(getComputedStyle(listbox).position).toBe('absolute')
    expect(widthDifference).toBeLessThan(1)
  },
}

export const CustomOption: Story = {
  render: () => (
    <AutoComplete
      aria-label="Search players with details"
      fetchSuggestions={searchPlayers}
      placeholder="Type ja"
      renderOption={(player) => (
        <span style={playerStyle}>
          <strong>{player.value}</strong>
          <span>
            #{player.number} · {player.position}
          </span>
        </span>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Search players with details' }),
      'ja',
    )

    await waitFor(() => {
      expect(
        canvas.getByRole('option', { name: /james.*#23.*Forward/ }),
      ).toBeVisible()
    })
  },
}

export const AsyncSearch: Story = {
  args: {
    'aria-label': 'Search players asynchronously',
    fetchSuggestions: (query) =>
      new Promise((resolve) => {
        window.setTimeout(() => resolve(searchPlayers(query)), 500)
      }),
    placeholder: 'Type ca to see loading',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(
      canvas.getByRole('combobox', {
        name: 'Search players asynchronously',
      }),
      'ca',
    )

    await waitFor(() => {
      expect(
        canvas.getByRole('status', { name: 'Loading suggestions' }),
      ).toBeVisible()
    })
    await waitFor(
      () => {
        expect(canvas.getByRole('option', { name: 'caruso' })).toBeVisible()
      },
      { timeout: 1_000 },
    )
  },
}

export const RestrictedStates: Story = {
  render: () => (
    <div style={stackStyle}>
      <label>
        Disabled
        <AutoComplete
          disabled
          fetchSuggestions={searchPlayers}
          placeholder="Unavailable"
        />
      </label>
      <label>
        Read only
        <AutoComplete
          defaultValue="james"
          fetchSuggestions={searchPlayers}
          readOnly
        />
      </label>
    </div>
  ),
}

export const LongContentInNarrowContainer: Story = {
  render: () => (
    <div style={{ width: 'min(18rem, 100%)' }}>
      <AutoComplete
        aria-label="Search documentation"
        fetchSuggestions={() => [
          {
            value:
              'A deliberately long suggestion that must wrap inside a narrow container',
          },
          { value: 'A shorter suggestion' },
        ]}
        placeholder="Type anything"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Search documentation' }),
      'a',
    )

    await waitFor(() => {
      expect(canvas.getAllByRole('option')).toHaveLength(2)
    })

    const option = canvas.getByRole('option', {
      name: /deliberately long suggestion/,
    })
    expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth)
  },
}
