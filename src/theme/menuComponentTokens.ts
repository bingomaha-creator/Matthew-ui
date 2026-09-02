import { toRem } from './tokens'
import type { CssVariableMap } from './tokens'

/** 通过 MatthewThemeConfig.components.Menu 使用，不新增包级类型或运行时导出。 */
export interface MenuComponentTokens {
  background?: string
  borderColor?: string
  itemColor?: string
  itemHoverBackground?: string
  itemSelectedBackground?: string
  itemSelectedColor?: string
  /** 数字设计单位（px）转 rem；最小高度与字号必须大于0。 */
  itemMinHeight?: number
  itemFontSize?: number
  /** 圆角与两个方向的内边距允许0。 */
  itemBorderRadius?: number
  itemPaddingBlock?: number
  itemPaddingInline?: number
  popupBackground?: string
  /** 阴影作为完整 CSS 字符串精确覆盖，不拆分或派生其颜色/尺寸。 */
  popupShadow?: string
}

// 字段表只记录公开变量映射和校验规则，不存储第二套组件默认样式。
// itemBorderRadius 对应 item-radius，而非简单把字段名转成 kebab-case。
const MENU_FIELDS = {
  background: { suffix: 'background', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  itemColor: { suffix: 'item-color', kind: 'string' },
  itemHoverBackground: { suffix: 'item-hover-background', kind: 'string' },
  itemSelectedBackground: { suffix: 'item-selected-background', kind: 'string' },
  itemSelectedColor: { suffix: 'item-selected-color', kind: 'string' },
  itemMinHeight: { suffix: 'item-min-height', kind: 'positive' },
  itemFontSize: { suffix: 'item-font-size', kind: 'positive' },
  itemBorderRadius: { suffix: 'item-radius', kind: 'nonnegative' },
  itemPaddingBlock: { suffix: 'item-padding-block', kind: 'nonnegative' },
  itemPaddingInline: { suffix: 'item-padding-inline', kind: 'nonnegative' },
  popupBackground: { suffix: 'popup-background', kind: 'string' },
  popupShadow: { suffix: 'popup-shadow', kind: 'string' },
} as const satisfies Record<keyof MenuComponentTokens, {
  suffix: string
  kind: 'string' | 'positive' | 'nonnegative'
}>

/** 内部 Adapter：只处理白名单字段；CSS 决定默认映射与选中/hover的使用时机。 */
export function menuTokensToCssVars(config: MenuComponentTokens = {}): CssVariableMap {
  const variables: CssVariableMap = {}
  for (const key of Object.keys(MENU_FIELDS) as Array<keyof MenuComponentTokens>) {
    const value: unknown = config[key]
    if (value === undefined) continue
    const { suffix, kind } = MENU_FIELDS[key]
    const name = 'components.Menu.' + key
    const cssName = `--matthew-ui-menu-${suffix}` as const
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
      // 与 Seed/Button 共用设计单位和精度约定，不受当前页面根字号影响。
      variables[cssName] = toRem(value)
    }
  }
  return variables
}
