'use client'

import { useEffect } from 'react'

import { Button } from '@acme/ui/button'
import { H2, P } from '@acme/ui/typography'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <H2>Something went wrong!</H2>
      <P className="text-muted-foreground">
        {error.message || 'An unexpected error occurred'}
      </P>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </Button>
    </div>
  )
}
