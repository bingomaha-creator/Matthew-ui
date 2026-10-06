import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import type { CodeBlockProps } from './CodeBlock.types'

const useCommitEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { code, title, language, wrap = false, copy, className, ...props }, ref,
) {
  const titleId = useId()
  const hasTitle = Boolean(title?.trim())
  const hasLanguage = Boolean(language?.trim())
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null)
  const request = useRef(0)
  const busy = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const label = copy?.label
  const copiedLabel = copy?.copiedLabel
  const errorLabel = copy?.errorLabel

  useCommitEffect(() => {
    busy.current = false
    setPending(false)
    setFeedback(null)
    return () => {
      // A→B→A must invalidate old completion too; text equality is not a request identity.
      request.current++
      busy.current = false
      clearTimeout(timer.current)
    }
  }, [code, label, copiedLabel, errorLabel])

  async function handleCopy() {
    if (!copy || busy.current) return
    busy.current = true
    const currentRequest = ++request.current
    clearTimeout(timer.current)
    setPending(true)
    setFeedback(null)
    let result: 'success' | 'error'
    try {
      await navigator.clipboard.writeText(code)
      result = 'success'
    } catch {
      result = 'error'
    }
    if (request.current !== currentRequest) return
    busy.current = false
    setPending(false)
    setFeedback(result)
    timer.current = setTimeout(() => setFeedback(null), 2000)
  }

  const labelledBy = props['aria-labelledby'] ?? (hasTitle ? titleId : undefined)
  const ariaLabel = props['aria-label']
  return <div {...props} ref={ref} className={clsx('matthew-code-block', { 'matthew-code-block--wrap': wrap }, className)}>
    {(hasTitle || hasLanguage || copy) && <div className="matthew-code-block__header">
      <div className="matthew-code-block__heading">
        {hasTitle && <span id={titleId} className="matthew-code-block__title">{title}</span>}
        {hasLanguage && <span className="matthew-code-block__language">{language}</span>}
      </div>
      {copy && <div className="matthew-code-block__actions">
        <span role="status" className={clsx('matthew-code-block__feedback', { 'matthew-code-block__feedback--error': feedback === 'error' })}>{feedback === 'success' ? copiedLabel : feedback === 'error' ? errorLabel : ''}</span>
        <button type="button" className="matthew-code-block__copy" aria-disabled={pending || undefined} aria-busy={pending || undefined} onClick={handleCopy}>{label}</button>
      </div>}
    </div>}
    <pre className="matthew-code-block__pre" tabIndex={0} role={labelledBy || ariaLabel ? 'region' : undefined} aria-labelledby={labelledBy} aria-label={ariaLabel}><code>{code}</code></pre>
  </div>
})
