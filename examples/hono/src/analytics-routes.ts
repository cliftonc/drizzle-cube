/**
 * Analytics Pages API Routes
 * CRUD operations for dashboard configurations
 */

import { Hono } from 'hono'
import { eq, and, asc } from 'drizzle-orm'
import type { DrizzleDatabase } from 'drizzle-cube/server'
import { analyticsPages } from '../schema'
import type { Schema } from '../schema'
import { productivityDashboardConfig } from './dashboard-config'

interface Variables {
  db: DrizzleDatabase<Schema>
  organisationId: number
}

const analyticsApp = new Hono<{ Variables: Variables }>()

// Middleware to ensure organisationId is set
analyticsApp.use('*', async (c, next) => {
  // For demo purposes, using a fixed organisation ID
  // In a real app, this would come from session/auth
  c.set('organisationId', 1)
  await next()
})

// Get all analytics pages
analyticsApp.get('/', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')

  try {
    const pages = await db
      .select()
      .from(analyticsPages)
      .where(
        and(
          eq(analyticsPages.organisationId, organisationId),
          eq(analyticsPages.isActive, true)
        )
      )
      .orderBy(asc(analyticsPages.order), asc(analyticsPages.name))

    return c.json({
      data: pages,
      meta: { total: pages.length }
    })
  } catch (error) {
    console.error('Error fetching analytics pages:', error)
    return c.json({ error: 'Failed to fetch analytics pages' }, 500)
  }
})

// Get specific analytics page
analyticsApp.get('/:id', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: 'Invalid page ID' }, 400)
  }

  try {
    const page = await db
      .select()
      .from(analyticsPages)
      .where(
        and(
          eq(analyticsPages.id, id),
          eq(analyticsPages.organisationId, organisationId),
          eq(analyticsPages.isActive, true)
        )
      )
      .limit(1)

    if (page.length === 0) {
      return c.json({ error: 'Analytics page not found' }, 404)
    }

    return c.json({ data: page[0] })
  } catch (error) {
    console.error('Error fetching analytics page:', error)
    return c.json({ error: 'Failed to fetch analytics page' }, 500)
  }
})

// Create new analytics page
analyticsApp.post('/', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')

  try {
    // Check dashboard count limit
    const existingPages = await db
      .select({ id: analyticsPages.id })
      .from(analyticsPages)
      .where(
        and(
          eq(analyticsPages.organisationId, organisationId),
          eq(analyticsPages.isActive, true)
        )
      )

    if (existingPages.length >= 10) {
      return c.json({ 
        error: 'Maximum number of dashboards reached (10). Please delete a dashboard first.' 
      }, 400)
    }

    const body = await c.req.json()
    const { name, description, config, order = 0 } = body

    if (!name || !config || !config.portlets) {
      return c.json({ 
        error: 'Missing required fields: name, config, or config.portlets' 
      }, 400)
    }

    if (!Array.isArray(config.portlets)) {
      return c.json({ error: 'Config portlets must be an array' }, 400)
    }

    // Limit portlets to maximum of 20
    if (config.portlets.length > 20) {
      config.portlets = config.portlets.slice(0, 20)
    }

    const newPage = await db
      .insert(analyticsPages)
      .values({
        name,
        description,
        order,
        organisationId,
        config
      })
      .returning()

    return c.json({ data: newPage[0] }, 201)
  } catch (error) {
    console.error('Error creating analytics page:', error)
    return c.json({ error: 'Failed to create analytics page' }, 500)
  }
})

// Create example analytics page
analyticsApp.post('/create-example', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')

  try {
    // Check dashboard count limit
    const existingPages = await db
      .select({ id: analyticsPages.id })
      .from(analyticsPages)
      .where(
        and(
          eq(analyticsPages.organisationId, organisationId),
          eq(analyticsPages.isActive, true)
        )
      )

    if (existingPages.length >= 10) {
      return c.json({ 
        error: 'Maximum number of dashboards reached (10). Please delete a dashboard first.' 
      }, 400)
    }
    const newPage = await db
      .insert(analyticsPages)
      .values({
        ...productivityDashboardConfig,
        organisationId
      })
      .returning()

    return c.json({ 
      data: newPage[0], 
      message: 'Example analytics page created successfully' 
    }, 201)
  } catch (error) {
    console.error('Error creating example analytics page:', error)
    return c.json({ error: 'Failed to create example analytics page' }, 500)
  }
})

// Update analytics page
analyticsApp.put('/:id', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: 'Invalid page ID' }, 400)
  }

  try {
    const body = await c.req.json()
    const { name, description, config, order } = body

    if (!name && !config && order === undefined && !description) {
      return c.json({ error: 'At least one field must be provided for update' }, 400)
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (order !== undefined) updateData.order = order
    if (config !== undefined) {
      if (!config.portlets || !Array.isArray(config.portlets)) {
        return c.json({ error: 'Config portlets must be an array' }, 400)
      }
      // Limit portlets to maximum of 20
      if (config.portlets.length > 20) {
        config.portlets = config.portlets.slice(0, 20)
      }
      updateData.config = config
    }

    const updatedPage = await db
      .update(analyticsPages)
      .set(updateData)
      .where(
        and(
          eq(analyticsPages.id, id),
          eq(analyticsPages.organisationId, organisationId)
        )
      )
      .returning()

    if (updatedPage.length === 0) {
      return c.json({ error: 'Analytics page not found' }, 404)
    }

    return c.json({ data: updatedPage[0] })
  } catch (error) {
    console.error('Error updating analytics page:', error)
    return c.json({ error: 'Failed to update analytics page' }, 500)
  }
})

// Reset analytics page to default configuration
analyticsApp.post('/:id/reset', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: 'Invalid page ID' }, 400)
  }

  try {
    const resetPage = await db
      .update(analyticsPages)
      .set({
        ...productivityDashboardConfig,
        organisationId,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(analyticsPages.id, id),
          eq(analyticsPages.organisationId, organisationId)
        )
      )
      .returning()

    if (resetPage.length === 0) {
      return c.json({ error: 'Analytics page not found' }, 404)
    }

    return c.json({ 
      data: resetPage[0],
      message: 'Dashboard reset to default configuration successfully' 
    })
  } catch (error) {
    console.error('Error resetting analytics page:', error)
    return c.json({ error: 'Failed to reset analytics page' }, 500)
  }
})

// Delete (soft delete) analytics page
analyticsApp.delete('/:id', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: 'Invalid page ID' }, 400)
  }

  try {
    const deletedPage = await db
      .update(analyticsPages)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(analyticsPages.id, id),
          eq(analyticsPages.organisationId, organisationId)
        )
      )
      .returning()

    if (deletedPage.length === 0) {
      return c.json({ error: 'Analytics page not found' }, 404)
    }

    return c.json({ message: 'Analytics page deleted successfully' })
  } catch (error) {
    console.error('Error deleting analytics page:', error)
    return c.json({ error: 'Failed to delete analytics page' }, 500)
  }
})

export default analyticsApp