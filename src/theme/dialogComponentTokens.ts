import { componentTokensToCssVars } from './componentTokenUtils'
import type { ComponentTokenFieldMap } from './componentTokenUtils'
import type { CssVariableMap } from './tokens'

/** 通过 MatthewThemeConfig.components.Dialog 使用，不单独包级导出。 */
export interface DialogComponentTokens {
  background?: string
  color?: string
  borderColor?: string
  backdropBackground?: string
  titleColor?: string
  closeColor?: string
  closeHoverBackground?: string
  shadow?: string
  borderRadius?: number
  titleFontSize?: number
  contentPaddingBlock?: number
  contentPaddingInline?: number
}

const DIALOG_FIELDS = {
  background: { suffix: 'background', kind: 'string' },
  color: { suffix: 'color', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  backdropBackground: { suffix: 'backdrop-background', kind: 'string' },
  titleColor: { suffix: 'title-color', kind: 'string' },
  closeColor: { suffix: 'close-color', kind: 'string' },
  closeHoverBackground: { suffix: 'close-hover-background', kind: 'string' },
  shadow: { suffix: 'shadow', kind: 'string' },
  borderRadius: { suffix: 'radius', kind: 'nonnegative' },
  titleFontSize: { suffix: 'title-font-size', kind: 'positive' },
  contentPaddingBlock: { suffix: 'content-padding-block', kind: 'nonnegative' },
  contentPaddingInline: { suffix: 'content-padding-inline', kind: 'nonnegative' },
} as const satisfies ComponentTokenFieldMap<DialogComponentTokens>

export function dialogTokensToCssVars(config: DialogComponentTokens = {}): CssVariableMap {
  return componentTokensToCssVars({ componentName: 'Dialog', cssPrefix: 'dialog', fields: DIALOG_FIELDS, config })
}
