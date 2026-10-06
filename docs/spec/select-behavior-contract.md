# Select 行为合同

状态：已实现；已随 v0.4.0 发布\
确认日期：2026-10-05\
适用范围：Select 第一版公开行为、可访问性、Portal 与消费验证\
视觉依据：[Select 视觉合同](select-visual-contract.md)

本文是已确认的 P1-1 行为规范。源码实现不代表组件已存在于 npm，也不构成提交、
推送、改版本或发布授权。后续 handoff 引用本文，不复制另一份行为真相源。

## 1. 定位与范围（SL-B01）

Select 是通用的单选、不可编辑选择控件，适用于主题、角色、筛选和普通表单选项。
选项和值由调用方提供；组件只负责展示、候选导航、提交请求与弹层。

- 第一版仅受控选择值，弹层展开由组件内部管理。
- 不提供搜索输入框；字符定位只移动活动项，不筛选或删除选项。
- AutoComplete 继续负责可输入建议，两者不互相包装，也不强制抽共享 combobox 原语。
- 不复制 Agent 的 styled-components、Store、路径别名、中文文案或定位常量。

## 2. 公开接口（SL-B02）

目标类型形状：

```ts
import type { ComponentPropsWithoutRef } from 'react'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'dangerouslySetInnerHTML' | 'value' | 'defaultValue' | 'onChange' | 'type'
> & {
  children?: never
  dangerouslySetInnerHTML?: never
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  popupHost?: () => HTMLElement | null
}
```

- 导出 `Select`、`SelectOption`、`SelectProps`；ref 指向触发器 `HTMLButtonElement`。
- 使用原生 `button`，固定安全的 `type="button"`。不因放进 form 触发提交。
- `disabled`、`autoFocus`、`id`、`title`、`className`、`style`、`data-*`、
  可访问名称及适用原生事件属性位于触发器。事件透传不能导致内部动作重复提交。
- 组件管理 combobox/listbox 关系属性；调用方不能用透传覆盖破坏其一致性。
- `label` 仅为字符串，不提供 `ReactNode` 标签、renderOption 或任意装饰插槽。
- `value` 是稳定、唯一身份；选项严格按数组顺序展示，不能用索引作为动态身份。
- 不开放 `defaultValue`、`open`、`defaultOpen`、`onOpenChange` 或第二套选择回调。
- 原生事件 `onClick/onKeyDown` 与业务选择回调含义不同；选择结果只经 `onValueChange`。
- `name/form` 等原生属性不意味着实现了原生 select 的表单值提交、required 校验或重置；
  第一版不增加隐藏 input，不承诺这些表单集成能力。

## 3. 值与活动项（SL-B03）

- 已选项由 `value` 唯一决定；活动项是当前指针／键盘候选，二者可以不同。
- 移动活动项不调用 `onValueChange`；只有点击选项或 Enter/Space 确认才请求更新。
- 提交可用选项后关闭弹层。提交当前 `value` 只关闭，不重复通知。
- 调用方没有更新 `value` 时，组件不自行改变已选展示。
- 打开时优先激活当前已选且可用的选项，否则激活第一项可用选项。
- 禁用选项不能激活或提交；当前已选项后来被禁用时，仍显示它的标签，但导航跳过它。
- 空字符串 `''` 是合法选项值，不能被当成未选择。
- `value` 不在 options 中时显示 `placeholder`；未提供 placeholder 时显示空标签。
  不把原始非法 value 当成默认文案，不自动选中第一项，也不发纠正回调。
- placeholder 只是展示，不加入 options，不可选择，不自带固定语言文案。

## 4. 键盘与指针（SL-B04）

| 操作 | 行为 |
| --- | --- |
| 点击触发器 | 开合弹层；再次点击关闭，不提交未确认活动项 |
| 收起时 Enter/Space | 打开，不提交；避免原生按钮激活造成双重切换 |
| 收起时 ArrowUp/ArrowDown | 打开，并按 SL-B03 初始化活动项 |
| 展开时 ArrowUp/ArrowDown | 在可用项间移动，首尾循环，跳过 disabled |
| 展开时 Home/End | 移到第一／最后一个可用选项 |
| 展开时 Enter/Space | 提交活动项；没有可用活动项时不提交 |
| 展开时 Escape | 关闭，不提交；只处理这次弹层关闭 |
| 展开时 Tab/Shift+Tab | 关闭，不提交，焦点按原生顺序继续移动 |
| 点击外部 | 关闭，不提交，不把焦点抢回触发器 |
| 指针经过可用选项 | 改变活动项，不提交 |
| 点击可用选项 | 提交并关闭，焦点回到／保留在触发器 |

字符定位：

- 在触发器接收可打印字符时，按字符串 label 的前缀定位可用选项；不显示输入框。
- 支持短时间连续输入的前缀匹配及重复字符在匹配项之间循环；无匹配保持原活动项。
- 收起时字符定位打开弹层并定位候选，但不提交值。
- 不截获带 Ctrl/Meta/Alt 的快捷键，不在 IME composition 中消费字符。
- Space 保持开合／确认语义；字符缓冲超时与具体匹配实现属于内部细节，不开放 props。
- 监听限定于本组件，不添加全局字符或方向键拦截。

Tab 关闭但不提交是本组件明确约定，不将其他组件库或 APG 示例的 Tab 提交行为
不经讨论搬入。关闭态 Escape 不阻止父级处理。

## 5. 动态与空选项（SL-B05）

- 新增、删除、重排、标签变化或 disabled 变化，不自行更新 `value`、不发选择回调。
- 展开时按 value 保留仍存在且可用的活动项；失效时立即回退到可用已选项或首个可用项。
- 不存在可用项时不设置活动项；ARIA 引用不能指向已删除节点。
- 同一 value 重排时保持条目 DOM 身份；动态选项不因旧数组索引恢复错误候选。
- options 为空时自动禁用触发器、不打开空弹层；若展开期间变空，立即关闭。
  不清空调用方 value；失效显示按 SL-B03 的 placeholder 规则处理，不缓存过期标签。
- 所有选项禁用不等于空列表：未显式 disabled 时仍可展开查看，不能导航或提交。
- 显式 disabled 优先；展开期间变为 disabled 时关闭，不提交、不主动转移焦点。

## 6. DOM、ARIA 与焦点（SL-B06）

- 触发器为原生 button，提供 `role="combobox"`、`aria-haspopup="listbox"`、
  `aria-expanded`；展开后 `aria-controls` 指向实际 listbox。
- listbox 与 option 有稳定唯一 id，多个实例不冲突。
- `aria-activedescendant` 仅引用当前存在且可用的活动项；无活动项或关闭时移除。
- 每项 `role="option"`，`aria-selected` 表达实际受控 value，
  disabled 项以 `aria-disabled` 表达，不用活动高亮冒充已选状态。
- DOM 焦点留在触发器，不让每个 option 进入 Tab 序列；活动项滚入弹层可见范围，
  不应因此滚动整个页面或制造焦点跳变。
- 调用方提供 `aria-label` 或 `aria-labelledby` 等明确控件名称；标签／placeholder
  不是字段名称的可靠替代。支持普通外部说明，不内置业务标签文案。
- 箭头和对勾等装饰图形 `aria-hidden`；不加入重复选中文案或默认 aria-live。
- Escape、选择确认保持触发器焦点；Tab 和外部点击保留浏览器正常焦点流。
- Dialog 内展开时首个 Escape 只关闭 Select；兼容原生 dialog cancel 默认行为，
  不能只用 stopPropagation 就声称父 Dialog 不会关闭。关闭后下一次 Escape 可由父级处理。

## 7. Portal 与宿主（SL-B07）

- 默认 Portal 到触发器所属 document 的 body；不在 SSR 渲染期访问 document/body。
- `popupHost` 支持调用方提供 Dialog 或侧栏内部容器；宿主在实际挂载／打开时解析，
  不缓存首次 render 尚未赋值的 ref。普通情况下未提供或返回 null 回退到 body。
- 模态消费端必须在打开 Select 前提供有效的模态内部宿主，避免浮层落在 inert 或
  aria-modal 语义之外；组件不识别业务 Dialog 名称、不替消费端推断模态归属。
- outside 判断同时包含触发器和 Portal 内容，点击选项不能被先当成外部关闭吞掉。
- 关闭后弹层不暴露为可访问选项；无需沿用 Thinking 的折叠保挂载合同。
- Select 是当前库首个 Portal 组件，只建立它所需的内部能力，不提前改造 Menu、
  AutoComplete，也不建立全局浮层管理器或公开 Portal 原语。

## 8. 定位与主题边界（SL-B08）

- 弹层默认向下，底部不足时向上；两侧不足时按可用空间限高并允许选项区滚动。
- 水平方向夹取可视边界，极窄视口不得因与触发器等宽要求制造页面横向溢出。
- 跟随相关容器滚动、窗口变化、触发器尺寸变化及选项内容变化重新定位。
- 自定义宿主含 transform、滚动或其他 containing block 时使用正确坐标系，
  不直接把 viewport 坐标当成宿主内坐标。
- 不把 Agent 的 gap/max-height/z-index 常量当成组件库既定规范；
  定位算法、原生能力或专用依赖的选择待实施前评估。新增运行时依赖需要单独说明并确认，
  当前文档不预先批准它。
- React Context 保持不等于 CSS 继承保持；Portal 必须保留触发器来源域的公开
  `--matthew-ui-*` 全局与 Select 组件变量，包括祖先 CSS、Provider、触发器 style 的局部覆盖。
- 亮暗、嵌套 Provider、配置启用／撤销及打开期间主题更新，触发器与弹层必须一致。
- 只桥接组件所需主题／字体，不复制业务祖先 class、业务布局或整份 computed style。

## 9. 包与验证（SL-B09）

实施交付时接入包根、`matthew-ui/select`、`matthew-ui/select/style.css`、全量 CSS
与类型声明；JS 不隐式引 CSS，不夹带其他组件，保留 React 18.2/19 兼容性。
主题接线复用现有组件 Token 转换与字段合并，不改变现有 23 个全局 Token。

验收至少覆盖：

- 类型／ref／透传、受控拒绝更新、同值无回调、空字符串／非法值／占位；
- 全部键盘与指针路径、禁用跳过、typeahead、IME、动态身份、空列表和全禁用；
- ARIA 实际引用、多实例、焦点、外部点击和父 Dialog 的两次 Escape；
- 真实 Chromium 定位：向下／向上／限高、水平边界、滚动、resize、尺寸变化、
  transformed 宿主及原生模态 dialog；不能用 jsdom 固定矩形替代全部几何验收；
- 两种 CSS 模式、无 Provider 回退、来源域 CSS、明暗／嵌套／动态撤销、Portal 内外主题一致；
- Story 展示默认、受控、禁用、空列表、全禁用、长标签、窄宽、动态选项和主题；
- React 18.2/19 真实 tarball 的类型、ESM/CJS、ref、样式、构建和入口边界；
- 对定位、主题丢失和焦点／ARIA 等关键验收加入能拒绝破坏实现的回归保护。

库验收后，Agent 再以独立任务通过 npm link 接入公开入口，验证角色、主题、记忆
筛选、模态宿主与移动侧栏；不能以本地链接成功代替真实发布包验收。

## 10. 非目标与实施边界

不做多选、可编辑搜索、远程查询、虚拟化、复杂分组、自定义标签渲染、清空按钮、
表单框架绑定、命令式弹层服务或 Agent DTO／主题模式／业务权限逻辑。

视觉合同的 16 个组件 Token 字段、校验与回退已实现。定位使用 Select 内部的原生 DOM
测量与观察，不增加运行时依赖，不公开 Portal／定位配置，也不改造其他组件。
变换宿主覆盖 translate 与轴向 scale；不承诺任意旋转、倾斜或三维变换的几何定位。
既有 P0 工作树保留；Agent 仓库、两个仓库依赖连接及发布状态不变。
