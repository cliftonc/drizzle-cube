interface MissingDependencyFallbackProps {
  chartType: string
  packageName: string
  installCommand: string
  height?: string | number
}

/**
 * Fallback component shown when a chart's optional dependency is not installed.
 * Provides clear instructions on how to install the missing package.
 */
export function MissingDependencyFallback({
  chartType,
  packageName,
  installCommand,
  height = 200
}: MissingDependencyFallbackProps) {
  return (
    <div
      className="dc-missing-dependency-fallback"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '1.5rem',
        textAlign: 'center',
        border: '1px dashed var(--dc-border, #e5e7eb)',
        borderRadius: '0.5rem',
        backgroundColor: 'var(--dc-surface, #f9fafb)'
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: 600,
        marginBottom: '0.5rem',
        color: 'var(--dc-text, #111827)'
      }}>
        Missing Dependency
      </h3>
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--dc-text-secondary, #6b7280)',
        marginBottom: '1rem',
        maxWidth: '28rem'
      }}>
        The <code style={{
          padding: '0.125rem 0.375rem',
          backgroundColor: 'var(--dc-surface-secondary, #f3f4f6)',
          borderRadius: '0.25rem',
          fontFamily: 'monospace',
          fontSize: '0.75rem'
        }}>{chartType}</code> chart requires the <code style={{
          padding: '0.125rem 0.375rem',
          backgroundColor: 'var(--dc-surface-secondary, #f3f4f6)',
          borderRadius: '0.25rem',
          fontFamily: 'monospace',
          fontSize: '0.75rem'
        }}>{packageName}</code> package.
      </p>
      <div style={{
        backgroundColor: 'var(--dc-surface-secondary, #f3f4f6)',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        color: 'var(--dc-text, #111827)'
      }}>
        <span style={{
          color: 'var(--dc-text-muted, #9ca3af)',
          userSelect: 'none'
        }}>$ </span>
        {installCommand}
      </div>
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--dc-text-muted, #9ca3af)',
        marginTop: '0.75rem'
      }}>
        After installing, restart your development server.
      </p>
    </div>
  )
}
