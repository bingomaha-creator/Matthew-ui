import { createElement } from 'react'
import { darkTheme, ThemeProvider } from 'matthew-ui/theme'

export const view = createElement(ThemeProvider, { theme: darkTheme }, 'Theme')
