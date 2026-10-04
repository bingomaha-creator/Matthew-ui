import { componentTokensToCssVars } from './componentTokenUtils'
import type { ComponentTokenFieldMap } from './componentTokenUtils'
import type { CssVariableMap } from './tokens'

/** 通过 MatthewThemeConfig.components.Select 使用，不单独包级导出。 */
export interface SelectComponentTokens {
  fontSize?: number
  triggerBackground?: string
  triggerColor?: string
  placeholderColor?: string
  borderColor?: string
  triggerHoverBorderColor?: string
  triggerMinHeight?: number
  borderRadius?: number
  triggerPaddingBlock?: number
  triggerPaddingInline?: number
  optionColor?: string
  optionActiveBackground?: string
  optionSelectedColor?: string
  optionMinHeight?: number
  popupBackground?: string
  popupShadow?: string
}

const SELECT_FIELDS = {
  fontSize: { suffix: 'font-size', kind: 'positive' },
  triggerBackground: { suffix: 'trigger-background', kind: 'string' },
  triggerColor: { suffix: 'trigger-color', kind: 'string' },
  placeholderColor: { suffix: 'placeholder-color', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  triggerHoverBorderColor: { suffix: 'trigger-hover-border-color', kind: 'string' },
  triggerMinHeight: { suffix: 'trigger-min-height', kind: 'positive' },
  borderRadius: { suffix: 'radius', kind: 'nonnegative' },
  triggerPaddingBlock: { suffix: 'trigger-padding-block', kind: 'nonnegative' },
  triggerPaddingInline: { suffix: 'trigger-padding-inline', kind: 'nonnegative' },
  optionColor: { suffix: 'option-color', kind: 'string' },
  optionActiveBackground: { suffix: 'option-active-background', kind: 'string' },
  optionSelectedColor: { suffix: 'option-selected-color', kind: 'string' },
  optionMinHeight: { suffix: 'option-min-height', kind: 'positive' },
  popupBackground: { suffix: 'popup-background', kind: 'string' },
  popupShadow: { suffix: 'popup-shadow', kind: 'string' },
} as const satisfies ComponentTokenFieldMap<SelectComponentTokens>

export function selectTokensToCssVars(config: SelectComponentTokens = {}): CssVariableMap {
  return componentTokensToCssVars({ componentName: 'Select', cssPrefix: 'select', fields: SELECT_FIELDS, config })
}
