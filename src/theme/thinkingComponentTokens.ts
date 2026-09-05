import { toRem } from './tokens'
import type { CssVariableMap } from './tokens'

/** 通过MatthewThemeConfig.components.Thinking使用；不新增包级独立导出。 */
export interface ThinkingComponentTokens {
  /** 标题文字；colorText。 */
  titleColor?: string
  /** 内容文字；colorTextMuted。 */
  contentColor?: string
  /** 内容左侧细线；colorBorder。 */
  borderColor?: string
  /** 标题栏hover背景；colorSurfaceHover。 */
  headerHoverBackground?: string
  /** 运行中圆点；colorPrimary。 */
  runningColor?: string
  /** 完成对勾；colorPrimaryActive。 */
  completedColor?: string
  /** 中止方块；colorTextMuted。 */
  stoppedColor?: string
  /** 失败感叹号；colorDanger。 */
  errorColor?: string
  /** 标题栏圆角；radiusMd。数字设计单位（px），输出 rem；允许0。 */
  borderRadius?: number
  /** 标题栏最小高度；controlHeightMd。必须大于0。 */
  headerMinHeight?: number
}

// 这里只维护白名单映射与校验，不存储组件默认样式。
// borderRadius映射为公开的 thinking-radius，与 button-radius 的先例一致。
const THINKING_FIELDS = {
  titleColor: { suffix: 'title-color', kind: 'string' },
  contentColor: { suffix: 'content-color', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  headerHoverBackground: { suffix: 'header-hover-background', kind: 'string' },
  runningColor: { suffix: 'running-color', kind: 'string' },
  completedColor: { suffix: 'completed-color', kind: 'string' },
  stoppedColor: { suffix: 'stopped-color', kind: 'string' },
  errorColor: { suffix: 'error-color', kind: 'string' },
  borderRadius: { suffix: 'radius', kind: 'nonnegative' },
  headerMinHeight: { suffix: 'header-min-height', kind: 'positive' },
} as const satisfies Record<keyof ThinkingComponentTokens, {
  suffix: string
  kind: 'string' | 'positive' | 'nonnegative'
}>

/** 内部Adapter：只生成显式变量；默认回退由SCSS在消费位置读取全局Token。 */
export function thinkingTokensToCssVars(config: ThinkingComponentTokens = {}): CssVariableMap {
  const variables: CssVariableMap = {}
  for (const key of Object.keys(THINKING_FIELDS) as Array<keyof ThinkingComponentTokens>) {
    const value: unknown = config[key]
    if (value === undefined) continue
    const { suffix, kind } = THINKING_FIELDS[key]
    const name = 'components.Thinking.' + key
    const cssName = `--matthew-ui-thinking-${suffix}` as const
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
      // 复用设计px→rem的精度规则，不读取当前页面字号。
      variables[cssName] = toRem(value)
    }
  }
  return variables
}
