/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

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

import { formatTimestampRelative } from '../format.ts'

describe('relative timestamp locale formatting', () => {
  for (const [interfaceLanguage, intlLocale] of [
    ['zhCN', 'zh-CN'],
    ['zhTW', 'zh-TW'],
  ] as const) {
    test(`accepts the ${interfaceLanguage} interface language code`, () => {
      const oneHourAgoSeconds = Date.now() / 1_000 - 3_600

      const actual = formatTimestampRelative(
        oneHourAgoSeconds,
        'seconds',
        interfaceLanguage
      )
      const expected = new Intl.RelativeTimeFormat(intlLocale, {
        numeric: 'always',
      }).format(-1, 'hour')

      assert.equal(actual, expected)
    })
  }
})
