import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import type { SelectProps } from './Select.types'
import { useSelectPopup } from './useSelectPopup'

// 编码 code points 而非 URI：合法 JS 字符串可含孤立代理项，encodeURIComponent 会抛异常。
const getOptionId = (id: string, value: string) =>
  `${id}-${Array.from(value, character => character.codePointAt(0)!.toString(16)).join('-')}`

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onValueChange, options, placeholder, popupHost, className, disabled,
    onClick, onKeyDown, ...props }, ref,
) {
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(null)
  const assignRef = useCallback((node: HTMLButtonElement | null) => {
    trigger.current = node
    setTriggerElement(node)
  }, [])
  // 由 React 管理 object/callback ref 与 React 19 callback cleanup，兼容 React 18。
  useImperativeHandle(ref, () => trigger.current!, [])
  const [open, setOpen] = useState(false)
  const [activeValue, setActiveValue] = useState<string | undefined>()
  const id = useId()
  const search = useRef({ text: '', time: 0 })
  const selected = options.find(option => option.value === value)
  const enabled = options.filter(option => !option.disabled)
  const inactive = disabled || options.length === 0
  const expanded = open && !inactive
  const initial = !selected?.disabled && selected ? selected.value : enabled[0]?.value
  const active = enabled.find(option => option.value === activeValue)?.value ?? initial
  const optionId = (optionValue: string) => getOptionId(id, optionValue)
  useSelectPopup(trigger, popup, expanded)

  useEffect(() => {
    if (!expanded || active === undefined || !popup.current) return
    const item = trigger.current?.ownerDocument.getElementById(getOptionId(id, active))
    if (!item) return
    const list = popup.current
    const top = item.offsetTop
    if (top < list.scrollTop) list.scrollTop = top
    else if (top + item.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + item.offsetHeight - list.clientHeight
  }, [expanded, active, id])

  if (inactive && open) setOpen(false)
  if (activeValue !== active) setActiveValue(active)

  useEffect(() => {
    if (!expanded) search.current = { text: '', time: 0 }
    if (!expanded) return
    const doc = trigger.current!.ownerDocument
    const outside = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target && !trigger.current?.contains(target) && !popup.current?.contains(target)) setOpen(false)
    }
    doc.addEventListener('pointerdown', outside)
    return () => doc.removeEventListener('pointerdown', outside)
  }, [expanded])

  function toggle() {
    search.current.text = ''
    if (!expanded) setActiveValue(initial)
    setOpen(!expanded)
  }
  function commit(next: string | undefined) {
    if (next === undefined || !enabled.some(option => option.value === next)) return
    if (next !== value) onValueChange(next)
    setOpen(false)
    trigger.current?.focus({ preventScroll: true })
  }
  const host = expanded ? popupHost?.() ?? triggerElement?.ownerDocument.body : undefined
  return <>
    <button {...props} ref={assignRef} type="button" role="combobox" aria-haspopup="listbox"
      aria-expanded={expanded} aria-controls={expanded ? id : undefined}
      aria-activedescendant={expanded && active !== undefined ? optionId(active) : undefined}
      disabled={inactive} className={clsx('matthew-select', className)}
      onClick={event => { onClick?.(event); if (!event.defaultPrevented && !inactive) toggle() }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented || inactive || event.nativeEvent.isComposing) return
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          if (!expanded) { setActiveValue(initial); setOpen(true) }
          else if (enabled.length) {
            const index = enabled.findIndex(option => option.value === active)
            const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length
            setActiveValue(enabled[next].value)
          }
        } else if (expanded && (event.key === 'Home' || event.key === 'End')) {
          event.preventDefault()
          setActiveValue(event.key === 'Home' ? enabled[0]?.value : enabled.at(-1)?.value)
        } else if (expanded && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault(); commit(active)
        } else if (expanded && event.key === 'Escape') {
          event.preventDefault(); event.stopPropagation(); setOpen(false)
        } else if (event.key === 'Tab') setOpen(false)
        else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== ' ') {
          event.preventDefault()
          const now = Date.now()
          const text = (now - search.current.time < 500 ? search.current.text : '') + event.key.toLocaleLowerCase()
          search.current = { text, time: now }
          const repeated = Array.from(text).every(char => char === text[0])
          const prefix = repeated ? text[0] : text
          const currentIndex = enabled.findIndex(option => option.value === (expanded ? active : initial))
          const start = repeated ? currentIndex + 1 : Math.max(currentIndex, 0)
          const candidate = enabled.map((_, index) => enabled[(start + index) % enabled.length])
            .find(option => option.label.toLocaleLowerCase().startsWith(prefix))
          if (!expanded) { setActiveValue(initial); setOpen(true) }
          if (candidate) setActiveValue(candidate.value)
        }
      }}>
      <span className={clsx('matthew-select__label', !selected && 'matthew-select__label--placeholder')}>
        {selected?.label ?? placeholder ?? ''}
      </span>
      <span className="matthew-select__arrow" aria-hidden="true" />
    </button>
    {expanded && host && createPortal(
      <div ref={popup} id={id} role="listbox" aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']} className="matthew-select__popup">
        {options.map(option => <div key={option.value} id={optionId(option.value)} role="option"
          aria-selected={option.value === value} aria-disabled={option.disabled || undefined}
          className={clsx('matthew-select__option', active === option.value && 'matthew-select__option--active')}
          onPointerMove={() => { if (!option.disabled) setActiveValue(option.value) }}
          onPointerDown={event => event.preventDefault()} onClick={() => commit(option.value)}>
          <span className="matthew-select__option-label">{option.label}</span>
          <svg className="matthew-select__check" aria-hidden="true" viewBox="0 0 16 16" fill="none">
            <path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>)}
      </div>, host)}
  </>
})
