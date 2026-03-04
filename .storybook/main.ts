import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {}
    config.resolve.dedupe = [
      ...(config.resolve.dedupe ?? []),
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled'
    ]
    return config
  }
}

export default config

