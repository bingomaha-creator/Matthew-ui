import type { MatthewThemeConfig } from './tokens'

/** 显式写出亮色预设拥有的字段，使它在暗色嵌套区域中也能明确切回亮色。 */
export const lightTheme = {
  seed: {
    colorPrimary: '#2563eb',
    colorDanger: '#dc2626',
  },
  tokens: {
    colorPrimaryHover: '#1d4ed8',
    colorPrimaryActive: '#1e40af',
    colorSurface: '#ffffff',
    colorSurfaceHover: '#f1f5f9',
    colorSurfaceActive: '#e2e8f0',
    colorText: '#0f172a',
    colorTextMuted: '#64748b',
    colorTextInverse: '#ffffff',
    colorBorder: '#cbd5e1',
    shadowOverlay: '0 0.75rem 1.5rem rgb(15 23 42 / 12%)',
  },
} satisfies MatthewThemeConfig

/**
 * 暗色第一版使用显式中性色表，而不是隐藏的暗色派生算法。
 * 品牌色和危险色仍作为 Seed，继续复用 createTokens 的交互色派生规则。
 */
export const darkTheme = {
  seed: {
    colorPrimary: '#3b82f6',
    colorDanger: '#ef4444',
  },
  tokens: {
    // 暗色选中态把 Primary 当作前景色使用，需要亮色阶保证与 active surface 的对比度。
    colorPrimaryHover: '#60a5fa',
    colorPrimaryActive: '#bfdbfe',
    colorSurface: '#1e293b',
    colorSurfaceHover: '#334155',
    colorSurfaceActive: '#475569',
    colorText: '#f8fafc',
    colorTextMuted: '#94a3b8',
    colorTextInverse: '#0f172a',
    colorBorder: '#334155',
    shadowOverlay: '0 0.75rem 1.5rem rgb(255 255 255 / 12%)',
  },
} satisfies MatthewThemeConfig
