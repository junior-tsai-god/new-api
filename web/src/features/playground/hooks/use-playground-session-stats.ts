/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { getPlaygroundSessionStats } from '../api'

const STATS_POLL_INTERVAL_MS = 1_000
// Request IDs are captured from response headers, before a long stream has
// finished and its consume log exists. Keep polling long enough for reasoning
// models while still bounding orphaned/error requests.
const MAX_STATS_POLL_RESULTS = 600

export type PlaygroundStatsPollingState =
  | 'idle'
  | 'polling'
  | 'settled'
  | 'timed-out'

export function getPlaygroundStatsPollingState(
  settled: boolean | undefined,
  successfulResultCount: number
): PlaygroundStatsPollingState {
  if (settled === undefined) {
    return 'idle'
  }

  if (settled) {
    return 'settled'
  }

  if (successfulResultCount >= MAX_STATS_POLL_RESULTS) {
    return 'timed-out'
  }

  return 'polling'
}

export function usePlaygroundSessionStats(
  userId: number | undefined,
  requestIds: string[]
) {
  const requestIdsKey = requestIds.join('\u0000')
  const pollingTracker = useMemo(
    () => ({ requestIdsKey, successfulResultCount: 0, userId }),
    [requestIdsKey, userId]
  )
  const query = useQuery({
    queryKey: ['playground-session-stats', userId, requestIds],
    queryFn: async () => {
      const stats = await getPlaygroundSessionStats(requestIds)
      pollingTracker.successfulResultCount += 1
      return stats
    },
    enabled: Boolean(userId) && requestIds.length > 0,
    refetchInterval: (currentQuery) => {
      const pollingState = getPlaygroundStatsPollingState(
        currentQuery.state.data?.settled,
        pollingTracker.successfulResultCount
      )
      if (pollingState !== 'polling') {
        return false
      }

      return STATS_POLL_INTERVAL_MS
    },
    retry: 2,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const pollingState = getPlaygroundStatsPollingState(
    query.data?.settled,
    pollingTracker.successfulResultCount
  )
  const pollingTimedOut = pollingState === 'timed-out'

  return {
    stats: pollingTimedOut ? undefined : query.data,
    hasStatsError: query.isError || pollingTimedOut,
    isLoadingStats: query.isPending && requestIds.length > 0,
    isSettlingStats:
      !pollingTimedOut && (query.isFetching || pollingState === 'polling'),
    retryStats: query.refetch,
  }
}
