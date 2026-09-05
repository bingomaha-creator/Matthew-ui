import { componentTokensToCssVars } from './componentTokenUtils'
import type { ComponentTokenFieldMap } from './componentTokenUtils'
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
} as const satisfies ComponentTokenFieldMap<ThinkingComponentTokens>

/** 内部Adapter：只生成显式变量；默认回退由SCSS在消费位置读取全局Token。 */
export function thinkingTokensToCssVars(config: ThinkingComponentTokens = {}): CssVariableMap {
  return componentTokensToCssVars({
    componentName: 'Thinking',
    cssPrefix: 'thinking',
    fields: THINKING_FIELDS,
    config,
  })
}
