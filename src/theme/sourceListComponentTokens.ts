import { componentTokensToCssVars } from './componentTokenUtils'
import type { ComponentTokenFieldMap } from './componentTokenUtils'
import type { CssVariableMap } from './tokens'

/** 仅通过 MatthewThemeConfig.components.SourceList 配置，不作包级导出。 */
export interface SourceListComponentTokens {
  background?: string
  borderColor?: string
  headerColor?: string
  headerHoverBackground?: string
  itemTitleColor?: string
  summaryColor?: string
  sourceColor?: string
  linkColor?: string
  borderRadius?: number
  headerMinHeight?: number
  itemPaddingBlock?: number
  itemPaddingInline?: number
}

const SOURCE_LIST_FIELDS = {
  background: { suffix: 'background', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  headerColor: { suffix: 'header-color', kind: 'string' },
  headerHoverBackground: { suffix: 'header-hover-background', kind: 'string' },
  itemTitleColor: { suffix: 'item-title-color', kind: 'string' },
  summaryColor: { suffix: 'summary-color', kind: 'string' },
  sourceColor: { suffix: 'source-color', kind: 'string' },
  linkColor: { suffix: 'link-color', kind: 'string' },
  borderRadius: { suffix: 'radius', kind: 'nonnegative' },
  headerMinHeight: { suffix: 'header-min-height', kind: 'positive' },
  itemPaddingBlock: { suffix: 'item-padding-block', kind: 'nonnegative' },
  itemPaddingInline: { suffix: 'item-padding-inline', kind: 'nonnegative' },
} as const satisfies ComponentTokenFieldMap<SourceListComponentTokens>

export function sourceListTokensToCssVars(config: SourceListComponentTokens = {}): CssVariableMap {
  return componentTokensToCssVars({ componentName: 'SourceList', cssPrefix: 'source-list', fields: SOURCE_LIST_FIELDS, config })
}
