import { createRef } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Button } from '../../index'

describe('Button', () => {
  test('renders a button with its accessible name', async () => {
    const screen = await render(<Button>保存</Button>)

    await expect
      .element(screen.getByRole('button', { name: '保存' }))
      .toBeInTheDocument()
  })

  test('uses type="button" by default', async () => {
    const screen = await render(<Button>打开弹窗</Button>)

    await expect
      .element(screen.getByRole('button', { name: '打开弹窗' }), {
        timeout: 500,
      })
      .toHaveAttribute('type', 'button')
  })

  test('preserves an explicit button type', async () => {
    const screen = await render(<Button type="submit">提交</Button>)

    await expect
      .element(screen.getByRole('button', { name: '提交' }), { timeout: 500 })
      .toHaveAttribute('type', 'submit')
  })

  test('applies the default visual classes', async () => {
    const screen = await render(<Button>保存</Button>)
    const button = screen.getByRole('button', { name: '保存' })

    await expect.element(button, { timeout: 500 }).toHaveClass('matthew-button')
    await expect.element(button).toHaveClass('matthew-button--secondary')
    await expect.element(button).toHaveClass('matthew-button--md')
  })

  test('applies variant and size classes without replacing className', async () => {
    const screen = await render(
      <Button variant="danger" size="lg" className="extra">
        删除
      </Button>,
    )
    const button = screen.getByRole('button', { name: '删除' })

    await expect.element(button, { timeout: 500 }).toHaveClass('matthew-button--danger')
    await expect.element(button).toHaveClass('matthew-button--lg')
    await expect.element(button).toHaveClass('extra')
  })

  test('forwards native attributes and className', async () => {
    const screen = await render(
      <Button className="extra" name="action" value="save">
        保存
      </Button>,
    )
    const button = screen.getByRole('button', { name: '保存' })

    await expect.element(button, { timeout: 500 }).toHaveClass('extra')
    await expect.element(button, { timeout: 500 }).toHaveAttribute('name', 'action')
    await expect.element(button, { timeout: 500 }).toHaveAttribute('value', 'save')
  })

  test('calls onClick when enabled', async () => {
    const handleClick = vi.fn()
    const screen = await render(<Button onClick={handleClick}>保存</Button>)

    await screen.getByRole('button', { name: '保存' }).click()

    expect(handleClick).toHaveBeenCalledOnce()
  })

  test('uses native disabled behavior', async () => {
    const handleClick = vi.fn()
    const screen = await render(
      <Button disabled onClick={handleClick}>
        删除
      </Button>,
    )
    const button = screen.getByRole('button', { name: '删除' })
    const nativeButton = button.element() as HTMLButtonElement

    await expect.element(button, { timeout: 500 }).toBeDisabled()
    nativeButton.click()
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('forwards its ref to the native button', async () => {
    const buttonRef = createRef<HTMLButtonElement>()
    const screen = await render(<Button ref={buttonRef}>保存</Button>)
    const button = screen.getByRole('button', { name: '保存' })

    await expect.element(button).toBeInTheDocument()
    expect(buttonRef.current).toBe(button.element())
  })
})
