import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import type { ForwardedRef } from 'react'
import clsx from 'clsx'
import type { ThinkingProps, ThinkingStatus } from './Thinking.types'

// 内部状态图形：形状必须互不相同，不能只依赖颜色区分（TH-V02）；不开放替换prop。
function StatusIndicator({ status }: { status: ThinkingStatus }) {
  if (status === 'running') {
    return (
      <span className="matthew-thinking__dots">
        <span />
        <span />
        <span />
      </span>
    )
  }

  if (status === 'stopped') {
    return <span className="matthew-thinking__square" />
  }

  if (status === 'completed') {
    return (
      <svg className="matthew-thinking__check" viewBox="0 0 16 16">
        <path
          d="M3 8.5 6.5 12 13 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg className="matthew-thinking__bang" viewBox="0 0 16 16">
      <path
        d="M8 3v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="12.5" r="1.25" fill="currentColor" />
    </svg>
  )
}

function ThinkingImpl(
  {
    title,
    status = 'running',
    statusLabels,
    open,
    defaultOpen,
    onOpenChange,
    className,
    children,
    ...rootProps
  }: ThinkingProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const contentId = useId()
  const isControlled = open !== undefined
  // defaultOpen 只作为初始值；后续 prop 变化不重置当前展开状态。
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
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
        'Thinking received both open and defaultOpen. defaultOpen will be ignored.',
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

  return (
    <div
      {...rootProps}
      ref={ref}
      data-status={status}
      className={clsx('matthew-thinking', className)}
    >
      <button
        type="button"
        className="matthew-thinking__header"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={toggle}
      >
        <span className="matthew-thinking__status" aria-hidden="true">
          <StatusIndicator status={status} />
        </span>
        <span className="matthew-thinking__title">{title}</span>
        {statusLabels && (
          <span className="matthew-thinking__status-label">
            {statusLabels[status]}
          </span>
        )}
        <span className="matthew-thinking__arrow" aria-hidden="true" />
      </button>
      <div id={contentId} className="matthew-thinking__content" hidden={!isOpen}>
        {children}
      </div>
    </div>
  )
}

export const Thinking = forwardRef(ThinkingImpl)
