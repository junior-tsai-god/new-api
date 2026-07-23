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
import { useIsMobile } from '@/hooks/use-mobile'

const DESKTOP_VCHART_OPTION = {
  mode: 'desktop-browser',
} as const

const MOBILE_VCHART_OPTION = {
  mode: 'mobile-browser',
} as const

export function useVChartOption() {
  return useIsMobile() ? MOBILE_VCHART_OPTION : DESKTOP_VCHART_OPTION
}
