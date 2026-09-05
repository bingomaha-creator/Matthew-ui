import { toRem } from './tokens'
import type { CssVariableMap } from './tokens'

/**
 * 组件 Token 通用转换的内部 seam：Button/Menu/AutoComplete/Thinking 各自保留
 * 公开类型、字段表与窄 Adapter，遍历、校验、rem 转换和变量组装集中在这里。
 * 本模块不存储组件默认值、不知道颜色的业务含义，也不导出到 npm 包入口。
 */
export type ComponentTokenFieldKind = 'string' | 'positive' | 'nonnegative'

export type ComponentTokenFieldMap<Config> = {
  [Key in keyof Config]-?: {
    suffix: string
    kind: ComponentTokenFieldKind
  }
}

interface ComponentTokenConversion<Config> {
  /** 组装错误消息里的 components.<name>.<field> 前缀，保持既有错误文本不变。 */
  componentName: string
  /** 组装公开 CSS Variable：--matthew-ui-<cssPrefix>-<suffix>。 */
  cssPrefix: string
  fields: ComponentTokenFieldMap<Config>
  config: Config | undefined
}

export function componentTokensToCssVars<Config extends object>(
  { componentName, cssPrefix, fields, config }: ComponentTokenConversion<Config>,
): CssVariableMap {
  const variables: CssVariableMap = {}
  for (const key of Object.keys(fields) as Array<keyof Config & string>) {
    const value: unknown = config?.[key]
    // 只有 undefined 表示未提供；null 等错误值仍进入运行时校验。
    if (value === undefined) continue
    const { suffix, kind } = fields[key]
    const name = 'components.' + componentName + '.' + key
    const cssName = `--matthew-ui-${cssPrefix}-${suffix}` as const
    if (kind === 'string') {
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
      // 与全局 Seed 共用设计px→rem的精度规则，不读取当前页面根字号。
      variables[cssName] = toRem(value)
    }
  }
  return variables
}
