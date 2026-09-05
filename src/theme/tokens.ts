import type { ButtonComponentTokens } from './componentTokens'
import type { MenuComponentTokens } from './menuComponentTokens'
import type { AutoCompleteComponentTokens } from './autoCompleteComponentTokens'
import type { ThinkingComponentTokens } from './thinkingComponentTokens'
import type { ToolCallComponentTokens } from './toolCallComponentTokens'

/**
 * 模板字符串类型只能在编译期约束“以 # 开头”；六位 hex 的真实性仍需运行时校验。
 */
export type HexColor = `#${string}`

/** 使用者提供的少量设计输入；一个 Seed 可以派生出一组相关的语义 Token。 */
export interface MatthewSeedToken {
  colorPrimary: HexColor
  colorDanger: HexColor
  borderRadius: number
  controlHeight: number
  fontSize: number
  durationFast: number
}

/** 组件最终消费的完整语义值，已经带有可直接写入 CSS 的单位或颜色格式。 */
export interface MatthewThemeTokens {
  colorPrimary: string
  colorPrimaryHover: string
  colorPrimaryActive: string
  colorDanger: string
  colorDangerHover: string
  colorDangerActive: string
  colorSurface: string
  colorSurfaceHover: string
  colorSurfaceActive: string
  colorText: string
  colorTextMuted: string
  colorTextInverse: string
  colorBorder: string
  colorFocus: string
  shadowOverlay: string
  radiusMd: string
  controlHeightSm: string
  controlHeightMd: string
  controlHeightLg: string
  fontSizeSm: string
  fontSizeMd: string
  fontSizeLg: string
  durationFast: string
}

export interface MatthewThemeConfig {
  /** 组件级精确覆盖，由 ThemeProvider 转成局部变量，不参与全局 Seed 派生。 */
  components?: {
    Button?: ButtonComponentTokens
    Menu?: MenuComponentTokens
    AutoComplete?: AutoCompleteComponentTokens
    Thinking?: ThinkingComponentTokens
    ToolCall?: ToolCallComponentTokens
  }
  /** 参与颜色、尺寸等家族派生。 */
  seed?: Partial<MatthewSeedToken>
  /** 在所有派生完成后精确覆盖单个 Token，不会反向触发其他字段重新计算。 */
  tokens?: Partial<MatthewThemeTokens>
}

export type CssVariableName = `--matthew-ui-${string}`
export type CssVariableMap = Record<CssVariableName, string>

/**
 * 默认结果既是亮色预设，也是兼容 0.1.0 现有视觉的校准基线。
 * createTokens 每次都会基于它创建新对象，调用者不会拿到这个内部对象本身。
 */
const DEFAULT_TOKENS: MatthewThemeTokens = {
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
}
// 只遍历已知键：既保证序列化完整，也防止运行时绕过类型混入未知 Token。
const TOKEN_KEYS = Object.keys(DEFAULT_TOKENS) as Array<keyof MatthewThemeTokens>

// 数值 Seed 使用设计单位，派生完成后才转换为 rem/ms 字符串。
const DEFAULT_PRIMARY = '#2563eb'
const DEFAULT_DANGER = '#dc2626'
const DEFAULT_BORDER_RADIUS = 8
const DEFAULT_CONTROL_HEIGHT = 40
const DEFAULT_FONT_SIZE = 14
const DEFAULT_DURATION_FAST = 150
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/
const REM_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
  useGrouping: false,
})

function normalizeSeedColor(name: string, value: unknown): HexColor {
  // JavaScript、JSON 或 any 都可能绕过 HexColor，因此不能只依赖 TypeScript。
  if (typeof value !== 'string' || !HEX_COLOR_PATTERN.test(value)) {
    throw new TypeError(`${name} must be a six-digit hex color`)
  }

  return value.toLowerCase() as HexColor
}

function parseHexColor(color: HexColor): [number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ]
}

function toHexChannel(channel: number): string {
  return channel.toString(16).padStart(2, '0')
}

function darken(color: HexColor, amount: number): HexColor {
  // 第一版使用确定的 sRGB 通道缩放：hover 降低 10%，active 降低 18%。
  const channels = parseHexColor(color).map((channel) =>
    Math.round(channel * (1 - amount)),
  )

  return `#${channels.map(toHexChannel).join('')}` as HexColor
}

function alphaOf(color: HexColor, alpha: number): string {
  const [red, green, blue] = parseHexColor(color)

  return `rgb(${red} ${green} ${blue} / ${alpha * 100}%)`
}

// 仅供主题内部 Module 复用，不从包根/theme 入口导出。
export function toRem(value: number): string {
  const remValue = value / 16
  // 把四舍五入后接近 0 的结果归一化，避免公开 CSS 中出现 -0rem。
  const normalizedValue = Math.abs(remValue) < 0.0000005 ? 0 : remValue

  return `${REM_FORMATTER.format(normalizedValue)}rem`
}

function assertValidNumber(
  name: string,
  value: unknown,
  isInRange: (candidate: number) => boolean,
  range: string,
): asserts value is number {
  // TypeError 表示“不是数字”，RangeError 表示“是数字，但不可用于该 Seed”。
  if (typeof value !== 'number') {
    throw new TypeError(`${name} must be a number`)
  }

  if (!Number.isFinite(value) || !isInRange(value)) {
    throw new RangeError(`${name} must be ${range}`)
  }
}

export function createTokens(
  config: MatthewThemeConfig = {},
): MatthewThemeTokens {
  // 只有 undefined 表示未配置；null 等运行时错误值必须进入校验并报错。
  const colorPrimary = normalizeSeedColor(
    'colorPrimary',
    config.seed?.colorPrimary === undefined
      ? DEFAULT_PRIMARY
      : config.seed.colorPrimary,
  )
  const colorDanger = normalizeSeedColor(
    'colorDanger',
    config.seed?.colorDanger === undefined
      ? DEFAULT_DANGER
      : config.seed.colorDanger,
  )
  // 比较的是标准化后的最终值，而不是调用者是否显式传入该字段。
  const primaryIsDefault = colorPrimary === DEFAULT_PRIMARY
  const dangerIsDefault = colorDanger === DEFAULT_DANGER
  const borderRadius: unknown =
    config.seed?.borderRadius === undefined
      ? DEFAULT_BORDER_RADIUS
      : config.seed.borderRadius
  const controlHeight: unknown =
    config.seed?.controlHeight === undefined
      ? DEFAULT_CONTROL_HEIGHT
      : config.seed.controlHeight
  const fontSize: unknown =
    config.seed?.fontSize === undefined
      ? DEFAULT_FONT_SIZE
      : config.seed.fontSize
  const durationFast: unknown =
    config.seed?.durationFast === undefined
      ? DEFAULT_DURATION_FAST
      : config.seed.durationFast

  assertValidNumber(
    'borderRadius',
    borderRadius,
    (value) => value >= 0,
    'greater than or equal to 0',
  )
  assertValidNumber(
    'controlHeight',
    controlHeight,
    (value) => value > 8,
    'greater than 8',
  )
  assertValidNumber(
    'fontSize',
    fontSize,
    (value) => value > 1,
    'greater than 1',
  )
  assertValidNumber(
    'durationFast',
    durationFast,
    (value) => value >= 0,
    'greater than or equal to 0',
  )

  // 先铺满23个默认字段，再重算真正受 Seed 影响的颜色和数值家族。
  const tokens: MatthewThemeTokens = {
    ...DEFAULT_TOKENS,
    colorPrimary,
    colorPrimaryHover: primaryIsDefault
      ? DEFAULT_TOKENS.colorPrimaryHover
      : darken(colorPrimary, 0.1),
    colorPrimaryActive: primaryIsDefault
      ? DEFAULT_TOKENS.colorPrimaryActive
      : darken(colorPrimary, 0.18),
    colorFocus: primaryIsDefault
      ? DEFAULT_TOKENS.colorFocus
      : alphaOf(colorPrimary, 0.35),
    colorDanger,
    colorDangerHover: dangerIsDefault
      ? DEFAULT_TOKENS.colorDangerHover
      : darken(colorDanger, 0.1),
    colorDangerActive: dangerIsDefault
      ? DEFAULT_TOKENS.colorDangerActive
      : darken(colorDanger, 0.18),
    radiusMd: toRem(borderRadius),
    controlHeightSm: toRem(controlHeight - 8),
    controlHeightMd: toRem(controlHeight),
    controlHeightLg: toRem(controlHeight + 8),
    fontSizeSm: toRem(fontSize - 1),
    fontSizeMd: toRem(fontSize),
    fontSizeLg: toRem(fontSize + 2),
    durationFast: `${durationFast}ms`,
  }

  // 最终覆盖拥有最高优先级；只替换指定字段，不反向重算同家族其他 Token。
  for (const key of TOKEN_KEYS) {
    const override = config.tokens?.[key]

    if (override !== undefined) {
      tokens[key] = override
    }
  }

  return tokens
}

export function tokensToCssVars(
  tokens: MatthewThemeTokens,
): CssVariableMap {
  const cssVariables = {} as CssVariableMap

  // 例如 controlHeightMd → --matthew-ui-control-height-md。
  for (const key of TOKEN_KEYS) {
    const cssName = `--matthew-ui-${key.replace(
      /[A-Z]/g,
      (letter) => `-${letter.toLowerCase()}`,
    )}` as CssVariableName

    cssVariables[cssName] = tokens[key]
  }

  return cssVariables
}
