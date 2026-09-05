import {
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createTokens, tokensToCssVars } from './tokens'
import type { MatthewThemeConfig } from './tokens'
import { buttonTokensToCssVars } from './componentTokens'
import { menuTokensToCssVars } from './menuComponentTokens'
import { autoCompleteTokensToCssVars } from './autoCompleteComponentTokens'
import { thinkingTokensToCssVars } from './thinkingComponentTokens'

export interface ThemeProviderProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  theme?: MatthewThemeConfig
  children: ReactNode
}

const ThemeConfigContext = createContext<MatthewThemeConfig | undefined>(
  undefined,
)

/**
 * 父子主题合并的统一规则：父层字段 + 当前层非 undefined 字段。
 * 显式 undefined 表示省略并继承父级；null 等错误值保留，交给运行时校验。
 * 只按字段合并，不能用整个子层对象替换父层配置。
 */
function mergeDefinedFields<Fields extends object>(
  parentFields: Fields | undefined,
  currentFields: Fields | undefined,
): Fields {
  return {
    ...parentFields,
    ...Object.fromEntries(
      Object.entries(currentFields ?? {}).filter(
        ([, value]) => value !== undefined,
      ),
    ),
  } as Fields
}

function mergeThemeConfig(
  parentTheme: MatthewThemeConfig | undefined,
  theme: MatthewThemeConfig | undefined,
): MatthewThemeConfig {
  return {
    components: {
      // 每个组件分别合并：子级只改一种组件不能丢失其他组件配置。
      AutoComplete: mergeDefinedFields(
        parentTheme?.components?.AutoComplete,
        theme?.components?.AutoComplete,
      ),
      Thinking: mergeDefinedFields(
        parentTheme?.components?.Thinking,
        theme?.components?.Thinking,
      ),
      Menu: mergeDefinedFields(
        parentTheme?.components?.Menu,
        theme?.components?.Menu,
      ),
      Button: mergeDefinedFields(
        parentTheme?.components?.Button,
        theme?.components?.Button,
      ),
    },
    seed: mergeDefinedFields(parentTheme?.seed, theme?.seed),
    tokens: mergeDefinedFields(parentTheme?.tokens, theme?.tokens),
  }
}

export function ThemeProvider({
  theme,
  children,
  style,
  ...wrapperProps
}: ThemeProviderProps): ReactElement {
  const parentTheme = useContext(ThemeConfigContext)
  const mergedTheme = useMemo(
    () => mergeThemeConfig(parentTheme, theme),
    [parentTheme, theme],
  )
  const cssVariables = tokensToCssVars(createTokens(mergedTheme))
  const componentVariables = {
    ...buttonTokensToCssVars(mergedTheme.components?.Button),
    ...menuTokensToCssVars(mergedTheme.components?.Menu),
    ...autoCompleteTokensToCssVars(mergedTheme.components?.AutoComplete),
    ...thinkingTokensToCssVars(mergedTheme.components?.Thinking),
  }

  // 只覆盖配置实际输出的变量；无配置时不写组件默认值，让 CSS 继承继续工作。
  // React 会在更新时移除不再输出的变量，避免上一次配置残留。
  return (
    <ThemeConfigContext.Provider value={mergedTheme}>
      <div
        {...wrapperProps}
        style={{ ...style, ...cssVariables, ...componentVariables }}
      >
        {children}
      </div>
    </ThemeConfigContext.Provider>
  )
}
