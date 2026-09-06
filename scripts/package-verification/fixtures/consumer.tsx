import { createRef } from 'react'
import {
  AutoComplete,
  Button,
  createTokens,
  darkTheme,
  lightTheme,
  LinkButton,
  Menu,
  TaskList,
  ThemeProvider,
  Thinking,
  ToolCall,
  tokensToCssVars,
} from 'matthew-ui'
import { Button as SubpathButton } from 'matthew-ui/button'
import { AutoComplete as SubpathAutoComplete } from 'matthew-ui/auto-complete'
import { Thinking as SubpathThinking } from 'matthew-ui/thinking'
import { ToolCall as SubpathToolCall } from 'matthew-ui/tool-call'
import { TaskList as SubpathTaskList } from 'matthew-ui/task-list'
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
  ThinkingProps,
  ThinkingStatus,
  ToolCallProps,
  ToolCallStatus,
  TaskListItem,
  TaskListProps,
  TaskStatus,
} from 'matthew-ui'
import type { ButtonProps as SubpathButtonProps } from 'matthew-ui/button'
import type { ThinkingProps as SubpathThinkingProps } from 'matthew-ui/thinking'
import type { ToolCallProps as SubpathToolCallProps } from 'matthew-ui/tool-call'
import type { TaskListProps as SubpathTaskListProps } from 'matthew-ui/task-list'
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
  ThinkingProps,
  ThinkingStatus,
  ToolCallProps,
  ToolCallStatus,
  TaskListItem,
  TaskListProps,
  TaskStatus,
  MatthewSeedToken,
  MatthewThemeConfig,
  MatthewThemeTokens,
  CssVariableMap,
  CssVariableName,
  SubpathButtonProps,
  SubpathAutoCompleteProps<PlayerOption>,
  SubpathThinkingProps,
  SubpathToolCallProps,
  SubpathTaskListProps,
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

const controlledThinking = (
  <Thinking
    ref={divRef}
    title="分析中"
    status="running"
    statusLabels={{
      running: 'Running', completed: 'Completed', stopped: 'Stopped', error: 'Failed',
    }}
    defaultOpen={false}
    onOpenChange={(nextOpen) => void nextOpen}
  >
    步骤
  </Thinking>
)
const subpathThinking = (
  <SubpathThinking title="子路径分析" status="completed" open>
    步骤
  </SubpathThinking>
)
const thinkingTheme: MatthewThemeConfig = { components: { Thinking: {
  titleColor: '#0f172a', contentColor: 'gray', borderColor: 'blue',
  headerHoverBackground: 'white', runningColor: 'green', completedColor: 'cyan',
  stoppedColor: 'gray', errorColor: 'red', borderRadius: 0, headerMinHeight: 48,
} } }
void [controlledThinking, subpathThinking, thinkingTheme]

// @ts-expect-error Thinking 圆角不允许字符串尺寸。
const invalidThinkingRadius: MatthewThemeConfig = { components: { Thinking: { borderRadius: '8px' } } }
// @ts-expect-error Thinking 标题颜色不能退化成数字。
const invalidThinkingColor: SubpathThemeConfig = { components: { Thinking: { titleColor: 5 } } }
void [invalidThinkingRadius, invalidThinkingColor]

const toolCallLabels: Record<ToolCallStatus, string> = {
  pending: '排队中', running: '执行中', completed: '已完成',
  error: '失败', stopped: '已中止',
}
const controlledToolCall = (
  <ToolCall
    ref={divRef}
    name="读取项目文件"
    status="running"
    summary="正在执行…"
    statusLabels={toolCallLabels}
    onOpenChange={(nextOpen) => void nextOpen}
  >
    步骤
  </ToolCall>
)
const subpathToolCall = (
  <SubpathToolCall name="子路径工具" status="stopped" />
)
const toolCallTheme: MatthewThemeConfig = { components: { ToolCall: {
  nameColor: '#0f172a', summaryColor: 'gray', detailColor: 'gray', borderColor: 'blue',
  headerHoverBackground: 'white', pendingColor: 'gray', runningColor: 'green',
  completedColor: 'cyan', errorColor: 'red', stoppedColor: 'gray',
  borderRadius: 0, headerMinHeight: 32,
} } }
void [controlledToolCall, subpathToolCall, toolCallTheme]

// @ts-expect-error ToolCall 圆角不允许字符串尺寸。
const invalidToolCallRadius: MatthewThemeConfig = { components: { ToolCall: { borderRadius: '8px' } } }
const invalidToolCallLabels: ToolCallProps = {
  name: '读取项目文件',
  status: 'running',
  // @ts-expect-error ToolCall 状态文案必须是完整五键映射。
  statusLabels: { running: '执行中' },
}
void [invalidToolCallRadius, invalidToolCallLabels]

const taskListItems: TaskListItem[] = [
  { id: 'contract', title: '确认合同', status: 'completed', summary: '已评审' },
  { id: 'quality', title: '质量检查', status: 'running' },
  { id: 'verify', title: '复核发布包', status: 'pending' },
]
const controlledTaskList = (
  <TaskList
    ref={divRef}
    title="实施计划"
    items={taskListItems}
    statusLabels={{
      pending: '排队中', running: '执行中', completed: '已完成',
      error: '失败', stopped: '已中止',
    }}
    onOpenChange={(nextOpen) => void nextOpen}
  />
)
const subpathTaskList = (
  <SubpathTaskList title="子路径计划" items={taskListItems} />
)
const taskListTheme: MatthewThemeConfig = { components: { TaskList: {
  background: 'white', borderColor: 'gray', titleColor: '#0f172a', progressColor: 'gray',
  itemColor: 'black', summaryColor: 'gray', headerHoverBackground: 'white',
  pendingColor: 'gray', runningColor: 'green', completedColor: 'cyan',
  errorColor: 'red', stoppedColor: 'gray', borderRadius: 0, headerMinHeight: 48, itemMinHeight: 40,
} } }
void [controlledTaskList, subpathTaskList, taskListTheme]

// @ts-expect-error TaskList 圆角不允许字符串尺寸。
const invalidTaskListRadius: MatthewThemeConfig = { components: { TaskList: { borderRadius: '8px' } } }
const invalidTaskListItem: TaskListProps = {
  title: '实施计划',
  items: [
    // @ts-expect-error 条目缺少必填 status。
    { id: 'a', title: '任务一' },
  ],
}
void [invalidTaskListRadius, invalidTaskListItem]

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
