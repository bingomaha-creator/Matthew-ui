# Select 视觉合同

状态：已实现；默认外观及 16 个组件 Token 已落地，尚未发布\
确认日期：2026-10-05\
适用范围：Select 第一版默认外观、主题与视觉验收\
行为依据：[Select 行为合同](select-behavior-contract.md)

预览只用于确认层级、活动高亮与选中对勾，不是正式实现、固定颜色来源或永久像素基线。
默认值必须映射组件库现有 Token，不能照抄预览色值、Agent 字体栈或业务圆角。
本文描述当前源码外观；不构成提交、推送、改版本或发布授权。

## 1. 视觉定位（SL-V01）

普通表单选择控件，不是聊天专用胶囊、命令面板或工具状态行。触发器与菜单轻量、
信息明确，和现有 Button、AutoComplete 的字体、控件高度、圆角、focus ring 协调。
第一版只有一种默认外观，不新增尺寸、密度或布局变体。

## 2. 触发器（SL-V02）

- 默认最小高度读取 `controlHeightMd`（默认 40px）；字号读取 `fontSizeMd`
  （默认 14px），字重 400，字体族继承宿主。
- 默认 1px 细边框 `colorBorder`，圆角 `radiusMd`，不加常驻阴影。
- 实色背景 `colorSurface`，文字 `colorText`，placeholder `colorTextMuted`。
- 标签单行省略、允许收缩；箭头保留独立占位，不被长标签挤压。
- 默认宽度跟随调用方提供的布局，允许普通 CSS 调整；不硬编码 Agent 侧栏／表单宽度，
  不沿用 TaskList 的 480px 面板宽度。
- hover 与展开时边框使用 `colorPrimary`；focus-visible 复用库的 `colorFocus` ring。
- disabled 背景／文字弱化，读取 `colorSurfaceHover`／`colorTextMuted`，
  不保留交互 hover 或展开提示；不单靠透明度让文字无法辨认。
- 空 options 的自动禁用与显式 disabled 外观一致；全禁用 options 不把触发器伪装成禁用。

## 3. 展开箭头（SL-V03）

- 右侧轻量线形箭头，收起朝下、展开朝上；不用 Agent 当前的实心三角。
- 方向表达开合，不随弹层向上／向下定位翻转。
- 装饰图形不进入可访问名称；不开放角度、图形替换或线宽 props。
- 过渡使用现有 `durationFast`；reduced-motion 下取消过渡。

## 4. 弹层（SL-V04）

- 正常空间中与触发器等宽，边界受可用视口／宿主空间约束；
  水平夹取时允许收窄，不能为了等宽制造页面溢出。
- 使用 `colorSurface` 实色背景、1px `colorBorder`、`radiusMd`、`shadowOverlay`。
- 与触发器之间保留小间隙；边界间隙、弹层高度上限、层级和内边距是内部布局参数，
  本轮不冻结 Agent 的具体数字，也不新增公共配置。
- 长列表在选项区域纵向滚动；不能给整个页面引入横向滚动。
- 首次打开先完成有效定位，避免在页面角落闪现后跳到触发器旁。
- 向上翻转不改变选项顺序、对勾位置或键盘含义；不增加持续动效和整层滑动动画。

## 5. 选项与状态分离（SL-V05）

- 默认行最小高度 36px（2.25rem），字号 `fontSizeMd`、字重 400；标签单行省略。
- 普通文字回退 `colorText`；选项不是按钮样式，不逐行增加边框或阴影。
- 当前活动项使用轻量背景 `colorSurfaceHover`；表示导航候选，不表示提交。
- 已选项文字使用 `colorPrimaryActive`、字重 500，右侧固定区域显示对勾。
  实施时真实 a11y 检查发现暗色 `colorPrimary` 与活动背景对比度不足，故沿用 Menu
  的选中前景回退 `colorPrimaryActive`；不改全局主题，显式选中色仍优先。
- 活动项和已选项不同时，两种提示可同时存在；二者相同时叠加，不能相互覆盖丢失。
- 未选项同样保留对勾空间，选中切换不引起标签宽度明显跳变。
- 禁用项弱化、不可激活；若它恰好是受控已选项，仍保留对勾表达当前值，
  但不表现为可用活动项。
- 对勾用内部 CSS／SVG 图形，不新增图标运行时依赖，不默认渲染“已选中”语言文案。

## 6. CSS、Token 与 Portal（SL-V06）

- 采用 `matthew-select` BEM 前缀；公开组件变量统一 `--matthew-ui-select-*`。
- 组件 Token 挂在 `MatthewThemeConfig.components.Select`，复用通用转换，
  不单独要求包级导出 `SelectComponentTokens`。
- 明确配置才输出变量；默认视觉在 CSS 消费位置回退到全局 Token，
  不创建第二份根节点默认变量表，不改变 23 个全局 Token。
- 数字按设计 px、16 基准转 rem；正尺寸 >0，圆角／padding ≥0；
  类型、有限数、undefined、null 与错误信息遵守现有转换约定。
- string 字段只检查类型，不校验完整 CSS 语法，不自动派生状态色。
- 字段继承、空对象／undefined、亮暗切换、局部覆盖与动态撤销规则沿用现有 Provider。
- Portal 内读取触发器来源域主题，不能意外使用 body 或宿主的另一套颜色；
  来源域普通祖先 CSS 变量、触发器 style 和字体也需要真实浏览器覆盖。
- className/style 位于触发器，不能承诺外部 `.ancestor .matthew-select__popup`
  在 Portal 后仍可命中；整个实例主题定制使用公开变量，不要求用户追踪内部 DOM。

### 已确认的 16 个字段

所有字段可选。变量统一以 `--matthew-ui-select-` 为前缀，表中列出精确后缀；
`borderRadius` 沿用其他组件的 `radius` 后缀惯例，不使用 `border-radius`。

```ts
export interface SelectComponentTokens {
  fontSize?: number
  triggerBackground?: string
  triggerColor?: string
  placeholderColor?: string
  borderColor?: string
  triggerHoverBorderColor?: string
  triggerMinHeight?: number
  borderRadius?: number
  triggerPaddingBlock?: number
  triggerPaddingInline?: number
  optionColor?: string
  optionActiveBackground?: string
  optionSelectedColor?: string
  optionMinHeight?: number
  popupBackground?: string
  popupShadow?: string
}
```

| 字段 | 校验 | CSS 变量后缀 | 默认回退 |
| --- | --- | --- | --- |
| `fontSize` | number > 0 | `font-size` | `fontSizeMd`，作用于触发器与选项 |
| `triggerBackground` | string | `trigger-background` | `colorSurface` |
| `triggerColor` | string | `trigger-color` | `colorText` |
| `placeholderColor` | string | `placeholder-color` | `colorTextMuted` |
| `borderColor` | string | `border-color` | `colorBorder`，作用于触发器与弹层 |
| `triggerHoverBorderColor` | string | `trigger-hover-border-color` | `colorPrimary`，作用于 hover 与展开态 |
| `triggerMinHeight` | number > 0 | `trigger-min-height` | `controlHeightMd`，默认 40px |
| `borderRadius` | number ≥ 0 | `radius` | `radiusMd`，作用于触发器与弹层 |
| `triggerPaddingBlock` | number ≥ 0 | `trigger-padding-block` | 0.5rem（设计 8px） |
| `triggerPaddingInline` | number ≥ 0 | `trigger-padding-inline` | 0.75rem（设计 12px） |
| `optionColor` | string | `option-color` | `colorText` |
| `optionActiveBackground` | string | `option-active-background` | `colorSurfaceHover` |
| `optionSelectedColor` | string | `option-selected-color` | `colorPrimaryActive`，作用于已选文字与对勾 |
| `optionMinHeight` | number > 0 | `option-min-height` | 2.25rem（设计 36px） |
| `popupBackground` | string | `popup-background` | `colorSurface` |
| `popupShadow` | string | `popup-shadow` | `shadowOverlay` |

### 状态消费与覆盖边界

- 普通触发器文字使用 `triggerColor`，占位使用 `placeholderColor`；两者互不派生。
- 触发器／弹层共用普通 `borderColor` 和 `borderRadius`；
  `triggerHoverBorderColor` 不改变弹层边框，`popupBackground` 不改变触发器背景。
- 禁用触发器背景、文字（含占位）优先读取全局 `colorSurfaceHover`、`colorTextMuted`，
  不使用普通 `triggerBackground`、`triggerColor`、`placeholderColor` 覆盖；
  保留普通边框与尺寸定制，不应用 hover／展开边框。
- 普通选项使用 `optionColor`；已选项文字与对勾使用 `optionSelectedColor`。
  活动背景独立使用 `optionActiveBackground`，不覆盖已选文字颜色；不新增
  `optionActiveColor` 或选中背景字段。
- 禁用选项文字与对勾优先使用全局 `colorTextMuted`；保留已选对勾的形状，
  不使用普通／选中颜色覆盖，不应用活动背景。禁用优先于活动和选中配色。
- 最小高度不是固定高度，内容、字号和内边距可以撑高；内边距不随高度覆盖自动派生。
- 默认字体族、字重、选项内边距／圆角、箭头尺寸／角度、对勾线宽、focus ring、
  定位坐标、翻转开关、弹层间隙／层级、动画速度及任意 CSS 注入不作为组件 Token。

### 与现有转换规则一致

复用 `componentTokensToCssVars` 与 `ComponentTokenFieldMap`，组件名为 `Select`、
CSS 前缀为 `select`；字段表用 `as const satisfies ComponentTokenFieldMap<SelectComponentTokens>`
检查完整性，不重建默认值表或独立校验器。

- string 字段类型错误：`TypeError`，消息为
  `components.Select.<field> must be a CSS string`。
- 数字字段类型错误：`TypeError`，消息为 `components.Select.<field> must be a number`。
- NaN、±Infinity、非正的字号／高度：`RangeError`，消息为
  `components.Select.<field> must be finite and greater than 0`。
- NaN、±Infinity、负的圆角／padding：`RangeError`，消息为
  `components.Select.<field> must be finite and greater than or equal to 0`。
- `undefined` 跳过，错误的字段值 `null` 进入校验；只序列化白名单中显式提供的字段。
- 父子 Provider 按字段继承，Select 与其他组件独立合并；空对象／undefined 不擦除父值。
  撤销子层配置恢复父值或默认回退，切换亮暗保留显式组件配置。
- 同一 Provider 的主题配置优先于其 style 中的同名变量；触发器自身 style 的公开变量
  可以作为单实例例外，并同步到 Portal。不得依赖内部私有变量。

## 7. 明暗、窄宽与动态稳定（SL-V07）

- 默认明暗都跟随当前主题，不硬编码浅色 popup 或把整个控件固定成暗色。
- 暗色中边框、活动背景、主色选中、弱化禁用项必须能区分，对勾与文字保持可读。
- 长标签、320px 可用区域和 200% 放大不撑破页面；箭头／对勾保留，标签允许省略。
- 更换标签、value、选项数量或主题，不因内容长度让触发器宽度随意跳变，
  不重新移动用户焦点；弹层按实际几何更新。
- reduced-motion 下取消箭头、边框与背景等过渡；无循环动画。

## 8. Story 与真实包视觉验收（SL-V08）

至少展示默认占位／已选值、展开活动项与已选项不同、同项叠加、禁用、空列表、
全禁用、长标签、窄容器、字符定位、动态增删重排、明暗、局部定制、嵌套继承、
动态启用／撤销覆盖、Portal 宿主和 reduced-motion。

浏览器应检查：

- 默认 40px 触发器、14px 字号、36px 选项、字体继承、1px 外框、圆角和 focus ring；
- 收起／展开箭头、对勾占位、活动背景与实际 aria-selected 独立；
- 明暗、全部 16 字段精确覆盖和撤销后触发器／Portal 内同步恢复；
- 字段类型／范围／错误文本、只输出显式变量、空配置、独立合并、禁用配色优先级；
- 宽视口下窄容器、200% 放大、长标签和滚动后的实际几何边界；
- 正常向下、底部向上、水平边界、限高与 transformed／模态宿主；
- 使用真实 `prefers-reduced-motion` 验证无过渡，不能仅检查样式表文本。

沿用组件浏览器测试、Story 交互和 React 18.2/19 真实 npm tarball，两种 CSS 模式
均验证。重要断言限定到对应实例，加入破坏性注入回归，避免默认实例掩盖窄宽／暗色
／宿主实例失败。人工观感验收不能被 computed style 完全替代。

## 9. 消费端归属

通用默认能力属于库；主题模式、角色选项、筛选值、语言文案、绿色成功语义、
页面间距／宽度、资料库权限和模态宿主选择属于业务端。
库不依赖 Agent 的 GlobalStyles；Agent 可以继续将自身主题映射为公开变量。
接入与删除 Agent 的旧 Select／覆盖是后续独立任务，本轮不修改 Agent 仓库。
