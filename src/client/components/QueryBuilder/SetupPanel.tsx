/**
 * SetupPanel Component
 * 
 * Provides configuration options for API endpoint and authentication.
 * Only shown in standalone QueryBuilder mode, not in modal contexts.
 */

import React, { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, CogIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import type { ApiConfig } from './types'

interface SetupPanelProps {
  isOpen: boolean
  onToggle: () => void
  config: ApiConfig
  onConfigChange: (config: ApiConfig) => void
  onReset: () => void
}

const SetupPanel: React.FC<SetupPanelProps> = ({
  isOpen,
  onToggle,
  config,
  onConfigChange,
  onReset
}) => {
  const [localConfig, setLocalConfig] = useState<ApiConfig>(config)

  const handleApply = () => {
    onConfigChange(localConfig)
  }

  const handleReset = () => {
    const defaultConfig = {
      baseApiUrl: '/cubejs-api/v1',
      apiToken: ''
    }
    setLocalConfig(defaultConfig)
    onConfigChange(defaultConfig)
    onReset()
  }

  const handleInputChange = (field: keyof ApiConfig, value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(config)
  const isUsingDefaults = config.baseApiUrl === '/cubejs-api/v1' && config.apiToken === ''

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-4">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 rounded-t-lg hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center space-x-2">
          <CogIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">API Configuration</h3>
          {!isUsingDefaults && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-blue-100 text-blue-800">
              Custom
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-4">
            {/* Base API URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base API URL
              </label>
              <input
                type="text"
                value={localConfig.baseApiUrl}
                onChange={(e) => handleInputChange('baseApiUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="/cubejs-api/v1"
              />
              <p className="text-xs text-gray-500 mt-1">
                The base URL for the Cube.js API endpoints
              </p>
            </div>

            {/* API Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                type="password"
                value={localConfig.apiToken}
                onChange={(e) => handleInputChange('apiToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Leave empty for no authentication"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional bearer token for API authentication
              </p>
            </div>

            {/* Status Indicator */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-medium text-gray-700">Current Configuration</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    URL: <span className="font-mono">{config.baseApiUrl}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Token: {config.apiToken ? (
                      <span className="text-green-600">Configured</span>
                    ) : (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </p>
                </div>
                {!isUsingDefaults && (
                  <button
                    onClick={handleReset}
                    className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    title="Reset to defaults"
                  >
                    <ArrowPathIcon className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {hasChanges && (
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setLocalConfig(config)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  Apply Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SetupPanel