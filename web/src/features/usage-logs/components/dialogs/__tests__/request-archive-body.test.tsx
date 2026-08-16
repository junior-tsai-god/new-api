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
import { test } from 'node:test'

import { renderToStaticMarkup } from 'react-dom/server'

import { RequestArchiveBody } from '../request-archive-body'

test('archived bodies are rendered as escaped plain preformatted text', () => {
  const html = renderToStaticMarkup(
    <RequestArchiveBody
      body={'<script>alert("archive")</script>\n{"ok":true}'}
      emptyLabel='Empty'
    />
  )

  assert.match(html, /^<pre/)
  assert.match(
    html,
    /&lt;script&gt;alert\(&quot;archive&quot;\)&lt;\/script&gt;/
  )
  assert.doesNotMatch(html, /<script>/)
})
