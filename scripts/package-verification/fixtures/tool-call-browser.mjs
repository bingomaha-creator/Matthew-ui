import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, ToolCall, darkTheme } from 'matthew-ui'
import { ToolCall as SubpathToolCall } from 'matthew-ui/tool-call'

// 消费真实安装包；不用源码alias或手工状态class。ref 回调把真实挂载写入 data 属性。
function RefToolCall(props) {
  return h(ToolCall, {
    ...props,
    ref: (element) => {
      if (element) element.dataset.refMounted = 'true'
    },
  })
}

// 固定合同配置：与 tool-call-style-checks.mjs 的固定预期独立写出。
const configuredTheme = {
  components: { ToolCall: {
    nameColor: 'rgb(20 20 20)', summaryColor: 'rgb(90 90 90)', detailColor: 'rgb(0 128 0)',
    borderColor: 'rgb(0 0 255)', headerHoverBackground: 'rgb(255 255 0)',
    pendingColor: 'rgb(0 0 0)', runningColor: 'rgb(255 0 255)',
    completedColor: 'rgb(0 255 255)', errorColor: 'rgb(255 0 0)',
    stoppedColor: 'rgb(128 128 128)', borderRadius: 0, headerMinHeight: 40,
  } },
}

function toolCall(testId, props, ...children) {
  return h(ToolCall, { 'data-testid': testId, defaultOpen: true, ...props }, ...children)
}

createRoot(document.getElementById('app')).render(h('main', null,
  h('section', { 'data-tool-call-default': '', style: { minHeight: '160px' } },
    h(RefToolCall, { 'data-testid': 'tool-call-ref', name: '读取项目文件', status: 'running', summary: '正在执行…' }, '读取项目结构'),
    toolCall('status-pending', { name: '排队', status: 'pending' }, '内容'),
    toolCall('status-running', { name: '执行', status: 'running' }, '内容'),
    toolCall('status-completed', { name: '完成', status: 'completed' }, '内容'),
    toolCall('status-error', { name: '失败', status: 'error' }, '内容'),
    toolCall('status-stopped', { name: '中止', status: 'stopped' }, '内容'),
    h(ToolCall, { 'data-testid': 'row-completed', name: '只读行', status: 'completed', summary: '已读取 3 个文件' }),
    h(ToolCall, {
      'data-testid': 'labels-running',
      name: '带标签',
      status: 'running',
      statusLabels: {
        pending: '排队中', running: '执行中', completed: '已完成',
        error: '失败', stopped: '已中止',
      },
    }, '内容')),
  h('section', { 'data-tool-call-custom': '', style: { minHeight: '160px' } },
    h(ThemeProvider, { theme: configuredTheme },
      toolCall('status-configured-error', { name: '定制工具', status: 'error', summary: '定制摘要' }, '定制详情'),
      h(SubpathToolCall, { name: '子路径实例', status: 'stopped', defaultOpen: true }, '子路径内容'))),
  h('section', { 'data-tool-call-dark': '', style: { minHeight: '120px' } },
    h(ThemeProvider, { theme: darkTheme },
      toolCall('status-dark-running', { name: '暗色标题', status: 'running' }, '暗色内容'))),
  h('section', { 'data-tool-call-nested': '', style: { minHeight: '120px' } },
    h(ThemeProvider, { theme: { components: { ToolCall: { runningColor: 'rgb(255 0 0)' } } } },
      h(ThemeProvider, { theme: { components: { ToolCall: { stoppedColor: 'rgb(0 255 0)' } } } },
        toolCall('status-nested-running', { name: '嵌套运行', status: 'running' }, '嵌套内容'),
        toolCall('status-nested-stopped', { name: '嵌套中止', status: 'stopped' }, '嵌套内容')))),
))
