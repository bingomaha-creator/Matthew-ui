import { Menu } from '../../index'
import type { MenuLinkItemProps, MenuMode, MenuProps } from '../../index'

const validModes: MenuMode[] = ['horizontal', 'vertical']

const validMenuProps = {
  mode: 'vertical',
  value: 'button',
  openValues: ['components'],
  onValueChange: (_value: string) => undefined,
  onOpenValuesChange: (_values: string[]) => undefined,
  'aria-label': '组件导航',
} satisfies MenuProps

const validMenu = (
  <Menu {...validMenuProps}>
    <Menu.Item disabled name="action" type="submit" value="refresh">
      刷新
    </Menu.Item>
    <Menu.LinkItem href="/docs" target="_blank" value="docs">
      文档
    </Menu.LinkItem>
    <Menu.SubMenu data-section="components" title="组件" value="components">
      <Menu.Item value="button">Button</Menu.Item>
    </Menu.SubMenu>
  </Menu>
)

// @ts-expect-error diagonal 不是约定的 Menu mode
const menuWithInvalidMode = <Menu mode="diagonal" />

// @ts-expect-error Menu.Item 必须有稳定 value
const itemWithoutValue = <Menu.Item>首页</Menu.Item>

// @ts-expect-error Menu.Item 不接收只属于链接的 href
const itemWithHref = <Menu.Item href="/docs" value="docs">文档</Menu.Item>

// @ts-expect-error Menu.LinkItem 的 href 是必填属性
const linkItemWithoutHref = <Menu.LinkItem value="docs">文档</Menu.LinkItem>

// @ts-expect-error Menu.LinkItem 始终保持 link 语义
const linkItemWithOverriddenRole = <Menu.LinkItem href="/docs" role="button" value="docs">文档</Menu.LinkItem>

const linkItemPropsWithControlledAria = {
  href: '/docs',
  value: 'docs',
  // @ts-expect-error Menu.LinkItem 的禁用语义只由 disabled 控制
  'aria-disabled': 'true',
} satisfies MenuLinkItemProps

// @ts-expect-error Menu.SubMenu 必须提供 title
const subMenuWithoutTitle = <Menu.SubMenu value="components" />

// @ts-expect-error Menu.SubMenu 必须有稳定 value
const subMenuWithoutValue = <Menu.SubMenu title="组件" />

void [
  validModes,
  validMenuProps,
  validMenu,
  menuWithInvalidMode,
  itemWithoutValue,
  itemWithHref,
  linkItemWithoutHref,
  linkItemWithOverriddenRole,
  linkItemPropsWithControlledAria,
  subMenuWithoutTitle,
  subMenuWithoutValue,
]
