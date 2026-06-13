import type { DynamicMeasure, QueryMeasure } from './types'
import { getDynamicMeasures } from './query-measures'

type Token =
  | { type: 'number'; value: number }
  | { type: 'reference'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' }

type Expression =
  | { type: 'literal'; value: number }
  | { type: 'reference'; value: string }
  | { type: 'binary'; operator: '+' | '-' | '*' | '/'; left: Expression; right: Expression }

export interface ParsedDynamicMeasureFormula {
  isValid: boolean
  references: string[]
  error?: string
  evaluate: (row: Record<string, unknown>) => number | null
}

const referencePattern = /^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/

export function parseDynamicMeasureFormula(formula: string): ParsedDynamicMeasureFormula {
  try {
    const tokens = tokenize(formula)
    const parser = new Parser(tokens)
    const expression = parser.parseExpression()
    parser.expectEnd()
    const references = collectReferences(expression)

    return {
      isValid: true,
      references,
      evaluate: (row) => evaluateExpression(expression, row)
    }
  } catch (error) {
    return {
      isValid: false,
      references: [],
      error: error instanceof Error ? error.message : 'Invalid dynamic measure formula',
      evaluate: () => null
    }
  }
}

export function evaluateDynamicMeasures(
  rows: Record<string, unknown>[],
  measures?: QueryMeasure[]
): Record<string, unknown>[] {
  const dynamicMeasures = getDynamicMeasures(measures)
  if (dynamicMeasures.length === 0) {
    return rows
  }

  const parsed = dynamicMeasures.map(measure => ({
    measure,
    formula: parseDynamicMeasureFormula(measure.formula)
  }))

  return rows.map(row => {
    const mappedRow = { ...row }
    for (const { measure, formula } of parsed) {
      mappedRow[measure.name] = formula.isValid ? formula.evaluate(mappedRow) : null
    }
    return mappedRow
  })
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < input.length) {
    const char = input[index]
    if (/\s/.test(char)) {
      index++
      continue
    }
    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char })
      index++
      continue
    }
    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'operator', value: char })
      index++
      continue
    }
    if (/\d|\./.test(char)) {
      const start = index
      while (index < input.length && /[\d.eE+-]/.test(input[index])) {
        const current = input[index]
        if ((current === '+' || current === '-') && !/[eE]/.test(input[index - 1] ?? '')) break
        index++
      }
      const raw = input.slice(start, index)
      if (!/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)) {
        throw new Error(`Invalid numeric literal '${raw}'`)
      }
      const value = Number(raw)
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid numeric literal '${raw}'`)
      }
      tokens.push({ type: 'number', value })
      continue
    }
    if (/[A-Za-z_]/.test(char)) {
      const start = index
      while (index < input.length && /[A-Za-z0-9_.]/.test(input[index])) index++
      const value = input.slice(start, index)
      if (!referencePattern.test(value)) {
        throw new Error(`Invalid measure reference '${value}'`)
      }
      tokens.push({ type: 'reference', value })
      continue
    }
    throw new Error(`Invalid token '${char}'`)
  }

  if (tokens.length === 0) {
    throw new Error('Formula is required')
  }
  return tokens
}

class Parser {
  private index = 0

  constructor(private readonly tokens: Token[]) {}

  parseExpression(): Expression {
    return this.parseAdditive()
  }

  expectEnd(): void {
    if (this.peek()) {
      throw new Error('Unexpected token at end of formula')
    }
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative()
    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = this.previous().value as '+' | '-'
      left = { type: 'binary', operator, left, right: this.parseMultiplicative() }
    }
    return left
  }

  private parseMultiplicative(): Expression {
    let left = this.parsePrimary()
    while (this.matchOperator('*') || this.matchOperator('/')) {
      const operator = this.previous().value as '*' | '/'
      left = { type: 'binary', operator, left, right: this.parsePrimary() }
    }
    return left
  }

  private parsePrimary(): Expression {
    const token = this.advance()
    if (!token) {
      throw new Error('Unexpected end of formula')
    }
    if (token.type === 'number') {
      return { type: 'literal', value: token.value }
    }
    if (token.type === 'reference') {
      return { type: 'reference', value: token.value }
    }
    if (token.type === 'operator' && token.value === '-') {
      return { type: 'binary', operator: '*', left: { type: 'literal', value: -1 }, right: this.parsePrimary() }
    }
    if (token.type === 'paren' && token.value === '(') {
      const expression = this.parseExpression()
      const closing = this.advance()
      if (!closing || closing.type !== 'paren' || closing.value !== ')') {
        throw new Error('Missing closing parenthesis')
      }
      return expression
    }
    throw new Error('Expected number, measure reference, or parenthesized expression')
  }

  private matchOperator(operator: '+' | '-' | '*' | '/'): boolean {
    const token = this.peek()
    if (token?.type === 'operator' && token.value === operator) {
      this.index++
      return true
    }
    return false
  }

  private peek(): Token | undefined {
    return this.tokens[this.index]
  }

  private previous(): Token {
    return this.tokens[this.index - 1]
  }

  private advance(): Token | undefined {
    return this.tokens[this.index++]
  }
}

function collectReferences(expression: Expression): string[] {
  const references = new Set<string>()
  const visit = (node: Expression) => {
    if (node.type === 'reference') {
      references.add(node.value)
      return
    }
    if (node.type === 'binary') {
      visit(node.left)
      visit(node.right)
    }
  }
  visit(expression)
  return [...references]
}

function evaluateExpression(expression: Expression, row: Record<string, unknown>): number | null {
  try {
    const value = evaluateNode(expression, row)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

function evaluateNode(expression: Expression, row: Record<string, unknown>): number {
  switch (expression.type) {
    case 'literal':
      return expression.value
    case 'reference':
      return coerceFiniteNumber(row[expression.value])
    case 'binary': {
      const left = evaluateNode(expression.left, row)
      const right = evaluateNode(expression.right, row)
      switch (expression.operator) {
        case '+': return left + right
        case '-': return left - right
        case '*': return left * right
        case '/': {
          if (right === 0) throw new Error('Division by zero')
          return left / right
        }
      }
    }
  }
}

function coerceFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) {
    const numericValue = Number(value)
    if (Number.isFinite(numericValue)) {
      return numericValue
    }
  }
  throw new Error('Operand is not a finite number')
}

export function createDynamicMeasureAnnotation(measure: DynamicMeasure) {
  return {
    title: measure.title || measure.name,
    shortTitle: measure.title || measure.name,
    type: 'number' as const,
    ...(measure.format ? { format: measure.format } : {})
  }
}
