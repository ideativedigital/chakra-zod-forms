import type { Preview } from '@storybook/react'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import React from 'react'

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ChakraProvider value={defaultSystem}>
        <Story />
      </ChakraProvider>
    )
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    docs: {
      canvas: {
        sourceState: 'shown'
      }
    }
  }
}

export default preview

