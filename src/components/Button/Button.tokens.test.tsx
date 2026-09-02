import type { CSSProperties, ReactNode, MouseEvent as ReactMouseEvent } from 'react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Button, darkTheme, LinkButton, ThemeProvider } from '../../index'
import type { MatthewThemeConfig } from '../../index'
import '../../styles/_tokens.scss'
import './Button.scss'

// 只固定验收坐标（根字号16px）与静止状态；不替换任何待测颜色、尺寸或状态选择器。
let originalRootSize: string
beforeEach(() => {
  originalRootSize = document.documentElement.style.fontSize
  document.documentElement.style.fontSize = '16px'
})
afterEach(() => {
  document.documentElement.style.fontSize = originalRootSize
})
const harness = (children: ReactNode) => (
  <div className="button-token-harness">
    <style>{'.button-token-harness :is(button, a) { transition: none; }'}</style>
    {children}
  </div>
)
const sizes = ['sm', 'md', 'lg'] as const
const dimensions = (element: Element) => {
  const style = getComputedStyle(element)
  return {
    minHeight: style.minHeight, fontSize: style.fontSize,
    paddingBlock: style.paddingBlock, paddingInline: style.paddingInline,
  }
}
const sample = () => sizes.map(size => <Button key={size} size={size}>{size}</Button>)


const colors = (element: Element) => {
  const style = getComputedStyle(element)
  return { background: style.backgroundColor, color: style.color, border: style.borderTopColor }
}
const greenTheme: MatthewThemeConfig = { components: { Button: {
  background: '#166534', backgroundHover: '#14532d', backgroundActive: '#052e16',
  color: '#ffffff', borderColor: '#166534',
} } }

describe('Button Token colors and states', () => {
  test('applies component colors across all variants without changing outside buttons', async () => {
    const screen = await render(harness(
      <>
        <ThemeProvider theme={greenTheme}>
          {(['primary', 'secondary', 'danger'] as const).map(variant =>
            <Button key={variant} variant={variant}>{variant}</Button>)}
        </ThemeProvider>
        <Button>外部</Button>
      </>,
    ))
    await screen.getByRole('button', { name: '外部' }).unhover()
    for (const name of ['primary', 'secondary', 'danger']) {
      expect(colors(screen.getByRole('button', { name, exact: true }).element())).toEqual({
        background: 'rgb(22, 101, 52)', color: 'rgb(255, 255, 255)', border: 'rgb(22, 101, 52)',
      })
    }
    expect(colors(screen.getByRole('button', { name: '外部' }).element())).toEqual({
      background: 'rgb(255, 255, 255)', color: 'rgb(15, 23, 42)', border: 'rgb(203, 213, 225)',
    })
  })

  test('keeps unspecified hover, active, text and border values from the current variant', async () => {
    const pressed: Array<{ active: boolean; background: string }> = []
    const screen = await render(harness(
      <ThemeProvider theme={{ components: { Button: { background: '#166534' } } }}>
        <Button variant="primary" onMouseDown={event => pressed.push({
          active: event.currentTarget.matches(':active'),
          background: getComputedStyle(event.currentTarget).backgroundColor,
        })}>保存</Button>
      </ThemeProvider>,
    ))
    const button = screen.getByRole('button', { name: '保存' })
    await button.unhover()
    expect(colors(button.element())).toEqual({
      background: 'rgb(22, 101, 52)', color: 'rgb(255, 255, 255)', border: 'rgb(37, 99, 235)',
    })
    await button.hover()
    expect(colors(button.element()).background).toBe('rgb(29, 78, 216)')
    await button.click()
    expect(pressed).toEqual([{ active: true, background: 'rgb(30, 64, 175)' }])
  })

  test('uses real hover and pressed colors on both Button and LinkButton', async () => {
    // 在真实 mousedown 中读取，click 完成后 :active 已结束；不伪造 DOM 事件或状态 class。
    const pressed: Array<{ active: boolean; background: string }> = []
    const capture = (event: ReactMouseEvent<HTMLElement>) => pressed.push({
      active: event.currentTarget.matches(':active'),
      background: getComputedStyle(event.currentTarget).backgroundColor,
    })
    const screen = await render(harness(
      <ThemeProvider theme={greenTheme}>
        <Button onMouseDown={capture}>保存</Button>
        <LinkButton href="#docs" onMouseDown={capture} onClick={event => event.preventDefault()}>文档</LinkButton>
      </ThemeProvider>,
    ))
    for (const locator of [
      screen.getByRole('button', { name: '保存' }),
      screen.getByRole('link', { name: '文档' }),
    ]) {
      await locator.unhover()
      expect(colors(locator.element()).background).toBe('rgb(22, 101, 52)')
      await locator.hover()
      expect(colors(locator.element()).background).toBe('rgb(20, 83, 45)')
      await locator.click()
      expect(colors(locator.element()).background).toBe('rgb(20, 83, 45)')
    }
    expect(pressed).toEqual([
      { active: true, background: 'rgb(5, 46, 22)' },
      { active: true, background: 'rgb(5, 46, 22)' },
    ])
  })

  test('keeps disabled Button and LinkButton out of interactive color effects', async () => {
    const pressed: Array<{ active: boolean; background: string; transform: string }> = []
    const screen = await render(harness(
      <ThemeProvider theme={greenTheme}>
        <Button disabled>禁用操作</Button>
        <LinkButton disabled href="#docs" onMouseDown={event => pressed.push({
          active: event.currentTarget.matches(':active'),
          background: getComputedStyle(event.currentTarget).backgroundColor,
          transform: getComputedStyle(event.currentTarget).transform,
        })}>禁用链接</LinkButton>
      </ThemeProvider>,
    ))
    const button = screen.getByRole('button', { name: '禁用操作' })
    const link = screen.getByRole('link', { name: '禁用链接' })
    for (const locator of [button, link]) {
      await locator.hover()
      expect(colors(locator.element()).background).toBe('rgb(22, 101, 52)')
      expect(getComputedStyle(locator.element()).opacity).toBe('0.55')
    }
    // aria-disabled 的链接仍可能收到鼠标事件；强制真实点击只绕过测试工具的可操作性检查。
    await link.click({ force: true })
    expect(pressed).toEqual([{ active: true, background: 'rgb(22, 101, 52)', transform: 'none' }])
  })

  test('inherits CSS overrides across a dark Provider while allowing a local exception', async () => {
    const screen = await render(harness(
      <div className="button-token-custom-region">
        <style>{`
          .button-token-custom-region { --matthew-ui-button-background: #166534; }
          .button-token-local { --matthew-ui-button-background: #14532d; }
        `}</style>
        <ThemeProvider theme={darkTheme}>
          <Button>继承</Button>
          <Button className="button-token-local">局部</Button>
        </ThemeProvider>
      </div>,
    ))
    await screen.getByRole('button', { name: '局部' }).unhover()
    expect(colors(screen.getByRole('button', { name: '继承' }).element())).toEqual({
      background: 'rgb(22, 101, 52)', color: 'rgb(248, 250, 252)', border: 'rgb(51, 65, 85)',
    })
    expect(colors(screen.getByRole('button', { name: '局部' }).element()).background).toBe('rgb(20, 83, 45)')
  })

  test('restores current variant and size defaults after removing component overrides', async () => {
    const view = (configured: boolean) => harness(
      <ThemeProvider theme={configured ? { components: { Button: {
        background: '#166534', minHeight: 64,
      } } } : {}}>
        <Button variant={configured ? 'primary' : 'danger'} size={configured ? 'sm' : 'lg'}>保存</Button>
      </ThemeProvider>,
    )
    const screen = await render(view(true))
    const button = screen.getByRole('button', { name: '保存' })
    await button.unhover()
    expect(colors(button.element()).background).toBe('rgb(22, 101, 52)')
    expect(dimensions(button.element()).minHeight).toBe('64px')
    await screen.rerender(view(false))
    expect(colors(button.element()).background).toBe('rgb(220, 38, 38)')
    expect(dimensions(button.element())).toEqual({
      minHeight: '48px', fontSize: '16px', paddingBlock: '10px', paddingInline: '20px',
    })
  })
})
describe('Button Token dimensions', () => {
  test('preserves all three default size profiles without a Provider', async () => {
    const screen = await render(harness(sample()))
    expect(sizes.map(size => dimensions(screen.getByRole('button', { name: size, exact: true }).element()))).toEqual([
      { minHeight: '32px', fontSize: '13px', paddingBlock: '6px', paddingInline: '12px' },
      { minHeight: '40px', fontSize: '14px', paddingBlock: '8px', paddingInline: '16px' },
      { minHeight: '48px', fontSize: '16px', paddingBlock: '10px', paddingInline: '20px' },
    ])
  })

  test('uses changed global height and font Seed families but preserves size padding', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={{ seed: { controlHeight: 48, fontSize: 18 } }}>{sample()}</ThemeProvider>,
    ))
    expect(sizes.map(size => dimensions(screen.getByRole('button', { name: size, exact: true }).element()))).toEqual([
      { minHeight: '40px', fontSize: '17px', paddingBlock: '6px', paddingInline: '12px' },
      { minHeight: '48px', fontSize: '18px', paddingBlock: '8px', paddingInline: '16px' },
      { minHeight: '56px', fontSize: '20px', paddingBlock: '10px', paddingInline: '20px' },
    ])
  })

  test('reflects a dynamic final semantic Token override in the same Button', async () => {
    const view = (theme: MatthewThemeConfig) => harness(
      <ThemeProvider theme={theme}><Button>保存</Button></ThemeProvider>,
    )
    const screen = await render(view({}))
    const button = screen.getByRole('button', { name: '保存' }).element()
    await screen.rerender(view({ tokens: { controlHeightMd: '3.25rem', fontSizeMd: '1.125rem' } }))
    expect(dimensions(button)).toEqual({
      minHeight: '52px', fontSize: '18px', paddingBlock: '8px', paddingInline: '16px',
    })
    await screen.rerender(view({}))
    expect(dimensions(button).minHeight).toBe('40px')
  })

  test('uses all five component dimensions for Button and LinkButton', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={{ components: { Button: {
        borderRadius: 24, minHeight: 64, fontSize: 20, paddingBlock: 0, paddingInline: 28,
      } } }}>
        <Button size="sm">保存</Button>
        <LinkButton href="#docs" size="lg">文档</LinkButton>
      </ThemeProvider>,
    ))
    for (const element of [
      screen.getByRole('button', { name: '保存' }).element(),
      screen.getByRole('link', { name: '文档' }).element(),
    ]) {
      expect(dimensions(element)).toEqual({
        minHeight: '64px', fontSize: '20px', paddingBlock: '0px', paddingInline: '28px',
      })
      expect(getComputedStyle(element).borderRadius).toBe('24px')
    }
  })

  test('overrides minimum height across sizes without changing font or padding', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={{ components: { Button: { minHeight: 64 } } }}>{sample()}</ThemeProvider>,
    ))
    expect(sizes.map(size => dimensions(screen.getByRole('button', { name: size, exact: true }).element()))).toEqual([
      { minHeight: '64px', fontSize: '13px', paddingBlock: '6px', paddingInline: '12px' },
      { minHeight: '64px', fontSize: '14px', paddingBlock: '8px', paddingInline: '16px' },
      { minHeight: '64px', fontSize: '16px', paddingBlock: '10px', paddingInline: '20px' },
    ])
  })

  test('allows content to grow beyond the configured minimum height', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={{ components: { Button: { minHeight: 16, fontSize: 32, paddingBlock: 8 } } }}>
        <Button>大字按钮</Button>
      </ThemeProvider>,
    ))
    const button = screen.getByRole('button', { name: '大字按钮' }).element()
    expect(getComputedStyle(button).minHeight).toBe('16px')
    expect(button.getBoundingClientRect().height).toBeGreaterThan(16)
  })

  test('supports ancestor CSS dimensions and a local Button override', async () => {
    const screen = await render(harness(
      <div style={{ '--matthew-ui-button-radius': '50%' } as CSSProperties}>
        <Button>继承</Button>
        <Button style={{ '--matthew-ui-button-radius': '12px' } as CSSProperties}>局部</Button>
      </div>,
    ))
    expect(getComputedStyle(screen.getByRole('button', { name: '继承' }).element()).borderRadius).toBe('50%')
    expect(getComputedStyle(screen.getByRole('button', { name: '局部' }).element()).borderRadius).toBe('12px')
  })
})
