/**
 * Portlet Modal Component
 * Simple modal for creating/editing portlets
 * Uses basic HTML modal - consuming app can replace with their preferred modal system
 */

import React, { useState, useEffect } from 'react'
import type { PortletConfig, ChartType } from '../types'

interface PortletModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (portlet: Partial<PortletConfig>) => void
  portlet?: PortletConfig | null
  title?: string
  submitText?: string
}

const chartTypes: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'table', label: 'Data Table' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'radar', label: 'Radar Chart' },
  { value: 'radialBar', label: 'Radial Bar' },
  { value: 'treemap', label: 'Tree Map' }
]

export default function PortletModal({
  isOpen,
  onClose,
  onSave,
  portlet,
  title = 'Create Portlet',
  submitText = 'Create Portlet'
}: PortletModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    query: '',
    chartType: 'bar' as ChartType,
    labelField: '',
    w: 6,
    h: 4
  })

  // Load portlet data when editing
  useEffect(() => {
    if (portlet) {
      setFormData({
        title: portlet.title,
        query: portlet.query,
        chartType: portlet.chartType,
        labelField: portlet.labelField || '',
        w: portlet.w,
        h: portlet.h
      })
    } else {
      setFormData({
        title: '',
        query: JSON.stringify({
          measures: [''],
          dimensions: ['']
        }, null, 2),
        chartType: 'bar',
        labelField: '',
        w: 6,
        h: 4
      })
    }
  }, [portlet])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.title.trim() || !formData.query.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      JSON.parse(formData.query) // Validate JSON
    } catch (e) {
      alert('Invalid JSON in query field')
      return
    }

    const portletData = {
      ...portlet,
      title: formData.title,
      query: formData.query,
      chartType: formData.chartType,
      labelField: formData.labelField || undefined,
      w: formData.w,
      h: formData.h,
      chartConfig: {
        x: '',
        y: ['']
      },
      displayConfig: {
        showLegend: true,
        showGrid: true,
        showTooltip: true
      }
    }

    onSave(portletData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chart Type
            </label>
            <select
              value={formData.chartType}
              onChange={(e) => setFormData({ ...formData, chartType: e.target.value as ChartType })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {chartTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (grid units)
              </label>
              <input
                type="number"
                min="3"
                max="12"
                value={formData.w}
                onChange={(e) => setFormData({ ...formData, w: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (grid units)
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={formData.h}
                onChange={(e) => setFormData({ ...formData, h: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {formData.chartType === 'pie' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label Field (for pie charts)
              </label>
              <input
                type="text"
                value={formData.labelField}
                onChange={(e) => setFormData({ ...formData, labelField: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., category"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cube Query (JSON) *
            </label>
            <textarea
              value={formData.query}
              onChange={(e) => setFormData({ ...formData, query: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={10}
              required
              placeholder={JSON.stringify({
                measures: ['People.count'],
                dimensions: ['People.active']
              }, null, 2)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}