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
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Database,
  GitBranch,
  KeyRound,
  LayersIcon,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SectionLink = {
  id: string
  label: string
}

type MetricItem = {
  label: string
  value: string
  description: string
  icon: LucideIcon
}

type InsightCard = {
  title: string
  description: string
  icon: LucideIcon
}

type SectionProps = {
  id: string
  eyebrow: string
  title: string
  icon: LucideIcon
  children: React.ReactNode
}

type DataTableProps = {
  caption: string
  headers: string[]
  rows: string[][]
  dense?: boolean
}

type ArchitectureLayer = {
  title: string
  description: string
  items: string[]
}

type Workstream = {
  title: string
  owner: string
  responsibilities: string[]
}

const sectionLinks: SectionLink[] = [
  { id: 'summary', label: '执行摘要' },
  { id: 'market', label: '行业与机会' },
  { id: 'business-model', label: '商业模式' },
  { id: 'suppliers', label: '供应商与价差' },
  { id: 'architecture', label: '中转站架构' },
  { id: 'plan', label: '阶段计划与分工' },
  { id: 'finance', label: '财务与风控' },
  { id: 'sources', label: '资料边界' },
]

const heroMetrics: MetricItem[] = [
  {
    label: '主要毛利来源',
    value: '区域价差 + 采购折扣',
    description:
      '把大陆、北美、东南亚的模型价格、汇率、税费和缓存能力纳入统一成本池。',
    icon: WalletCards,
  },
  {
    label: '核心客户',
    value: 'AI 应用团队 / 出海企业',
    description: '解决多模型接入、跨区域稳定性、企业账单、合规和成本优化问题。',
    icon: Users,
  },
  {
    label: '交付形态',
    value: 'SaaS + 私有化 + 采购托管',
    description:
      '公开站点快速获客，企业客户通过专属通道、SLA 和折扣池沉淀收入。',
    icon: Route,
  },
]

const summaryCards: InsightCard[] = [
  {
    title: '先做“模型成本路由”，再做“企业 AI 网关”',
    description:
      '短期以模型聚合、价格差和稳定通道建立现金流；中期把权限、审计、预算、故障切换和合规模块做成企业级网关。',
    icon: GitBranch,
  },
  {
    title: '差价不是唯一卖点，交付确定性才是溢价来源',
    description:
      '单纯按低价转售容易被供应商调价击穿。需要把可用性、低延迟、账单透明、限流、缓存、企业支持一起打包。',
    icon: ShieldCheck,
  },
  {
    title: '中国大陆模型供应链已经足够丰富',
    description:
      '阿里云百炼、火山方舟、腾讯混元、百度千帆、DeepSeek、智谱、Kimi、MiniMax 等可形成多层供应池。',
    icon: Database,
  },
]

const marketInsights: InsightCard[] = [
  {
    title: '企业从“试用模型”进入“治理模型”阶段',
    description:
      '客户已经不只关心能不能调用模型，而是关心预算、权限、审计、稳定性、数据边界和供应商锁定。',
    icon: BarChart3,
  },
  {
    title: '多模型应用需要统一 API 和统一账单',
    description:
      'OpenAI 兼容协议仍然是事实入口，但客户会同时需要 Qwen、Doubao、Hunyuan、ERNIE、DeepSeek、Claude、Gemini 等模型。',
    icon: LayersIcon,
  },
  {
    title: '出海客户对跨区域成本和可用性更敏感',
    description:
      '北美、东南亚、大陆的可用区域、币种、税费、限流和数据要求不同，中转站可以承担路由与采购优化角色。',
    icon: Activity,
  },
]

const businessModelRows: string[][] = [
  [
    '区域价差与汇率优化',
    '同一模型或同类模型在不同区域、币种、计价档位、缓存策略下存在差异。',
    '按量加价、成本路由、区域成本池、汇率保护价。',
  ],
  [
    '大客户采购折扣',
    '云厂商常见资源包、预付费、年度框架、承诺消费、专属 QPS 和商务优惠。',
    '把折扣作为毛利来源，同时给客户比官网零售价更稳的企业报价。',
  ],
  [
    '企业网关订阅',
    '客户需要 API Key 管理、用量审计、模型白名单、预算、团队权限、发票和 SLA。',
    '按席位、按租户、按月平台费，叠加模型用量。',
  ],
  [
    '私有化与专属通道',
    '金融、教育、政企和大型 SaaS 需要私有部署、专线、日志留存和数据边界。',
    '一次性部署费、年度维护费、专属通道管理费。',
  ],
  [
    '开发者生态与插件市场',
    '围绕客户端、Agent、RAG、知识库、监控告警形成生态能力。',
    '模板、插件、托管服务、联合方案分成。',
  ],
]

const supplierRows: string[][] = [
  [
    '阿里云百炼 / Model Studio',
    'Qwen 系列、第三方模型、文本/多模态/Embedding/图片等',
    '公开价格表可按中国北京、美国弗吉尼亚、新加坡、德国等区域比较。',
    '适合作为主力供应商；重点谈资源包、Batch 50% 折扣、上下文缓存、企业账期。',
  ],
  [
    '火山引擎方舟',
    'Doubao 系列、视频/图片/语音、多模态和推理服务',
    '公开页面对文本模型价格抓取不稳定，需控制台或商务核价。',
    '适合补充大陆主力通道；重点核对文本模型单价、QPS、并发、专属资源池。',
  ],
  [
    '腾讯云混元 / TokenHub',
    'Hunyuan-a13b、角色/翻译/视觉/Embedding 等',
    'Hunyuan-a13b 公开价约 0.5/2 元人民币每百万输入/输出 tokens。',
    '适合低价国产模型池；重点谈预付费资源包、企业折扣、TokenHub 迁移政策。',
  ],
  [
    '百度智能云千帆',
    'ERNIE 5.0、ERNIE X1、DeepSeek、GLM、Kimi、Qwen 等',
    '公开价格按千 tokens 计价，部分模型有批量推理折扣。',
    '适合作为国产与第三方模型聚合补充；重点核对企业版 Token Plan。',
  ],
  [
    'DeepSeek 官方 API',
    'DeepSeek-V4-Flash / Pro，长上下文、缓存命中价',
    '公开价极低，Flash 约 1/2 元人民币每百万输入缓存未命中/输出 tokens。',
    '适合作为低成本推理主力；重点核对并发、企业 SLA、限流和版本迁移节奏。',
  ],
  [
    '智谱、Kimi、MiniMax、硅基流动等',
    'GLM、Moonshot、MiniMax、第三方聚合模型池',
    '公开价与促销活动变化快，需要继续补齐。',
    '作为差异化模型和备份通道；重点核对 ToS、商用授权、地域和折扣阶梯。',
  ],
]

const alibabaPriceRows: string[][] = [
  [
    'qwen3.7-max',
    '中国北京',
    '$1.65 / $4.951',
    '与美国弗吉尼亚 Global 档公开价一致。',
  ],
  [
    'qwen3.7-max',
    '美国弗吉尼亚 Global',
    '$1.65 / $4.951',
    '与中国北京一致；同区还有 qwen3.7-max-us 专用档，价格更高。',
  ],
  [
    'qwen3.7-max-us',
    '美国弗吉尼亚 US 专用档',
    '$2.5 / $7.5',
    '较北京/Global 约高 51.5%，与新加坡 International 档同价。',
  ],
  [
    'qwen3.7-max',
    '新加坡 International',
    '$2.5 / $7.5',
    '较北京/Global 约高 51.5%，可作为东南亚价差参考。',
  ],
  [
    'qwen3-max 32K 内非思考',
    '中国北京 / 美国弗吉尼亚 Global',
    '$0.359 / $1.434',
    '两地 Global 档公开价一致；需核对账号地域和可售范围。',
  ],
  [
    'qwen3-max 32K 内 International',
    '新加坡等 International 档',
    '$1.2 / $6',
    '同模型不同商业档位价差明显，适合重点跟进。',
  ],
  [
    'qwen-plus 低上下文档',
    'Global vs qwen-plus-us',
    '$0.115/$0.287 vs $0.4/$1.2',
    'US 专用档输入约 3.5 倍，非思考输出约 4.2 倍；上下文档位不同，需谨慎比价。',
  ],
  [
    'qwen-flash 低上下文档',
    'Global vs qwen-flash-us',
    '$0.022/$0.216 vs $0.05/$0.4',
    'US 档输入约 2.27 倍，输出约 1.85 倍。',
  ],
]

const verifiedPriceRows: string[][] = [
  [
    '腾讯云混元',
    'Hunyuan-a13b',
    '0.5 / 2 元人民币',
    '每百万输入/输出 tokens；公开文档显示支持后付费和预付费。',
  ],
  [
    '腾讯云混元',
    'Hunyuan-role-latest',
    '2.4 / 9.6 元人民币',
    '每百万输入/输出 tokens。',
  ],
  [
    'DeepSeek 官方',
    'DeepSeek-V4-Flash',
    '1 / 2 元人民币',
    '缓存未命中输入/输出；缓存命中输入约 0.02 元每百万 tokens。',
  ],
  [
    'DeepSeek 官方',
    'DeepSeek-V4-Pro',
    '3 / 6 元人民币',
    '缓存未命中输入/输出；缓存命中输入约 0.025 元每百万 tokens。',
  ],
  [
    '百度千帆',
    'ERNIE 5.0 32K 内',
    '约 6 / 24 元人民币',
    '由 0.006/0.024 元每千 tokens 换算；高上下文档更高。',
  ],
  [
    '百度千帆',
    'ERNIE X1.1',
    '约 1 / 4 元人民币',
    '由 0.001/0.004 元每千 tokens 换算；搜索增强另计。',
  ],
]

const discountRows: string[][] = [
  [
    '阿里云百炼',
    'Batch 调用公开说明为实时推理 50% 单价；上下文缓存对输入有折扣；促销以控制台为准。',
    '谈年度承诺消费、资源包、账期、专属 QPS、跨区域开通、价格保护周期。',
  ],
  [
    '百度千帆',
    '公开文档有 Token Plan 企业版入口，部分模型显示批量推理折扣价。',
    '谈企业版 Token 包、批推资源、模型组合价、私有化/专有云方案。',
  ],
  [
    '腾讯云混元',
    '公开文档显示后付费日结和预付费能力，具体企业折扣未公开。',
    '谈预付费资源包、云账号大客户折扣、QPS、TokenHub 迁移优惠。',
  ],
  [
    '火山引擎方舟',
    '文本模型公开价需控制台复核；视频模型公开报道显示大客户可能绑定承诺消费与并发权益。',
    '谈年度框架、并发池、专属资源、账号区域、日志与版权合规支持。',
  ],
  [
    'DeepSeek 官方',
    '公开价本身较低，折扣空间不一定体现在单价。',
    '重点谈并发、稳定性、企业支持、版本锁定、用量上限和故障沟通机制。',
  ],
]

const architectureLayers: ArchitectureLayer[] = [
  {
    title: '接入层',
    description: '兼容 OpenAI API、客户端 SDK、企业专属域名和多租户鉴权。',
    items: ['API Key', 'JWT / OAuth', 'IP 白名单', '请求签名'],
  },
  {
    title: '治理层',
    description: '统一处理预算、限流、审计、风控、模型白名单和团队权限。',
    items: ['Quota', 'Rate Limit', 'Audit Log', 'Policy'],
  },
  {
    title: '智能路由层',
    description:
      '基于区域、价格、延迟、模型能力、故障状态和客户合规要求选择通道。',
    items: ['成本路由', '故障切换', '权重分流', '缓存命中'],
  },
  {
    title: '供应商适配层',
    description:
      '对接国内外模型供应商，屏蔽协议差异、错误码差异和计费字段差异。',
    items: ['阿里云', '火山', '腾讯', '百度', 'DeepSeek', '海外模型'],
  },
  {
    title: '结算与运营层',
    description: '完成实时成本核算、客户账单、毛利看板、渠道健康度和商务核价。',
    items: ['成本中心', '发票', '毛利报表', '告警'],
  },
]

const planRows: string[][] = [
  [
    '0-2 周',
    '商业与供应链验证',
    '补齐火山、智谱、Kimi、MiniMax、硅基流动价格；确认阿里云区域价差；跑通 3 个目标客户访谈。',
    '价格矩阵、供应商评分表、首版报价策略。',
  ],
  [
    '3-6 周',
    'MVP 站点与计费闭环',
    '完成站点文档、模型广场、API Key、用量日志、渠道健康、基础路由、成本核算。',
    '可对外试用的中转站与基础运营后台。',
  ],
  [
    '7-10 周',
    '企业能力增强',
    '团队权限、预算审批、SLA 告警、专属通道、账单导出、供应商故障切换。',
    '企业试点版本，支持付费 PoC。',
  ],
  [
    '11-16 周',
    '规模化与商务谈判',
    '根据试点用量谈年度框架和折扣；扩展区域通道；建立销售漏斗与客户成功流程。',
    '首批年度客户、供应商折扣池、可复用交付手册。',
  ],
]

const workstreams: Workstream[] = [
  {
    title: '产品与商业',
    owner: '产品/创始人',
    responsibilities: [
      '客户访谈',
      '报价策略',
      '套餐设计',
      '竞品跟踪',
      'BP 与销售材料',
    ],
  },
  {
    title: '供应链与商务',
    owner: '商务/运营',
    responsibilities: [
      '供应商报价',
      '折扣谈判',
      '账号开通',
      '合同发票',
      '价格更新机制',
    ],
  },
  {
    title: '网关与计费',
    owner: '后端',
    responsibilities: [
      '渠道适配',
      '路由策略',
      '限流熔断',
      '成本核算',
      '账单与审计',
    ],
  },
  {
    title: '站点与控制台',
    owner: '前端',
    responsibilities: [
      '文档页面',
      '模型广场',
      '用量看板',
      '企业管理界面',
      '可视化报价',
    ],
  },
  {
    title: '合规与安全',
    owner: '安全/法务',
    responsibilities: [
      'ToS 审核',
      '数据跨境',
      '日志留存',
      '隐私协议',
      '高风险客户限制',
    ],
  },
]

const riskRows: string[][] = [
  [
    '供应商调价导致毛利下降',
    '高',
    '建立多供应商成本池；报价保留调价条款；大客户签价格保护周期。',
  ],
  [
    '区域价差被供应商政策限制',
    '高',
    '不承诺规避地域限制；按供应商 ToS 和客户数据所在地做合规路由。',
  ],
  [
    '模型质量或版本变化影响客户',
    '中',
    '模型版本白名单、灰度切换、回滚能力和客户级模型锁定。',
  ],
  [
    '滥用、盗刷和欠费风险',
    '高',
    '实名/KYC、预付费额度、异常请求风控、速率限制和自动停用。',
  ],
  [
    '企业客户要求 SLA 但供应商无兜底',
    '中',
    '多通道故障切换、服务等级分层、明确不可抗力与上游故障条款。',
  ],
]

function Badge(props: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'border-border/70 bg-background/80 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        props.className
      )}
    >
      {props.children}
    </span>
  )
}

function MetricCard(props: { item: MetricItem }) {
  const Icon = props.item.icon

  return (
    <div className='border-border/70 bg-background/70 rounded-lg border p-5 shadow-xs'>
      <div className='flex items-start gap-3'>
        <div className='bg-primary/10 text-primary rounded-lg p-2'>
          <Icon className='size-4' />
        </div>
        <div className='min-w-0 space-y-1'>
          <p className='text-muted-foreground text-xs font-medium'>
            {props.item.label}
          </p>
          <p className='text-lg leading-tight font-semibold'>
            {props.item.value}
          </p>
          <p className='text-muted-foreground text-sm leading-6'>
            {props.item.description}
          </p>
        </div>
      </div>
    </div>
  )
}

function InsightGrid(props: { items: InsightCard[] }) {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {props.items.map((item) => {
        const Icon = item.icon
        return (
          <article
            key={item.title}
            className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'
          >
            <div className='bg-muted mb-4 inline-flex rounded-lg p-2'>
              <Icon className='text-muted-foreground size-5' />
            </div>
            <h3 className='text-base font-semibold'>{item.title}</h3>
            <p className='text-muted-foreground mt-2 text-sm leading-6'>
              {item.description}
            </p>
          </article>
        )
      })}
    </div>
  )
}

function Section(props: SectionProps) {
  const Icon = props.icon

  return (
    <section id={props.id} className='scroll-mt-24 space-y-6'>
      <div className='space-y-3'>
        <div className='text-primary flex items-center gap-2 text-sm font-semibold'>
          <Icon className='size-4' />
          <span>{props.eyebrow}</span>
        </div>
        <h2 className='text-2xl leading-tight font-semibold tracking-tight md:text-3xl'>
          {props.title}
        </h2>
      </div>
      {props.children}
    </section>
  )
}

function DataTable(props: DataTableProps) {
  return (
    <div className='border-border/70 overflow-x-auto rounded-lg border'>
      <table
        className={cn(
          'min-w-[760px] table-fixed text-left text-sm',
          props.dense ? 'w-[980px]' : 'w-full'
        )}
      >
        <caption className='sr-only'>{props.caption}</caption>
        <thead className='bg-muted/70 text-muted-foreground'>
          <tr>
            {props.headers.map((header) => (
              <th key={header} scope='col' className='px-4 py-3 font-medium'>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-border divide-y'>
          {props.rows.map((row) => {
            const rowKey = row.join('|')
            return (
              <tr key={rowKey} className='bg-card/40 align-top'>
                {props.headers.map((header, cellIndex) => (
                  <td
                    key={`${rowKey}-${header}`}
                    className='px-4 py-3 leading-6 break-words'
                  >
                    {row[cellIndex]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ArchitectureDiagram() {
  return (
    <div className='space-y-4'>
      {architectureLayers.map((layer, index) => (
        <div key={layer.title} className='space-y-4'>
          <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
            <div className='grid gap-4 lg:grid-cols-[12rem_1fr] lg:items-start'>
              <div>
                <p className='text-lg font-semibold'>{layer.title}</p>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  {layer.description}
                </p>
              </div>
              <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
                {layer.items.map((item) => (
                  <span
                    key={item}
                    className='bg-muted/60 text-foreground rounded-lg px-3 py-2 text-sm'
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {index < architectureLayers.length - 1 && (
            <div className='text-muted-foreground flex justify-center text-sm'>
              ↓
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function WorkstreamGrid() {
  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {workstreams.map((stream) => (
        <article
          key={stream.title}
          className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'
        >
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h3 className='font-semibold'>{stream.title}</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                负责人：{stream.owner}
              </p>
            </div>
            <KeyRound className='text-muted-foreground size-5 shrink-0' />
          </div>
          <div className='mt-4 flex flex-wrap gap-2'>
            {stream.responsibilities.map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

export function Docs() {
  const { t } = useTranslation()

  return (
    <PublicLayout showMainContainer={false}>
      <main>
        <section className='border-border/60 bg-muted/20 border-b px-6 pt-24 pb-12 md:pt-32 md:pb-16'>
          <div className='mx-auto max-w-6xl'>
            <div className='mb-8'>
              <Button
                variant='outline'
                className='gap-2'
                render={<Link to='/' />}
              >
                <ArrowLeft className='size-4' />
                {t('Back to Home')}
              </Button>
            </div>

            <div className='grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-end'>
              <div className='space-y-6'>
                <div className='flex flex-wrap gap-2'>
                  <Badge className='bg-primary/10 text-primary border-primary/20'>
                    商业计划书
                  </Badge>
                  <Badge>站内文档</Badge>
                  <Badge>模型供应调研</Badge>
                  <Badge>更新：2026-07-07</Badge>
                </div>
                <div className='max-w-4xl space-y-4'>
                  <h1 className='text-[clamp(2rem,5vw,4rem)] leading-tight font-semibold tracking-tight'>
                    AI API 中转站商业计划书
                  </h1>
                  <p className='text-muted-foreground max-w-3xl text-base leading-8 md:text-lg'>
                    本计划书聚焦中国大陆模型供应商与北美、东南亚等区域的价格差、采购折扣和企业级交付能力，
                    目标是把模型调用从单点转售升级为可治理、可审计、可控成本的企业
                    AI 网关服务。
                  </p>
                </div>
              </div>

              <div className='border-border/70 bg-background/80 rounded-lg border p-5 shadow-xs'>
                <div className='mb-4 flex items-center gap-2'>
                  <Sparkles className='text-primary size-5' />
                  <p className='font-semibold'>商业主线建议</p>
                </div>
                <p className='text-muted-foreground text-sm leading-7'>
                  不把“价差”包装成绕过地域限制，而是提供合规的区域成本优化、供应商采购托管、稳定性保障和企业账单治理。
                </p>
              </div>
            </div>

            <div className='mt-8 grid gap-4 md:grid-cols-3'>
              {heroMetrics.map((item) => (
                <MetricCard key={item.label} item={item} />
              ))}
            </div>
          </div>
        </section>

        <div className='mx-auto grid max-w-6xl gap-10 px-6 py-12 xl:grid-cols-[13rem_1fr] xl:py-16'>
          <aside className='hidden xl:block'>
            <nav className='border-border/70 bg-card/70 sticky top-24 rounded-lg border p-3 shadow-xs'>
              <div className='mb-3 flex items-center gap-2 px-2 text-sm font-semibold'>
                <BookOpen className='size-4' />
                目录
              </div>
              <div className='space-y-1'>
                {sectionLinks.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className='text-muted-foreground hover:bg-muted hover:text-foreground block rounded-md px-2 py-2 text-sm transition-colors'
                  >
                    {section.label}
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          <div className='space-y-16'>
            <Section
              id='summary'
              eyebrow='01 / Executive Summary'
              title='执行摘要'
              icon={Sparkles}
            >
              <div className='text-muted-foreground space-y-4 text-base leading-8'>
                <p>
                  项目定位为面向开发者、AI
                  应用公司和企业客户的模型服务中转站。第一阶段以 OpenAI 兼容
                  API、模型聚合、成本路由、用量计费和稳定通道为核心，快速承接多模型调用需求。
                  第二阶段转向企业 AI
                  网关，提供团队权限、预算控制、审计、SLA、专属通道和供应商采购托管。
                </p>
                <p>
                  商业模式建议以“区域价差与采购优化”为切入点，但不要只依赖价差。真正可持续的收入来自：
                  大客户折扣池、批处理与缓存带来的成本优势、企业平台订阅费、私有化交付费，以及跨供应商故障切换带来的稳定性溢价。
                </p>
              </div>
              <InsightGrid items={summaryCards} />
            </Section>

            <Section
              id='market'
              eyebrow='02 / Market'
              title='行业调研与市场机会'
              icon={BarChart3}
            >
              <InsightGrid items={marketInsights} />
              <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                <h3 className='font-semibold'>目标客户优先级</h3>
                <div className='mt-4 grid gap-4 md:grid-cols-3'>
                  <div>
                    <p className='font-medium'>AI 原生应用团队</p>
                    <p className='text-muted-foreground mt-2 text-sm leading-6'>
                      关注模型覆盖、成本、速度、失败重试和账单透明，付费决策快。
                    </p>
                  </div>
                  <div>
                    <p className='font-medium'>出海 SaaS 与内容平台</p>
                    <p className='text-muted-foreground mt-2 text-sm leading-6'>
                      关注北美、东南亚、大陆多区域可用性，愿意为稳定和合规买单。
                    </p>
                  </div>
                  <div>
                    <p className='font-medium'>企业内部 AI 平台</p>
                    <p className='text-muted-foreground mt-2 text-sm leading-6'>
                      关注权限、审计、采购、发票、数据边界和
                      SLA，客单价高但销售周期长。
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            <Section
              id='business-model'
              eyebrow='03 / Business Model'
              title='商业模式：围绕区域价差做成本优化，但用企业交付形成护城河'
              icon={WalletCards}
            >
              <DataTable
                caption='商业模式拆解'
                headers={['收入模块', '成立原因', '变现方式']}
                rows={businessModelRows}
              />
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                  <h3 className='font-semibold'>建议报价公式</h3>
                  <p className='text-muted-foreground mt-3 text-sm leading-7'>
                    客户价 = 模型真实成本 + 汇率/税费/支付通道 + 网络与缓存成本
                    + 风控坏账准备 + 平台毛利。 对企业客户应提供“阶梯价格 +
                    月度最低消费 + SLA 等级”，避免只有单一 token 差价。
                  </p>
                </div>
                <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                  <h3 className='font-semibold'>不建议承诺的边界</h3>
                  <p className='text-muted-foreground mt-3 text-sm leading-7'>
                    不承诺规避地域限制、绕过供应商
                    ToS、绕过数据跨境规则。对外话术应是“合规区域路由、采购优化与稳定交付”，
                    不是简单搬运低价接口。
                  </p>
                </div>
              </div>
            </Section>

            <Section
              id='suppliers'
              eyebrow='04 / Suppliers'
              title='中国模型供应商调研与区域价差判断'
              icon={Database}
            >
              <div className='space-y-8'>
                <div>
                  <h3 className='mb-3 text-lg font-semibold'>供应商候选池</h3>
                  <DataTable
                    caption='中国模型供应商候选池'
                    headers={[
                      '供应商',
                      '模型/能力',
                      '公开价格状态',
                      'BP 中的作用',
                    ]}
                    rows={supplierRows}
                    dense
                  />
                </div>

                <div>
                  <h3 className='mb-3 text-lg font-semibold'>
                    阿里云国内、北美、东南亚价差重点
                  </h3>
                  <DataTable
                    caption='阿里云区域价差'
                    headers={[
                      '模型',
                      '区域/档位',
                      '输入/输出价（每百万 tokens）',
                      '判断',
                    ]}
                    rows={alibabaPriceRows}
                    dense
                  />
                  <p className='text-muted-foreground mt-3 text-sm leading-6'>
                    结论：阿里云不是所有模型都“大陆便宜、北美贵”。qwen3.7-max 和
                    qwen3-max 的部分 Global
                    档在中国北京与美国弗吉尼亚公开价一致； 但 International、US
                    专用档和部分上下文档位存在明显差异。BP 应把“区域 + 商业档位
                    + 账号可售范围”一起作为成本路由变量。
                  </p>
                </div>

                <div>
                  <h3 className='mb-3 text-lg font-semibold'>
                    其他已核验公开价格
                  </h3>
                  <DataTable
                    caption='其他模型供应商公开价格'
                    headers={['供应商', '模型', '输入/输出价', '说明']}
                    rows={verifiedPriceRows}
                    dense
                  />
                </div>

                <div>
                  <h3 className='mb-3 text-lg font-semibold'>
                    大客户折扣与可谈空间
                  </h3>
                  <DataTable
                    caption='大客户折扣判断'
                    headers={['供应商', '公开可见线索', '建议谈判点']}
                    rows={discountRows}
                    dense
                  />
                </div>
              </div>
            </Section>

            <Section
              id='architecture'
              eyebrow='05 / Architecture'
              title='中转站架构设计'
              icon={GitBranch}
            >
              <ArchitectureDiagram />
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                  <Zap className='text-primary mb-3 size-5' />
                  <h3 className='font-semibold'>成本路由</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    按模型能力、区域、实时价格、缓存命中率、延迟和错误率动态选择供应商。
                  </p>
                </div>
                <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                  <ShieldCheck className='text-primary mb-3 size-5' />
                  <h3 className='font-semibold'>合规路由</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    客户可配置数据区域、日志留存、供应商黑白名单和敏感业务限制。
                  </p>
                </div>
                <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                  <Activity className='text-primary mb-3 size-5' />
                  <h3 className='font-semibold'>稳定性路由</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    通道探活、熔断、重试、降级模型、告警和客户级 SLA 报表。
                  </p>
                </div>
              </div>
            </Section>

            <Section
              id='plan'
              eyebrow='06 / Plan'
              title='阶段计划与团队分工'
              icon={Users}
            >
              <DataTable
                caption='阶段计划'
                headers={['阶段', '主题', '关键任务', '交付物']}
                rows={planRows}
                dense
              />
              <WorkstreamGrid />
            </Section>

            <Section
              id='finance'
              eyebrow='07 / Finance and Risk'
              title='财务假设与风险控制'
              icon={ShieldCheck}
            >
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                  <p className='text-muted-foreground text-sm'>基础毛利目标</p>
                  <p className='mt-2 text-2xl font-semibold'>15%-35%</p>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    开发者按量业务毛利较薄，企业订阅与私有化服务拉高综合毛利。
                  </p>
                </div>
                <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                  <p className='text-muted-foreground text-sm'>企业客户定价</p>
                  <p className='mt-2 text-2xl font-semibold'>平台费 + 用量</p>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    建议采用月度最低消费、阶梯单价、SLA 等级和专属支持。
                  </p>
                </div>
                <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                  <p className='text-muted-foreground text-sm'>采购策略</p>
                  <p className='mt-2 text-2xl font-semibold'>多供应商成本池</p>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    避免单一供应商调价或限流导致业务中断和毛利塌陷。
                  </p>
                </div>
              </div>
              <DataTable
                caption='主要风险与应对'
                headers={['风险', '等级', '应对策略']}
                rows={riskRows}
              />
            </Section>

            <Section
              id='sources'
              eyebrow='08 / Research Boundary'
              title='资料来源与待补充边界'
              icon={BookOpen}
            >
              <div className='border-border/70 bg-card rounded-lg border p-5 shadow-xs'>
                <p className='text-muted-foreground leading-8'>
                  本页价格信息以 2026-07-07
                  可访问的公开资料为基础，已优先使用阿里云 Model
                  Studio、腾讯云混元、百度千帆、DeepSeek 官方文档等可核验页面。
                  火山引擎方舟、智谱、Kimi、MiniMax、硅基流动等价格与大客户折扣需要继续通过控制台、商务询价或可截图页面补齐。
                  后续应建立价格更新流程：每周抓取公开价，每月向供应商复核企业价，每次调价同步成本路由和客户报价。
                </p>
              </div>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </PublicLayout>
  )
}
