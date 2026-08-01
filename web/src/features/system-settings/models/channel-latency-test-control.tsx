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
import { TestTubeIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { notifyModelLatencyUpdated } from '@/lib/model-latency-refresh'

import {
  getCurrentChannelLatencyTest,
  getSystemTask,
  startChannelLatencyTest,
} from '../api'
import type { ChannelLatencyTestTask, SystemTaskStatus } from '../types'

function isActiveStatus(status?: SystemTaskStatus) {
  return status === 'pending' || status === 'running'
}

export function ChannelLatencyTestControl() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [trackedTaskId, setTrackedTaskId] = useState<string>()
  const reportedTaskIdRef = useRef<string | undefined>(undefined)

  const currentTaskQuery = useQuery({
    queryKey: ['system-task', 'current', 'channel_test'],
    queryFn: getCurrentChannelLatencyTest,
    refetchInterval: (query) =>
      isActiveStatus(query.state.data?.data?.status) ? 1500 : false,
  })

  useEffect(() => {
    const currentTask = currentTaskQuery.data?.data
    if (currentTask && isActiveStatus(currentTask.status)) {
      setTrackedTaskId(currentTask.task_id)
    }
  }, [currentTaskQuery.data])

  const trackedTaskQuery = useQuery({
    queryKey: ['system-task', trackedTaskId],
    queryFn: ({ queryKey }) =>
      getSystemTask<ChannelLatencyTestTask>(String(queryKey[1])),
    enabled: Boolean(trackedTaskId),
    refetchInterval: (query) =>
      isActiveStatus(query.state.data?.data?.status) ? 1500 : false,
  })

  const startMutation = useMutation({
    mutationFn: startChannelLatencyTest,
    onSuccess: (response) => {
      if (!response.success || !response.data?.task_id) {
        toast.error(response.message || t('Failed to start latency test'))
        return
      }
      reportedTaskIdRef.current = undefined
      setTrackedTaskId(response.data.task_id)
      toast.success(t('Latency test started'))
      queryClient.invalidateQueries({
        queryKey: ['system-task', 'current', 'channel_test'],
      })
    },
    onError: () => {
      toast.error(
        t('A latency test is already running or could not be started')
      )
      queryClient.invalidateQueries({
        queryKey: ['system-task', 'current', 'channel_test'],
      })
    },
  })

  const task =
    trackedTaskQuery.data?.data ?? currentTaskQuery.data?.data ?? undefined
  const isActive = startMutation.isPending || isActiveStatus(task?.status)
  const progress = Math.min(100, Math.max(0, task?.state?.progress ?? 0))

  useEffect(() => {
    if (
      !task ||
      isActiveStatus(task.status) ||
      reportedTaskIdRef.current === task.task_id
    ) {
      return
    }

    reportedTaskIdRef.current = task.task_id
    if (task.status === 'succeeded') {
      toast.success(
        t('Latency test complete: {{succeeded}} succeeded, {{failed}} failed', {
          succeeded: task.result?.succeeded ?? 0,
          failed: task.result?.failed ?? 0,
        })
      )
      queryClient.invalidateQueries({ queryKey: ['pricing'] })
      queryClient.invalidateQueries({ queryKey: ['channels'] })
      queryClient.invalidateQueries({
        queryKey: ['system-info', 'system-tasks'],
      })
      notifyModelLatencyUpdated()
      return
    }

    toast.error(task.error || t('Latency test failed'))
  }, [queryClient, t, task])

  let statusText = t('No latency test is running.')
  if (task && isActiveStatus(task.status)) {
    statusText =
      task.state?.total && task.state.total > 0
        ? t('Testing {{processed}} of {{total}} channels', {
            processed: task.state.processed,
            total: task.state.total,
          })
        : t('Latency test queued')
  } else if (task?.status === 'succeeded') {
    statusText = t(
      'Last test: {{tested}} channels, {{succeeded}} succeeded, {{failed}} failed',
      {
        tested: task.result?.tested ?? 0,
        succeeded: task.result?.succeeded ?? 0,
        failed: task.result?.failed ?? 0,
      }
    )
  } else if (task?.status === 'failed') {
    statusText = task.error || t('Latency test failed')
  }

  return (
    <div className='bg-muted/20 flex min-w-0 flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='min-w-0'>
        <div className='flex items-center gap-2'>
          <HugeiconsIcon
            icon={TestTubeIcon}
            className='text-muted-foreground size-4'
            aria-hidden='true'
          />
          <p className='text-sm font-medium'>{t('Interface latency test')}</p>
        </div>
        <p className='text-muted-foreground mt-1 text-xs leading-5'>
          {t(
            'Probe enabled channels with their configured test models. Results update the model marketplace.'
          )}
        </p>
        <div className='mt-2 flex items-center gap-3' aria-live='polite'>
          <p className='text-muted-foreground text-xs'>{statusText}</p>
          {task && isActiveStatus(task.status) && (
            <Progress
              value={progress}
              className='h-1.5 w-24'
              aria-label={t('Latency test progress')}
            />
          )}
        </div>
      </div>

      <Button
        type='button'
        variant='outline'
        onClick={() => startMutation.mutate()}
        disabled={isActive}
        className='shrink-0'
      >
        {isActive ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <HugeiconsIcon icon={TestTubeIcon} data-icon='inline-start' />
        )}
        {isActive ? t('Testing...') : t('Test now')}
      </Button>
    </div>
  )
}
