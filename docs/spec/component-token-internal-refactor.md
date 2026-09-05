# 组件 Token 内部抽象重构 Spec

> 状态：已实现并验收
> 基线：`73cdb12 feat: add Thinking agent status component`
> 范围：仅主题系统内部实现，不改变公开使用方式。

## 1. 背景

Button、Menu、AutoComplete 和 Thinking 已分别实现组件 Token 转换 Adapter。
四份实现都在重复以下规则：

- 只遍历已知字段白名单；
- `undefined` 表示未提供，不输出 CSS Variable；
- 字符串字段只做类型检查；
- 数字字段区分正数和非负数，拒绝非有限数；
- 数字按现有 `toRem` 规则转换；
- 使用组件名、字段名和变量后缀组装错误与 CSS Variable。

`ThemeProvider` 同时为四种组件配置、Seed 和最终 Token 重复了
“忽略当前层 `undefined` 并按字段继承父层”的合并逻辑。

第四个真实 Adapter 已证明该 seam 存在；在继续开发 agent 组件前收敛重复，
可避免第五份复制实现。

## 2. 目标

1. 建立一个内部组件 Token 转换模块，集中字段遍历、校验、`toRem`
   与 CSS Variable 输出规则。
2. 保留四个现有组件 Adapter 作为组件特有字段表与通用转换模块之间的 seam。
3. 在 `ThemeProvider` 内集中“忽略 `undefined` 的父子字段合并”规则。
4. 让后续组件只需定义自己的类型、字段表、命名空间和窄 Adapter。

## 3. 非目标

- 不增删或重命名任何公开 Token 字段。
- 不更改任何公开 CSS Variable 名称或默认回退。
- 不将组件 Token 类型新增为包级独立导出。
- 不改变 ThemeProvider 的 DOM、ref、嵌套作用域或 style 优先级。
- 不引入自定义校验器、可插拔规则、新单位系统或未来字段类型。
- 不借机重构 ThemeProvider 之外的主题架构。
- 不修改 README 的公开用法；仅允许同步测试数量等事实信息，不新增公开使用方式。

## 4. 不变量

重构前后必须保持以下可观察结果完全一致：

1. 四个 `*ComponentTokens` 类型的字段、可选性和可用入口不变。
2. 四个 `*TokensToCssVars` Adapter 的名称、输入和输出不变。
3. 空配置只输出空映射，未配置字段不生成组件默认变量。
4. `undefined` 继续表示未提供；非法 `null` 不能被过滤，仍进入运行时校验。
5. 字符串字段的 `TypeError` 、数字字段的 `TypeError` 和 `RangeError`
   类型及消息文本不变。
6. 所有数值的 rem 精度、`-0` 处理和范围边界不变。
7. 父子 Provider 继续按单字段继承，子层配置一种组件不能丢失其他组件配置。
8. 显式组件配置在亮暗切换时保留，撤销当前层后恢复父值或 CSS 回退。
9. 调用方 `style` 与 ThemeProvider 生成变量的现有优先级不变。
10. 运行时依赖仍只有 `clsx`。

## 5. 目标设计

### 5.1 通用转换模块

新增一个仅供源码内部使用的模块，建议路径为：

```text
src/theme/componentTokenUtils.ts
```

它的 interface 只表达当前已经稳定的差异：

```ts
type ComponentTokenFieldKind = 'string' | 'positive' | 'nonnegative'

type ComponentTokenFieldMap<Config> = {
  [Key in keyof Config]-?: {
    suffix: string
    kind: ComponentTokenFieldKind
  }
}

componentTokensToCssVars({
  componentName,
  cssPrefix,
  fields,
  config,
})
```

实现负责：

- 按字段表遍历配置；
- 跳过 `undefined`；
- 按 `kind` 生成与现状一致的校验与错误；
- 复用 `toRem`；
- 组装 `--matthew-ui-${cssPrefix}-${suffix}`。

该模块不存储组件默认值，不知道颜色的业务含义，也不导出到 npm 包入口。

### 5.2 组件 Adapter

以下文件继续保留组件自己的公开 TypeScript 类型、私有字段表与现有 Adapter：

- `src/theme/componentTokens.ts`（Button）
- `src/theme/menuComponentTokens.ts`
- `src/theme/autoCompleteComponentTokens.ts`
- `src/theme/thinkingComponentTokens.ts`

每个 Adapter 只提供：

- `componentName`；
- `cssPrefix`；
- 自己的字段映射与校验类别；
- 对通用转换模块的窄调用。

Button 内部字段表的 `color` 类别可归一为 `string`，但其可观察校验和错误文本不得改变。

### 5.3 ThemeProvider 字段合并

在 `ThemeProvider.tsx` 内保留一个私有泛型 helper：

```ts
mergeDefinedFields(parent, current)
```

它只负责：

```text
父层字段 + 当前层非 undefined 字段
```

不将该 helper 放进 `componentTokenUtils.ts`，因为父子主题合并与 Token 到 CSS
转换是两个不同职责。

## 6. 执行批次

### A. 特征保护

- 确认四个 Adapter 的稀疏输出、CSS Variable 名称、rem 转换和异常已有测试。
- 只在现有公开 seam 存在空白时补充回归用例，不围绕循环实现写测试。

### B. 转换模块

- 新增通用模块。
- 逐个将 Button、Menu、AutoComplete、Thinking Adapter 改为窄调用。
- 每迁移一个 Adapter 后运行其现有 ThemeProvider/Token 测试。

### C. 合并 helper

- 在 ThemeProvider 内新增 `mergeDefinedFields`。
- 将四种组件、Seed 和最终 Token 的重复过滤/合并替换为该 helper。
- 保留组件之间独立合并的结构，不将整个 `components` 对象直接覆盖。

### D. 完整验证

- `git diff --check`
- `npm run quality:check`
- 检查真实 tarball 中没有新公开入口、运行时依赖或 CSS 变化。

## 7. 验收标准

- 四个组件字段表不再包含复制的遍历、类型校验、范围校验和
  `toRem` 转换实现。
- 新增组件 Token 时，不需再复制上述通用实现。
- ThemeProvider 中不再为每类配置重复编写
  `Object.entries(...).filter(([, value]) => value !== undefined)`。
- 所有第4节不变量由现有或补充的公开 seam 测试保护。
- `npm run quality:check` 全部通过，lint 只允许已存在的 Menu Fast Refresh warning。
- `git diff --check` 通过。

## 8. 文档与 handoff 职责

本文档是该重构的唯一规范依据。如后续交由其他执行者，handoff 只需：

1. 引用 `docs/spec/component-token-internal-refactor.md`；
2. 说明当前分支、基线 commit 和工作树状态；
3. 记录已完成批次、未完成批次和当前阻塞；
4. 提供最新验证结果。

handoff 不复制本 spec 的目标设计、不变量或验收标准，避免两份文档演变后相互冲突。
