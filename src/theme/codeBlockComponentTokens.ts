import { componentTokensToCssVars } from './componentTokenUtils'
import type { ComponentTokenFieldMap } from './componentTokenUtils'
import type { CssVariableMap } from './tokens'

/** 仅通过 MatthewThemeConfig.components.CodeBlock 配置，不作包级导出。 */
export interface CodeBlockComponentTokens {
  background?: string
  color?: string
  borderColor?: string
  headerBackground?: string
  headerColor?: string
  borderRadius?: number
  paddingBlock?: number
  paddingInline?: number
}
const CODE_BLOCK_FIELDS = {
  background: { suffix: 'background', kind: 'string' },
  color: { suffix: 'color', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  headerBackground: { suffix: 'header-background', kind: 'string' },
  headerColor: { suffix: 'header-color', kind: 'string' },
  borderRadius: { suffix: 'radius', kind: 'nonnegative' },
  paddingBlock: { suffix: 'padding-block', kind: 'nonnegative' },
  paddingInline: { suffix: 'padding-inline', kind: 'nonnegative' },
} as const satisfies ComponentTokenFieldMap<CodeBlockComponentTokens>

export function codeBlockTokensToCssVars(config: CodeBlockComponentTokens = {}): CssVariableMap {
  return componentTokensToCssVars({ componentName: 'CodeBlock', cssPrefix: 'code-block', fields: CODE_BLOCK_FIELDS, config })
}
