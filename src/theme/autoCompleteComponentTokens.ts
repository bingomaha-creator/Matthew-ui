import { componentTokensToCssVars } from './componentTokenUtils'
import type { ComponentTokenFieldMap } from './componentTokenUtils'
import type { CssVariableMap } from './tokens'

/** 通过MatthewThemeConfig.components.AutoComplete使用；不新增包级独立导出。 */
export interface AutoCompleteComponentTokens {
  /** 整体字号；fontSizeMd。 */
  fontSize?: number
  /** 普通输入背景；colorSurface，禁用/只读不使用此覆盖。 */
  inputBackground?: string
  /** 输入文字；colorText。 */
  inputColor?: string
  /** 输入框与浮层普通边框；colorBorder。 */
  borderColor?: string
  /** 可编辑输入框hover边框；colorPrimary。 */
  inputHoverBorderColor?: string
  /** 输入框最小高度；controlHeightMd。 */
  inputMinHeight?: number
  /** 输入框圆角；radiusMd。 */
  inputBorderRadius?: number
  /** 输入框上下padding；0.5rem。 */
  inputPaddingBlock?: number
  /** 输入框左右padding；0.75rem。 */
  inputPaddingInline?: number
  /** 普通建议文字；colorText。 */
  optionColor?: string
  /** hover/当前候选背景；colorSurfaceActive。 */
  optionActiveBackground?: string
  /** hover/当前候选文字；colorPrimaryActive。 */
  optionActiveColor?: string
  /** 建议项与加载行圆角；max(0px, radiusMd - 0.125rem)。 */
  optionBorderRadius?: number
  /** 建议项与加载行上下padding；0.625rem。 */
  optionPaddingBlock?: number
  /** 建议项与加载行左右padding；0.75rem。 */
  optionPaddingInline?: number
  /** 浮层背景；colorSurface。 */
  popupBackground?: string
  /** 浮层阴影；shadowOverlay。 */
  popupShadow?: string
}

// 这里只维护白名单映射与校验，不存储组件默认样式。
// input/option的BorderRadius分别映射为input-radius/option-radius。
const AUTO_COMPLETE_FIELDS = {
  fontSize: { suffix: 'font-size', kind: 'positive' },
  inputBackground: { suffix: 'input-background', kind: 'string' },
  inputColor: { suffix: 'input-color', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  inputHoverBorderColor: { suffix: 'input-hover-border-color', kind: 'string' },
  inputMinHeight: { suffix: 'input-min-height', kind: 'positive' },
  inputBorderRadius: { suffix: 'input-radius', kind: 'nonnegative' },
  inputPaddingBlock: { suffix: 'input-padding-block', kind: 'nonnegative' },
  inputPaddingInline: { suffix: 'input-padding-inline', kind: 'nonnegative' },
  optionColor: { suffix: 'option-color', kind: 'string' },
  optionActiveBackground: { suffix: 'option-active-background', kind: 'string' },
  optionActiveColor: { suffix: 'option-active-color', kind: 'string' },
  optionBorderRadius: { suffix: 'option-radius', kind: 'nonnegative' },
  optionPaddingBlock: { suffix: 'option-padding-block', kind: 'nonnegative' },
  optionPaddingInline: { suffix: 'option-padding-inline', kind: 'nonnegative' },
  popupBackground: { suffix: 'popup-background', kind: 'string' },
  popupShadow: { suffix: 'popup-shadow', kind: 'string' },
} as const satisfies ComponentTokenFieldMap<AutoCompleteComponentTokens>

/** 内部Adapter：只生成显式变量；6B才由SCSS决定各状态的消费与默认回退。 */
export function autoCompleteTokensToCssVars(config: AutoCompleteComponentTokens = {}): CssVariableMap {
  return componentTokensToCssVars({
    componentName: 'AutoComplete',
    cssPrefix: 'auto-complete',
    fields: AUTO_COMPLETE_FIELDS,
    config,
  })
}
