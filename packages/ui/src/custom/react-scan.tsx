'use client'

// biome-ignore lint/style/useImportType: react-scan must be imported before react
import { scan } from 'react-scan'

import { useSearchParams } from 'next/navigation'
import { type JSX, useEffect } from 'react'
//

export function ReactScan(): JSX.Element {
  const pathParams = useSearchParams()
  const enabled = pathParams.get('react-scan') === 'true'

  useEffect(() => {
    scan({
      enabled,
    })
  }, [enabled])

  return <></>
}
