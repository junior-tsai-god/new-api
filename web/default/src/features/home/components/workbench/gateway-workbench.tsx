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
import { GatewayControlsCard } from './gateway-controls-card'
import { LatencyCard } from './latency-card'
import { LiveRequestsCard } from './live-requests-card'
import { ModelPoolCard } from './model-pool-card'
import { RequestTimelineCard } from './request-timeline-card'
import { RoutingLoadCard } from './routing-load-card'

export function GatewayWorkbench() {
  return (
    <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-[0.92fr_1fr_1fr_1.04fr] lg:grid-rows-[18rem_16rem]'>
      <ModelPoolCard />
      <RoutingLoadCard />
      <LatencyCard />
      <LiveRequestsCard />
      <GatewayControlsCard />
      <RequestTimelineCard />
    </div>
  )
}
