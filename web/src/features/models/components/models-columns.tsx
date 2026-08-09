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
import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import { BadgeCell, BadgeListCell } from '@/components/data-table'
import { GroupBadge } from '@/components/group-badge'
import { ProviderBadge } from '@/components/provider-badge'
import { StatusBadge } from '@/components/status-badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatTimestampToDate } from '@/lib/format'
import { getLobeIcon } from '@/lib/lobe-icon'

import { getModelStatusConfig } from '../constants'
import { formatEndpointsDisplay } from '../lib'
import type { Model, Vendor } from '../types'
import { DataTableRowActions } from './data-table-row-actions'

const EMPTY_VENDORS: Vendor[] = []

function getCompactModelIcon(iconKey: string) {
  const baseIconKey = iconKey.split('.')[0]

  return getLobeIcon(`${baseIconKey}.Avatar.type={'platform'}`, 20)
}

/**
 * Generate models columns configuration
 */
export function useModelsColumns(
  vendors: Vendor[] = EMPTY_VENDORS
): ColumnDef<Model>[] {
  const { t } = useTranslation()

  return createModelsColumns(t, vendors)
}

export function createModelsColumns(
  t: TFunction,
  vendors: Vendor[] = EMPTY_VENDORS
): ColumnDef<Model>[] {
  // Get translated configs
  const MODEL_STATUS_CONFIG = getModelStatusConfig(t)

  const vendorMap: Record<number, Vendor> = {}
  vendors.forEach((v) => {
    vendorMap[v.id] = v
  })

  return [
    // Checkbox column
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    // Model Name column (with model icon)
    {
      accessorKey: 'model_name',
      header: t('Model Name'),
      meta: { mobileTitle: true },
      cell: ({ row }) => {
        const model = row.original
        const name = row.getValue('model_name') as string
        const iconKey =
          model.icon ||
          vendorMap[model.vendor_id || 0]?.icon ||
          model.model_name?.[0] ||
          'N'
        const icon = getCompactModelIcon(iconKey)

        return (
          <div className='flex max-w-full min-w-0 items-center gap-2'>
            <div className='flex size-5 shrink-0 items-center justify-center overflow-hidden'>
              {icon}
            </div>
            <StatusBadge
              label={name}
              variant='neutral'
              copyText={name}
              size='sm'
              className='-ml-1.5 font-mono'
            />
          </div>
        )
      },
      size: 260,
      minSize: 200,
    },

    // Status column
    {
      accessorKey: 'status',
      header: t('Status'),
      meta: { mobileBadge: true },
      cell: ({ row }) => {
        const status = row.getValue('status') as number
        const config =
          MODEL_STATUS_CONFIG[status as 0 | 1] || MODEL_STATUS_CONFIG[0]

        return (
          <StatusBadge
            variant={config.variant}
            size='sm'
            copyable={false}
            className='-ml-1.5 max-w-none shrink-0'
          >
            {config.label}
          </StatusBadge>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value.length === 0 || value.includes('all')) return true
        const status = row.getValue(id) as number
        if (value.includes('enabled')) return status === 1
        if (value.includes('disabled')) return status !== 1
        return false
      },
      size: 110,
      minSize: 110,
      enableSorting: false,
    },

    // Vendor column
    {
      accessorKey: 'vendor_id',
      header: t('Vendor'),
      cell: ({ row }) => {
        const vendorId = row.getValue('vendor_id') as number
        const vendor = vendorMap[vendorId]

        if (!vendor) {
          return <span className='text-muted-foreground text-xs'>-</span>
        }

        return (
          <BadgeCell>
            <ProviderBadge iconKey={vendor.icon} label={vendor.name} />
          </BadgeCell>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value.length === 0 || value.includes('all')) return true
        return value.includes(String(row.getValue(id)))
      },
      size: 130,
      enableSorting: false,
    },

    // Endpoints column
    {
      accessorKey: 'endpoints',
      header: t('Endpoints'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const endpoints = row.getValue('endpoints') as string
        const endpointArray = formatEndpointsDisplay(endpoints)
        return (
          <BadgeListCell
            max={3}
            items={endpointArray.map((ep) => (
              <StatusBadge key={ep} label={ep} autoColor={ep} size='sm' />
            ))}
          />
        )
      },
      size: 200,
      enableSorting: false,
    },

    // Enable Groups column
    {
      accessorKey: 'enable_groups',
      header: t('Enable Groups'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const groups = row.getValue('enable_groups') as string[]
        return (
          <BadgeListCell
            max={3}
            items={(groups ?? []).map((g) => (
              <GroupBadge key={g} group={g} size='sm' />
            ))}
          />
        )
      },
      size: 200,
      enableSorting: false,
    },

    // Created Time column
    {
      accessorKey: 'created_time',
      header: t('Created'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const timestamp = row.getValue('created_time') as number
        return (
          <div className='font-mono text-sm whitespace-nowrap'>
            {formatTimestampToDate(timestamp)}
          </div>
        )
      },
      size: 140,
    },

    // Updated Time column
    {
      accessorKey: 'updated_time',
      header: t('Updated'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const timestamp = row.getValue('updated_time') as number
        return (
          <div className='font-mono text-sm whitespace-nowrap'>
            {formatTimestampToDate(timestamp)}
          </div>
        )
      },
      size: 140,
    },

    // Actions column
    {
      id: 'actions',
      header: () => t('Actions'),
      cell: ({ row }) => {
        return <DataTableRowActions row={row} />
      },
      enableSorting: false,
      enableHiding: false,
      meta: { pinned: 'right' as const },
    },
  ]
}
