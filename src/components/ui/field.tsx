import { Box, Button, Field as ChakraField, defineStyle, SystemStyleObject } from '@chakra-ui/react'
import * as React from 'react'
import { LuInfo } from 'react-icons/lu'
import { ToggleTip } from './toggle-tip'

export interface FieldProps extends Omit<ChakraField.RootProps, 'label'> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  errorText?: React.ReactNode
  optionalText?: React.ReactNode
  tooltip?: React.ReactNode
  floatingLabel?: boolean
  floatingBg?: SystemStyleObject['bg']
  asLine?: boolean
}

const FloatingLabelWrapper = ({
  children,
  isActive
}: React.PropsWithChildren<{ isActive?: boolean }>) => {
  if (isActive) {
    return (
      <Box pos='relative' w='full'>
        {children}
      </Box>
    )
  }
  return <>{children}</>
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(props, ref) {
  const {
    label,
    children,
    helperText,
    errorText,
    tooltip,
    optionalText,
    floatingLabel,
    floatingBg,
    asLine,
    ...rest
  } = props
  return (
    <ChakraField.Root ref={ref} flexDirection={asLine ? 'row' : 'column'} {...rest}>
      <FloatingLabelWrapper isActive={floatingLabel}>
        {!floatingLabel && label && (
          <ChakraField.Label
            css={floatingLabel ? { ...floatingStyles, bg: floatingBg ?? floatingStyles.bg } : {}}>
            {label}
            {tooltip && <ToggleTip content={tooltip}>
              <Button size="xs" variant="ghost">
                <LuInfo />
              </Button></ToggleTip>}
            <ChakraField.RequiredIndicator fallback={optionalText} />
          </ChakraField.Label>
        )}
        {React.isValidElement(children)
          ? React.cloneElement(children, {
            ...(children.props as any),
            className: `${(children.props as any).className ?? ''} peer`
          })
          : children}
        {floatingLabel && label && (
          <ChakraField.Label css={floatingLabel ? floatingStyles : {}}>
            {label}
            <ChakraField.RequiredIndicator fallback={optionalText} />
          </ChakraField.Label>
        )}
      </FloatingLabelWrapper>
      {(helperText || (floatingLabel && tooltip)) && (
        <ChakraField.HelperText>{helperText || (floatingLabel && tooltip)}</ChakraField.HelperText>
      )}
      {errorText && <ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>}
    </ChakraField.Root>
  )
})

const floatingStyles = defineStyle({
  pos: 'absolute',
  bg: 'bg',
  px: '0.5',
  top: '-3',
  insetStart: '2',
  fontWeight: 'normal',
  pointerEvents: 'none',
  transition: 'position',
  _peerPlaceholderShown: {
    color: 'colorPalette.fg',
    top: '2.5',
    insetStart: '3'
  },
  _peerFocusVisible: {
    top: '-3',
    insetStart: '2',
    color: 'colorPalette.fg'
  }
})
