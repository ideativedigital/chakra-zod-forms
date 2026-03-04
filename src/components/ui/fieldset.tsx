import { Fieldset as ChakraFieldset, Text } from '@chakra-ui/react'
import { forwardRef } from 'react'

export interface FieldsetProps extends Omit<ChakraFieldset.RootProps, 'label'> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  errorText?: React.ReactNode
  optionalText?: React.ReactNode
  tooltip?: React.ReactNode
  required?: boolean
}

export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(
  function Fieldset(props, ref) {
    const { label, children, helperText, errorText, tooltip, optionalText, required, ...rest } =
      props
    return (
      <ChakraFieldset.Root ref={ref} {...rest}>
        <ChakraFieldset.Legend>
          {label}{' '}
          {required && (
            <Text as='span' color='red.500'>
              {' '}
              *
            </Text>
          )}
        </ChakraFieldset.Legend>
        <ChakraFieldset.Content>{children}</ChakraFieldset.Content>
        {helperText && <ChakraFieldset.HelperText>{helperText}</ChakraFieldset.HelperText>}
        {errorText && <ChakraFieldset.ErrorText>{errorText}</ChakraFieldset.ErrorText>}
      </ChakraFieldset.Root>
    )
  }
)
