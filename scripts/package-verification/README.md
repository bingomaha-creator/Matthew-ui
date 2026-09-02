# Package verification

统一运行入口仍是 `npm run verify:package`。下面的 Module 不单独启动，
由 `scripts/verify-package.mjs` 按原顺序调用，并共享命令执行和失败汇总。

| 文件 | 职责 |
| --- | --- |
| `../verify-package.mjs` | 创建临时目录、打包/解包、组织检查、汇总失败、最终清理 |
| `package-checks.mjs` | 完整发布文件树的引用可达性、manifest、README、公开声明与依赖合同 |
| `style-checks.mjs` | Token/组件/全量 CSS 内容、CSS/JS source map、Chromium 计算样式 |
| `menu-style-checks.mjs` | Menu真实挂载bundle、按需/全量CSS的固定预期、选中hover与浮层检查 |
| `auto-complete-style-checks.mjs` | AutoComplete真实挂载、按需/全量CSS、输入/加载/候选/状态及暗色浮层检查 |
| `consumer-checks.mjs` | 创建并安装 React 18/19 消费端、执行类型/运行时/Vite/浏览器样式检查 |
| `fixtures/` | 原样复制到临时消费项目的真实示例文件 |
| `*.test.mjs` | 验证器自身的回归测试：合法产物应通过，故意破坏的产物应失败 |
| `test-support.mjs` | 为回归测试创建临时发布包副本并清理，不修改仓库 dist |

## Fixture 的执行环境

Fixture 是消费端代码，不是本库源码；其中 `matthew-ui` 必须解析为临时项目安装的
真实 npm tarball，不能为方便本地编辑而改成源码相对路径或添加源码 alias。
消费者的 package.json 和 tsconfig 仍由 consumer-checks 按版本生成。

`consumer.tsx` 保留合法用法和 `@ts-expect-error` 负向类型用例；
只有该文件中的两个 Invalid 类型别名被 lint 的 unused 规则豁免，
其错误类型约束仍由两套消费环境的 TypeScript 编译验证。

## 评审问题修复（2026-08-30）

结构拆分后，以下三项已补充行为检查：

- 从 manifest 的公开 JS/类型/CSS 入口递归遍历真实静态引用，支持多层与循环引用；
  JS 使用 TypeScript 预扫描识别 import/export/require，不因注释或普通字符串包含文件名就认定可达。
- 把完整发布文件树与可达集合比较，拒绝任意目录内的孤儿文件；同时跟随声明依赖、
  CSS 本地资源和相邻 source map，缺失依赖也会失败。裸包依赖由真实消费者安装验证，
  map 内嵌源码不是需要额外发布的文件。
- React 18.2/19 消费端从真实安装包渲染默认 Button HTML，不挂 ThemeProvider；
  Chromium 分别加载按需 CSS 和全量 CSS，验证 :root 回退、字体颜色、背景、
  边框、圆角和 md 高度。每种模式使用独立页面、16px 根字号与 reduced-motion，
  比较固定期望及两种模式的结果，避免两套样式一起错误却通过。

## 如何运行

```bash
# 首次安装依赖后准备 Chromium；CI 已包含此步骤
npx playwright install chromium

# 构建后运行验证器的34条回归测试，不安装 React 双版本消费项目
npm run test:package-checks

# 包含上述回归测试，再打包并验证 React 18.2/19 真实消费
npm run verify:package
```

4C 在同一消费链路补充 `style-markup.mjs --configured`：真实包的 ThemeProvider
生成10个配置字段，Button 与 LinkButton 验证默认/悬停/按下配色、5项尺寸、作用域隔离。
每种 CSS 模式仍保留无 Provider 基线；定制值分别匹配固定期望，不能仅凭两模式相等通过。
回归测试故意破坏临时副本的圆角、hover 色或链接字号，证明检查器会拒绝错误产物。

Button浏览器样式检查使用SSR HTML与真实指针验证CSS，不替代React事件、hydration或视觉截图测试。
引入方式的生产打包与 Tree Shaking 仍由独立 Vite fixtures 验证。

5A在现有consumer.tsx/esm-check.mjs中补充Menu配置：
验证包根/theme子路径的合法与非法类型，以及真实React18.2/19的嵌套SSR输出、
Button/Menu字段共存和数值范围错误。5B完成Menu源码SCSS接线与浏览器样式测试。

5C新增 `menu-browser.mjs`，在同一消费端真实挂载Menu并经过effect注册：
无Provider基线、13字段定制和暗色浮层在两种CSS模式分别对照固定预期。
fixture用受控openValues保留浮层，避免跨区域移动指针触发延迟关闭干扰样式检查；
选择Item仍通过真实点击，hover使用真实指针，不手工构造内部class。
Vite仅在内存构建消费项目bundle，不使用源码alias、不产生持久构建目录；
fixture从消费端解析React18.2/19与安装包，并检查menu-only JS不包含其他组件或隐式CSS。

`menu-browser-style-checks.test.mjs`新增7条验证器回归：
正常产物通过，临时副本中6种样式错误会被拒绝。回归测试使用当前构建的dist副本
与本地运行依赖；真正的React双版本tarball安装仍由consumer-checks单独执行。
临时副本在测试结束时清理，不修改真实dist或源码。

6A在现有consumer.tsx/esm-check.mjs中追加AutoComplete17字段的公开类型用例，
以及React18.2/19包根/theme入口的三组件嵌套SSR、稀疏输出、尺寸范围和阴影类型错误。
这仅验证配置能力；6B已完成AutoComplete源码SCSS接线与15条浏览器样式测试，
以下6C继续完成真实包默认/定制样式专项验收，不把源码测试或SSR输出视为包样式验收。

6C新增 `auto-complete-browser.mjs` 消费端示例与 `auto-complete-style-checks.mjs`：
两套React真实挂载AutoComplete，输入触发300ms防抖，在网络边界控制Promise返回，
验证加载行、候选、真实方向键/指针与回填，以及禁用/只读与亮暗浮层。
两种CSS模式各自对照固定预期，保留无Provider基线；auto-complete-only无其他组件或隐式CSS。
新增7条验证器回归已Red→Green，6种临时CSS错误被拒绝；沿用已有临时副本清理机制。
不新增独立发布脚本，也不改组件状态实现。
