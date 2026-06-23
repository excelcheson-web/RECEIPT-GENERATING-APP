'use client'

import { useEffect, useMemo, useState } from 'react'
import { computeRuntimeTrackingState } from '@/lib/trackingAutomation'
import type { TrackingEventRecord } from '@/lib/types'

export function useLiveTrackingRuntime(events: TrackingEventRecord[], refreshMs = 5000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()

    const intervalId = window.setInterval(tick, refreshMs)
    return () => window.clearInterval(intervalId)
  }, [refreshMs])

  const runtime = useMemo(() => computeRuntimeTrackingState(events, now), [events, now])

  return runtime
}

