import { componentTokensToCssVars } from './componentTokenUtils'
import type { ComponentTokenFieldMap } from './componentTokenUtils'
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
  background: { suffix: 'background', kind: 'string' },
  backgroundHover: { suffix: 'background-hover', kind: 'string' },
  backgroundActive: { suffix: 'background-active', kind: 'string' },
  color: { suffix: 'color', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  borderRadius: { suffix: 'radius', kind: 'nonnegative' },
  minHeight: { suffix: 'min-height', kind: 'positive' },
  fontSize: { suffix: 'font-size', kind: 'positive' },
  paddingBlock: { suffix: 'padding-block', kind: 'nonnegative' },
  paddingInline: { suffix: 'padding-inline', kind: 'nonnegative' },
} as const satisfies ComponentTokenFieldMap<ButtonComponentTokens>

/** 内部 Adapter：只转换明确配置的已知字段；不计算任何默认值或交互色。 */
export function buttonTokensToCssVars(config: ButtonComponentTokens = {}): CssVariableMap {
  return componentTokensToCssVars({
    componentName: 'Button',
    cssPrefix: 'button',
    fields: BUTTON_FIELDS,
    config,
  })
}
