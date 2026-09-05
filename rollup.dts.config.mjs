import { dts } from 'rollup-plugin-dts'

export default {
  input: {
    index: 'src/index.ts',
    button: 'src/components/Button/index.ts',
    menu: 'src/components/Menu/index.ts',
    'auto-complete': 'src/components/AutoComplete/index.ts',
    thinking: 'src/components/Thinking/index.ts',
    'tool-call': 'src/components/ToolCall/index.ts',
    theme: 'src/theme/index.ts',
  },
  output: {
    dir: 'dist',
    entryFileNames: ({ name }) =>
      name === 'index' ? 'index.d.ts' : `${name}/index.d.ts`,
    format: 'es',
  },
  plugins: [
    dts({
      tsconfig: './tsconfig.build.json',
    }),
  ],
}
