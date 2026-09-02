import { describe, expect, test } from 'vitest'
import { createTokens, tokensToCssVars } from './tokens'
import type { MatthewSeedToken, MatthewThemeConfig } from './tokens'

describe('createTokens', () => {
  test('returns the complete default light token set', () => {
    // 完整对象断言会同时发现默认值改变、多键、少键和字段拼写错误。
    expect(createTokens()).toEqual({
      colorPrimary: '#2563eb',
      colorPrimaryHover: '#1d4ed8',
      colorPrimaryActive: '#1e40af',
      colorDanger: '#dc2626',
      colorDangerHover: '#b91c1c',
      colorDangerActive: '#991b1b',
      colorSurface: '#ffffff',
      colorSurfaceHover: '#f1f5f9',
      colorSurfaceActive: '#e2e8f0',
      colorText: '#0f172a',
      colorTextMuted: '#64748b',
      colorTextInverse: '#ffffff',
      colorBorder: '#cbd5e1',
      colorFocus: 'rgb(37 99 235 / 35%)',
      shadowOverlay: '0 0.75rem 1.5rem rgb(15 23 42 / 12%)',
      radiusMd: '0.5rem',
      controlHeightSm: '2rem',
      controlHeightMd: '2.5rem',
      controlHeightLg: '3rem',
      fontSizeSm: '0.8125rem',
      fontSizeMd: '0.875rem',
      fontSizeLg: '1rem',
      durationFast: '150ms',
    })
  })

  test('returns isolated results containing only known token keys', () => {
    const first = createTokens()
    const second = createTokens()
    const configWithUnknownToken = {
      tokens: {
        unknownToken: 'unexpected',
      },
      // 模拟 JavaScript/any 绕过 TypeScript 后传入未知字段的运行时场景。
    } as unknown as MatthewThemeConfig

    // 修改一次调用的结果，不得污染后续调用或内部默认对象。
    first.colorPrimary = '#000000'

    expect(second.colorPrimary).toBe('#2563eb')
    expect(createTokens(configWithUnknownToken)).not.toHaveProperty('unknownToken')
    expect(Object.keys(second)).toHaveLength(23)
  })

  test('normalizes and derives a custom primary color family', () => {
    const tokens = createTokens({
      seed: { colorPrimary: '#00B96B' },
    })

    expect(tokens).toMatchObject({
      colorPrimary: '#00b96b',
      colorPrimaryHover: '#00a760',
      colorPrimaryActive: '#009858',
      colorFocus: 'rgb(0 185 107 / 35%)',
    })
  })

  test.each([
    '#fff',
    '#2563eb80',
    'red',
    'rgb(37 99 235)',
    'hsl(221 83% 53%)',
    'oklch(60% 0.2 150)',
    'var(--brand-color)',
    'invalid',
  ])('rejects unsupported seed color %s for both color families', (value) => {
    // 同一批非法格式必须同时约束 Primary 和 Danger，避免两个入口规则漂移。
    for (const field of ['colorPrimary', 'colorDanger'] as const) {
      const call = () =>
        createTokens({
          seed: { [field]: value } as Partial<MatthewSeedToken>,
        })

      expect(call).toThrow(TypeError)
      expect(call).toThrow(new RegExp(`${field}.*six-digit hex`))
    }
  })

  test.each([null, 42])('rejects non-string seed color %s', (value) => {
    // 类型断言故意模拟编译期保护被绕过，验证 createTokens 的运行时防线。
    const call = () =>
      createTokens({
        seed: { colorPrimary: value },
      } as unknown as MatthewThemeConfig)

    expect(call).toThrow(TypeError)
    expect(call).toThrow(/colorPrimary.*six-digit hex/)
  })

  test('calibrates and derives the two color families independently', () => {
    const defaultPrimary = createTokens({
      seed: { colorPrimary: '#2563EB' },
    })
    const customDanger = createTokens({
      seed: { colorDanger: '#FF0000' },
    })
    const bothCustom = createTokens({
      seed: {
        colorPrimary: '#00b96b',
        colorDanger: '#ff0000',
      },
    })

    // 显式传入大小写不同的默认值，仍应命中旧视觉校准值。
    expect(defaultPrimary).toMatchObject({
      colorPrimary: '#2563eb',
      colorPrimaryHover: '#1d4ed8',
      colorPrimaryActive: '#1e40af',
      colorFocus: 'rgb(37 99 235 / 35%)',
    })
    expect(customDanger).toMatchObject({
      colorDanger: '#ff0000',
      colorDangerHover: '#e60000',
      colorDangerActive: '#d10000',
      colorPrimary: '#2563eb',
      colorPrimaryHover: '#1d4ed8',
      colorPrimaryActive: '#1e40af',
      colorFocus: 'rgb(37 99 235 / 35%)',
    })
    // 两个家族分别派生，修改一方不能让另一方意外脱离自己的规则。
    expect(bothCustom).toMatchObject({
      colorPrimaryHover: '#00a760',
      colorPrimaryActive: '#009858',
      colorDangerHover: '#e60000',
      colorDangerActive: '#d10000',
    })
  })

  test('derives radius, control heights, font sizes, and duration from numeric seeds', () => {
    const tokens = createTokens({
      seed: {
        borderRadius: 4,
        controlHeight: 36,
        fontSize: 16,
        durationFast: 200,
      },
    })

    expect(tokens).toMatchObject({
      radiusMd: '0.25rem',
      controlHeightSm: '1.75rem',
      controlHeightMd: '2.25rem',
      controlHeightLg: '2.75rem',
      fontSizeSm: '0.9375rem',
      fontSizeMd: '1rem',
      fontSizeLg: '1.125rem',
      durationFast: '200ms',
    })
  })

  test.each([
    ['controlHeight', '40'],
    ['fontSize', null],
  ])('rejects non-number %s values with TypeError', (field, value) => {
    const call = () =>
      createTokens({
        seed: { [field]: value },
      } as unknown as MatthewThemeConfig)

    expect(call).toThrow(TypeError)
    expect(call).toThrow(new RegExp(field))
  })

  test.each([
    ['borderRadius', -1, 'greater than or equal to 0'],
    ['borderRadius', Number.NaN, 'greater than or equal to 0'],
    ['controlHeight', 8, 'greater than 8'],
    ['fontSize', 1, 'greater than 1'],
    ['durationFast', -1, 'greater than or equal to 0'],
    ['durationFast', Number.POSITIVE_INFINITY, 'greater than or equal to 0'],
  ])('rejects out-of-range %s values with RangeError', (field, value, range) => {
    const call = () =>
      createTokens({
        seed: { [field]: value },
      } as unknown as MatthewThemeConfig)

    expect(call).toThrow(RangeError)
    expect(call).toThrow(new RegExp(`${field}.*${range}`))
  })

  test('formats rem values without redundant precision or negative zero', () => {
    expect(createTokens({ seed: { borderRadius: 0 } }).radiusMd).toBe('0rem')
    expect(createTokens({ seed: { borderRadius: 5.33333 } }).radiusMd).toBe(
      '0.333333rem',
    )
  })

  test('applies exact token overrides last without mutating the config', () => {
    const config: MatthewThemeConfig = {
      seed: { colorPrimary: '#00b96b' },
      tokens: { colorPrimaryHover: 'oklch(60% 0.2 150)' },
    }
    // 快照来自调用前，用来证明 createTokens 没有就地修改 seed/tokens。
    const originalConfig = structuredClone(config)

    const tokens = createTokens(config)

    expect(tokens.colorPrimary).toBe('#00b96b')
    expect(tokens.colorPrimaryHover).toBe('oklch(60% 0.2 150)')
    expect(tokens.colorPrimaryActive).toBe('#009858')
    expect(tokens.colorFocus).toBe('rgb(0 185 107 / 35%)')
    expect(config).toEqual(originalConfig)
  })
})

describe('tokensToCssVars', () => {
  test('maps every token to its CSS variable without mutating the tokens', () => {
    const tokens = createTokens()
    const originalTokens = structuredClone(tokens)

    // 使用完整23项字面量，而不是复用实现逻辑计算期望值，避免同错同对。
    expect(tokensToCssVars(tokens)).toEqual({
      '--matthew-ui-color-primary': '#2563eb',
      '--matthew-ui-color-primary-hover': '#1d4ed8',
      '--matthew-ui-color-primary-active': '#1e40af',
      '--matthew-ui-color-danger': '#dc2626',
      '--matthew-ui-color-danger-hover': '#b91c1c',
      '--matthew-ui-color-danger-active': '#991b1b',
      '--matthew-ui-color-surface': '#ffffff',
      '--matthew-ui-color-surface-hover': '#f1f5f9',
      '--matthew-ui-color-surface-active': '#e2e8f0',
      '--matthew-ui-color-text': '#0f172a',
      '--matthew-ui-color-text-muted': '#64748b',
      '--matthew-ui-color-text-inverse': '#ffffff',
      '--matthew-ui-color-border': '#cbd5e1',
      '--matthew-ui-color-focus': 'rgb(37 99 235 / 35%)',
      '--matthew-ui-shadow-overlay':
        '0 0.75rem 1.5rem rgb(15 23 42 / 12%)',
      '--matthew-ui-radius-md': '0.5rem',
      '--matthew-ui-control-height-sm': '2rem',
      '--matthew-ui-control-height-md': '2.5rem',
      '--matthew-ui-control-height-lg': '3rem',
      '--matthew-ui-font-size-sm': '0.8125rem',
      '--matthew-ui-font-size-md': '0.875rem',
      '--matthew-ui-font-size-lg': '1rem',
      '--matthew-ui-duration-fast': '150ms',
    })
    expect(tokens).toEqual(originalTokens)
  })
})
