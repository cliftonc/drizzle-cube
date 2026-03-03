/**
 * Notebook Zustand Store (Instance-based)
 *
 * State management for the AgenticNotebook component, consolidating:
 * - Notebook blocks (portlets + markdown)
 * - Chat messages
 * - Session state
 * - UI state
 *
 * KEY ARCHITECTURE: Instance-based stores
 * - Each AgenticNotebook gets its own store instance via Context
 * - No server state (data fetching is handled by portlets via TanStack Query)
 * - State is per-notebook session
 *
 * Uses Zustand's createStore (factory) instead of create (singleton).
 * Store is provided via React Context.
 */

import { createContext, useContext, useRef, type ReactNode } from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type {
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
} from '../types'

// ============================================================================
// Types
// ============================================================================

/**
 * A portlet block in the notebook
 */
export interface PortletBlock {
  id: string
  type: 'portlet'
  title: string
  query: string
  chartType: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
}

/**
 * A markdown text block in the notebook
 */
export interface MarkdownBlock {
  id: string
  type: 'markdown'
  title?: string
  content: string
}

/**
 * A block in the notebook canvas
 */
export type NotebookBlock = PortletBlock | MarkdownBlock

/**
 * A tool call record for display in chat messages
 */
export interface ToolCallRecord {
  id: string
  name: string
  input?: unknown
  result?: unknown
  status: 'running' | 'complete' | 'error'
}

/**
 * A chat message
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: string
  toolCalls?: ToolCallRecord[]
  timestamp: number
}

/**
 * Serializable notebook config for save/load
 */
export interface NotebookConfig {
  blocks: NotebookBlock[]
  messages: ChatMessage[]
}

// ============================================================================
// Store State
// ============================================================================

export interface NotebookStoreState {
  /** Ordered array of notebook blocks */
  blocks: NotebookBlock[]

  /** Chat message history */
  messages: ChatMessage[]

  /** Whether the agent is currently streaming a response */
  isStreaming: boolean

  /** Agent SDK session ID for multi-turn conversations */
  sessionId: string | null

  /** Chat input value */
  inputValue: string
}

// ============================================================================
// Store Actions
// ============================================================================

export interface NotebookStoreActions {
  // Block actions
  addBlock: (block: NotebookBlock) => void
  removeBlock: (id: string) => void
  moveBlock: (id: string, direction: 'up' | 'down') => void
  updateBlock: (id: string, updates: Partial<Omit<PortletBlock, 'id' | 'type'>>) => void

  // Chat actions
  addMessage: (message: ChatMessage) => void
  appendToLastAssistantMessage: (text: string) => void
  setLastAssistantError: (error: string) => void
  addToolCallToLastAssistant: (toolCall: ToolCallRecord) => void
  updateLastToolCall: (update: Partial<ToolCallRecord>) => void

  // Session/UI actions
  setIsStreaming: (streaming: boolean) => void
  setSessionId: (id: string | null) => void
  setInputValue: (value: string) => void

  // Persistence
  save: () => NotebookConfig
  load: (config: NotebookConfig) => void

  // Reset
  reset: () => void
}

/**
 * Combined store type
 */
export type NotebookStore = NotebookStoreState & NotebookStoreActions

// ============================================================================
// Initial State
// ============================================================================

const createDefaultState = (): NotebookStoreState => ({
  blocks: [],
  messages: [],
  isStreaming: false,
  sessionId: null,
  inputValue: '',
})

// ============================================================================
// Store Factory
// ============================================================================

function createStoreActions(
  set: (
    partial:
      | Partial<NotebookStore>
      | ((state: NotebookStore) => Partial<NotebookStore>)
  ) => void,
  get: () => NotebookStore
): NotebookStoreActions {
  return {
    // Block actions
    addBlock: (block) =>
      set((state) => ({
        blocks: [...state.blocks, block],
      })),

    removeBlock: (id) =>
      set((state) => ({
        blocks: state.blocks.filter((b) => b.id !== id),
      })),

    moveBlock: (id, direction) =>
      set((state) => {
        const idx = state.blocks.findIndex((b) => b.id === id)
        if (idx === -1) return {}
        if (direction === 'up' && idx === 0) return {}
        if (direction === 'down' && idx === state.blocks.length - 1) return {}

        const newBlocks = [...state.blocks]
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1
        ;[newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]]
        return { blocks: newBlocks }
      }),

    updateBlock: (id, updates) =>
      set((state) => ({
        blocks: state.blocks.map((b) =>
          b.id === id && b.type === 'portlet' ? { ...b, ...updates } : b
        ),
      })),

    // Chat actions
    addMessage: (message) =>
      set((state) => ({
        messages: [...state.messages, message],
      })),

    appendToLastAssistantMessage: (text) =>
      set((state) => {
        const messages = [...state.messages]
        const lastMsg = messages[messages.length - 1]
        if (lastMsg && lastMsg.role === 'assistant') {
          messages[messages.length - 1] = {
            ...lastMsg,
            content: lastMsg.content + text,
          }
        }
        return { messages }
      }),

    setLastAssistantError: (error) =>
      set((state) => {
        const messages = [...state.messages]
        const lastMsg = messages[messages.length - 1]
        if (lastMsg && lastMsg.role === 'assistant') {
          messages[messages.length - 1] = { ...lastMsg, error }
        }
        return { messages }
      }),

    addToolCallToLastAssistant: (toolCall) =>
      set((state) => {
        const messages = [...state.messages]
        const lastMsg = messages[messages.length - 1]
        if (lastMsg && lastMsg.role === 'assistant') {
          messages[messages.length - 1] = {
            ...lastMsg,
            toolCalls: [...(lastMsg.toolCalls || []), toolCall],
          }
        }
        return { messages }
      }),

    updateLastToolCall: (update) =>
      set((state) => {
        const messages = [...state.messages]
        const lastMsg = messages[messages.length - 1]
        if (lastMsg?.role === 'assistant' && lastMsg.toolCalls?.length) {
          const toolCalls = [...lastMsg.toolCalls]
          // Find by ID if provided, otherwise fall back to last
          const idx = update.id
            ? toolCalls.findIndex((tc) => tc.id === update.id)
            : toolCalls.length - 1
          if (idx !== -1) {
            toolCalls[idx] = { ...toolCalls[idx], ...update }
            messages[messages.length - 1] = { ...lastMsg, toolCalls }
          }
        }
        return { messages }
      }),

    // Session/UI actions
    setIsStreaming: (streaming) => set({ isStreaming: streaming }),
    setSessionId: (id) => set({ sessionId: id }),
    setInputValue: (value) => set({ inputValue: value }),

    // Persistence
    save: () => {
      const state = get()
      return {
        blocks: state.blocks,
        messages: state.messages,
      }
    },

    load: (config) =>
      set({
        blocks: config.blocks || [],
        messages: config.messages || [],
      }),

    // Reset
    reset: () => set(createDefaultState()),
  }
}

/**
 * Create a new notebook store instance
 */
export function createNotebookStore() {
  const initialState = createDefaultState()

  return createStore<NotebookStore>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        ...initialState,
        ...createStoreActions(set, get),
      })),
      { name: 'NotebookStore' }
    )
  )
}

// ============================================================================
// React Context & Provider
// ============================================================================

const NotebookStoreContext = createContext<StoreApi<NotebookStore> | null>(null)

export interface NotebookStoreProviderProps {
  children: ReactNode
  /** Initial config to load */
  initialConfig?: NotebookConfig
}

/**
 * Provider component that creates a store instance per AgenticNotebook
 */
export function NotebookStoreProvider({
  children,
  initialConfig,
}: NotebookStoreProviderProps) {
  const storeRef = useRef<StoreApi<NotebookStore> | null>(null)

  if (!storeRef.current) {
    const store = createNotebookStore()
    if (initialConfig) {
      store.getState().load(initialConfig)
    }
    storeRef.current = store
  }

  return (
    <NotebookStoreContext.Provider value={storeRef.current}>
      {children}
    </NotebookStoreContext.Provider>
  )
}

/**
 * Hook to access the notebook store from context
 * @throws Error if used outside of provider
 */
export function useNotebookStore<T>(selector: (state: NotebookStore) => T): T {
  const store = useContext(NotebookStoreContext)
  if (!store) {
    throw new Error('useNotebookStore must be used within NotebookStoreProvider')
  }
  return useStore(store, selector)
}

// ============================================================================
// Selectors
// ============================================================================

export const selectBlocks = (state: NotebookStore) => state.blocks
export const selectMessages = (state: NotebookStore) => state.messages
export const selectIsStreaming = (state: NotebookStore) => state.isStreaming
export const selectSessionId = (state: NotebookStore) => state.sessionId
export const selectInputValue = (state: NotebookStore) => state.inputValue

export const selectChatState = (state: NotebookStore) => ({
  messages: state.messages,
  isStreaming: state.isStreaming,
  inputValue: state.inputValue,
})

export const selectChatActions = (state: NotebookStore) => ({
  addMessage: state.addMessage,
  appendToLastAssistantMessage: state.appendToLastAssistantMessage,
  setLastAssistantError: state.setLastAssistantError,
  addToolCallToLastAssistant: state.addToolCallToLastAssistant,
  updateLastToolCall: state.updateLastToolCall,
  setIsStreaming: state.setIsStreaming,
  setInputValue: state.setInputValue,
  setSessionId: state.setSessionId,
})

export const selectBlockActions = (state: NotebookStore) => ({
  addBlock: state.addBlock,
  removeBlock: state.removeBlock,
  moveBlock: state.moveBlock,
  updateBlock: state.updateBlock,
})
