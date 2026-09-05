import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, Thinking, darkTheme } from 'matthew-ui'
import { Thinking as SubpathThinking } from 'matthew-ui/thinking'

// 消费真实安装包；不用源码alias或手工状态class。ref 回调把真实挂载写入 data 属性。
function RefThinking(props) {
  return h(Thinking, {
    ...props,
    ref: (element) => {
      if (element) element.dataset.refMounted = 'true'
    },
  })
}

// 固定合同配置：与 thinking-style-checks.mjs 的固定预期独立写出。
const configuredTheme = {
  components: { Thinking: {
    titleColor: 'rgb(20 20 20)', contentColor: 'rgb(0 128 0)',
    borderColor: 'rgb(0 0 255)', headerHoverBackground: 'rgb(255 255 0)',
    runningColor: 'rgb(255 0 255)', completedColor: 'rgb(0 255 255)',
    stoppedColor: 'rgb(128 128 128)', errorColor: 'rgb(255 0 0)',
    borderRadius: 0, headerMinHeight: 48,
  } },
}

createRoot(document.getElementById('app')).render(h('main', null,
  h('section', { 'data-thinking-default': '', style: { minHeight: '120px' } },
    h(RefThinking, { 'data-testid': 'thinking-ref', title: '正在分析项目' }, '读取项目结构'),
    h(Thinking, { 'data-testid': 'status-running', title: '运行中', status: 'running', defaultOpen: true }, '内容'),
    h(Thinking, { 'data-testid': 'status-completed', title: '已完成', status: 'completed', defaultOpen: true }, '内容'),
    h(Thinking, { 'data-testid': 'status-stopped', title: '已中止', status: 'stopped', defaultOpen: true }, '内容'),
    h(Thinking, { 'data-testid': 'status-error', title: '失败', status: 'error', defaultOpen: true }, '内容')),
  h('section', { 'data-thinking-custom': '', style: { minHeight: '120px' } },
    h(ThemeProvider, { theme: configuredTheme },
      h(Thinking, { 'data-testid': 'status-configured-error', title: '定制标题', status: 'error', defaultOpen: true }, '定制内容'),
      h(SubpathThinking, { title: '子路径实例', status: 'stopped', defaultOpen: true }, '子路径内容'))),
  h('section', { 'data-thinking-dark': '', style: { minHeight: '120px' } },
    h(ThemeProvider, { theme: darkTheme },
      h(Thinking, { 'data-testid': 'status-dark-running', title: '暗色标题', status: 'running', defaultOpen: true }, '暗色内容'))),
  h('section', { 'data-thinking-nested': '', style: { minHeight: '120px' } },
    h(ThemeProvider, { theme: { components: { Thinking: { runningColor: 'rgb(255 0 0)' } } } },
      h(ThemeProvider, { theme: { components: { Thinking: { stoppedColor: 'rgb(0 255 0)' } } } },
        h(Thinking, { 'data-testid': 'status-nested-running', title: '嵌套运行', status: 'running', defaultOpen: true }, '嵌套内容'),
        h(Thinking, { 'data-testid': 'status-nested-stopped', title: '嵌套中止', status: 'stopped', defaultOpen: true }, '嵌套内容')))),
))
