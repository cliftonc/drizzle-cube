/**
 * AI Assistant Modal Component
 * 
 * Multi-step modal for AI-powered query generation
 * Step 1: API Key input
 * Step 2: Model selection  
 * Step 3: Query input and response
 */

import React, { useState } from 'react'
import { ExclamationCircleIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Modal from '../Modal'
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
      <div className="shrink-0 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-sm text-gray-600">
          Using: <span className="font-medium">AI Query Generation</span>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-sm">
            Server-provided AI (Rate Limited)
          </span>
        </div>
      </div>
      
      {/* Middle: Input/Output Row - Takes remaining space */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Left: Query Input */}
        <div className="w-full md:w-1/2 flex flex-col">
          <label htmlFor="user-prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your query in natural language
          </label>
          <textarea
            id="user-prompt"
            value={state.userPrompt}
            onChange={(e) => setState(prev => ({ ...prev, userPrompt: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Show me the total revenue by month for the last year (Press Enter to generate, Shift+Enter for new line)"
            className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 resize-none"
            required
          />
        </div>
        
        {/* Right: Output Query */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {state.response ? (
                <>
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">AI Generated Query</span>
                </>
              ) : (
                <span className="text-sm font-medium text-gray-500">Generated Query</span>
              )}
            </div>
            {state.response && (
              <button
                onClick={handleValidate}
                disabled={state.isValidating}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                title="Click to re-validate query"
              >
                {state.isValidating ? 'Validating...' : 'Re-validate'}
              </button>
            )}
          </div>
          
          {state.response ? (
            <div className="flex-1 bg-green-50 border border-green-200 rounded-md p-3">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto bg-white p-3 rounded-sm border h-full">
                {state.response}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-md p-8 min-h-64">
              <div className="text-center">
                <SparklesIcon className="w-12 h-12 mx-auto text-gray-400" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Messages - Fixed height */}
      <div className="shrink-0">
        {state.responseError && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm text-red-700">{state.responseError}</div>
          </div>
        )}
        
        {state.isValidating && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5 shrink-0"></div>
            <div className="text-sm text-blue-700">Validating query...</div>
          </div>
        )}
        
        {state.validationResult === 'valid' && !state.isValidating && (
          <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div className="text-sm text-green-700">Query is valid and ready to use!</div>
          </div>
        )}
        
        {state.validationResult === 'invalid' && !state.isValidating && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm text-red-700">
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
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
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
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          <CheckCircleIcon className="w-4 h-4 mr-2" />
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