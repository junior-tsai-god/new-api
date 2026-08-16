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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { TopNavLink } from '../../types'
import { isTopNavLinkActive } from '../top-nav'

const workspaceLink: TopNavLink = {
  title: 'Workspace',
  href: '/dashboard/overview',
  activePrefixes: [
    '/dashboard',
    '/playground',
    '/keys',
    '/model-catalog',
    '/system-settings',
  ],
}

describe('stable global navigation state', () => {
  test('keeps Workspace active throughout authenticated sections', () => {
    for (const pathname of [
      '/dashboard/overview',
      '/playground',
      '/keys',
      '/model-catalog/catalog',
      '/system-settings/auth',
    ]) {
      assert.equal(isTopNavLinkActive(pathname, workspaceLink), true)
    }
  })

  test('lets public destinations take over the active state', () => {
    assert.equal(isTopNavLinkActive('/pricing', workspaceLink), false)
    assert.equal(isTopNavLinkActive('/docs', workspaceLink), false)
  })

  test('does not treat every route as a child of Home', () => {
    assert.equal(
      isTopNavLinkActive('/docs', { title: 'Home', href: '/' }),
      false
    )
  })
})
