'use client'

import { useEffect } from 'react'
import { notFound } from 'next/navigation'

export default function ComparisonPage() {
  useEffect(() => {
    notFound()
  }, [])

  return null
}
