# Dialog 行为合同

状态：已实现；尚未发布\
确认日期：2026-10-05\
适用范围：P1-2 第一版受控模态 Dialog\
视觉依据：[Dialog 视觉合同](dialog-visual-contract.md)

## 1. 定位与公开接口（DG-B01）

只负责模态展示、关闭请求、焦点与布局。保存、取消按钮、表单、草稿、错误与请求
属于调用方；不搬入 Agent 的 Memory／Knowledge 逻辑，不新增运行时依赖。

导出 `Dialog` / `DialogProps`，根与 `matthew-ui/dialog` 均可引入；ref 指向
`HTMLDialogElement`，主要用于 Select 的 `popupHost` 和读取 DOM，不是命令式服务。

```ts
type DialogProps = Omit<ComponentPropsWithoutRef<'dialog'>,
  'open' | 'title' | 'children' | 'onCancel' | 'onClose' | 'tabIndex' |
  'autoFocus' | 'closedby' | 'closedBy' | 'role' | 'aria-modal' | 'dangerouslySetInnerHTML'
> & {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  closeLabel: string
  children: ReactNode
  footer?: ReactNode
  dismissible?: boolean // 默认 true
  closeOnBackdrop?: boolean // 默认 false
  initialFocus?: () => HTMLElement | null
}
```

`closeLabel` 是关闭图标的本地化可访问名称；不内置语言文案。原生 `title` 被标题节点
替代，className/style/data/aria 属性位于 dialog。组件负责模态语义，不能改为非模态
role 或手工传 open 属性；不提供 defaultOpen、尺寸枚举、loading 或可配置层级。

## 2. 受控与关闭（DG-B02）

- 使用 `<dialog>.showModal()`，不是单独写 HTML open 属性；不 Portal，继承来源域主题。
- 关闭按钮与 Escape 只请求 `onOpenChange(false)`；调用方不更新 open 时保持模态。
- 调用方把 open 改为 false 时真正关闭，不再次回调。动态回调使用当前 prop。
- 默认点遮罩不关闭；closeOnBackdrop=true 时仅完整的遮罩按下／释放请求关闭，
  内容区拖动结束在遮罩、点 dialog 空白 padding 不误关闭。
  关闭后重新打开会作废旧的 pointer 手势，不把释放动作误认为新的一次遮罩点击。
- dismissible=false 时关闭按钮 disabled，Escape／遮罩不回调；调用方仍可改 open
  关闭。它不代表保存中，不执行请求，也不擅自阻止业务 footer 的操作。
- 不依赖较新的 closedby／requestClose 支持；使用原生 cancel 事件阻止提前关闭。
- ref.close/showModal、method="dialog" 与外部手改 open 属性不属于受控接口；
  业务 footer 应请求修改 open，不绕过状态。正常表单提交不被 Dialog 接管。

## 3. 生命周期、焦点与 Select（DG-B03）

- 关闭后 dialog 和 children 保持挂载且不可见；输入及子模块状态保留，不自动 reset。
  需要销毁时由父层条件挂载；不另加 destroyOnClose。内容 effect 也仍存在。
- 打开时 initialFocus 返回的有效、可聚焦内部节点优先；其次内容中 autofocus；
  默认聚焦标题（tabIndex=-1），避免长内容打开后顶部被滚走。dialog 本身不加 tabindex。
  此处 autofocus 指原生DOM属性；React autoFocus 可能只在挂载时执行一次 focus，
  不能保证关闭后再次打开时定位。React 表单建议用 initialFocus 返回自己的 input ref。
- Tab / Shift+Tab 和背景 inert 由原生模态管理，不手写全站键盘焦点陷阱。
- 关闭／卸载回到打开前仍有效的节点；节点已删除／禁用时不抢到无关位置。
- 背景文档滚动在模态期间锁定，关闭／卸载恢复原来的样式；组件内容独立滚动。
  多实例共享锁只做必要计数，不公开堆栈管理器，也不承诺复杂嵌套工作流。
- Dialog 内 Select 必须提供 popupHost={() => dialogRef.current}；首次 Escape 只关闭
  Select，再次才请求 Dialog 关闭。Select 弹层不落到 inert 的 body 外部区域。
- SSR 无 DOM 访问，输出关闭的 shell；客户端挂载后才按 open 建立模态。
  React 18.2／19、StrictMode 不重复请求关闭；卸载不留下 top layer 或滚动锁。

## 4. 可访问性与验收（DG-B04）

标题有 per-instance 唯一 id，默认 aria-labelledby 引用它；显式 aria-label 或
aria-labelledby 可覆盖名称。调用方保证标题／自定义名称可被理解；组件不猜测
ReactNode 内部输出。aria-describedby 只透传调用方提供的简短说明，不把表单全文
串成描述。提供明确可见的关闭图标；footer 可省略，不自动注入确定／取消。

验收接口：Dialog 公开 props／原生 DOM、ThemeProvider 的组件配置、真实 tarball。
真实 Chromium 验证受控拒绝、Escape、遮罩拖动、焦点和背景隔离、保留状态、动态
禁止关闭、卸载／StrictMode、Select 两次 Escape、长内容和窄屏／200% 字体放大。
Story 覆盖默认、暗色、长表单、窄屏、主题撤销、保存中与 Select 组合；两种 CSS 模式、
React 18.2／19 的类型、ESM/CJS、ref、SSR、按需入口与无隐式 CSS 均需真实包验证。
关键样式／焦点验收须有故障注入回归，不用 jsdom 模拟原生模态代替浏览器。

依据：[HTML dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)、
[WAI-ARIA Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)。

## 5. 非目标

不做 Drawer、非模态弹窗、拖拽、命令式全局服务、业务确认／脏数据提示、表单框架、
任意弹层管理器或 Portal 公共原语。Agent 接入、提交、推送、改版本与发布另行授权。
