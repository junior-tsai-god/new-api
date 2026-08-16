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
import { createFileRoute, redirect } from '@tanstack/react-router'
import z from 'zod'

import { UsageLogs } from '@/features/usage-logs'
import { canAccessRequestArchives } from '@/features/usage-logs/lib/request-archive'
import {
  isUsageLogsSectionId,
  USAGE_LOGS_DEFAULT_SECTION,
} from '@/features/usage-logs/section-registry'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

const logTypeValues = ['0', '1', '2', '3', '4', '5', '6', '7'] as const
const logTypeSearchSchema = z
  .preprocess((value) => {
    if (value == null || value === '') return undefined
    return Array.isArray(value) ? value : [value]
  }, z.array(z.enum(logTypeValues)).optional())
  .catch([])

const usageLogsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(undefined),
  type: logTypeSearchSchema.optional(),
  filter: z.string().optional().catch(''),
  model: z.string().optional().catch(''),
  token: z.string().optional().catch(''),
  channel: z.string().optional().catch(''),
  group: z.string().optional().catch(''),
  username: z.string().optional().catch(''),
  requestId: z.string().optional().catch(''),
  upstreamRequestId: z.string().optional().catch(''),
  path: z.string().optional().catch(''),
  statusCode: z.number().int().min(100).max(599).optional().catch(undefined),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
})

export const Route = createFileRoute('/_authenticated/usage-logs/$section')({
  beforeLoad: ({ params, search }) => {
    if (!isUsageLogsSectionId(params.section)) {
      throw redirect({
        to: '/usage-logs/$section',
        params: { section: USAGE_LOGS_DEFAULT_SECTION },
      })
    }
    if (params.section === 'archive') {
      const { auth } = useAuthStore.getState()
      if (!canAccessRequestArchives(auth.user?.role, ROLE.ADMIN)) {
        throw redirect({ to: '/403' })
      }
    }
    // type 仅 common/activity 使用，其他分类清掉 URL 里的 type
    const hasTypeSearch = Array.isArray(search?.type)
      ? search.type.length > 0
      : search?.type != null && search.type !== ''
    const supportsTypeFilter =
      params.section === 'common' || params.section === 'activity'
    if (!supportsTypeFilter && hasTypeSearch) {
      throw redirect({
        to: '/usage-logs/$section',
        params: { section: params.section },
        search: { ...search, type: undefined },
        replace: true,
      })
    }
  },
  validateSearch: usageLogsSearchSchema,
  component: UsageLogs,
})
