import { createRef } from 'react'
import {
  createTokens,
  darkTheme,
  lightTheme,
  ThemeProvider,
  tokensToCssVars,
} from '../index'
import type {
  CssVariableMap,
  CssVariableName,
  MatthewSeedToken,
  MatthewThemeConfig,
  MatthewThemeTokens,
  ThemeProviderProps,
} from '../index'
const buttonTheme = {
  components: { Button: {
    background: '#166534', backgroundHover: 'green', backgroundActive: 'darkgreen',
    color: 'white', borderColor: 'green', borderRadius: 8,
    minHeight: 48, fontSize: 16, paddingBlock: 0, paddingInline: 12,
  } },
} satisfies MatthewThemeConfig
const configuredButtonProvider: ThemeProviderProps = {
  theme: buttonTheme, children: <span>配置</span>,
}
// @ts-expect-error 尺寸对象只接受数字，CSS 字符串由底层 CSS 变量使用。
const stringDimension: MatthewThemeConfig = { components: { Button: { borderRadius: '8px' } } }
// @ts-expect-error 不接受任意 CSS 属性。
const arbitraryStyle: MatthewThemeConfig = { components: { Button: { display: 'flex' } } }
// @ts-expect-error 仍不接受未开放的组件配置。
const otherComponent: MatthewThemeConfig = { components: { Upload: {} } }
// @ts-expect-error 颜色字段只接受字符串。
const numericColor: MatthewThemeConfig = { components: { Button: { color: 123 } } }
// @ts-expect-error null 不作为清空继承指令。
const nullRadius: MatthewThemeConfig = { components: { Button: { borderRadius: null } } }
void [configuredButtonProvider, stringDimension, arbitraryStyle, otherComponent, numericColor, nullRadius]

const menuTheme = {
  components: {
    Button: { borderRadius: 8 },
    Menu: {
      background: '#ffffff', borderColor: 'gray', itemColor: 'black',
      itemHoverBackground: '#f1f5f9', itemSelectedBackground: '#dcfce7',
      itemSelectedColor: '#166534', itemMinHeight: 48, itemFontSize: 16,
      itemBorderRadius: 8, itemPaddingBlock: 0, itemPaddingInline: 12,
      popupBackground: 'white', popupShadow: 'none',
    },
  },
} satisfies MatthewThemeConfig
const configuredMenuProvider: ThemeProviderProps = { theme: menuTheme, children: '菜单配置' }
// @ts-expect-error 菜单项尺寸只接受数字。
const stringMenuDimension: MatthewThemeConfig = { components: { Menu: { itemMinHeight: '48px' } } }
// @ts-expect-error 不开放任意CSS字段。
const arbitraryMenuStyle: MatthewThemeConfig = { components: { Menu: { display: 'grid' } } }
// @ts-expect-error 菜单配色必须是字符串。
const numericMenuColor: MatthewThemeConfig = { components: { Menu: { itemColor: 123 } } }
// @ts-expect-error 阴影同样只接受CSS字符串。
const numericMenuShadow: MatthewThemeConfig = { components: { Menu: { popupShadow: 8 } } }
// @ts-expect-error null不是清空继承指令。
const nullMenuRadius: MatthewThemeConfig = { components: { Menu: { itemBorderRadius: null } } }
void [configuredMenuProvider, stringMenuDimension, arbitraryMenuStyle, numericMenuColor, numericMenuShadow, nullMenuRadius]


const autoCompleteTheme = {
  components: {
    Button: { borderRadius: 8 }, Menu: { itemBorderRadius: 8 },
    AutoComplete: {
      fontSize: 16, inputBackground: 'white', inputColor: 'black',
      borderColor: 'gray', inputHoverBorderColor: 'green',
      inputMinHeight: 48, inputBorderRadius: 8, inputPaddingBlock: 0, inputPaddingInline: 12,
      optionColor: 'black', optionActiveBackground: '#dcfce7', optionActiveColor: '#166534',
      optionBorderRadius: 0, optionPaddingBlock: 10, optionPaddingInline: 12,
      popupBackground: 'white', popupShadow: 'none',
    },
  },
} satisfies MatthewThemeConfig
const configuredAutoCompleteProvider: ThemeProviderProps = { theme: autoCompleteTheme, children: '搜索配置' }
// @ts-expect-error 字号只接受设计px数字。
const stringAutoFont: MatthewThemeConfig = { components: { AutoComplete: { fontSize: '16px' } } }
// @ts-expect-error 建议padding也只接受数字。
const stringAutoPadding: MatthewThemeConfig = { components: { AutoComplete: { optionPaddingInline: '12px' } } }
// @ts-expect-error 不接受任意CSS字段。
const arbitraryAutoStyle: MatthewThemeConfig = { components: { AutoComplete: { display: 'grid' } } }
// @ts-expect-error 颜色不能退化成数字或any。
const numericAutoColor: MatthewThemeConfig = { components: { AutoComplete: { inputColor: 123 } } }
// @ts-expect-error 阴影只接受字符串。
const numericAutoShadow: MatthewThemeConfig = { components: { AutoComplete: { popupShadow: 8 } } }
// @ts-expect-error null不是清空继承指令。
const nullAutoRadius: MatthewThemeConfig = { components: { AutoComplete: { inputBorderRadius: null } } }
void [configuredAutoCompleteProvider, stringAutoFont, stringAutoPadding, arbitraryAutoStyle,
  numericAutoColor, numericAutoShadow, nullAutoRadius]

const config: MatthewThemeConfig = {
  seed: {
    colorPrimary: '#00b96b',
  } satisfies Partial<MatthewSeedToken>,
  tokens: {
    colorSurface: '#101820',
  } satisfies Partial<MatthewThemeTokens>,
}

const validProviderProps: ThemeProviderProps = {
  theme: config,
  id: 'theme-root',
  className: 'preview',
  style: { padding: 16 },
  'aria-label': '主题预览',
  children: <span>内容</span>,
}

const validProvider = <ThemeProvider {...validProviderProps} />
const defaultProvider = <ThemeProvider>内容</ThemeProvider>
const tokens: MatthewThemeTokens = createTokens(lightTheme)
const variables: CssVariableMap = tokensToCssVars(tokens)
const variableName: CssVariableName = '--matthew-ui-color-primary'

createTokens(darkTheme)

const wrapperRef = createRef<HTMLDivElement>()

// @ts-expect-error 第一版 ThemeProvider 不转发 ref
const providerWithRef = <ThemeProvider ref={wrapperRef}>内容</ThemeProvider>

// @ts-expect-error ThemeProvider 必须拥有可渲染的 children
const providerWithoutChildren = <ThemeProvider />

void [
  validProvider,
  defaultProvider,
  variables,
  variableName,
  providerWithRef,
  providerWithoutChildren,
]
