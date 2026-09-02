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

export interface ThemeProviderProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  theme?: MatthewThemeConfig
  children: ReactNode
}

const ThemeConfigContext = createContext<MatthewThemeConfig | undefined>(
  undefined,
)

function mergeThemeConfig(
  parentTheme: MatthewThemeConfig | undefined,
  theme: MatthewThemeConfig | undefined,
): MatthewThemeConfig {
  return {
    components: {
      // AutoComplete也按字段独立合并：子级只改一种组件不能丢失其他配置。
      AutoComplete: {
        ...parentTheme?.components?.AutoComplete,
        ...Object.fromEntries(
          Object.entries(theme?.components?.AutoComplete ?? {}).filter(
            ([, value]) => value !== undefined,
          ),
        ),
      },
      // 每个组件分别合并，不能用整个子 components 对象替换父级配置。
      Menu: {
        ...parentTheme?.components?.Menu,
        ...Object.fromEntries(
          Object.entries(theme?.components?.Menu ?? {}).filter(
            ([, value]) => value !== undefined,
          ),
        ),
      },
      Button: {
        ...parentTheme?.components?.Button,
        // 组件字段的 undefined 表示继承，不能通过普通 spread 把父值擦掉。
        ...Object.fromEntries(
          Object.entries(theme?.components?.Button ?? {}).filter(
            ([, value]) => value !== undefined,
          ),
        ),
      },
    },
    seed: {
      ...parentTheme?.seed,
      // 与组件Token一致：显式undefined表示未提供，不能擦除父级Seed。
      ...Object.fromEntries(
        Object.entries(theme?.seed ?? {}).filter(
          ([, value]) => value !== undefined,
        ),
      ),
    },
    tokens: {
      ...parentTheme?.tokens,
      // 最终Token也按字段继承；null等错误值仍保留并交给运行时校验。
      ...Object.fromEntries(
        Object.entries(theme?.tokens ?? {}).filter(
          ([, value]) => value !== undefined,
        ),
      ),
    },
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
