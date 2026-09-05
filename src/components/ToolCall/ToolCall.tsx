import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { isValidElement } from 'react'
import type { ForwardedRef, ReactNode } from 'react'
import clsx from 'clsx'
import type { ToolCallProps, ToolCallStatus } from './ToolCall.types'

type NormalizedChildren =
  | { present: false; content: null }
  | { present: true; content: ReactNode }

const EMPTY_CHILDREN: NormalizedChildren = { present: false, content: null }

function presentChildren(content: ReactNode): NormalizedChildren {
  return { present: true, content }
}

function isIterableObject(node: object): node is Iterable<ReactNode> {
  return typeof (node as Iterable<ReactNode>)[Symbol.iterator] === 'function'
}

// 相同 children 引用的普通重渲染复用物化结果，避免再次消费一次性 iterable。
const normalizedChildrenCache = new WeakMap<object, NormalizedChildren>()

function normalizeList(items: ReactNode[]): NormalizedChildren {
  const content: ReactNode[] = []
  for (const item of items) {
    const normalized = normalizeChildren(item)
    if (normalized.present) content.push(normalized.content)
  }
  return content.length > 0 ? presentChildren(content) : EMPTY_CHILDREN
}

/**
 * 把"详情判定"与"最终渲染内容"合并为一次元素级规范化（TC-B04）：
 * null/undefined/布尔值/空字符串/空数组/仅含空值的嵌套数组与 Iterable
 * 渲染为空，不算详情；bigint、ReactPortal、Promise 及其他合法非空
 * ReactNode 算详情。调用方提供元素（包括空 Fragment 或渲染为 null 的
 * 组件元素）即视为提供详情；模块不执行、不克隆或深入检查元素内部。
 * 数组与通用 Iterable 会被一次性物化，物化后的同一份内容既用于判定
 * 也用于详情区渲染，不会在检测后渲染原始 iterator。
 */
function normalizeChildren(node: ReactNode): NormalizedChildren {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return EMPTY_CHILDREN
  }
  if (typeof node === 'string') {
    return node.length > 0 ? presentChildren(node) : EMPTY_CHILDREN
  }
  if (typeof node === 'number' || typeof node === 'bigint') {
    return presentChildren(node)
  }
  if (isValidElement(node)) {
    return presentChildren(node)
  }
  if (typeof node !== 'object') {
    return presentChildren(node)
  }
  const cached = normalizedChildrenCache.get(node)
  if (cached) return cached
  const result = isIterableObject(node)
    ? normalizeList([...node])
    : presentChildren(node)
  normalizedChildrenCache.set(node, result)
  return result
}

// 内部状态图形：空心圆、缺口圆环、对勾、感叹号、方块互不相同（TC-V02），
// 不能只依赖颜色区分；不开放替换prop。视觉尺寸不超过 Thinking 的状态标识。
function StatusIndicator({ status }: { status: ToolCallStatus }) {
  if (status === 'running') {
    // 缺口圆环用 CSS 实现，缺口侧透明，旋转动画在 SCSS 中定义。
    return <span className="matthew-tool-call__ring" />
  }

  if (status === 'pending') {
    // pending 明确使用空心圆，不使用浅色实心圆。
    return <span className="matthew-tool-call__hollow" />
  }

  if (status === 'completed') {
    return (
      <svg className="matthew-tool-call__check" viewBox="0 0 16 16">
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

  if (status === 'error') {
    return (
      <svg className="matthew-tool-call__bang" viewBox="0 0 16 16">
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

  return <span className="matthew-tool-call__square" />
}

function ToolCallImpl(
  {
    name,
    status,
    summary,
    statusLabels,
    open,
    defaultOpen,
    onOpenChange,
    className,
    children,
    ...rootProps
  }: ToolCallProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const detailId = useId()
  const isControlled = open !== undefined
  // defaultOpen 只作为初始值；后续 prop 变化不重置当前展开状态。
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const hasWarnedAboutOpenConflict = useRef(false)
  const normalizedChildren = normalizeChildren(children)
  const hasDetails = normalizedChildren.present
  const isOpen = isControlled ? open : uncontrolledOpen

  useEffect(() => {
    // 冲突警告属于 disclosure 行为（TC-B03）；无详情时两个展开 prop 均无效，不警告。
    if (
      import.meta.env.DEV &&
      hasDetails &&
      isControlled &&
      defaultOpen !== undefined &&
      !hasWarnedAboutOpenConflict.current
    ) {
      console.warn(
        'ToolCall received both open and defaultOpen. defaultOpen will be ignored.',
      )
      hasWarnedAboutOpenConflict.current = true
    }
  }, [defaultOpen, hasDetails, isControlled])

  const toggle = () => {
    // 受控模式不在内部更改状态，只上报请求的新状态。
    const nextOpen = !isOpen

    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  const headerContent = (
    <>
      <span className="matthew-tool-call__status" aria-hidden="true">
        <StatusIndicator status={status} />
      </span>
      <span className="matthew-tool-call__name">{name}</span>
      {summary !== undefined && (
        <span className="matthew-tool-call__summary">{summary}</span>
      )}
      {statusLabels && (
        // 当前状态文案以视觉隐藏文本加入可访问名称；图形本身从辅助技术树隐藏（TC-B05）。
        <span className="matthew-tool-call__sr-status">{statusLabels[status]}</span>
      )}
      {hasDetails && (
        // 默认指向右方，展开后旋转到下方；同一组件内保持一致（TC-V01）。
        <span className="matthew-tool-call__arrow" aria-hidden="true" />
      )}
    </>
  )

  return (
    <div
      {...rootProps}
      ref={ref}
      data-status={status}
      className={clsx('matthew-tool-call', className)}
    >
      {hasDetails ? (
        <button
          type="button"
          className="matthew-tool-call__header"
          aria-expanded={isOpen}
          aria-controls={detailId}
          onClick={toggle}
        >
          {headerContent}
        </button>
      ) : (
        // 无详情时退化为非交互状态行：不渲染按钮、箭头或空详情容器（TC-B04）。
        <div className="matthew-tool-call__header">{headerContent}</div>
      )}
      {hasDetails && (
        <div
          id={detailId}
          className="matthew-tool-call__detail"
          hidden={!isOpen}
        >
          {normalizedChildren.content}
        </div>
      )}
    </div>
  )
}

export const ToolCall = forwardRef(ToolCallImpl)
