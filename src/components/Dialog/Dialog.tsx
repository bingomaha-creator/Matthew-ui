import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import clsx from 'clsx'
import type { DialogProps } from './Dialog.types'

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
// 只管理本模块拥有的滚动锁；并行实例释放时不能提前解锁，也不能丢失原 inline priority。
const scrollLocks = new WeakMap<Document, { count: number; value: string; priority: string }>()
function lockScroll(doc: Document) {
  const style = doc.documentElement.style
  const lock = scrollLocks.get(doc) ?? { count: 0, value: style.getPropertyValue('overflow'), priority: style.getPropertyPriority('overflow') }
  lock.count++
  scrollLocks.set(doc, lock)
  style.setProperty('overflow', 'hidden', 'important')
  return () => {
    if (--lock.count) return
    if (lock.value) style.setProperty('overflow', lock.value, lock.priority)
    else style.removeProperty('overflow')
    scrollLocks.delete(doc)
  }
}

export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  { open, onOpenChange, title, closeLabel, children, footer,
    dismissible = true, closeOnBackdrop = false,
    initialFocus, className, onPointerDown, onPointerUp, onPointerCancel, ...props }, ref,
) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const backdropPointer = useRef<number | undefined>(undefined)
  useImperativeHandle(ref, () => dialog.current!, [])
  useBrowserLayoutEffect(() => {
    const node = dialog.current!
    backdropPointer.current = undefined
    if (!open) { if (node.open) node.close(); return }
    const previous = node.ownerDocument.activeElement as HTMLElement | null
    const target = initialFocus?.() ?? node.querySelector<HTMLElement>('[autofocus]')
    node.showModal()
    const unlock = lockScroll(node.ownerDocument)
    if (target && node.contains(target)) target.focus({ preventScroll: true })
    if (!target || node.ownerDocument.activeElement !== target) node.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true })
    return () => {
      if (node.open) node.close()
      unlock()
      if (previous?.isConnected && !previous.matches(':disabled')) previous.focus({ preventScroll: true })
    }
  }, [open])
  return <dialog {...props} ref={dialog} role="dialog" aria-modal="true" aria-labelledby={props['aria-labelledby'] ?? (props['aria-label'] ? undefined : titleId)}
    className={clsx('matthew-dialog', className)} onCancel={event => {
      event.preventDefault()
      if (open && dismissible) onOpenChange(false)
    }} onPointerDown={event => {
      onPointerDown?.(event)
      const r = event.currentTarget.getBoundingClientRect()
      const outside = event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom
      backdropPointer.current = !event.defaultPrevented && event.button === 0 && event.target === event.currentTarget && outside
        ? event.pointerId : undefined
    }} onPointerUp={event => {
      onPointerUp?.(event)
      const r = event.currentTarget.getBoundingClientRect()
      const outside = event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom
      const startedOutside = backdropPointer.current === event.pointerId
      backdropPointer.current = undefined
      if (!event.defaultPrevented && startedOutside && event.target === event.currentTarget && outside && open && dismissible && closeOnBackdrop) onOpenChange(false)
    }} onPointerCancel={event => { backdropPointer.current = undefined; onPointerCancel?.(event) }}>
    <header className="matthew-dialog__header"><h2 id={titleId} tabIndex={-1} className="matthew-dialog__title">{title}</h2>
      <button type="button" aria-label={closeLabel} className="matthew-dialog__close"
        disabled={!dismissible} onClick={() => { if (open && dismissible) onOpenChange(false) }}>
        <span aria-hidden="true" className="matthew-dialog__close-icon" />
      </button>
    </header>
    <div className="matthew-dialog__content">{children}</div>
    {footer != null && footer !== false && footer !== '' && <footer className="matthew-dialog__footer">{footer}</footer>}
  </dialog>
})
