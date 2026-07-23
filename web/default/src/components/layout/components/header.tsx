import { SidebarTrigger } from '@/components/ui/sidebar'
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
import { cn } from '@/lib/utils'

type HeaderProps = React.HTMLAttributes<HTMLElement>

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-[var(--app-header-height,4.75rem)] w-full shrink-0 bg-transparent',
        className
      )}
      {...props}
    >
      <div className='route-status-bridge flex h-full items-center gap-2 border-b px-3 sm:px-5 lg:px-7'>
        <SidebarTrigger
          variant='outline'
          className='bg-card/75 size-9 rounded-xl shadow-none'
        />
        {children}
      </div>
    </header>
  )
}
