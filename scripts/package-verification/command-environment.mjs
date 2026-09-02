// 为发布验证器的全部子命令提供一致、隔离的 npm 环境。
export function createVerificationCommandEnvironment({
  npmCache,
  overrides = {},
  parentEnvironment = process.env,
}) {
  return {
    ...parentEnvironment,
    npm_config_cache: npmCache,
    ...overrides,
    // npm publish --dry-run 会把配置传给 prepublishOnly；内部验证必须真正写入临时文件。
    npm_config_dry_run: 'false',
    NPM_CONFIG_DRY_RUN: 'false',
  }
}
