import { Dialog as ChakraDialog, CloseButton, ColorPalette, DialogRootProps, Portal } from '@chakra-ui/react'
import * as React from 'react'




interface DialogContentProps extends ChakraDialog.ContentProps {
  portalled?: boolean
  portalRef?: React.RefObject<HTMLDivElement>
  backdrop?: boolean
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(props, ref) {
    const { children, portalled = true, portalRef, backdrop = true, ...rest } = props
    const mbRef = React.useRef<HTMLDivElement>(null)

    return (
      <Portal disabled={!portalled} container={portalRef}>
        {backdrop && <ChakraDialog.Backdrop />}
        <ChakraDialog.Positioner>
          <ChakraDialog.Content ref={ref ?? mbRef} {...rest}>
            {children}
          </ChakraDialog.Content>
        </ChakraDialog.Positioner>
      </Portal>
    )
  }
)

export const DialogCloseTrigger = React.forwardRef<
  HTMLButtonElement,
  ChakraDialog.CloseTriggerProps
>(function DialogCloseTrigger(props, ref) {
  return (
    <ChakraDialog.CloseTrigger position='absolute' top='2' insetEnd='2' {...props} asChild>
      <CloseButton size='sm' ref={ref}>
        {props.children}
      </CloseButton>
    </ChakraDialog.CloseTrigger>
  )
})

export type SimpleDialogProps = DialogRootProps & {
  closeable?: boolean
  onClose: () => void
  contentRef?: React.RefObject<HTMLDivElement>
  colorPalette?: ColorPalette
}
export const SimpleDialog = ({
  closeable,
  children,
  onClose,
  contentRef,
  colorPalette,
  ...props
}: SimpleDialogProps) => {
  return (
    <Dialog.Root
      {...props}
      onOpenChange={e => {
        props.onOpenChange?.(e)
        if (!e.open) onClose()
      }}>
      <DialogContent ref={contentRef} colorPalette={colorPalette}>
        {closeable && <DialogCloseTrigger />}
        {children}
      </DialogContent>
    </Dialog.Root>
  )
}

export const DialogRoot = ChakraDialog.Root
export const DialogFooter = ChakraDialog.Footer
export const DialogHeader = ChakraDialog.Header
export const DialogBody = ChakraDialog.Body
export const DialogBackdrop = ChakraDialog.Backdrop
export const DialogTitle = ChakraDialog.Title
export const DialogDescription = ChakraDialog.Description
export const DialogTrigger = ChakraDialog.Trigger
export const DialogActionTrigger = ChakraDialog.ActionTrigger

export const Dialog = {
  Root: DialogRoot,
  Content: DialogContent,
  CloseTrigger: DialogCloseTrigger,
  Footer: DialogFooter,
  Header: DialogHeader,
  Body: DialogBody,
  Backdrop: DialogBackdrop,
  Title: DialogTitle,
  Description: DialogDescription,
  Trigger: DialogTrigger,
  ActionTrigger: DialogActionTrigger,
  Simple: SimpleDialog
}
