import { useEffect, useLayoutEffect, type RefObject } from 'react'

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Select 专用：桥接来源域主题并在宿主实际坐标系内定位，不公开浮层原语。 */
export function useSelectPopup(
  triggerRef: RefObject<HTMLButtonElement | null>,
  popupRef: RefObject<HTMLDivElement | null>,
  expanded: boolean,
) {
  // 每次 render 都重测：选项、宿主、inline style 与 Provider 更新不复用过期几何。
  useBrowserLayoutEffect(() => {
    const trigger = triggerRef.current
    const popup = popupRef.current
    const host = popup?.parentElement
    const win = trigger?.ownerDocument.defaultView
    if (!expanded || !trigger || !popup || !host || !win) return
    let frame = 0
    let copied: string[] = []
    const viewport = win.visualViewport
    const position = () => {
      const source = win.getComputedStyle(trigger)
      copied.forEach(name => popup.style.removeProperty(name))
      copied = Array.from(source).filter(name =>
        /^--matthew-ui-(?:select-|color-|shadow-overlay$|radius-md$|control-height-|font-size-|duration-fast$)/.test(name))
      copied.forEach(name => popup.style.setProperty(name, source.getPropertyValue(name)))
      popup.style.fontFamily = source.fontFamily
      popup.style.direction = source.direction
      popup.style.colorScheme = source.colorScheme

      // fixed 坐标不总是 viewport 坐标：transform/contain 宿主会建立 containing block。
      // 隐形探针测实际原点和轴向缩放，覆盖移动侧栏的 translate 及普通 scale。
      const probe = trigger.ownerDocument.createElement('div')
      probe.style.cssText = 'position:fixed;left:0;top:0;width:100px;height:100px;visibility:hidden;pointer-events:none;box-sizing:border-box;padding:0;border:0;margin:0;'
      host.append(probe)
      const origin = probe.getBoundingClientRect()
      probe.remove()
      const scaleX = origin.width / 100 || 1
      const scaleY = origin.height / 100 || 1
      const rect = trigger.getBoundingClientRect()
      const edge = 8
      let leftEdge = (viewport?.offsetLeft ?? 0) + edge
      let topEdge = (viewport?.offsetTop ?? 0) + edge
      let rightEdge = leftEdge + (viewport?.width ?? trigger.ownerDocument.documentElement.clientWidth) - edge * 2
      let bottomEdge = topEdge + (viewport?.height ?? win.innerHeight) - edge * 2
      let localContainingBlock = false
      for (let node: HTMLElement | null = host; node; node = node.parentElement) {
        const style = win.getComputedStyle(node)
        if (style.transform !== 'none' || style.perspective !== 'none' || style.filter !== 'none' ||
          /(paint|layout|strict|content)/.test(style.contain)) localContainingBlock = true
      }
      for (let node: HTMLElement | null = host; node; node = node.parentElement) {
        if (!localContainingBlock) break
        const style = win.getComputedStyle(node)
        if (!/(hidden|clip|auto|scroll)/.test(style.overflowX + style.overflowY)) continue
        const clip = node.getBoundingClientRect()
        if (/(hidden|clip|auto|scroll)/.test(style.overflowX)) {
          leftEdge = Math.max(leftEdge, clip.left + edge)
          rightEdge = Math.min(rightEdge, clip.right - edge)
        }
        if (/(hidden|clip|auto|scroll)/.test(style.overflowY)) {
          topEdge = Math.max(topEdge, clip.top + edge)
          bottomEdge = Math.min(bottomEdge, clip.bottom - edge)
        }
      }
      const width = Math.max(0, Math.min(rect.width, rightEdge - leftEdge))
      const left = Math.min(Math.max(rect.left, leftEdge), rightEdge - width)
      popup.style.width = `${width / scaleX}px`
      const popupStyle = win.getComputedStyle(popup)
      const border = parseFloat(popupStyle.borderTopWidth) + parseFloat(popupStyle.borderBottomWidth)
      const desired = Math.min((popup.scrollHeight + border) * scaleY,
        parseFloat(win.getComputedStyle(trigger.ownerDocument.documentElement).fontSize) * 20)
      const below = Math.max(0, bottomEdge - rect.bottom - edge)
      const above = Math.max(0, rect.top - edge - topEdge)
      const down = desired <= below || below >= above
      const height = Math.max(0, Math.min(desired, down ? below : above))
      const top = Math.min(Math.max(down ? rect.bottom + edge : rect.top - edge - height, topEdge), bottomEdge - height)
      popup.style.left = `${(left - origin.left) / scaleX}px`
      popup.style.top = `${(top - origin.top) / scaleY}px`
      popup.style.maxHeight = `${height / scaleY}px`
      popup.dataset.placement = down ? 'bottom' : 'top'
      popup.dataset.positioned = 'true'
    }
    const schedule = () => {
      if (!frame) frame = win.requestAnimationFrame(() => { frame = 0; position() })
    }
    position()
    const ancestors: HTMLElement[] = []
    for (let node: HTMLElement | null = trigger; node; node = node.parentElement) ancestors.push(node)
    for (let node: HTMLElement | null = host; node; node = node.parentElement) {
      if (!ancestors.includes(node)) ancestors.push(node)
    }
    const mutation = new MutationObserver(schedule)
    // CSS 选择器也可能依赖 data-* / aria-* 等属性，不限制属性名。
    // 只观察祖先自身，不观察子树／popup，避免桥接 style 写入造成反馈。
    ancestors.forEach(node => mutation.observe(node, { attributes: true }))
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule)
    ancestors.forEach(node => resize?.observe(node))
    resize?.observe(popup)
    const media = win.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', schedule)
    win.addEventListener('scroll', schedule, true)
    win.addEventListener('resize', schedule)
    viewport?.addEventListener?.('resize', schedule)
    viewport?.addEventListener?.('scroll', schedule)
    return () => {
      win.cancelAnimationFrame(frame)
      mutation.disconnect(); resize?.disconnect()
      media.removeEventListener('change', schedule)
      win.removeEventListener('scroll', schedule, true)
      win.removeEventListener('resize', schedule)
      viewport?.removeEventListener?.('resize', schedule)
      viewport?.removeEventListener?.('scroll', schedule)
    }
  })
}
