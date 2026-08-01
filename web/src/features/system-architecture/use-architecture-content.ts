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
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  ArchitectureFlow,
  ArchitectureLayer,
  DiagnosticBoundary,
  RuntimeNode,
} from './types'

export function useArchitectureContent(): {
  flows: ArchitectureFlow[]
  layers: ArchitectureLayer[]
  runtimeNodes: RuntimeNode[]
  diagnosticBoundaries: DiagnosticBoundary[]
} {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      flows: [
        {
          id: 'request',
          label: t('API request'),
          summary: t(
            'Inference requests pass through policy checks, billing, protocol conversion, and the selected upstream provider.'
          ),
          steps: [
            {
              code: '01',
              title: t('Client application'),
              technology: 'OpenAI SDK / HTTP',
              description: t('Calls the unified OpenAI-compatible endpoint.'),
            },
            {
              code: '02',
              title: t('Edge gateway'),
              technology: 'Caddy / TLS',
              description: t('Terminates TLS and forwards traffic to the API.'),
            },
            {
              code: '03',
              title: t('Policy middleware'),
              technology: 'Auth / CORS / Rate limit',
              description: t(
                'Authenticates the caller and applies request policies.'
              ),
            },
            {
              code: '04',
              title: t('Router and controller'),
              technology: 'Gin Router',
              description: t(
                'Matches the endpoint and normalizes the request.'
              ),
            },
            {
              code: '05',
              title: t('Service and billing'),
              technology: 'Go Services',
              description: t(
                'Runs business rules, quota checks, and usage accounting.'
              ),
            },
            {
              code: '06',
              title: t('Relay adapter'),
              technology: 'Provider Protocols',
              description: t(
                'Converts the request into the selected provider protocol.'
              ),
            },
            {
              code: '07',
              title: t('AI provider'),
              technology: '40+ upstreams',
              description: t(
                'Streams the response back through the same controlled path.'
              ),
            },
          ],
        },
        {
          id: 'payment',
          label: t('Payment flow'),
          summary: t(
            'A top-up becomes available only after PayPal confirms the order and the local quota transaction succeeds.'
          ),
          steps: [
            {
              code: '01',
              title: t('Wallet interface'),
              technology: 'React',
              description: t('Selects an amount and starts PayPal checkout.'),
            },
            {
              code: '02',
              title: t('Top-up API'),
              technology: 'Gin Controller',
              description: t(
                'Creates a pending top-up order for the current user.'
              ),
            },
            {
              code: '03',
              title: 'PayPal Orders API',
              technology: 'Sandbox / Live',
              description: t(
                'Creates and approves the external payment order.'
              ),
            },
            {
              code: '04',
              title: t('Capture and webhook'),
              technology: 'Signed Events',
              description: t(
                'Confirms the captured amount and verifies webhook events.'
              ),
            },
            {
              code: '05',
              title: t('Database transaction'),
              technology: 'GORM / PostgreSQL',
              description: t(
                'Commits the order status and quota as one transaction.'
              ),
            },
            {
              code: '06',
              title: t('Available quota'),
              technology: 'User Balance',
              description: t(
                'Makes the credited balance available to the user.'
              ),
            },
          ],
        },
        {
          id: 'admin',
          label: t('Admin configuration'),
          summary: t(
            'Administrator changes are validated, stored, synchronized, and then consumed by routing and billing.'
          ),
          steps: [
            {
              code: '01',
              title: t('Admin console'),
              technology: 'React / TanStack Router',
              description: t(
                'Edits channels, pricing, payments, and system options.'
              ),
            },
            {
              code: '02',
              title: t('Role guard'),
              technology: 'Admin RBAC',
              description: t(
                'Allows only administrators to enter protected workspaces.'
              ),
            },
            {
              code: '03',
              title: t('Settings API'),
              technology: 'Controller / Service',
              description: t(
                'Receives configuration changes through authenticated APIs.'
              ),
            },
            {
              code: '04',
              title: t('Option validation'),
              technology: 'Typed Settings',
              description: t(
                'Normalizes values before they become runtime configuration.'
              ),
            },
            {
              code: '05',
              title: t('Options store'),
              technology: 'PostgreSQL',
              description: t(
                'Stores durable options and operational configuration.'
              ),
            },
            {
              code: '06',
              title: t('Runtime sync'),
              technology: 'Memory / Redis',
              description: t(
                'Refreshes the settings used by routing and billing.'
              ),
            },
          ],
        },
      ],
      layers: [
        {
          code: 'L1',
          title: t('Experience layer'),
          description: t(
            'Administrator and user workflows, route state, forms, and localized interface content.'
          ),
          technologies: [
            'React 19',
            'TanStack Router',
            'Base UI',
            'Tailwind CSS',
          ],
        },
        {
          code: 'L2',
          title: t('Edge and policy layer'),
          description: t(
            'TLS termination, authentication, authorization, CORS, rate limits, and request tracing.'
          ),
          technologies: ['Caddy', 'Gin Middleware', 'JWT', 'WebAuthn'],
        },
        {
          code: 'L3',
          title: t('Business core'),
          description: t(
            'Controllers coordinate services; services enforce billing, account, subscription, and payment rules.'
          ),
          technologies: ['Controller', 'Service', 'Model', 'GORM'],
        },
        {
          code: 'L4',
          title: t('Relay fabric'),
          description: t(
            'A unified API selects channels and translates requests and streams for each upstream protocol.'
          ),
          technologies: ['OpenAI', 'Claude', 'Gemini', 'Azure', 'Bedrock'],
        },
        {
          code: 'L5',
          title: t('State and operations'),
          description: t(
            'Durable records, fast cache state, rate-limit counters, audit logs, and scheduled synchronization.'
          ),
          technologies: ['PostgreSQL', 'Redis', 'SQLite / MySQL', 'Local Logs'],
        },
      ],
      runtimeNodes: [
        {
          label: t('Ingress'),
          value: 'Caddy 2',
          detail: t('TLS termination and reverse proxy'),
        },
        {
          label: t('Application'),
          value: 'new-api',
          detail: t('Go and Gin unified API service'),
        },
        {
          label: t('Primary data'),
          value: 'PostgreSQL 15',
          detail: t('Users, orders, channels, and settings'),
        },
        {
          label: t('Fast state'),
          value: 'Redis',
          detail: t('Cache, synchronization, and rate limits'),
        },
        {
          label: t('Provider edge'),
          value: '40+',
          detail: t('Protocol adapters and upstream channels'),
        },
      ],
      diagnosticBoundaries: [
        {
          code: 'A',
          title: t('Browser and route'),
          description: t(
            'Confirm the page loads, the session is valid, and the role guard allows access.'
          ),
        },
        {
          code: 'B',
          title: t('API and policy'),
          description: t(
            'Check request IDs and HTTP status codes before inspecting business logic.'
          ),
        },
        {
          code: 'C',
          title: t('Service and state'),
          description: t(
            'Verify settings, quota, transactions, database records, and Redis state.'
          ),
        },
        {
          code: 'D',
          title: t('Relay and upstream'),
          description: t(
            'Inspect channel selection, protocol conversion, and the provider response.'
          ),
        },
      ],
    }),
    [t]
  )
}
