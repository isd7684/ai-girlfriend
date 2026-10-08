"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

type AdminProvidersProps = {
  children: React.ReactNode
}

export function AdminProviders({ children }: AdminProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
