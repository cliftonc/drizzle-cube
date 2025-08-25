import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { 
  AnalyticsPage, 
  CreateAnalyticsPageRequest, 
  UpdateAnalyticsPageRequest 
} from '../types'

const API_BASE = '/api/analytics-pages'

// Fetch all analytics pages
export function useAnalyticsPages() {
  return useQuery({
    queryKey: ['analytics-pages'],
    queryFn: async (): Promise<AnalyticsPage[]> => {
      const response = await fetch(API_BASE)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics pages')
      }
      const data = await response.json()
      return data.data
    }
  })
}

// Fetch single analytics page
export function useAnalyticsPage(id: number | string) {
  return useQuery({
    queryKey: ['analytics-pages', id],
    queryFn: async (): Promise<AnalyticsPage> => {
      const response = await fetch(`${API_BASE}/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics page')
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!id
  })
}

// Create analytics page
export function useCreateAnalyticsPage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (pageData: CreateAnalyticsPageRequest): Promise<AnalyticsPage> => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pageData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create analytics page')
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-pages'] })
    }
  })
}

// Create example analytics page
export function useCreateExamplePage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (): Promise<AnalyticsPage> => {
      const response = await fetch(`${API_BASE}/create-example`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to create example page')
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-pages'] })
    }
  })
}

// Update analytics page
export function useUpdateAnalyticsPage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...pageData 
    }: UpdateAnalyticsPageRequest & { id: number }): Promise<AnalyticsPage> => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pageData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update analytics page')
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analytics-pages'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-pages', variables.id] })
    }
  })
}

// Reset analytics page to default configuration
export function useResetAnalyticsPage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number): Promise<AnalyticsPage> => {
      const response = await fetch(`${API_BASE}/${id}/reset`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset analytics page')
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['analytics-pages'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-pages', id] })
    }
  })
}

// Delete analytics page
export function useDeleteAnalyticsPage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete analytics page')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-pages'] })
    }
  })
}