// src/components/layout/app-providers.tsx
"use client";

import type { ReactNode } from 'react';

// This component can be used to wrap your application with any client-side context providers
// For example, React Query Provider, Theme Provider, etc.
// For now, it's a simple passthrough, but useful for future expansion.

export default function AppProviders({ children }: { children: ReactNode }) {
  // Example:
  // const [queryClient] = useState(() => new QueryClient());
  // return (
  //   <QueryClientProvider client={queryClient}>
  //     {children}
  //   </QueryClientProvider>
  // );

  return <>{children}</>;
}
