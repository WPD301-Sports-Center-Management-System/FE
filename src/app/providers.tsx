import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth/context/auth-context'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { queryClient } from '@/shared/api/query-client'

function AppToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolvedTheme}
      duration={3500}
    />
  )
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppToaster />
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

