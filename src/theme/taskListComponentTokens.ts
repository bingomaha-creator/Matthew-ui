import { componentTokensToCssVars } from './componentTokenUtils'
import type { ComponentTokenFieldMap } from './componentTokenUtils'
import type { CssVariableMap } from './tokens'

/** 通过MatthewThemeConfig.components.TaskList使用；不新增包级独立导出。 */
export interface TaskListComponentTokens {
  /** 面板背景；colorSurface。 */
  background?: string
  /** 外框、标题分隔线与任务连接线；colorBorder。 */
  borderColor?: string
  /** 标题文字；colorText。 */
  titleColor?: string
  /** 总体摘要文字；colorTextMuted。 */
  progressColor?: string
  /** 任务行标题文字；colorText，completed 回退 summaryColor。 */
  itemColor?: string
  /** 行内摘要与完成标题文字；colorTextMuted。 */
  summaryColor?: string
  /** 标题栏hover背景；colorSurfaceHover。 */
  headerHoverBackground?: string
  /** 排队空心圆；colorTextMuted。 */
  pendingColor?: string
  /** 运行缺口圆环；colorPrimary。 */
  runningColor?: string
  /** 完成圆形对勾；colorPrimaryActive。 */
  completedColor?: string
  /** 失败圆形感叹号；colorDanger。 */
  errorColor?: string
  /** 中止方块；colorTextMuted。 */
  stoppedColor?: string
  /** 面板圆角；radiusMd。数字设计单位（px），输出 rem；允许0。 */
  borderRadius?: number
  /** 标题栏最小高度；controlHeightMd。必须大于0。 */
  headerMinHeight?: number
  /** 任务行最小高度；34px。必须大于0。 */
  itemMinHeight?: number
}

// 这里只维护白名单映射与校验，不存储组件默认样式。
// borderRadius映射为公开的 task-list-radius，与 button-radius 的先例一致。
const TASK_LIST_FIELDS = {
  background: { suffix: 'background', kind: 'string' },
  borderColor: { suffix: 'border-color', kind: 'string' },
  titleColor: { suffix: 'title-color', kind: 'string' },
  progressColor: { suffix: 'progress-color', kind: 'string' },
  itemColor: { suffix: 'item-color', kind: 'string' },
  summaryColor: { suffix: 'summary-color', kind: 'string' },
  headerHoverBackground: { suffix: 'header-hover-background', kind: 'string' },
  pendingColor: { suffix: 'pending-color', kind: 'string' },
  runningColor: { suffix: 'running-color', kind: 'string' },
  completedColor: { suffix: 'completed-color', kind: 'string' },
  errorColor: { suffix: 'error-color', kind: 'string' },
  stoppedColor: { suffix: 'stopped-color', kind: 'string' },
  borderRadius: { suffix: 'radius', kind: 'nonnegative' },
  headerMinHeight: { suffix: 'header-min-height', kind: 'positive' },
  itemMinHeight: { suffix: 'item-min-height', kind: 'positive' },
} as const satisfies ComponentTokenFieldMap<TaskListComponentTokens>

/** 内部Adapter：只生成显式变量；默认回退由SCSS在消费位置读取全局Token。 */
export function taskListTokensToCssVars(config: TaskListComponentTokens = {}): CssVariableMap {
  return componentTokensToCssVars({
    componentName: 'TaskList',
    cssPrefix: 'task-list',
    fields: TASK_LIST_FIELDS,
    config,
  })
}
