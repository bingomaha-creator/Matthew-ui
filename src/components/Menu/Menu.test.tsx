import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Menu } from '../../index'

const waitForHoverDelay = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 350)
  })

describe('Menu', () => {
  test('has no selected item when no initial value is provided', async () => {
    const screen = await render(
      <Menu>
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.Item value="docs">文档</Menu.Item>
      </Menu>,
    )

    await expect
      .element(screen.getByRole('button', { name: '首页' }))
      .not.toHaveAttribute('aria-current')
    await expect
      .element(screen.getByRole('button', { name: '文档' }))
      .not.toHaveAttribute('aria-current')
  })

  test('initializes an uncontrolled selection from defaultValue', async () => {
    const screen = await render(
      <Menu defaultValue="docs">
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.Item value="docs">文档</Menu.Item>
      </Menu>,
    )

    await expect
      .element(screen.getByRole('button', { name: '首页' }))
      .not.toHaveAttribute('aria-current')
    await expect
      .element(screen.getByRole('button', { name: '文档' }))
      .toHaveAttribute('aria-current', 'true')
  })

  test('selects an enabled item and reports its stable value', async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Menu defaultValue="home" onValueChange={onValueChange}>
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.Item value="docs">文档</Menu.Item>
      </Menu>,
    )

    await screen.getByRole('button', { name: '文档' }).click()

    await expect
      .element(screen.getByRole('button', { name: '首页' }))
      .not.toHaveAttribute('aria-current')
    await expect
      .element(screen.getByRole('button', { name: '文档' }))
      .toHaveAttribute('aria-current', 'true')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('docs')
  })

  test('does not report a change when the selected item is activated again', async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Menu defaultValue="home" onValueChange={onValueChange}>
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.Item value="docs">文档</Menu.Item>
      </Menu>,
    )

    const docsItem = screen.getByRole('button', { name: '文档' })

    await docsItem.click()

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('docs')
    onValueChange.mockClear()

    await docsItem.click()

    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('keeps the selected value when callers reorder items', async () => {
    function ReorderableMenu() {
      const [isReversed, setIsReversed] = useState(false)
      const items = isReversed
        ? [
            { value: 'docs', label: '文档' },
            { value: 'home', label: '首页' },
          ]
        : [
            { value: 'home', label: '首页' },
            { value: 'docs', label: '文档' },
          ]

      return (
        <>
          <button onClick={() => setIsReversed((previous) => !previous)}>
            切换顺序
          </button>
          <Menu defaultValue="docs">
            {items.map((item) => (
              <Menu.Item key={item.value} value={item.value}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </>
      )
    }

    const screen = await render(<ReorderableMenu />)

    await screen.getByRole('button', { name: '切换顺序' }).click()

    await expect
      .element(screen.getByRole('button', { name: '文档' }))
      .toHaveAttribute('aria-current', 'true')
    await expect
      .element(screen.getByRole('button', { name: '首页' }))
      .not.toHaveAttribute('aria-current')
  })

  test('does not select or report a disabled item', async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Menu defaultValue="home" onValueChange={onValueChange}>
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.Item disabled value="docs">
          文档
        </Menu.Item>
      </Menu>,
    )
    const disabledItem = screen.getByRole('button', { name: '文档' })

    await expect.element(disabledItem).toBeDisabled()
    ;(disabledItem.element() as HTMLButtonElement).click()

    await expect
      .element(screen.getByRole('button', { name: '首页' }))
      .toHaveAttribute('aria-current', 'true')
    await expect.element(disabledItem).not.toHaveAttribute('aria-current')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('uses value as the selected item when controlled and defaultValue is also provided', async () => {
    const screen = await render(
      <Menu defaultValue="home" value="docs">
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.Item value="docs">文档</Menu.Item>
      </Menu>,
    )

    await expect
      .element(screen.getByRole('button', { name: '首页' }))
      .not.toHaveAttribute('aria-current')
    await expect
      .element(screen.getByRole('button', { name: '文档' }))
      .toHaveAttribute('aria-current', 'true')
  })

  test('requests a controlled value change without changing the selected DOM item', async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Menu onValueChange={onValueChange} value="home">
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.Item value="docs">文档</Menu.Item>
      </Menu>,
    )

    await screen.getByRole('button', { name: '文档' }).click()

    await expect
      .element(screen.getByRole('button', { name: '首页' }))
      .toHaveAttribute('aria-current', 'true')
    await expect
      .element(screen.getByRole('button', { name: '文档' }))
      .not.toHaveAttribute('aria-current')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('docs')
  })

  test('reflects a parent update to a controlled value', async () => {
    function ControlledMenu() {
      const [value, setValue] = useState('home')

      return (
        <Menu onValueChange={setValue} value={value}>
          <Menu.Item value="home">首页</Menu.Item>
          <Menu.Item value="docs">文档</Menu.Item>
        </Menu>
      )
    }

    const screen = await render(<ControlledMenu />)

    await screen.getByRole('button', { name: '文档' }).click()

    await expect
      .element(screen.getByRole('button', { name: '首页' }))
      .not.toHaveAttribute('aria-current')
    await expect
      .element(screen.getByRole('button', { name: '文档' }))
      .toHaveAttribute('aria-current', 'true')
  })

  test('does not request a controlled value change for its already selected item', async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Menu onValueChange={onValueChange} value="home">
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.Item value="docs">文档</Menu.Item>
      </Menu>,
    )

    await screen.getByRole('button', { name: '首页' }).click()

    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('warns in development when controlled and uncontrolled selection props conflict', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await render(
      <Menu defaultValue="home" value="docs">
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.Item value="docs">文档</Menu.Item>
      </Menu>,
    )

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('defaultValue will be ignored'),
    )
    warn.mockRestore()
  })

  test('lets vertical submenus open independently', async () => {
    const screen = await render(
      <Menu mode="vertical">
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu title="资源" value="resources">
          <Menu.Item value="guide">使用指南</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )

    const components = screen.getByRole('button', { name: '组件' })
    const resources = screen.getByRole('button', { name: '资源' })

    await components.click()
    await resources.click()

    await expect.element(components).toHaveAttribute('aria-expanded', 'true')
    await expect.element(resources).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(screen.getByRole('button', { name: 'Button 示例' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: '使用指南' }))
      .toBeInTheDocument()
  })

  test('uses horizontal single-open behavior when mode is omitted', async () => {
    const screen = await render(
      <Menu>
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu title="资源" value="resources">
          <Menu.Item value="guide">使用指南</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )

    const components = screen.getByRole('button', { name: '组件' })
    const resources = screen.getByRole('button', { name: '资源' })

    await components.click()
    await expect.element(components).toHaveAttribute('aria-expanded', 'true')

    await resources.click()

    await expect.element(components).toHaveAttribute('aria-expanded', 'false')
    await expect.element(resources).toHaveAttribute('aria-expanded', 'true')
  })

  test('initializes uncontrolled vertical submenus from defaultOpenValues', async () => {
    const screen = await render(
      <Menu defaultOpenValues={['components', 'resources']} mode="vertical">
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu title="资源" value="resources">
          <Menu.Item value="guide">使用指南</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )

    await expect
      .element(screen.getByRole('button', { name: '组件' }))
      .toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(screen.getByRole('button', { name: '资源' }))
      .toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(screen.getByRole('button', { name: 'Button 示例' }))
      .toBeInTheDocument()
  })

  test('requests a controlled open-value change without changing the expanded submenu', async () => {
    const onOpenValuesChange = vi.fn()
    const screen = await render(
      <Menu
        mode="vertical"
        onOpenValuesChange={onOpenValuesChange}
        openValues={['components']}
      >
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu title="资源" value="resources">
          <Menu.Item value="guide">使用指南</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )

    const components = screen.getByRole('button', { name: '组件' })
    const resources = screen.getByRole('button', { name: '资源' })

    await resources.click()

    await expect.element(components).toHaveAttribute('aria-expanded', 'true')
    await expect.element(resources).toHaveAttribute('aria-expanded', 'false')
    expect(onOpenValuesChange).toHaveBeenCalledExactlyOnceWith([
      'components',
      'resources',
    ])
  })

  test('reflects a parent update to controlled openValues', async () => {
    function ControlledOpenMenu() {
      const [openValues, setOpenValues] = useState<string[]>([])

      return (
        <Menu
          mode="vertical"
          onOpenValuesChange={setOpenValues}
          openValues={openValues}
        >
          <Menu.SubMenu title="组件" value="components">
            <Menu.Item value="button">Button 示例</Menu.Item>
          </Menu.SubMenu>
        </Menu>
      )
    }

    const screen = await render(<ControlledOpenMenu />)

    await screen.getByRole('button', { name: '组件' }).click()

    await expect
      .element(screen.getByRole('button', { name: '组件' }))
      .toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(screen.getByRole('button', { name: 'Button 示例' }))
      .toBeInTheDocument()
  })

  test('opens a horizontal submenu after the 300ms hover delay', async () => {
    const screen = await render(
      <Menu>
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )
    const components = screen.getByRole('button', { name: '组件' })

    await components.hover()
    await waitForHoverDelay()

    await expect.element(components).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(screen.getByRole('button', { name: 'Button 示例' }))
      .toBeInTheDocument()
  })

  test('closes an open horizontal submenu after the 300ms hover-leave delay', async () => {
    const screen = await render(
      <Menu defaultOpenValues={['components']}>
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )
    const components = screen.getByRole('button', { name: '组件' })

    await components.hover()
    await components.unhover()
    await waitForHoverDelay()

    await expect.element(components).toHaveAttribute('aria-expanded', 'false')
  })

  test('keeps a horizontal submenu open when the pointer re-enters before its close delay', async () => {
    const screen = await render(
      <Menu defaultOpenValues={['components']}>
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )
    const components = screen.getByRole('button', { name: '组件' })

    await components.hover()
    await components.unhover()
    await components.hover()
    await waitForHoverDelay()

    await expect.element(components).toHaveAttribute('aria-expanded', 'true')
  })

  test('does not leave a pending hover-open request after a click opens the submenu', async () => {
    const onOpenValuesChange = vi.fn()
    const screen = await render(
      <Menu onOpenValuesChange={onOpenValuesChange}>
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )
    const components = screen.getByRole('button', { name: '组件' })

    await components.hover()
    ;(components.element() as HTMLButtonElement).click()
    await waitForHoverDelay()

    await expect.element(components).toHaveAttribute('aria-expanded', 'true')
    expect(onOpenValuesChange).toHaveBeenCalledExactlyOnceWith(['components'])
  })

  test('warns and uses controlled openValues when open state props conflict', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const screen = await render(
      <Menu
        defaultOpenValues={['components']}
        openValues={['resources']}
      >
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu title="资源" value="resources">
          <Menu.Item value="guide">使用指南</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )

    await expect
      .element(screen.getByRole('button', { name: '组件' }))
      .toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(screen.getByRole('button', { name: '资源' }))
      .toHaveAttribute('aria-expanded', 'true')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('defaultOpenValues will be ignored'),
    )
    warn.mockRestore()
  })

  test('uses only the first valid horizontal default open value and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const screen = await render(
      <Menu defaultOpenValues={['missing', 'resources', 'components']}>
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu title="资源" value="resources">
          <Menu.Item value="guide">使用指南</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )

    await expect
      .element(screen.getByRole('button', { name: '组件' }))
      .toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(screen.getByRole('button', { name: '资源' }))
      .toHaveAttribute('aria-expanded', 'true')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('only the first valid open value will be used'),
    )
    warn.mockRestore()
  })

  test('marks a vertical SubMenu when one of its descendants is selected', async () => {
    const screen = await render(
      <Menu defaultOpenValues={['components']} mode="vertical">
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )
    const components = screen.getByRole('button', { name: '组件' })

    await screen.getByRole('button', { name: 'Button 示例' }).click()

    await expect
      .element(components)
      .toHaveAttribute('data-descendant-active', 'true')
  })

  test('marks a closed SubMenu when an initial value selects its descendant', async () => {
    const screen = await render(
      <Menu defaultValue="button" mode="vertical">
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )

    await expect
      .element(screen.getByRole('button', { name: '组件' }))
      .toHaveAttribute('aria-expanded', 'false')
    await expect
      .element(screen.getByRole('button', { name: '组件' }))
      .toHaveAttribute('data-descendant-active', 'true')
  })

  test('closes a horizontal SubMenu after selecting its enabled child', async () => {
    const screen = await render(
      <Menu defaultOpenValues={['components']}>
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )
    const components = screen.getByRole('button', { name: '组件' })

    await screen.getByRole('button', { name: 'Button 示例' }).click()

    await expect.element(components).toHaveAttribute('aria-expanded', 'false')
  })

  test('keeps a vertical SubMenu open after selecting its enabled child', async () => {
    const screen = await render(
      <Menu defaultOpenValues={['components']} mode="vertical">
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )
    const components = screen.getByRole('button', { name: '组件' })

    await screen.getByRole('button', { name: 'Button 示例' }).click()

    await expect.element(components).toHaveAttribute('aria-expanded', 'true')
  })

  test('does not select a disabled child or close its horizontal SubMenu', async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Menu
        defaultOpenValues={['components']}
        defaultValue="home"
        onValueChange={onValueChange}
      >
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item disabled value="button">
            Button 示例
          </Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )
    const components = screen.getByRole('button', { name: '组件' })

    ;(screen.getByRole('button', {
      name: 'Button 示例',
    }).element() as HTMLButtonElement).click()

    await expect.element(components).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(screen.getByRole('button', { name: '首页' }))
      .toHaveAttribute('aria-current', 'true')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('closes an open horizontal SubMenu when users click outside the Menu', async () => {
    const screen = await render(
      <>
        <Menu defaultOpenValues={['components']}>
          <Menu.SubMenu title="组件" value="components">
            <Menu.Item value="button">Button 示例</Menu.Item>
          </Menu.SubMenu>
        </Menu>
        <button style={{ marginLeft: '20rem' }}>外部操作</button>
      </>,
    )
    const components = screen.getByRole('button', { name: '组件' })

    await screen.getByRole('button', { name: '外部操作' }).click()

    await expect.element(components).toHaveAttribute('aria-expanded', 'false')
  })

  test('closes with Escape and returns focus to the SubMenu trigger', async () => {
    const screen = await render(
      <Menu defaultOpenValues={['components']}>
        <Menu.SubMenu title="组件" value="components">
          <Menu.Item value="button">Button 示例</Menu.Item>
        </Menu.SubMenu>
      </Menu>,
    )
    const components = screen.getByRole('button', { name: '组件' })
    const child = screen.getByRole('button', { name: 'Button 示例' })

    ;(child.element() as HTMLButtonElement).focus()
    child.element().dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
    )

    await expect.element(components).toHaveAttribute('aria-expanded', 'false')
    await expect.element(components).toHaveFocus()
  })

  test('renders a real LinkItem and keeps disabled links out of navigation', async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Menu defaultValue="home" onValueChange={onValueChange}>
        <Menu.Item value="home">首页</Menu.Item>
        <Menu.LinkItem href="/docs" value="docs">
          文档
        </Menu.LinkItem>
        <Menu.LinkItem disabled href="/guide" value="guide">
          禁用指南
        </Menu.LinkItem>
      </Menu>,
    )
    const link = screen.getByRole('link', { name: '文档' })
    const disabledLink = screen.getByText('禁用指南')

    await expect.element(link).toHaveAttribute('href', '/docs')
    await expect.element(disabledLink).not.toHaveAttribute('href')
    await expect.element(disabledLink).toHaveAttribute('aria-disabled', 'true')
    await expect.element(disabledLink).toHaveAttribute('tabindex', '-1')

    await disabledLink.click()

    expect(onValueChange).not.toHaveBeenCalled()
  })
})
