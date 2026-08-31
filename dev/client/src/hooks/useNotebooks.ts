import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Notebook,
  CreateNotebookRequest,
  UpdateNotebookRequest
} from '../types'
import { getJson, retryUnlessRequestFault } from './api'
export { isNotFound } from './api'

const API_BASE = '/api/notebooks'

// Fetch all notebooks
export function useNotebooks() {
  return useQuery({
    queryKey: ['notebooks'],
    queryFn: () => getJson<Notebook[]>(API_BASE, 'Failed to fetch notebooks'),
    retry: retryUnlessRequestFault
  })
}

// Fetch single notebook
export function useNotebook(id: number | string) {
  return useQuery({
    queryKey: ['notebooks', id],
    queryFn: () => getJson<Notebook>(`${API_BASE}/${id}`, 'Failed to fetch notebook'),
    enabled: !!id,
    retry: retryUnlessRequestFault
  })
}

// Create notebook
export function useCreateNotebook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateNotebookRequest): Promise<Notebook> => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create notebook')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
    }
  })
}

// Update notebook
export function useUpdateNotebook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: UpdateNotebookRequest & { id: number }): Promise<Notebook> => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update notebook')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(['notebooks', variables.id], updated)
      queryClient.setQueryData(['notebooks', String(variables.id)], updated)
      queryClient.invalidateQueries({ queryKey: ['notebooks'], exact: true })
    }
  })
}

// Delete notebook
export function useDeleteNotebook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete notebook')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
    }
  })
}
