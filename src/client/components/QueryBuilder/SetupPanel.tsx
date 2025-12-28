/**
 * SetupPanel Component
 * 
 * Provides configuration options for API endpoint and authentication.
 * Only shown in standalone QueryBuilder mode, not in modal contexts.
 */

import React, { useState } from 'react'
import { getIcon } from '../../icons'
import type { ApiConfig } from './types'

const ChevronDownIcon = getIcon('chevronDown')
const ChevronUpIcon = getIcon('chevronUp')
const SettingsIcon = getIcon('settings')
const RefreshIcon = getIcon('refresh')

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
    <div className="bg-dc-surface border border-dc-border rounded-lg mb-4">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-dc-surface-secondary rounded-t-lg hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-dc-accent"
      >
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-dc-text-secondary" />
          <h3 className="text-sm font-semibold text-dc-text">API Configuration</h3>
          {!isUsingDefaults && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-dc-info text-dc-text">
              Custom
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUpIcon className="w-4 h-4 text-dc-text-muted" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-dc-text-muted" />
        )}
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="p-4 border-t border-dc-border">
          <div className="space-y-4">
            {/* Base API URL */}
            <div>
              <label className="block text-sm font-medium text-dc-text-secondary mb-1">
                Base API URL
              </label>
              <input
                type="text"
                value={localConfig.baseApiUrl}
                onChange={(e) => handleInputChange('baseApiUrl', e.target.value)}
                className="w-full px-3 py-2 border border-dc-border rounded-md bg-dc-surface text-dc-text focus:outline-hidden focus:ring-2 focus:ring-dc-accent focus:border-dc-accent text-sm"
                placeholder="/cubejs-api/v1"
              />
              <p className="text-xs text-dc-text-muted mt-1">
                The base URL for the Cube.js API endpoints
              </p>
            </div>

            {/* API Token */}
            <div>
              <label className="block text-sm font-medium text-dc-text-secondary mb-1">
                API Token
              </label>
              <input
                type="password"
                value={localConfig.apiToken}
                onChange={(e) => handleInputChange('apiToken', e.target.value)}
                className="w-full px-3 py-2 border border-dc-border rounded-md bg-dc-surface text-dc-text focus:outline-hidden focus:ring-2 focus:ring-dc-accent focus:border-dc-accent text-sm"
                placeholder="Leave empty for no authentication"
              />
              <p className="text-xs text-dc-text-muted mt-1">
                Optional bearer token for API authentication
              </p>
            </div>

            {/* Status Indicator */}
            <div className="bg-dc-surface-secondary border border-dc-border rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-medium text-dc-text-secondary">Current Configuration</h4>
                  <p className="text-xs text-dc-text-secondary mt-1">
                    URL: <span className="font-mono">{config.baseApiUrl}</span>
                  </p>
                  <p className="text-xs text-dc-text-secondary">
                    Token: {config.apiToken ? (
                      <span className="text-dc-success">Configured</span>
                    ) : (
                      <span className="text-dc-text-muted">Not set</span>
                    )}
                  </p>
                </div>
                {!isUsingDefaults && (
                  <button
                    onClick={handleReset}
                    className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-dc-text-secondary bg-dc-surface border border-dc-border rounded-sm hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-dc-accent"
                    title="Reset to defaults"
                  >
                    <RefreshIcon className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {hasChanges && (
              <div className="flex justify-end space-x-2 pt-2 border-t border-dc-border">
                <button
                  onClick={() => setLocalConfig(config)}
                  className="px-3 py-1.5 text-sm font-medium text-dc-text-secondary bg-dc-surface border border-dc-border rounded-md hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-dc-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-3 py-1.5 text-sm font-medium text-white border border-transparent rounded-md focus:outline-hidden focus:ring-2 focus:ring-dc-accent"
                  style={{ backgroundColor: 'var(--dc-primary)' }}
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