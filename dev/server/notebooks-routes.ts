/**
 * Notebooks API Routes
 * CRUD operations for AI notebook configurations
 */

import { Hono } from 'hono'
import { eq, and, asc } from 'drizzle-orm'
import type { DrizzleDatabase } from '../../src/server/index.js'
import { notebooks } from './schema.js'
import type { Schema } from './schema.js'

interface Variables {
  db: DrizzleDatabase<Schema>
  organisationId: number
}

const notebooksApp = new Hono<{ Variables: Variables }>()

// Middleware to ensure organisationId is set
notebooksApp.use('*', async (c, next) => {
  c.set('organisationId', 1)
  await next()
})

// Get all notebooks
notebooksApp.get('/', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')

  try {
    const items = await db
      .select()
      .from(notebooks)
      .where(
        and(
          eq(notebooks.organisationId, organisationId),
          eq(notebooks.isActive, true)
        )
      )
      .orderBy(asc(notebooks.order), asc(notebooks.name))

    return c.json({
      data: items,
      meta: { total: items.length }
    })
  } catch (error) {
    console.error('Error fetching notebooks:', error)
    return c.json({ error: 'Failed to fetch notebooks' }, 500)
  }
})

// Get specific notebook
notebooksApp.get('/:id', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: 'Invalid notebook ID' }, 400)
  }

  try {
    const item = await db
      .select()
      .from(notebooks)
      .where(
        and(
          eq(notebooks.id, id),
          eq(notebooks.organisationId, organisationId),
          eq(notebooks.isActive, true)
        )
      )
      .limit(1)

    if (item.length === 0) {
      return c.json({ error: 'Notebook not found' }, 404)
    }

    return c.json({ data: item[0] })
  } catch (error) {
    console.error('Error fetching notebook:', error)
    return c.json({ error: 'Failed to fetch notebook' }, 500)
  }
})

// Create new notebook
notebooksApp.post('/', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')

  try {
    // Check notebook count limit
    const existing = await db
      .select({ id: notebooks.id })
      .from(notebooks)
      .where(
        and(
          eq(notebooks.organisationId, organisationId),
          eq(notebooks.isActive, true)
        )
      )

    if (existing.length >= 20) {
      return c.json({
        error: 'Maximum number of notebooks reached (20). Please delete a notebook first.'
      }, 400)
    }

    const body = await c.req.json()
    const { name, description, config, order = 0 } = body

    if (!name) {
      return c.json({ error: 'Missing required field: name' }, 400)
    }

    const newItem = await db
      .insert(notebooks)
      .values({
        name,
        description,
        order,
        organisationId,
        config: config || { blocks: [], messages: [] }
      })
      .returning()

    return c.json({ data: newItem[0] }, 201)
  } catch (error) {
    console.error('Error creating notebook:', error)
    return c.json({ error: 'Failed to create notebook' }, 500)
  }
})

// Update notebook
notebooksApp.put('/:id', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: 'Invalid notebook ID' }, 400)
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
    if (config !== undefined) updateData.config = config

    const updated = await db
      .update(notebooks)
      .set(updateData)
      .where(
        and(
          eq(notebooks.id, id),
          eq(notebooks.organisationId, organisationId)
        )
      )
      .returning()

    if (updated.length === 0) {
      return c.json({ error: 'Notebook not found' }, 404)
    }

    return c.json({ data: updated[0] })
  } catch (error) {
    console.error('Error updating notebook:', error)
    return c.json({ error: 'Failed to update notebook' }, 500)
  }
})

// Delete (soft delete) notebook
notebooksApp.delete('/:id', async (c) => {
  const db = c.get('db')
  const organisationId = c.get('organisationId')
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: 'Invalid notebook ID' }, 400)
  }

  try {
    const deleted = await db
      .update(notebooks)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(notebooks.id, id),
          eq(notebooks.organisationId, organisationId)
        )
      )
      .returning()

    if (deleted.length === 0) {
      return c.json({ error: 'Notebook not found' }, 404)
    }

    return c.json({ message: 'Notebook deleted successfully' })
  } catch (error) {
    console.error('Error deleting notebook:', error)
    return c.json({ error: 'Failed to delete notebook' }, 500)
  }
})

export default notebooksApp
