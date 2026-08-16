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
import type { ReactNode } from 'react'

interface WalletPageContentProps {
  recharge: ReactNode
  subscription: ReactNode
  stats: ReactNode
  affiliate: ReactNode
  showSubscriptionPanel: boolean
}

export function WalletPageContent(props: WalletPageContentProps) {
  return (
    <>
      <div
        className={
          props.showSubscriptionPanel
            ? 'grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] xl:items-start'
            : 'grid gap-5'
        }
      >
        <div id='wallet-add-funds' className='scroll-mt-4'>
          {props.recharge}
        </div>
        {props.subscription}
      </div>

      {props.stats}
      {props.affiliate}
    </>
  )
}
