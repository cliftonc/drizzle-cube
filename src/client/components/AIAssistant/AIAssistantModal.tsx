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
  buildSystemPrompt,
  formatCubeSchemaForPrompt,
  saveAIConfig,
  loadAIConfig,
  extractTextFromResponse
} from './utils'
import { DEFAULT_SYSTEM_PROMPT_TEMPLATE } from './constants'

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  schema: any
  onQueryLoad?: (query: any) => void
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  schema,
  onQueryLoad
}) => {
  const [state, setState] = useState<AIAssistantState>(() => {
    const savedConfig = loadAIConfig()
    return {
      step: savedConfig.apiKey ? 'query' : 'api-key',
      apiKey: savedConfig.apiKey,
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

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.apiKey.trim()) return
    
    saveAIConfig({
      provider: 'gemini',
      apiKey: state.apiKey
    })
    
    setState(prev => ({ ...prev, step: 'query' }))
  }

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.userPrompt.trim()) return

    setState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      response: null, 
      responseError: null 
    }))

    try {
      const cubeSchema = formatCubeSchemaForPrompt(schema)
      const systemPrompt = buildSystemPrompt(state.systemPromptTemplate, {
        CUBE_SCHEMA: cubeSchema,
        USER_PROMPT: state.userPrompt
      })

      const response = await sendGeminiMessage(
        state.apiKey,
        systemPrompt
      )

      const responseText = extractTextFromResponse(response)
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        response: responseText 
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        responseError: error instanceof Error ? error.message : 'Failed to process query'
      }))
    }
  }

  const handleValidate = async () => {
    if (!state.response) return

    setState(prev => ({
      ...prev,
      isValidating: true,
      validationResult: null,
      validationError: null
    }))

    try {
      const query = JSON.parse(state.response)
      
      const response = await fetch('/cubejs-api/v1/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      })

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isValidating: false,
          validationResult: 'valid'
        }))
      } else {
        const errorData = await response.text()
        setState(prev => ({
          ...prev,
          isValidating: false,
          validationResult: 'invalid',
          validationError: errorData || `HTTP ${response.status}: ${response.statusText}`
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isValidating: false,
        validationResult: 'invalid',
        validationError: error instanceof Error ? error.message : 'Failed to validate query'
      }))
    }
  }

  const handleUseQuery = () => {
    if (!state.response || state.validationResult !== 'valid' || !onQueryLoad) return

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
      userPrompt: '',
      response: null,
      responseError: null,
      validationResult: null,
      validationError: null
    }))
    onClose()
  }

  const renderApiKeyStep = () => (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Google Gemini</h3>
        <p className="text-gray-600">Enter your API key to enable AI-powered query generation</p>
      </div>
      
      <form onSubmit={handleApiKeySubmit} className="space-y-6">
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-3">
            Google Gemini API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={state.apiKey}
            onChange={(e) => setState(prev => ({ ...prev, apiKey: e.target.value }))}
            placeholder="AIza..."
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              Get your API key from{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Google AI Studio
              </a>
            </p>
            <p className="text-xs text-gray-400">
              This key is proxied via our infrastructure but not logged or stored - you can verify this in the Github repository.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!state.apiKey.trim()}
            className="px-12 py-3 bg-blue-600 text-white text-lg rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Connect to Gemini
          </button>
        </div>
      </form>
    </div>
  )


  const renderQueryStep = () => (
    <div className="flex flex-col space-y-4">
      {/* Top: Config Panel - Full Width */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-sm text-gray-600">
          Using: <span className="font-medium">Google Gemini 2.0 Flash</span>
        </div>
        <button
          onClick={() => setState(prev => ({ ...prev, step: 'api-key' }))}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Change API Key
        </button>
      </div>
      
      {/* Middle: Input/Output Row - Takes remaining space */}
      <div className="flex gap-6 flex-1 min-h-0" style={{minWidth: '800px', minHeight: '400px'}}>
        {/* Left: Query Input */}
        <div className="w-1/2 flex flex-col">
          <label htmlFor="user-prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your query in natural language
          </label>
          <textarea
            id="user-prompt"
            value={state.userPrompt}
            onChange={(e) => setState(prev => ({ ...prev, userPrompt: e.target.value }))}
            placeholder="e.g., Show me the total revenue by month for the last year"
            className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
            required
          />
        </div>
        
        {/* Right: Output Query */}
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            {state.response ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">AI Generated Query</span>
              </>
            ) : (
              <span className="text-sm font-medium text-gray-500">Generated Query</span>
            )}
          </div>
          
          {state.response ? (
            <div className="flex-1 bg-green-50 border border-green-200 rounded-md p-3">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto bg-white p-3 rounded border h-full">
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
      <div className="flex-shrink-0">
        {state.responseError && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{state.responseError}</div>
          </div>
        )}
        
        {state.validationResult === 'valid' && (
          <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">Query is valid and ready to use!</div>
          </div>
        )}
        
        {state.validationResult === 'invalid' && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <div className="font-medium mb-1">Query validation failed:</div>
              <div className="text-xs">{state.validationError}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom: Action Buttons - Right Aligned */}
      <div className="flex-shrink-0 flex justify-end space-x-3 pt-3">
        <button
          type="submit"
          disabled={!state.userPrompt.trim() || state.isSubmitting}
          onClick={handleQuerySubmit}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
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
        
        <button
          onClick={handleValidate}
          disabled={!state.response || state.isValidating}
          className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          {state.isValidating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Validating...
            </>
          ) : (
            'Validate'
          )}
        </button>
        
        <button
          onClick={handleUseQuery}
          disabled={state.validationResult !== 'valid' || !onQueryLoad}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          <CheckCircleIcon className="w-4 h-4 mr-2" />
          Use Query
        </button>
      </div>
    </div>
  )

  const getTitle = () => {
    switch (state.step) {
      case 'api-key':
        return 'AI Assistant - Setup'
      case 'query':
        return 'AI Assistant - Generate Query'
      default:
        return 'AI Assistant'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="xl"
    >
      {state.step === 'api-key' && renderApiKeyStep()}
      {state.step === 'query' && renderQueryStep()}
    </Modal>
  )
}

export default AIAssistantModal