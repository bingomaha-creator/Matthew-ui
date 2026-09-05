import { componentTokensToCssVars } from './componentTokenUtils'
import type { ComponentTokenFieldMap } from './componentTokenUtils'
import type { CssVariableMap } from './tokens'

/** 通过MatthewThemeConfig.components.ToolCall使用；不新增包级独立导出。 */
export interface ToolCallComponentTokens {
  /** 工具名称文字；colorText。 */
  nameColor?: string
  /** 摘要文字；colorTextMuted。 */
  summaryColor?: string
  /** 详情文字；colorTextMuted。 */
  detailColor?: string
  /** 详情分隔线；colorBorder。 */
  borderColor?: string
  /** 标题行hover背景；colorSurfaceHover。 */
  headerHoverBackground?: string
  /** 排队空心圆；colorTextMuted。 */
  pendingColor?: string
  /** 运行缺口圆环；colorPrimary。 */
  runningColor?: string
  /** 完成对勾；colorPrimaryActive。 */
  completedColor?: string
  /** 失败感叹号；colorDanger。 */
  errorColor?: string
  /** 中止方块；colorTextMuted。 */
  stoppedColor?: string
  /** 标题行圆角；radiusMd。数字设计单位（px），输出 rem；允许0。 */
  borderRadius?: number
  /** 标题行最小高度；controlHeightSm。必须大于0。 */
  headerMinHeight?: number
}

// 这里只维护白名单映射与校验，不存储组件默认样式。
// borderRadius映射为公开的 tool-call-radius，与 button-radius 的先例一致。
const TOOL_CALL_FIELDS = {
  nameColor: { suffix: 'name-color', kind: 'string' },
  summaryColor: { suffix: 'summary-color', kind: 'string' },
  detailColor: { suffix: 'detail-color', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  headerHoverBackground: { suffix: 'header-hover-background', kind: 'string' },
  pendingColor: { suffix: 'pending-color', kind: 'string' },
  runningColor: { suffix: 'running-color', kind: 'string' },
  completedColor: { suffix: 'completed-color', kind: 'string' },
  errorColor: { suffix: 'error-color', kind: 'string' },
  stoppedColor: { suffix: 'stopped-color', kind: 'string' },
  borderRadius: { suffix: 'radius', kind: 'nonnegative' },
  headerMinHeight: { suffix: 'header-min-height', kind: 'positive' },
} as const satisfies ComponentTokenFieldMap<ToolCallComponentTokens>

/** 内部Adapter：只生成显式变量；默认回退由SCSS在消费位置读取全局Token。 */
export function toolCallTokensToCssVars(config: ToolCallComponentTokens = {}): CssVariableMap {
  return componentTokensToCssVars({
    componentName: 'ToolCall',
    cssPrefix: 'tool-call',
    fields: TOOL_CALL_FIELDS,
    config,
  })
}
