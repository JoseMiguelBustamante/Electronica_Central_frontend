import { createContext } from 'react'

export interface ToastAction {
  label: string
  to?: string
  onClick?: () => void
}

export interface ToastOptions {
  action?: ToastAction
}

export interface ToastApi {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
}

export const ToastContext = createContext<ToastApi | null>(null)
