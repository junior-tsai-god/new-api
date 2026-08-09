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

import {
  isModelCatalogSection,
  MODEL_CATALOG_DEFAULT_SECTION,
  MODEL_CATALOG_SECTIONS,
} from '../section-registry.ts'

describe('model catalog sections', () => {
  test('opens the catalog first and exposes status in the same workspace', () => {
    assert.equal(MODEL_CATALOG_DEFAULT_SECTION, 'catalog')
    assert.deepEqual(MODEL_CATALOG_SECTIONS, ['catalog', 'status'])
  })

  test('rejects admin model sections from the user model workspace', () => {
    assert.equal(isModelCatalogSection('metadata'), false)
    assert.equal(isModelCatalogSection('deployments'), false)
    assert.equal(isModelCatalogSection('status'), true)
  })
})
