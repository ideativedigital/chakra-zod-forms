'use client'

import type {
  ButtonProps as ChakraButtonProps,
  IconButtonProps as ChakraIconButtonProps
} from '@chakra-ui/react'
import {
  AbsoluteCenter,
  Button as ChakraButton,
  IconButton as ChakraIconButton,
  Span,
  Spinner
} from '@chakra-ui/react'


import * as React from 'react'
import { useMergeRefs } from '../../hooks/use-merge-refs'
import { isPromise } from '../../utils/types'


interface ButtonCustomProps {
  loading?: boolean
  loadingText?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  hotkey?: string
  displayHotkey?: boolean
  throttle?: number
  tooltip?: React.ReactNode
  active?: boolean
}

export interface ButtonProps extends ChakraButtonProps, ButtonCustomProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | undefined | Promise<void>
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  props,
  extref
) {
  const {
    loading,
    disabled,
    loadingText,
    children,
    tooltip,
    hotkey,
    throttle = 500,
    leftIcon,
    rightIcon,
    displayHotkey = true,
    onClick: propsClick,
    ...rest
  } = props
  const [isLoading, setLoading] = React.useState(loading)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const ref = useMergeRefs([extref, buttonRef])
  const onClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const res = propsClick?.(e)
    if (isPromise(res)) {
      setLoading(true)
      res.finally(() => setLoading(false))
    }
  },
    [propsClick]
  )
  return (

    <ChakraButton disabled={loading || disabled} ref={ref} {...rest} onClick={onClick}>
      {props.asChild ? (
        children
      ) : (loading || isLoading) && !loadingText ? (
        <>
          <AbsoluteCenter display='inline-flex'>
            <Spinner size='inherit' color='inherit' />
          </AbsoluteCenter>
          <Span opacity={0}>{children}</Span>
        </>
      ) : (loading || isLoading) && loadingText ? (
        <>
          <Spinner size='inherit' color='inherit' />
          {loadingText}
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}

    </ChakraButton>

  )
})

interface IconButtonCustomProps {
  loading?: boolean
  icon?: React.ReactNode
  hotkey?: string
  throttle?: number
  tooltip?: React.ReactNode
  active?: boolean
}

export interface IconButtonProps extends ChakraIconButtonProps, IconButtonCustomProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | undefined | Promise<void>
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  props,
  extref
) {
  const {
    loading,
    disabled,
    children,
    tooltip,
    hotkey,
    throttle = 500,
    icon,
    active,
    onClick: propsClick,
    ...rest
  } = props
  const [isLoading, setLoading] = React.useState(loading)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const ref = useMergeRefs([extref, buttonRef])
  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const res = propsClick?.(e)
      if (res instanceof Promise) {
        setLoading(true)
        res.finally(() => setLoading(false))
      }
    },
    [propsClick]
  )
  return (

    <ChakraIconButton disabled={loading || disabled} ref={ref} {...rest} onClick={onClick}>
      {loading || isLoading ? (
        <>
          <AbsoluteCenter display='inline-flex'>
            <Spinner size='inherit' color='inherit' />
          </AbsoluteCenter>
          <Span opacity={0}>{children}</Span>
        </>
      ) : (
        <>
          {icon}
          {children}

        </>
      )}
    </ChakraIconButton>

  )
})
