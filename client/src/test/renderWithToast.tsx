import type { ReactNode } from 'react'
import type { RenderOptions } from '@testing-library/react'
import { ToastProvider } from '../components/toast/ToastProvider'
import { render as renderWithTestingLibrary } from '@testing-library/react'

export const render = (ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) => {
    return renderWithTestingLibrary(ui, { wrapper: ToastProvider, ...options })
}
