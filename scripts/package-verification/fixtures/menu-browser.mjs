import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import { Menu } from 'matthew-ui/menu'
import { ThemeProvider, darkTheme } from 'matthew-ui/theme'

// 消费真实安装包；不用源码alias或手工状态class。父标题/浮层等待挂载注册后再验收。
function sample(label) {
  return h(Menu, { 'aria-label': label, defaultValue: 'docs', openValues: ['group'] },
    h(Menu.Item, { value: 'home' }, 'Home'),
    h(Menu.SubMenu, { value: 'group', title: 'Components' },
      h(Menu.LinkItem, { value: 'docs', href: '#docs' }, 'Docs'),
      h(Menu.Item, { value: 'action' }, 'Action')))
}
createRoot(document.getElementById('app')).render(h('main', null,
  h('section', { 'data-menu-default': '', 'aria-label': 'Default', style: { minHeight: '220px' } }, sample('Default navigation')),
  h(ThemeProvider, {
    'data-menu-custom': '', style: { minHeight: '260px' },
    theme: { components: { Menu: {
      background: '#fafafa', borderColor: '#166534', itemColor: '#14532d',
      itemHoverBackground: '#bbf7d0', itemSelectedBackground: '#dcfce7', itemSelectedColor: '#166534',
      itemMinHeight: 48, itemFontSize: 16, itemBorderRadius: 12,
      itemPaddingBlock: 10, itemPaddingInline: 20,
      popupBackground: '#f0fdf4', popupShadow: 'none',
    } } },
  }, sample('Configured navigation')),
  h(ThemeProvider, {
    theme: darkTheme, 'data-menu-dark': '', style: { minHeight: '220px' },
  }, sample('Dark navigation')),
))
