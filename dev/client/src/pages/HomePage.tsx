import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { getIcon, highlightCodeBlocks } from '@drizzle-cube/client'
import { useCreateNotebook } from '../hooks/useNotebooks'

const ChartBarIcon = getIcon('chartBar')
const MagnifyingGlassIcon = getIcon('search')
const BookOpenIcon = getIcon('bookOpen')
const CodeBracketIcon = getIcon('codeBracket')
const SparklesIcon = getIcon('sparkles')
const SchemaGraphIcon = getIcon('schemaGraph')
const TableIcon = getIcon('dimension')

export default function HomePage() {
  const navigate = useNavigate()
  const createNotebook = useCreateNotebook()
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Apply syntax highlighting after component mounts
  useEffect(() => {
    setTimeout(() => {
      highlightCodeBlocks().catch((err) => {
        console.debug('Syntax highlighting not available:', err)
      })
    }, 0)
  }, [])

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = prompt.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)
    try {
      const notebook = await createNotebook.mutateAsync({
        name: trimmed.slice(0, 60) + (trimmed.length > 60 ? '…' : ''),
      })
      navigate(`/notebooks/${notebook.id}`, { state: { initialPrompt: trimmed } })
    } catch (err) {
      console.error('Failed to create notebook:', err)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Override Prism.js background styling */}
      <style>{`
        .language-ts, .language-json, pre[class*="language-"] {
          background: transparent !important;
        }
        code[class*="language-"], pre[class*="language-"] {
          background: transparent !important;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dc-text mb-4 sm:mb-6">
            Drizzle Cube Dev Server
          </h1>
          <p className="text-base sm:text-lg text-dc-text-secondary max-w-3xl mx-auto leading-relaxed px-2">
            Use this site to test any changes to the React components and server.
          </p>

          <form onSubmit={handlePromptSubmit} className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <SparklesIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask a question about your data..."
                disabled={isSubmitting}
                className="w-full pl-12 pr-24 py-3.5 rounded-xl border border-dc-border bg-dc-surface text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base shadow-sm disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating…' : 'Ask AI'}
              </button>
            </div>
            <p className="text-xs text-dc-text-muted mt-2">
              Creates a new AI notebook and starts analysing your data
            </p>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 mb-12 sm:mb-16">
          <Link
            to="/dashboards"
            className="group bg-dc-surface hover:bg-dc-surface-hover border border-dc-border hover:border-dc-border-hover rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-dc-text mb-1 sm:mb-2">Dashboards</h3>
              <p className="text-sm text-dc-text-muted">View analytics and insights</p>
            </div>
          </Link>

          <Link
            to="/analysis-builder"
            className="group bg-dc-surface hover:bg-dc-surface-hover border border-dc-border hover:border-dc-border-hover rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation relative"
          >
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1 shadow-md z-10">
              <SparklesIcon className="w-3 h-3" />
              <span>AI Enabled</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <MagnifyingGlassIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-dc-text mb-1 sm:mb-2">Analysis Builder</h3>
              <p className="text-sm text-dc-text-muted">Build custom queries</p>
            </div>
          </Link>

          <Link
            to="/notebooks"
            className="group bg-dc-surface hover:bg-dc-surface-hover border border-dc-border hover:border-dc-border-hover rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation relative"
          >
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1 shadow-md z-10">
              <SparklesIcon className="w-3 h-3" />
              <span>AI Agent</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <BookOpenIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-dc-text mb-1 sm:mb-2">AI Notebooks</h3>
              <p className="text-sm text-dc-text-muted">Explore data with AI</p>
            </div>
          </Link>

          <Link
            to="/schema"
            className="group bg-dc-surface hover:bg-dc-surface-hover border border-dc-border hover:border-dc-border-hover rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <SchemaGraphIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-dc-text mb-1 sm:mb-2">Schema</h3>
              <p className="text-sm text-dc-text-muted">Browse cube relationships</p>
            </div>
          </Link>

          <Link
            to="/data-browser"
            className="group bg-dc-surface hover:bg-dc-surface-hover border border-dc-border hover:border-dc-border-hover rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <TableIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-dc-text mb-1 sm:mb-2">Data Browser</h3>
              <p className="text-sm text-dc-text-muted">Browse raw cube data</p>
            </div>
          </Link>

          <a
            href="https://github.com/cliftonc/drizzle-cube"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-dc-card-bg hover:bg-dc-card-bg-hover border border-dc-card-border hover:border-dc-card-border-hover rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-dc-muted-bg group-hover:bg-dc-accent-bg rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <CodeBracketIcon className="w-6 h-6 text-dc-muted group-hover:text-dc-accent" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-dc-text mb-1 sm:mb-2">GitHub</h3>
              <p className="text-sm text-dc-text-muted">View source code</p>
            </div>
          </a>
        </div>
      </div>
    </>
  )
}
