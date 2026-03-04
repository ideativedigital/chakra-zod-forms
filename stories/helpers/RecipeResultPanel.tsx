import { Box, Code, Text } from '@chakra-ui/react'

type RecipeResultPanelProps = {
  result: unknown
}

export function RecipeResultPanel({ result }: RecipeResultPanelProps) {
  return (
    <Box>
      <Text mb="2" fontWeight="medium">
        Submitted JSON
      </Text>
      <Code display="block" whiteSpace="pre" p="3">
        {JSON.stringify(result, null, 2)}
      </Code>
    </Box>
  )
}

