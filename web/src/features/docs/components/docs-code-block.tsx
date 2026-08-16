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
import { CopyButton } from '@/components/copy-button'

type DocsCodeBlockProps = {
  code: string
  label: string
}

export function DocsCodeBlock(props: DocsCodeBlockProps) {
  return (
    <div className='overflow-hidden rounded-xl border border-[var(--aivanta-rule)] bg-[var(--aivanta-ink)] text-[var(--aivanta-paper)]'>
      <div className='flex items-center justify-between border-b border-white/10 px-4 py-2.5'>
        <span className='font-mono text-[11px] tracking-[0.12em] text-white/60 uppercase'>
          {props.label}
        </span>
        <CopyButton
          value={props.code}
          className='text-white/70 hover:bg-white/10 hover:text-white'
          iconClassName='size-3.5'
        />
      </div>
      <pre className='max-h-[34rem] overflow-auto px-4 py-4 font-mono text-[12px] leading-6 whitespace-pre sm:text-[13px]'>
        <code>{props.code}</code>
      </pre>
    </div>
  )
}
