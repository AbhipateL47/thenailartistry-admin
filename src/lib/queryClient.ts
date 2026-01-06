import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized QueryClient configuration
 * - 30s staleTime for queries
 * - No refetch on window focus
 * - Retry once for queries, never for mutations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
