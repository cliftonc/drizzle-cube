import { useState, useEffect, useCallback } from 'react'
import type { CubeClient } from '../client/CubeClient'

export interface CubeMetaField {
  name: string
  title: string
  shortTitle: string
  type: string
}

export interface CubeMetaRelationship {
  targetCube: string
  relationship: 'belongsTo' | 'hasOne' | 'hasMany'
  joinFields: Array<{
    sourceField: string
    targetField: string
  }>
}

export interface CubeMetaCube {
  name: string
  title: string
  description?: string
  measures: CubeMetaField[]
  dimensions: CubeMetaField[]
  segments: CubeMetaField[]
  relationships?: CubeMetaRelationship[]
}

export interface CubeMeta {
  cubes: CubeMetaCube[]
}

export type FieldLabelMap = Record<string, string>

interface CachedMeta {
  data: CubeMeta
  labelMap: FieldLabelMap
  timestamp: number
}

interface UseCubeMetaResult {
  meta: CubeMeta | null
  labelMap: FieldLabelMap
  loading: boolean
  error: string | null
  refetch: () => void
  getFieldLabel: (fieldName: string) => string
}

// Cache duration: 15 minutes
const CACHE_DURATION = 15 * 60 * 1000

// In-memory cache
let cachedMeta: CachedMeta | null = null

function buildLabelMap(meta: CubeMeta): FieldLabelMap {
  const labelMap: FieldLabelMap = {}
  
  meta.cubes.forEach(cube => {
    // Add measures
    cube.measures.forEach(measure => {
      labelMap[measure.name] = measure.title || measure.shortTitle || measure.name
    })
    
    // Add dimensions
    cube.dimensions.forEach(dimension => {
      labelMap[dimension.name] = dimension.title || dimension.shortTitle || dimension.name
    })
    
    // Add segments
    cube.segments.forEach(segment => {
      labelMap[segment.name] = segment.title || segment.shortTitle || segment.name
    })
  })
  
  return labelMap
}

function isCacheValid(): boolean {
  if (!cachedMeta) return false
  const now = Date.now()
  return (now - cachedMeta.timestamp) < CACHE_DURATION
}

// Export cache clearing function for tests
export function clearMetaCache() {
  cachedMeta = null
}

export function useCubeMeta(cubeApi: CubeClient): UseCubeMetaResult {
  const [meta, setMeta] = useState<CubeMeta | null>(null)
  const [labelMap, setLabelMap] = useState<FieldLabelMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeta = useCallback(async () => {
    // Check cache first
    if (isCacheValid() && cachedMeta) {
      setMeta(cachedMeta.data)
      setLabelMap(cachedMeta.labelMap)
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const metaData: CubeMeta = await cubeApi.meta()
      const newLabelMap = buildLabelMap(metaData)
      
      // Cache the result
      cachedMeta = {
        data: metaData,
        labelMap: newLabelMap,
        timestamp: Date.now()
      }
      
      setMeta(metaData)
      setLabelMap(newLabelMap)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metadata'
      setError(errorMessage)
      console.error('Failed to fetch cube metadata:', err)
    } finally {
      setLoading(false)
    }
  }, [cubeApi])

  useEffect(() => {
    fetchMeta()
  }, [fetchMeta])

  const getFieldLabel = useCallback((fieldName: string): string => {
    return labelMap[fieldName] || fieldName
  }, [labelMap])

  const refetch = useCallback(() => {
    // Clear cache and refetch
    cachedMeta = null
    fetchMeta()
  }, [fetchMeta])

  return {
    meta,
    labelMap,
    loading,
    error,
    refetch,
    getFieldLabel
  }
}