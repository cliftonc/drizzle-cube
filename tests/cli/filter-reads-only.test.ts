import { describe, it, expect } from 'vitest'
import {
  aliasedTable,
  and,
  between,
  eq,
  exists,
  inArray,
  isNull,
  like,
  not,
  or,
  sql
} from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { customType, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { filterReadsOnly } from '../../src/server/physical-plan/processors/joins-processor'

const lowered = customType<{ data: string }>({
  dataType: () => 'text',
  toDriver: value => sql`lower(${value})`
})
const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey(),
  organisationId: integer('organisation_id'),
  accountId: integer('account_id'),
  label: text('label'),
  code: lowered('code')
})
const payments = sqliteTable('payments', {
  id: integer('id').primaryKey(),
  invoiceId: integer('invoice_id'),
  organisationId: integer('organisation_id')
})
const invoicesAlias = aliasedTable(invoices, 'i')

const local: Array<[string, SQL | undefined]> = [
  ['a comparison with a value', eq(invoices.organisationId, 1)],
  ['and, or, not and is null', and(or(eq(invoices.organisationId, 1), isNull(invoices.organisationId)), not(eq(invoices.id, 2)))],
  ['a list of values', inArray(invoices.id, [1, 2, 3])],
  ['an empty list of values', inArray(invoices.id, [])],
  ['a pattern', like(invoices.label, 'org1%')],
  ['a range', between(invoices.id, 1, 9)],
  ['two columns of the relation', eq(invoices.id, invoices.accountId)],
  ['a template with a column and a value', sql`${invoices.organisationId} = ${1}`]
]

const notLocal: Array<[string, SQL | undefined]> = [
  ['a column of another table', eq(payments.organisationId, 1)],
  ['a comparison with a column of another table', eq(invoices.id, payments.invoiceId)],
  ['a column of an alias of the relation', eq(invoicesAlias.organisationId, 1)],
  ['raw text', sql.raw('payments.organisation_id = 1')],
  ['a template with a table name in its text', sql`payments.organisation_id = ${1}`],
  ['an identifier', sql`${sql.identifier('payments')}.${sql.identifier('organisation_id')} = ${1}`],
  ['a function call', sql`lower(${invoices.label}) = ${'x'}`],
  ['a table', sql`${invoices.id} in (select invoice_id from ${payments})`],
  ['an existence test', exists(sql`(select 1 from payments where payments.invoice_id = ${invoices.id})`)],
  ['a value whose encoder writes SQL', eq(invoices.code, 'ABC')],
  ['a local comparison and a column of another table', and(eq(invoices.organisationId, 1), eq(payments.organisationId, 1))]
]

describe('filterReadsOnly', () => {
  for (const [name, filter] of local) {
    it(`accepts ${name}`, () => {
      expect(filterReadsOnly(filter!, [invoices])).toBe(true)
    })
  }

  for (const [name, filter] of notLocal) {
    it(`does not accept ${name}`, () => {
      expect(filterReadsOnly(filter!, [invoices])).toBe(false)
    })
  }

  it('accepts columns of every relation it is given', () => {
    expect(filterReadsOnly(eq(invoices.id, payments.invoiceId), [invoices, payments])).toBe(true)
  })
})
