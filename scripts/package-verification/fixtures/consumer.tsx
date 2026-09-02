import { createRef } from 'react'
import {
  AutoComplete,
  Button,
  createTokens,
  darkTheme,
  lightTheme,
  LinkButton,
  Menu,
  ThemeProvider,
  tokensToCssVars,
} from 'matthew-ui'
import { Button as SubpathButton } from 'matthew-ui/button'
import { AutoComplete as SubpathAutoComplete } from 'matthew-ui/auto-complete'
import {
  darkTheme as subpathDarkTheme,
  ThemeProvider as SubpathThemeProvider,
} from 'matthew-ui/theme'
import type {
  AutoCompleteOption,
  AutoCompleteProps,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  CssVariableMap,
  CssVariableName,
  LinkButtonProps,
  MatthewSeedToken,
  MatthewThemeConfig,
  MatthewThemeTokens,
  MenuItemProps,
  MenuLinkItemProps,
  MenuMode,
  MenuProps,
  MenuSubMenuProps,
  ThemeProviderProps,
} from 'matthew-ui'
import type { ButtonProps as SubpathButtonProps } from 'matthew-ui/button'
import type {
  AutoCompleteProps as SubpathAutoCompleteProps,
} from 'matthew-ui/auto-complete'
import type { MatthewThemeConfig as SubpathThemeConfig } from 'matthew-ui/theme'
// @ts-expect-error Button 子路径不公开 Menu 类型。
import type { MenuProps as InvalidButtonMenuProps } from 'matthew-ui/button'
// @ts-expect-error Theme 子路径不公开组件类型。
import type { ButtonProps as InvalidThemeButtonProps } from 'matthew-ui/theme'

type PlayerOption = AutoCompleteOption & {
  number: number
}

type PublicTypeContract = [
  AutoCompleteProps<PlayerOption>,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  LinkButtonProps,
  MenuItemProps,
  MenuLinkItemProps,
  MenuMode,
  MenuProps,
  MenuSubMenuProps,
  ThemeProviderProps,
  MatthewSeedToken,
  MatthewThemeConfig,
  MatthewThemeTokens,
  CssVariableMap,
  CssVariableName,
  SubpathButtonProps,
  SubpathAutoCompleteProps<PlayerOption>,
  SubpathThemeConfig,
]

declare const publicTypes: PublicTypeContract
void publicTypes

const players: PlayerOption[] = [
  { value: 'james', number: 23 },
  { value: 'caruso', number: 4 },
]
const buttonRef = createRef<HTMLButtonElement>()
const anchorRef = createRef<HTMLAnchorElement>()
const inputRef = createRef<HTMLInputElement>()
const divRef = createRef<HTMLDivElement>()


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
const stringAutoFont: SubpathThemeConfig = { components: { AutoComplete: { fontSize: '16px' } } }
// @ts-expect-error 建议padding也只接受数字。
const stringAutoPadding: MatthewThemeConfig = { components: { AutoComplete: { optionPaddingInline: '12px' } } }
// @ts-expect-error 不接受任意CSS字段。
const arbitraryAutoStyle: SubpathThemeConfig = { components: { AutoComplete: { display: 'grid' } } }
// @ts-expect-error 颜色不能退化成数字或any。
const numericAutoColor: MatthewThemeConfig = { components: { AutoComplete: { inputColor: 123 } } }
// @ts-expect-error 阴影只接受字符串。
const numericAutoShadow: SubpathThemeConfig = { components: { AutoComplete: { popupShadow: 8 } } }
// @ts-expect-error null不是清空继承指令。
const nullAutoRadius: MatthewThemeConfig = { components: { AutoComplete: { inputBorderRadius: null } } }
void [configuredAutoCompleteProvider, stringAutoFont, stringAutoPadding, arbitraryAutoStyle,
  numericAutoColor, numericAutoShadow, nullAutoRadius]

const autoCompleteSubpathConfig: SubpathThemeConfig = autoCompleteTheme
const autoCompleteSubpathProvider = <SubpathThemeProvider theme={autoCompleteSubpathConfig}>配置</SubpathThemeProvider>
void autoCompleteSubpathProvider

const validButton = <Button ref={buttonRef}>Save</Button>
const validSubpathButton = <SubpathButton>Subpath save</SubpathButton>
const validSubpathAutoComplete = (
  <SubpathAutoComplete fetchSuggestions={() => players} />
)
const validSubpathTheme = (
  <SubpathThemeProvider theme={{
    ...subpathDarkTheme,
    components: {
      Button: { borderRadius: 8, background: '#166534' },
      Menu: {
        background: 'white', borderColor: 'gray', itemColor: 'black',
        itemHoverBackground: '#f1f5f9', itemSelectedBackground: '#dcfce7',
        itemSelectedColor: '#166534', itemMinHeight: 48, itemFontSize: 16,
        itemBorderRadius: 8, itemPaddingBlock: 0, itemPaddingInline: 12,
        popupBackground: 'white', popupShadow: 'none',
      },
    },
  }}>
    <span>Theme</span>
  </SubpathThemeProvider>
)
const validLinkButton = (
  <LinkButton href="/docs" ref={anchorRef}>Docs</LinkButton>
)
const explicitGeneric = (
  <AutoComplete<PlayerOption>
    fetchSuggestions={() => players}
    onOptionSelect={(player) => player.number.toFixed()}
    ref={inputRef}
    renderOption={(player) => player.number}
  />
)
const inferredGeneric = (
  <AutoComplete
    fetchSuggestions={() => players}
    onOptionSelect={(player) => {
      player.number.toFixed()
      // @ts-expect-error Inference must not degrade the option to any.
      player.number.toUpperCase()
    }}
    renderOption={(player) => player.number}
  />
)
const validMenu = (
  <Menu aria-label="Navigation" mode="vertical">
    <Menu.Item value="home">Home</Menu.Item>
    <Menu.LinkItem href="/docs" value="docs">Docs</Menu.LinkItem>
    <Menu.SubMenu title="Components" value="components">
      <Menu.Item value="button">Button</Menu.Item>
    </Menu.SubMenu>
  </Menu>
)
const validTheme = (
  <ThemeProvider
    theme={{ ...darkTheme, components: {
      Button: { minHeight: 48, paddingBlock: 0 },
      Menu: { itemMinHeight: 48, itemSelectedColor: '#166534' },
    } }}
    className="theme-preview"
  >
    <Button>Dark button</Button>
  </ThemeProvider>
)
const themeVariables = tokensToCssVars(createTokens(lightTheme))

// @ts-expect-error 真实包的Menu尺寸不能退化为字符串或any。
const invalidMenuDimension: MatthewThemeConfig = { components: { Menu: { itemMinHeight: '48px' } } }
// @ts-expect-error theme子路径保持同一13字段合同。
const invalidMenuField: SubpathThemeConfig = { components: { Menu: { display: 'grid' } } }
// @ts-expect-error 阴影必须是CSS字符串。
const invalidMenuShadow: SubpathThemeConfig = { components: { Menu: { popupShadow: 1 } } }

// @ts-expect-error Button refs point to HTMLButtonElement.
const buttonWithWrongRef = <Button ref={anchorRef}>Save</Button>
// @ts-expect-error LinkButton refs point to HTMLAnchorElement.
const linkWithWrongRef = <LinkButton href="/docs" ref={buttonRef}>Docs</LinkButton>
const autoCompleteWithWrongRef = (
  <AutoComplete
    // @ts-expect-error AutoComplete refs point to HTMLInputElement.
    ref={divRef}
    fetchSuggestions={() => players}
  />
)

void [
  validButton,
  validSubpathButton,
  validSubpathAutoComplete,
  validSubpathTheme,
  validLinkButton,
  explicitGeneric,
  inferredGeneric,
  validMenu,
  validTheme,
  themeVariables,
  invalidMenuDimension,
  invalidMenuField,
  invalidMenuShadow,
  buttonWithWrongRef,
  linkWithWrongRef,
  autoCompleteWithWrongRef,
]
