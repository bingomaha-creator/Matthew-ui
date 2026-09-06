import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, TaskList, darkTheme } from 'matthew-ui'
import { TaskList as SubpathTaskList } from 'matthew-ui/task-list'

// 消费真实安装包；不用源码alias或手工状态class。ref 回调把真实挂载写入 data 属性。
function RefTaskList(props) {
  return h(TaskList, {
    ...props,
    ref: (element) => {
      if (element) element.dataset.refMounted = 'true'
    },
  })
}

const sampleItems = [
  { id: 'contract', title: '确认合同', status: 'completed', summary: '31 个测试' },
  { id: 'implement', title: '实现组件', status: 'completed' },
  { id: 'quality', title: '质量检查', status: 'running', summary: '正在执行…' },
  { id: 'verify', title: '复核发布包', status: 'pending' },
  { id: 'release', title: '提交检查点', status: 'error' },
  { id: 'stop', title: '中止任务', status: 'stopped' },
]

// 固定合同配置：与 task-list-style-checks.mjs 的固定预期独立写出。
const configuredTheme = {
  components: { TaskList: {
    background: 'rgb(250 250 250)', borderColor: 'rgb(0 0 255)', titleColor: 'rgb(20 20 20)',
    progressColor: 'rgb(90 90 90)', itemColor: 'rgb(0 128 0)', summaryColor: 'rgb(128 128 128)',
    headerHoverBackground: 'rgb(255 255 0)', pendingColor: 'rgb(0 0 0)',
    runningColor: 'rgb(255 0 255)', completedColor: 'rgb(0 255 255)',
    errorColor: 'rgb(255 0 0)', stoppedColor: 'rgb(128 128 128)',
    borderRadius: 0, headerMinHeight: 48, itemMinHeight: 40,
  } },
}

createRoot(document.getElementById('app')).render(h('main', null,
  h('section', { 'data-task-list-default': '', style: { minWidth: '480px', minHeight: '320px' } },
    h(RefTaskList, { 'data-testid': 'task-list-ref', title: '实施计划', items: sampleItems }),
    h(TaskList, { 'data-testid': 'empty-list', title: '空计划', items: [] })),
  h('section', { 'data-task-list-custom': '', style: { minWidth: '480px', minHeight: '200px' } },
    h(ThemeProvider, { theme: configuredTheme },
      h(TaskList, { 'data-testid': 'configured-list', title: '定制面板', items: sampleItems }),
      h(SubpathTaskList, { title: '子路径面板', items: [{ id: 'sub', title: '子路径任务', status: 'pending' }] }))),
  h('section', { 'data-task-list-dark': '', style: { minWidth: '480px', minHeight: '200px' } },
    h(ThemeProvider, { theme: darkTheme },
      h(TaskList, { 'data-testid': 'dark-list', title: '暗色面板', items: sampleItems }))),
  h('section', { 'data-task-list-nested': '', style: { minWidth: '480px', minHeight: '200px' } },
    h(ThemeProvider, { theme: { components: { TaskList: { runningColor: 'rgb(255 0 0)' } } } },
      h(ThemeProvider, { theme: { components: { TaskList: { background: 'rgb(0 255 0)' } } } },
        h(TaskList, { 'data-testid': 'nested-list', title: '嵌套面板', items: sampleItems })))),
  // 宽视口中的 320px 窄容器：容器查询按组件可用宽度生效（TL-V08）。
  h('section', { 'data-task-list-narrow-container': '', style: { width: '320px', minHeight: '200px' } },
    h(TaskList, { 'data-testid': 'narrow-list', title: '窄容器面板', items: sampleItems })),
))
