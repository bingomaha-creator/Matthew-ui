import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import type { ForwardedRef } from 'react'
import clsx from 'clsx'
import type { TaskListItem, TaskListProps, TaskStatus } from './TaskList.types'

// 内部状态图形（TL-V04）：空心圆、缺口圆环、圆形底对勾、圆形感叹号、
// 方块互不相同，不只依赖颜色区分；不开放替换prop。
function StatusIndicator({ status }: { status: TaskStatus }) {
  if (status === 'running') {
    return <span className="matthew-task-list__ring" />
  }

  if (status === 'pending') {
    return <span className="matthew-task-list__hollow" />
  }

  if (status === 'completed') {
    // 圆形底 + 对勾，比 ToolCall 的单独对勾更强调任务完成。
    return (
      <svg className="matthew-task-list__check" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="currentColor" />
        <path
          className="matthew-task-list__check-mark"
          d="M4.5 8.5 7 11 11.5 5.5"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (status === 'error') {
    // 圆形内感叹号。
    return (
      <svg className="matthew-task-list__bang" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 4.5v4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11.75" r="1.1" fill="currentColor" />
      </svg>
    )
  }

  return <span className="matthew-task-list__square" />
}

function TaskListImpl(
  {
    title,
    items,
    statusLabels,
    open,
    defaultOpen,
    onOpenChange,
    className,
    ...rootProps
  }: TaskListProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const listId = useId()
  const isControlled = open !== undefined
  // defaultOpen 只作为初始值且默认展开；后续 prop 变化不重置当前展开状态。
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? true)
  const hasWarnedAboutOpenConflict = useRef(false)
  const isOpen = isControlled ? open : uncontrolledOpen

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      isControlled &&
      defaultOpen !== undefined &&
      !hasWarnedAboutOpenConflict.current
    ) {
      console.warn(
        'TaskList received both open and defaultOpen. defaultOpen will be ignored.',
      )
      hasWarnedAboutOpenConflict.current = true
    }
  }, [defaultOpen, isControlled])

  const toggle = () => {
    // 受控模式不在内部更改状态，只上报请求的新状态。
    const nextOpen = !isOpen

    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  const completedCount = items.filter(
    (item) => item.status === 'completed',
  ).length

  return (
    <div
      {...rootProps}
      ref={ref}
      className={clsx('matthew-task-list', className)}
    >
      <button
        type="button"
        className="matthew-task-list__header"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={toggle}
      >
        <span className="matthew-task-list__title">{title}</span>
        {items.length > 0 && (
          <span className="matthew-task-list__progress">
            {completedCount} / {items.length}
          </span>
        )}
        <span className="matthew-task-list__arrow" aria-hidden="true" />
      </button>
      <ol id={listId} className="matthew-task-list__list" hidden={!isOpen}>
        {items.map((item: TaskListItem) => (
          <li
            key={item.id}
            data-status={item.status}
            className="matthew-task-list__item"
          >
            <span className="matthew-task-list__status" aria-hidden="true">
              <StatusIndicator status={item.status} />
            </span>
            <span className="matthew-task-list__item-title">{item.title}</span>
            {item.summary !== undefined && (
              <span className="matthew-task-list__summary">{item.summary}</span>
            )}
            {statusLabels && (
              // 当前状态文案以视觉隐藏文本加入条目可访问内容（TL-B06）。
              <span className="matthew-task-list__sr-status">
                {statusLabels[item.status]}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export const TaskList = forwardRef(TaskListImpl)
