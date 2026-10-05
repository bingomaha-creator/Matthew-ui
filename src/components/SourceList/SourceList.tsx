import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import type { SourceListProps } from './SourceList.types'

const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect

// URL 按浏览器规则解析（包括大小写和控制字符）；不手写协议正则。
function safeHref(href: string | undefined): string | undefined {
  if (!href?.trim()) return undefined
  try {
    const { protocol } = new URL(href, 'https://matthew-ui.invalid/')
    return protocol === 'https:' || protocol === 'http:' ? href : undefined
  } catch {
    return undefined
  }
}

export const SourceList = forwardRef<HTMLDivElement, SourceListProps>(function SourceList(
  { items, title, open, defaultOpen, onOpenChange, className, ...props }, ref,
) {
  const listId = useId()
  const hasTitle = Boolean(title?.trim())
  const controlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false)
  const warned = useRef(false)
  const headerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const visible = !hasTitle || (controlled ? open : internalOpen)
  // 在本次提交的布局阶段回退焦点，不影响列表外的活动元素。
  useBrowserLayoutEffect(() => {
    const list = listRef.current
    if (!visible && list?.contains(list.ownerDocument.activeElement)) {
      headerRef.current?.focus({ preventScroll: true })
    }
  }, [visible])
  useEffect(() => {
    if (import.meta.env.DEV && controlled && defaultOpen !== undefined && !warned.current) {
      console.warn('SourceList received both open and defaultOpen. defaultOpen will be ignored.')
      warned.current = true
    }
  }, [controlled, defaultOpen])
  const toggle = () => {
    const nextOpen = !visible
    if (!controlled) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }
  return (
    <div {...props} ref={ref} className={clsx('matthew-source-list', hasTitle && 'matthew-source-list--framed', className)}>
      {hasTitle && (
        <button ref={headerRef} type="button" className="matthew-source-list__header"
          aria-expanded={visible} aria-controls={listId} onClick={toggle}>
          <span className="matthew-source-list__title">{title}</span>
          {items.length > 0 && <> <span className="matthew-source-list__count">{items.length}</span></>}
          <span className="matthew-source-list__arrow" aria-hidden="true" />
        </button>
      )}
      <ul ref={listRef} id={listId} hidden={!visible} className="matthew-source-list__list">
        {items.map(item => {
          const href = safeHref(item.href)
          return (
            <li key={item.id} id={item.domId} tabIndex={item.domId ? -1 : undefined} className="matthew-source-list__item">
              {href ? (
                <a className="matthew-source-list__item-title" href={href} target={item.target ?? '_self'}
                  rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}>{item.title}</a>
              ) : <span className="matthew-source-list__item-title">{item.title}</span>}
              {item.summary && <p className="matthew-source-list__summary">{item.summary}</p>}
              {item.source && <p className="matthew-source-list__source">{item.source}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
})
