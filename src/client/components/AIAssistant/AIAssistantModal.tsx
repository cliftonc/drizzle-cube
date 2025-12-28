/**
 * AI Assistant Modal Component
 * 
 * Multi-step modal for AI-powered query generation
 * Step 1: API Key input
 * Step 2: Model selection  
 * Step 3: Query input and response
 */

import React, { useState } from 'react'
import { getIcon } from '../../icons'
import Modal from '../Modal'

const ErrorIcon = getIcon('error')
const SuccessIcon = getIcon('success')
const SparklesIcon = getIcon('sparkles')
import type { AIAssistantState } from './types'
import {
  sendGeminiMessage,
  loadAIConfig,
  extractTextFromResponse
} from './utils'
import { DEFAULT_SYSTEM_PROMPT_TEMPLATE } from './constants'

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  schema?: any
  onQueryLoad?: (query: any) => void
  aiEndpoint?: string
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onQueryLoad,
  aiEndpoint = '/api/ai'
}) => {
  const [state, setState] = useState<AIAssistantState>(() => {
    const savedConfig = loadAIConfig()
    return {
      step: 'query', // Skip API key step and go straight to query
      apiKey: savedConfig.apiKey || '',
      systemPromptTemplate: DEFAULT_SYSTEM_PROMPT_TEMPLATE,
      userPrompt: '',
      isSubmitting: false,
      response: null,
      responseError: null,
      isValidating: false,
      validationResult: null,
      validationError: null
    }
  })


  const handleQuerySubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!state.userPrompt.trim()) return

    setState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      response: null, 
      responseError: null,
      validationResult: null,
      validationError: null,
      isValidating: false
    }))

    try {
      // Send only the user prompt - server will handle system prompt building
      const response = await sendGeminiMessage(
        state.apiKey,
        state.userPrompt,
        aiEndpoint
      )

      const responseText = extractTextFromResponse(response)
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        response: responseText 
      }))
      
      // Automatically validate after successful generation
      setTimeout(() => {
        validateResponse(responseText)
      }, 500)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        responseError: error instanceof Error ? error.message : 'Failed to process query'
      }))
    }
  }

  // Validate a specific response text (used for auto-validation)
  const validateResponse = async (responseText: string) => {
    if (!responseText) {
      console.log('AI Modal: No response text to validate')
      return
    }

    console.log('AI Modal: Starting validation with response:', responseText.substring(0, 100) + '...')
    
    setState(prev => ({
      ...prev,
      isValidating: true,
      validationResult: null,
      validationError: null
    }))

    try {
      const query = JSON.parse(responseText)
      console.log('AI Modal: Parsed query:', query)
      
      const response = await fetch('/cubejs-api/v1/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      })

      console.log('AI Modal: Validation response status:', response.status)

      if (response.ok) {
        console.log('AI Modal: Validation SUCCESS')
        setState(prev => ({
          ...prev,
          isValidating: false,
          validationResult: 'valid'
        }))
      } else {
        const errorData = await response.text()
        console.log('AI Modal: Validation FAILED:', errorData)
        setState(prev => ({
          ...prev,
          isValidating: false,
          validationResult: 'invalid',
          validationError: errorData || `HTTP ${response.status}: ${response.statusText}`
        }))
      }
    } catch (error) {
      console.log('AI Modal: Validation ERROR:', error)
      setState(prev => ({
        ...prev,
        isValidating: false,
        validationResult: 'invalid',
        validationError: error instanceof Error ? error.message : 'Failed to validate query'
      }))
    }
  }

  const handleValidate = async () => {
    if (!state.response) return
    await validateResponse(state.response)
  }

  const handleUseQuery = () => {
    if (!state.response || !onQueryLoad) return

    try {
      const query = JSON.parse(state.response)
      onQueryLoad(query)
      handleClose()
    } catch (error) {
      setState(prev => ({
        ...prev,
        validationError: 'Invalid JSON format'
      }))
    }
  }

  const handleClose = () => {
    setState(prev => ({
      ...prev,
      response: null,
      responseError: null,
      validationResult: null,
      validationError: null
    }))
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuerySubmit()
    }
  }



  const renderQueryStep = () => (
    <div className="flex flex-col space-y-4">
      {/* Top: Config Panel - Full Width */}
      <div className="shrink-0 p-3 bg-dc-surface-secondary border border-dc-border rounded-md">
        <div className="text-sm text-dc-text-muted">
          Using: <span className="font-medium">AI Query Generation</span>
          <span className="ml-2 px-2 py-1 bg-dc-accent-bg text-dc-accent text-xs rounded-sm">
            Server-provided AI (Rate Limited)
          </span>
        </div>
      </div>
      
      {/* Middle: Input/Output Row - Takes remaining space */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Left: Query Input */}
        <div className="w-full md:w-1/2 flex flex-col">
          <label htmlFor="user-prompt" className="block text-sm font-medium text-dc-text-secondary mb-2">
            Describe your query in natural language
          </label>
          <textarea
            id="user-prompt"
            value={state.userPrompt}
            onChange={(e) => setState(prev => ({ ...prev, userPrompt: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Show me the total revenue by month for the last year (Press Enter to generate, Shift+Enter for new line)"
            className="flex-1 w-full px-3 py-2 border border-dc-border rounded-md shadow-xs focus:outline-none focus:ring-dc-accent focus:border-dc-accent resize-none bg-dc-surface text-dc-text"
            required
          />
        </div>
        
        {/* Right: Output Query */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {state.response ? (
                <>
                  <SuccessIcon className="w-5 h-5 text-dc-success" />
                  <span className="text-sm font-medium text-dc-success">AI Generated Query</span>
                </>
              ) : (
                <span className="text-sm font-medium text-dc-text-muted">Generated Query</span>
              )}
            </div>
            {state.response && (
              <button
                onClick={handleValidate}
                disabled={state.isValidating}
                className="text-xs text-dc-accent hover:text-dc-accent disabled:opacity-50"
                title="Click to re-validate query"
              >
                {state.isValidating ? 'Validating...' : 'Re-validate'}
              </button>
            )}
          </div>

          {state.response ? (
            <div className="flex-1 bg-dc-success-bg border border-dc-success rounded-md p-3">
              <pre className="text-sm text-dc-text whitespace-pre-wrap overflow-auto bg-dc-surface p-3 rounded-sm border h-full">
                {state.response}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-dc-text-muted border-2 border-dashed border-dc-border rounded-md p-8 min-h-64">
              <div className="text-center">
                <SparklesIcon className="w-12 h-12 mx-auto text-dc-text-muted" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Messages - Fixed height */}
      <div className="shrink-0">
        {state.responseError && (
          <div className="flex items-start space-x-2 p-3 bg-dc-danger-bg border border-dc-error rounded-md">
            <ErrorIcon className="w-5 h-5 text-dc-error mt-0.5 shrink-0" />
            <div className="text-sm text-dc-error">{state.responseError}</div>
          </div>
        )}
        
        {state.isValidating && (
          <div className="flex items-start space-x-2 p-3 bg-dc-accent-bg border border-dc-accent rounded-md">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-dc-accent mt-0.5 shrink-0"></div>
            <div className="text-sm text-dc-accent">Validating query...</div>
          </div>
        )}
        
        {state.validationResult === 'valid' && !state.isValidating && (
          <div className="flex items-start space-x-2 p-3 bg-dc-success-bg border border-dc-success rounded-md">
            <SuccessIcon className="w-5 h-5 text-dc-success mt-0.5 shrink-0" />
            <div className="text-sm text-dc-success">Query is valid and ready to use!</div>
          </div>
        )}
        
        {state.validationResult === 'invalid' && !state.isValidating && (
          <div className="flex items-start space-x-2 p-3 bg-dc-danger-bg border border-dc-error rounded-md">
            <ErrorIcon className="w-5 h-5 text-dc-error mt-0.5 shrink-0" />
            <div className="text-sm text-dc-error">
              <div className="font-medium mb-1">Query validation failed:</div>
              <div className="text-xs">{state.validationError}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom: Action Buttons - Right Aligned */}
      <div className="shrink-0 flex justify-end space-x-3 pt-3">
        <button
          type="submit"
          disabled={!state.userPrompt.trim() || state.isSubmitting}
          onClick={handleQuerySubmit}
          className="px-4 py-2 text-white text-sm rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-dc-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          style={{
            backgroundColor: 'var(--dc-primary)'
          }}
        >
          {state.isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate
            </>
          )}
        </button>

        {/* Validation happens automatically after generation */}

        <button
          onClick={handleUseQuery}
          disabled={!state.response || !onQueryLoad}
          className="px-4 py-2 bg-dc-success text-white text-sm rounded-md hover:bg-dc-success focus:outline-none focus:ring-2 focus:ring-dc-success focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <SuccessIcon className="w-4 h-4 mr-2" />
          Use Query
        </button>
      </div>
    </div>
  )

  const getTitle = () => {
    return 'AI Assistant - Generate Query'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="fullscreen-mobile"
    >
      {renderQueryStep()}
    </Modal>
  )
}

export default AIAssistantModal