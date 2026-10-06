# Dialog 视觉合同

状态：已实现；已随 v0.4.0 发布\
确认日期：2026-10-05\
适用范围：P1-2 默认 Dialog、主题和视觉验收\
行为依据：[Dialog 行为合同](dialog-behavior-contract.md)

## 1. 默认布局（DG-V01）

沿用已预览的居中表单弹窗，不照搬 Agent 的 styled-components 样式。

- 默认 width: min(32rem, calc(100% - 2rem))，根字号16px时512px，窄视口两侧各16px。
- 最大高度 calc(100dvh - 2rem)，内容区滚动，标题栏和 footer 不被内容卷走。
- 根节点1px边框、radiusMd、colorSurface、shadowOverlay，无额外卡片层。
- 标题栏上下16px／左右20px；标题 fontSizeLg（默认16px）/500，可以换行。
  内容 fontSizeMd（默认14px）/400，字体族继承宿主，不带业务字体。
- 内容默认上下／左右20px；footer 上下16px／左右20px、按钮靠右、gap8px、允许换行。
  不提供 footer 时不渲染 footer 和底部分隔线。
- 关闭图标占位32px，hover为subtle背景；粗指针44px，不因窄屏挤压标题。
- 不内置正文表单样式／保存按钮；示例复用 Button、Select，并给普通输入明确 label。
  Select 箭头右侧12px留白；不为 Dialog 再添加一套选择框或任意箭头字段。
- 默认遮罩 rgb(15 23 42 / 45%)，亮暗均遮暗背景；颜色可精确覆盖，不通过猜测
  surface 颜色推断主题。预览色值不是替代库 Token 的权威来源。

## 2. 交互视觉与响应式（DG-V02）

关闭按钮有 focus-visible；禁用时以 colorTextMuted 表达，不触发 hover。
仅关闭按钮的颜色／背景有 durationFast 的短过渡；第一版不加入开合缩放／位移动效，
reduced-motion 时取消过渡。长标题、长文字、375px／320px、200% 根字号不得把
面板或父页面横向撑破。title/body/footer 默认 min-width:0，允许词内换行。

## 3. 组件 Token（DG-V03）

`MatthewThemeConfig.components.Dialog` 12个可选字段；复用通用转换与独立字段合并，
不包级导出 DialogComponentTokens，不新增全局 Token。

| 字段 | 类型 | CSS 后缀（--matthew-ui-dialog-） | 默认 |
| --- | --- | --- | --- |
| background | string | background | colorSurface |
| color | string | color | colorText |
| borderColor | string | border-color | colorBorder |
| backdropBackground | string | backdrop-background | rgb(15 23 42 / 45%) |
| titleColor | string | title-color | colorText |
| closeColor | string | close-color | colorTextMuted |
| closeHoverBackground | string | close-hover-background | colorSurfaceHover |
| shadow | string | shadow | shadowOverlay |
| borderRadius | number ≥0 | radius | radiusMd |
| titleFontSize | number >0 | title-font-size | fontSizeLg |
| contentPaddingBlock | number ≥0 | content-padding-block | 20px／1.25rem |
| contentPaddingInline | number ≥0 | content-padding-inline | 20px／1.25rem |

所有数字按设计px／16转rem；string仅检查类型不检查CSS语法。正尺寸、非负圆角／
padding、finite、null和错误文本沿用现有规则 `components.Dialog.<field> ...`。
只输出显式字段；空对象和undefined继承，null不表示清空。子层撤销恢复父值或默认。
明暗切换保留定制。className/style 在 dialog；::backdrop 消费根节点公开变量。
不开放宽度、层级、动画参数 Token；宽度可用正常CSS覆盖，仍需遵守窄屏约束。

## 4. 视觉与发布验收（DG-V04）

真实 Chromium 的按需／全量CSS均核对512px宽、16px视口边距、标题16px/500、正文
14px、20px内容padding、圆角8px、surface/border/shadow、遮罩伪元素、关闭hover。
12字段精确覆盖、无Provider、暗色、祖先变量、嵌套与动态撤销都检查computed style。
窄宽、长内容、无footer、200%根字号、reduced-motion与Select组合验收必须有明确结果。
Story采用真实原生模态；卸载时关闭并清理，不能留下遮罩污染后续场景。

本轮只实现组件库；Agent接入和发布另行进行。
