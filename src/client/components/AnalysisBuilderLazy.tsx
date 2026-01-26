import { forwardRef, lazy, Suspense } from 'react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import type { AnalysisBuilderProps, AnalysisBuilderRef } from './AnalysisBuilder/types'
import LoadingIndicator from './LoadingIndicator'

const LazyAnalysisBuilder = lazy(() => import('./AnalysisBuilder')) as ForwardRefExoticComponent<
  AnalysisBuilderProps & RefAttributes<AnalysisBuilderRef>
>

const AnalysisBuilder = forwardRef<AnalysisBuilderRef, AnalysisBuilderProps>((props, ref) => (
  <Suspense
    fallback={
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full dc:py-6">
        <LoadingIndicator />
      </div>
    }
  >
    <LazyAnalysisBuilder {...props} ref={ref} />
  </Suspense>
))

AnalysisBuilder.displayName = 'AnalysisBuilder'

export default AnalysisBuilder
