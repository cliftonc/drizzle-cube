/**
 * FilterEditModal Component
 *
 * Modal for editing dashboard filter details including label, field, operator, and values.
 * Now delegates to DashboardFilterConfigModal for the modern search-based UX.
 *
 * Pattern: Self-contained modal with local state (matches PortletEditModal pattern)
 * - All editing state is local to the modal
 * - Changes only propagate on "Done" button click via onSave callback
 * - Cancel/close resets local state without saving
 */

import React, { useMemo, useCallback } from 'react'
import { extractDashboardFields } from '../../utils/filterUtils'
import DashboardFilterConfigModal from './DashboardFilterConfigModal'
import type { DashboardFilter, CubeMeta, DashboardConfig } from '../../types'
import type { MetaResponse } from '../../shared/types'

interface FilterEditModalProps {
  filter: DashboardFilter
  schema: CubeMeta | null
  dashboardConfig: DashboardConfig
  isOpen: boolean
  onSave: (filter: DashboardFilter) => void | Promise<void>
  onClose: () => void
  onDelete: () => void
  convertToMetaResponse: (cubeMeta: CubeMeta | null) => MetaResponse | null
}

const FilterEditModal: React.FC<FilterEditModalProps> = ({
  filter,
  schema,
  dashboardConfig,
  isOpen,
  onSave,
  onClose,
  onDelete,
  convertToMetaResponse
}) => {
  // Convert full schema to MetaResponse format
  const fullSchema = useMemo(() => {
    return convertToMetaResponse(schema)
  }, [schema, convertToMetaResponse])

  // Extract fields used in dashboard
  const dashboardFields = useMemo(() => {
    return extractDashboardFields(dashboardConfig)
  }, [dashboardConfig])

  // Create filtered schema showing only dashboard fields
  const filteredSchema = useMemo<MetaResponse | null>(() => {
    if (!schema) return null

    const filteredCubes = schema.cubes
      .map(cube => {
        const cubeName = cube.name

        const filteredMeasures = cube.measures.filter(measure => {
          const fullName = measure.name.includes('.')
            ? measure.name
            : `${cubeName}.${measure.name}`
          return dashboardFields.measures.has(fullName)
        })

        const filteredDimensions = cube.dimensions.filter(dimension => {
          const fullName = dimension.name.includes('.')
            ? dimension.name
            : `${cubeName}.${dimension.name}`
          return dashboardFields.dimensions.has(fullName) ||
                 dashboardFields.timeDimensions.has(fullName)
        })

        if (filteredMeasures.length > 0 || filteredDimensions.length > 0) {
          return {
            ...cube,
            measures: filteredMeasures,
            dimensions: filteredDimensions
          }
        }

        return null
      })
      .filter((cube): cube is NonNullable<typeof cube> => cube !== null)

    const filteredCubeMeta: CubeMeta = {
      ...schema,
      cubes: filteredCubes
    }

    return convertToMetaResponse(filteredCubeMeta)
  }, [schema, dashboardFields, convertToMetaResponse])

  // Handle save with async support
  const handleSave = useCallback(async (updatedFilter: DashboardFilter) => {
    try {
      await onSave(updatedFilter)
      onClose()
    } catch (error) {
      console.error('Failed to save filter:', error)
      alert('Failed to save filter. Please try again.')
    }
  }, [onSave, onClose])

  if (!isOpen) return null

  return (
    <DashboardFilterConfigModal
      filter={filter}
      fullSchema={fullSchema}
      filteredSchema={filteredSchema}
      isOpen={isOpen}
      onSave={handleSave}
      onDelete={onDelete}
      onClose={onClose}
    />
  )
}

export default FilterEditModal
