import { useCallback, useEffect, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import type {
  AutoCompleteOption,
  AutoCompleteProps,
} from './AutoComplete.types'

export function AutoComplete<
  T extends AutoCompleteOption = AutoCompleteOption,
>({
  value,
  defaultValue,
  onValueChange,
  onOptionSelect,
  renderOption,
  fetchSuggestions,
  disabled,
  readOnly,
  className,
  type = 'text',
  ref,
  ...inputProps
}: AutoCompleteProps<T>) {
  const listboxId = useId()
  const isControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
  const [searchInput, setSearchInput] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<T[]>([])
  const [suggestionsQuery, setSuggestionsQuery] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const hasWarnedAboutValueConflict = useRef(false)
  const fetchSuggestionsRef = useRef(fetchSuggestions)
  const isComposingRef = useRef(false)
  const loadingRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const requestVersion = useRef(0)
  const pendingControlledValue = useRef<string | null>(null)
  const previousControlledValue = useRef(value)
  const displayValue = isControlled ? (value ?? '') : uncontrolledValue
  const canInteract = !disabled && !readOnly
  const getOptionId = (option: T) =>
    listboxId + '-option-' + encodeURIComponent(option.value)

  const clearSuggestionState = useCallback(() => {
    setSuggestions([])
    setSuggestionsQuery(null)
    setActiveIndex(-1)
    setIsOpen(false)
    setLoading(false)
  }, [])

  const closeSuggestionList = useCallback(() => {
    setActiveIndex(-1)
    setIsOpen(false)
  }, [])

  const commitSuggestions = useCallback(
    (nextSuggestions: T[], query: string) => {
      setSuggestions(nextSuggestions)
      setSuggestionsQuery(query)
      setActiveIndex(-1)
      setIsOpen(nextSuggestions.length > 0)
      setLoading(false)
    },
    [],
  )

  const startLoading = useCallback((query: string) => {
    setSuggestions([])
    setSuggestionsQuery(query)
    setActiveIndex(-1)
    setIsOpen(true)
    setLoading(true)
  }, [])

  const selectOption = (option: T) => {
    requestVersion.current += 1

    if (option.value !== displayValue) {
      if (!isControlled) {
        setUncontrolledValue(option.value)
      }

      onValueChange?.(option.value)
    }

    onOptionSelect?.(option)
    setSearchInput(null)
    clearSuggestionState()
  }

  useEffect(() => {
    fetchSuggestionsRef.current = fetchSuggestions
  }, [fetchSuggestions])

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return
      }

      if (loadingRef.current) {
        requestVersion.current += 1
        clearSuggestionState()
        return
      }

      closeSuggestionList()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      requestVersion.current += 1
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [clearSuggestionState, closeSuggestionList])

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      isControlled &&
      defaultValue !== undefined &&
      !hasWarnedAboutValueConflict.current
    ) {
      console.warn(
        'AutoComplete received both value and defaultValue. defaultValue will be ignored.',
      )
      hasWarnedAboutValueConflict.current = true
    }
  }, [defaultValue, isControlled])

  useEffect(() => {
    if (!isControlled || value === previousControlledValue.current) {
      return
    }

    previousControlledValue.current = value

    if (pendingControlledValue.current === value) {
      pendingControlledValue.current = null

      if (!isComposingRef.current) {
        setSearchInput(value)
      }

      return
    }

    requestVersion.current += 1
    pendingControlledValue.current = null
    setSearchInput(null)
    clearSuggestionState()
  }, [clearSuggestionState, isControlled, value])

  useEffect(() => {
    if (canInteract) {
      return
    }

    requestVersion.current += 1
    // Restriction changes invalidate async state before interaction resumes.
    // oxlint-disable-next-line react/set-state-in-effect
    clearSuggestionState()
  }, [canInteract, clearSuggestionState])

  useEffect(() => {
    if (searchInput === null || !canInteract) {
      return
    }

    const query = searchInput.trim()
    const version = requestVersion.current

    if (!query) {
      return
    }

    const timer = window.setTimeout(() => {
      let result: T[] | PromiseLike<T[]>

      try {
        result = fetchSuggestionsRef.current(query)
      } catch {
        clearSuggestionState()
        return
      }

      if (Array.isArray(result)) {
        commitSuggestions(result, query)
      } else if (typeof result?.then === 'function') {
        startLoading(query)

        Promise.resolve(result).then(
          (data) => {
            if (version !== requestVersion.current) {
              return
            }

            commitSuggestions(data, query)
          },
          () => {
            if (version !== requestVersion.current) {
              return
            }

            clearSuggestionState()
          },
        )
      }
    }, 300)

    return () => {
      requestVersion.current += 1
      window.clearTimeout(timer)
    }
  }, [
    canInteract,
    clearSuggestionState,
    commitSuggestions,
    searchInput,
    startLoading,
  ])

  const activeOptionId =
    isOpen && canInteract && activeIndex >= 0
      ? getOptionId(suggestions[activeIndex])
      : undefined
  const hasValidSuggestions =
    suggestions.length > 0 && suggestionsQuery === displayValue.trim()

  return (
    <div
      ref={rootRef}
      className="matthew-auto-complete"
      onBlur={(event) => {
        if (
          event.currentTarget.contains(event.relatedTarget as Node | null)
        ) {
          return
        }

        if (loading) {
          requestVersion.current += 1
          clearSuggestionState()
          return
        }

        closeSuggestionList()
      }}
    >
      <input
        ref={ref}
        {...inputProps}
        type={type === 'search' ? 'search' : 'text'}
        disabled={disabled}
        readOnly={readOnly}
        value={displayValue}
        onChange={(event) => {
          if (!canInteract) {
            return
          }

          const nextValue = event.currentTarget.value
          requestVersion.current += 1

          if (!nextValue.trim()) {
            clearSuggestionState()
          } else {
            if (nextValue.trim() !== suggestionsQuery) {
              setIsOpen(false)
            }

            setActiveIndex(-1)
          }

          if (isControlled) {
            pendingControlledValue.current = nextValue
          } else {
            setUncontrolledValue(nextValue)

            if (!isComposingRef.current) {
              setSearchInput(nextValue)
            }
          }

          if (nextValue !== displayValue) {
            onValueChange?.(nextValue)
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen && canInteract}
        aria-activedescendant={activeOptionId}
        className={clsx('matthew-auto-complete__input', className)}
        onCompositionStart={(event) => {
          inputProps.onCompositionStart?.(event)
          isComposingRef.current = true
        }}
        onCompositionEnd={(event) => {
          inputProps.onCompositionEnd?.(event)
          isComposingRef.current = false

          if (!isControlled || event.currentTarget.value === displayValue) {
            setSearchInput(event.currentTarget.value)
          }
        }}
        onFocus={(event) => {
          inputProps.onFocus?.(event)

          if (
            !event.defaultPrevented &&
            canInteract &&
            hasValidSuggestions
          ) {
            setIsOpen(true)
          }
        }}
        onKeyDown={(event) => {
          inputProps.onKeyDown?.(event)

          if (!canInteract) {
            return
          }

          if (!event.defaultPrevented && event.key === 'Tab' && isOpen) {
            if (loading) {
              requestVersion.current += 1
              clearSuggestionState()
            } else {
              closeSuggestionList()
            }
            return
          }

          if (
            !event.defaultPrevented &&
            event.key === 'Escape' &&
            isOpen
          ) {
            event.preventDefault()

            if (loading) {
              requestVersion.current += 1
              clearSuggestionState()
            } else {
              closeSuggestionList()
            }
            return
          }

          if (
            !event.defaultPrevented &&
            event.key === 'Enter' &&
            activeIndex >= 0
          ) {
            event.preventDefault()
            selectOption(suggestions[activeIndex])
            return
          }

          if (
            event.defaultPrevented ||
            !hasValidSuggestions ||
            (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
          ) {
            return
          }

          event.preventDefault()
          setIsOpen(true)
          setActiveIndex((currentIndex) => {
            if (currentIndex < 0) {
              return 0
            }

            const offset = event.key === 'ArrowDown' ? 1 : -1
            return Math.min(
              suggestions.length - 1,
              Math.max(0, currentIndex + offset),
            )
          })
        }}
      />
      {isOpen && canInteract && (
        <ul
          id={listboxId}
          role="listbox"
          aria-busy={loading}
          className="matthew-auto-complete__list"
        >
          {loading && (
            <li role="presentation" className="matthew-auto-complete__loading">
              <span role="status" aria-label="Loading suggestions">
                Loading...
              </span>
            </li>
          )}
          {suggestions.map((option, index) => (
            <li
              id={getOptionId(option)}
              key={option.value}
              role="option"
              aria-selected={activeIndex === index}
              className="matthew-auto-complete__option"
              onClick={() => selectOption(option)}
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => setActiveIndex(index)}
            >
              {renderOption?.(option) ?? option.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
