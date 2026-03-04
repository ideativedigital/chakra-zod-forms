import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    '@chakra-ui/react',
    '@fortawesome/pro-regular-svg-icons',
    '@fortawesome/react-fontawesome'
  ]
})
