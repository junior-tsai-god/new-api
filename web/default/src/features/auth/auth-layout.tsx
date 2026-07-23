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
import { Link } from '@tanstack/react-router'

import { AivantaBrand } from '@/components/aivanta-brand'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout(props: AuthLayoutProps) {
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='min-h-svh bg-[var(--deck-canvas)] p-0 md:p-6'>
      <div className='aivanta-paper-grid bg-background relative mx-auto flex min-h-svh w-full max-w-[92rem] overflow-hidden md:min-h-[calc(100svh-3rem)] md:rounded-[2.5rem] md:border md:shadow-[var(--deck-shadow)]'>
        <div
          aria-hidden='true'
          className='bg-warning/28 pointer-events-none absolute top-[-11rem] left-1/2 size-[30rem] -translate-x-1/2 rounded-full blur-3xl'
        />
        <Link
          to='/'
          className='absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-10 transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
        >
          {loading ? (
            <span className='flex items-center gap-2.5'>
              <Skeleton className='size-8 rounded-[0.7rem]' />
              <span className='grid gap-1'>
                <Skeleton className='h-3.5 w-16' />
                <Skeleton className='h-2 w-20' />
              </span>
            </span>
          ) : (
            <AivantaBrand
              projectName={systemName}
              projectLogo={logo}
              markClassName='size-9'
              nameClassName='text-lg'
            />
          )}
        </Link>

        <main className='relative flex min-h-svh flex-1 items-center justify-center overflow-y-auto px-4 pt-24 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-24 md:min-h-[calc(100svh-3rem)]'>
          <div className='bg-card flex w-full max-w-[31rem] flex-col justify-center rounded-3xl border p-6 shadow-sm sm:p-9'>
            {props.children}
          </div>
        </main>
      </div>
    </div>
  )
}
