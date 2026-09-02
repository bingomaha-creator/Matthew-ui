import { toRem } from './tokens'
import type { CssVariableMap } from './tokens'

/** 通过 MatthewThemeConfig.components.Button 使用；不单独增加包级类型导出。 */
export interface ButtonComponentTokens {
  background?: string
  backgroundHover?: string
  backgroundActive?: string
  color?: string
  borderColor?: string
  /** 数字设计单位（px），输出 rem；允许0。 */
  borderRadius?: number
  /** 最小高度而非固定高度，必须大于0。 */
  minHeight?: number
  fontSize?: number
  paddingBlock?: number
  paddingInline?: number
}

// 只有字段映射和输入规则，没有第二份组件默认值表。
// 名字并非一律 kebab-case：borderRadius 对应公开的 button-radius。
const BUTTON_FIELDS = {
  background: { suffix: 'background', kind: 'color' },
  backgroundHover: { suffix: 'background-hover', kind: 'color' },
  backgroundActive: { suffix: 'background-active', kind: 'color' },
  color: { suffix: 'color', kind: 'color' },
  borderColor: { suffix: 'border-color', kind: 'color' },
  borderRadius: { suffix: 'radius', kind: 'nonnegative' },
  minHeight: { suffix: 'min-height', kind: 'positive' },
  fontSize: { suffix: 'font-size', kind: 'positive' },
  paddingBlock: { suffix: 'padding-block', kind: 'nonnegative' },
  paddingInline: { suffix: 'padding-inline', kind: 'nonnegative' },
} as const satisfies Record<keyof ButtonComponentTokens, {
  suffix: string
  kind: 'color' | 'nonnegative' | 'positive'
}>

/** 内部 Adapter：只转换明确配置的已知字段；不计算任何默认值或交互色。 */
export function buttonTokensToCssVars(config: ButtonComponentTokens = {}): CssVariableMap {
  const variables: CssVariableMap = {}
  for (const key of Object.keys(BUTTON_FIELDS) as Array<keyof ButtonComponentTokens>) {
    const value: unknown = config[key]
    if (value === undefined) continue
    const { suffix, kind } = BUTTON_FIELDS[key]
    const name = 'components.Button.' + key
    const cssName = `--matthew-ui-button-${suffix}` as const
    if (kind === 'color') {
      if (typeof value !== 'string') throw new TypeError(name + ' must be a CSS string')
      variables[cssName] = value
    } else {
      if (typeof value !== 'number') throw new TypeError(name + ' must be a number')
      const validRange = kind === 'positive' ? value > 0 : value >= 0
      if (!Number.isFinite(value) || !validRange) {
        throw new RangeError(name + (kind === 'positive'
          ? ' must be finite and greater than 0'
          : ' must be finite and greater than or equal to 0'))
      }
      // 与全局 Seed 共用格式化规则，不重复维护单位/精度约定。
      variables[cssName] = toRem(value)
    }
  }
  return variables
}
