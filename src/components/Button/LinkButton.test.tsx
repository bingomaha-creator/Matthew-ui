import { createRef, type MouseEvent as ReactMouseEvent } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { LinkButton } from '../../index'

describe('LinkButton', () => {
  test('renders a link with its accessible name', async () => {
    const screen = await render(<LinkButton href="/docs">文档</LinkButton>)

    await expect
      .element(screen.getByRole('link', { name: '文档' }), { timeout: 500 })
      .toBeInTheDocument()
  })

  test('preserves link semantics when an unsupported role is spread', async () => {
    const unsupportedProps = { role: 'button' as const }
    const screen = await render(
      <LinkButton href="/docs" {...unsupportedProps}>
        文档
      </LinkButton>,
    )

    await expect
      .element(screen.getByRole('link', { name: '文档' }), { timeout: 500 })
      .toBeInTheDocument()
  })

  test('derives aria-disabled only from disabled', async () => {
    const unsupportedProps = { 'aria-disabled': 'true' as const }
    const screen = await render(
      <LinkButton href="/docs" {...unsupportedProps}>
        文档
      </LinkButton>,
    )

    await expect
      .element(screen.getByRole('link', { name: '文档' }), { timeout: 500 })
      .not.toHaveAttribute('aria-disabled')
  })

  test('applies visual and disabled classes', async () => {
    const screen = await render(
      <LinkButton href="/docs" variant="danger" size="sm" disabled>
        文档
      </LinkButton>,
    )
    const link = screen.getByRole('link', { name: '文档' })

    await expect.element(link, { timeout: 500 }).toHaveClass('matthew-button--danger')
    await expect.element(link).toHaveClass('matthew-button--sm')
    await expect.element(link).toHaveClass('matthew-button--disabled')
  })

  test('exposes its navigation target', async () => {
    const screen = await render(<LinkButton href="/docs">文档</LinkButton>)

    await expect
      .element(screen.getByRole('link', { name: '文档' }), { timeout: 500 })
      .toHaveAttribute('href', '/docs')
  })

  test('forwards native anchor attributes and className', async () => {
    const screen = await render(
      <LinkButton
        href="https://example.com/docs"
        className="extra"
        target="_blank"
        rel="noreferrer"
      >
        外部文档
      </LinkButton>,
    )
    const link = screen.getByRole('link', { name: '外部文档' })

    await expect.element(link, { timeout: 500 }).toHaveClass('extra')
    await expect.element(link, { timeout: 500 }).toHaveAttribute('target', '_blank')
    await expect.element(link, { timeout: 500 }).toHaveAttribute('rel', 'noreferrer')
  })

  test('calls onClick when enabled', async () => {
    const handleClick = vi.fn((event: ReactMouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
    })
    const screen = await render(
      <LinkButton href="#docs" onClick={handleClick}>
        文档
      </LinkButton>,
    )

    await screen.getByRole('link', { name: '文档' }).click()

    expect(handleClick).toHaveBeenCalledOnce()
  })

  test('forwards its ref to the native anchor', async () => {
    const linkRef = createRef<HTMLAnchorElement>()
    const screen = await render(
      <LinkButton href="/docs" ref={linkRef}>
        文档
      </LinkButton>,
    )
    const link = screen.getByRole('link', { name: '文档' })

    await expect.element(link, { timeout: 500 }).toBeInTheDocument()
    expect(linkRef.current).toBe(link.element())
  })

  test('exposes its disabled state to assistive technology', async () => {
    const screen = await render(
      <LinkButton href="/docs" disabled>
        文档
      </LinkButton>,
    )

    await expect
      .element(screen.getByRole('link', { name: '文档' }), { timeout: 500 })
      .toHaveAttribute('aria-disabled', 'true')
  })

  test('removes navigation and sequential focus when disabled', async () => {
    const screen = await render(
      <LinkButton href="/docs" disabled>
        文档
      </LinkButton>,
    )
    const link = screen.getByRole('link', { name: '文档' })

    await expect.element(link, { timeout: 500 }).not.toHaveAttribute('href')
    await expect.element(link, { timeout: 500 }).toHaveAttribute('tabindex', '-1')
  })

  test('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const screen = await render(
      <LinkButton href="/docs" disabled onClick={handleClick}>
        文档
      </LinkButton>,
    )
    const link = screen.getByRole('link', { name: '文档' })
    const nativeLink = link.element() as HTMLAnchorElement

    nativeLink.click()

    expect(handleClick).not.toHaveBeenCalled()
  })
})
