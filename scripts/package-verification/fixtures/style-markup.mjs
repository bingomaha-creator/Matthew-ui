import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button, LinkButton } from 'matthew-ui/button'
import { ThemeProvider } from 'matthew-ui/theme'

// 必须在临时消费项目运行：Button 和 React 均来自真实安装包，不使用源码 alias。
// SSR 仅提供真实组件 HTML；计算样式由主验证器在 Chromium 中读取。
const configured = createElement('div', null,
  createElement(ThemeProvider, {
    theme: { components: { Button: {
      background: '#166534', backgroundHover: '#14532d', backgroundActive: '#052e16',
      color: '#ffffff', borderColor: '#166534', borderRadius: 20,
      minHeight: 48, fontSize: 16, paddingBlock: 10, paddingInline: 24,
    } } },
  },
  createElement(Button, null, 'Custom save'),
  createElement(LinkButton, { href: '#docs' }, 'Custom docs')),
  createElement(Button, null, 'Outside'),
)
console.log(renderToStaticMarkup(process.argv.includes('--configured')
  ? configured
  : createElement(Button, null, 'Save')))
