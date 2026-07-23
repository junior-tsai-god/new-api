/*
Copyright (C) 2025 QuantumNous

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

import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Tag } from '@douyinfe/semi-ui';

const summaryCards = [
  {
    title: '核心机会',
    value: '跨区域模型价格差与交付复杂度',
    text: '围绕中国大陆、北美、东南亚的供应商价格、结算币种、合规和稳定性差异，提供统一接入、路由、账单和 SLA 能力。',
  },
  {
    title: '目标客户',
    value: '出海团队、AI 应用、集成商',
    text: '重点服务既需要国内模型能力，又要覆盖海外用户体验的 B 端客户，包括 SaaS、客服、营销、教育、开发者工具和系统集成商。',
  },
  {
    title: '收入模型',
    value: '价差套利 + 托管服务费',
    text: '基础模式是 API 调用差价；进阶模式叠加模型路由、用量风控、账单托管、企业私有化和采购代谈。',
  },
];

const supplierRows = [
  [
    '阿里云百炼/通义千问',
    '国内与海外均有区域价，可做价格差与资源池对比',
    '重点核验北美、国内、新加坡同模型价格和企业折扣',
  ],
  [
    '火山方舟/豆包',
    '国内模型生态强，企业销售体系成熟',
    '重点核验批量采购、承诺消费、AI Coding 套餐限制',
  ],
  [
    '腾讯云混元',
    '企业客户资源强，人民币计费模型明确',
    '适合纳入国内主力备选与行业客户谈判样本',
  ],
  [
    '百度千帆/文心',
    '国内云厂商完整方案，适合政企场景',
    '关注私有化、行业合规和专属资源报价',
  ],
  [
    'DeepSeek 官方/API 平台',
    '价格具备市场锚点意义，适合作为低价基准',
    '关注峰谷价格、并发、稳定性和转售限制',
  ],
  [
    '智谱、月之暗面、MiniMax、阶跃星辰',
    '补齐国产模型供给丰富度',
    '用于模型矩阵、冗余路由和场景化推荐',
  ],
];

const alibabaRows = [
  [
    'qwen3.7-max Global',
    '北京/美东弗吉尼亚',
    '$1.65 / 百万输入 token',
    '$4.951 / 百万输出 token',
    '同一 Global 价，适合做基础锚点',
  ],
  [
    'qwen3.7-max-us',
    '美国专属',
    '$2.50 / 百万输入 token',
    '$7.50 / 百万输出 token',
    '较 Global 约高 51.5%',
  ],
  [
    'qwen3.7-max International',
    '新加坡',
    '$2.50 / 百万输入 token',
    '$7.50 / 百万输出 token',
    '可用于东南亚独立池定价',
  ],
];

const verifiedPriceRows = [
  [
    '腾讯云 Hunyuan-a13b',
    '0.5 RMB / 百万输入 token',
    '2 RMB / 百万输出 token',
    '国内人民币低价基础模型样本',
  ],
  [
    '腾讯云 Hunyuan-role',
    '2.4 RMB / 百万输入 token',
    '9.6 RMB / 百万输出 token',
    '角色/垂类模型样本',
  ],
  [
    'DeepSeek-V4 Flash',
    '0.45 RMB / 百万输入 token',
    '1.8 RMB / 百万输出 token',
    '低价通用路由候选',
  ],
  [
    'DeepSeek-V4 Pro',
    '0.9 RMB / 百万输入 token',
    '3.6 RMB / 百万输出 token',
    '高质量低成本对照样本',
  ],
  [
    '百度 ERNIE 系列',
    '需按控制台最新价格确认',
    '需按控制台最新价格确认',
    '重点采集折扣、区域和 QPS',
  ],
];

const businessModels = [
  {
    title: '区域价差中转',
    text: '以中国大陆模型资源为主采购池，面向海外或跨境应用提供统一 API；收益来自采购价与销售价之间的差额。',
  },
  {
    title: '企业用量托管',
    text: '为客户管理多供应商 Key、预算、子账号、配额、告警和账单；按月收 SaaS 服务费或按用量抽成。',
  },
  {
    title: '智能路由与降本',
    text: '按模型质量、价格、延迟、可用性自动切换；向客户销售“同等体验下的成本优化”能力。',
  },
  {
    title: '大客户采购代理',
    text: '代表有稳定调用量的客户谈承诺消费、阶梯折扣和专属并发；收益来自返点、服务费或价差。',
  },
];

const architectureRows = [
  ['入口层', '统一 OpenAI-compatible API、鉴权、限流、用户/项目隔离'],
  ['路由层', '按地区、价格、延迟、模型能力、余额、失败率做动态选择'],
  ['供应商适配层', '阿里云、火山、腾讯、百度、DeepSeek 等渠道适配和降级'],
  ['计费层', 'token 标准化、汇率换算、供应商成本入账、客户侧价格表'],
  ['运营层', '用量看板、毛利分析、异常告警、供应商 SLA 与折扣台账'],
];

const planRows = [
  [
    '第 1 周',
    '补齐供应商价格、服务条款、折扣口径和转售限制',
    '价格矩阵、风险清单、可谈判供应商名单',
  ],
  [
    '第 2 周',
    '完成中转站商业架构、目标客户画像、定价模型',
    'BP 初稿、单位经济模型、MVP 范围',
  ],
  [
    '第 3-4 周',
    '实现区域路由、成本记录、渠道健康检查和报价工具',
    '可演示 MVP、内部成本看板',
  ],
  [
    '第 5-8 周',
    '试点客户接入、采购谈判、SLA 与账单流程固化',
    '试点合同、采购折扣、正式版 BP',
  ],
];

const researchItems = [
  '同模型在中国大陆、北美、新加坡/东南亚的实时官方价格截图。',
  '大客户折扣口径：承诺消费、预付费、阶梯量、专属资源池、并发/QPS 包。',
  '服务条款：是否允许 API 转售、中转、代调用、海外客户服务和数据跨境。',
  '稳定性指标：区域可用性、限流策略、错误率、上下文长度、流式支持。',
  '结算因素：币种、税费、发票、汇率风险、充值折扣和退款规则。',
];

const Section = ({ eyebrow, title, children }) => (
  <section className='space-y-5'>
    <div>
      {eyebrow && (
        <div className='text-sm font-semibold text-semi-color-primary mb-2'>
          {eyebrow}
        </div>
      )}
      <h2 className='text-2xl md:text-3xl font-bold text-semi-color-text-0'>
        {title}
      </h2>
    </div>
    {children}
  </section>
);

const DataTable = ({ columns, rows }) => (
  <div className='overflow-x-auto rounded-lg border border-semi-color-border bg-semi-color-bg-1'>
    <table className='w-full min-w-[760px] border-collapse text-left text-sm'>
      <thead>
        <tr className='border-b border-semi-color-border bg-semi-color-fill-0'>
          {columns.map((column) => (
            <th
              key={column}
              className='px-4 py-3 font-semibold text-semi-color-text-0'
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.join('|')}
            className='border-b border-semi-color-border last:border-b-0'
          >
            {row.map((cell, index) => (
              <td
                key={`${row[0]}-${index}`}
                className='px-4 py-3 align-top text-semi-color-text-1'
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Docs = () => (
  <div className='classic-page-fill min-h-screen bg-semi-color-bg-0 text-semi-color-text-0'>
    <div className='border-b border-semi-color-border bg-semi-color-bg-1'>
      <div className='max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-10'>
        <div className='mb-8'>
          <Link to='/'>
            <Button theme='borderless'>返回首页</Button>
          </Link>
        </div>
        <div className='flex flex-wrap items-center gap-2 mb-5'>
          <Tag color='blue' shape='circle'>
            商业计划书
          </Tag>
          <Tag color='green' shape='circle'>
            AI API 中转站
          </Tag>
          <Tag color='orange' shape='circle'>
            最后更新：2026-07-07
          </Tag>
        </div>
        <h1 className='text-4xl md:text-5xl font-bold leading-tight max-w-4xl'>
          AI API 中转站商业计划书
        </h1>
        <p className='mt-5 max-w-3xl text-base md:text-lg leading-8 text-semi-color-text-1'>
          本计划书聚焦中国大陆模型服务与北美、东南亚等海外区域之间的价格差、资源差和交付差，
          将现有网关能力包装为可销售的企业级模型服务中转站。
        </p>
      </div>
    </div>

    <main className='max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-14'>
      <Section eyebrow='01 / Executive Summary' title='项目定位'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className='rounded-lg border border-semi-color-border bg-semi-color-bg-1 p-5'
            >
              <div className='text-sm font-semibold text-semi-color-primary'>
                {card.title}
              </div>
              <h3 className='mt-3 text-xl font-bold text-semi-color-text-0'>
                {card.value}
              </h3>
              <p className='mt-3 text-sm leading-7 text-semi-color-text-1'>
                {card.text}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow='02 / Market Research' title='中国模型供应商调研框架'>
        <DataTable
          columns={['供应商', '商业判断', '下一步重点']}
          rows={supplierRows}
        />
      </Section>

      <Section eyebrow='03 / Price Gap' title='已整理的价格差样本'>
        <div className='space-y-6'>
          <DataTable
            columns={['阿里云样本', '区域', '输入价', '输出价', '判断']}
            rows={alibabaRows}
          />
          <DataTable
            columns={['供应商/模型', '输入价', '输出价', '判断']}
            rows={verifiedPriceRows}
          />
        </div>
        <p className='text-sm leading-7 text-semi-color-text-2'>
          注：价格会随供应商版本、区域、活动和阶梯折扣变化。正式对外报价前，需要用本地
          Codex/CUA 采集官方控制台截图、服务条款和企业销售回复。
        </p>
      </Section>

      <Section eyebrow='04 / Business Model' title='建议优先验证的商业模式'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {businessModels.map((model) => (
            <article
              key={model.title}
              className='rounded-lg border border-semi-color-border bg-semi-color-bg-1 p-5'
            >
              <h3 className='text-lg font-bold text-semi-color-text-0'>
                {model.title}
              </h3>
              <p className='mt-3 text-sm leading-7 text-semi-color-text-1'>
                {model.text}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow='05 / Architecture' title='中转站架构设计'>
        <DataTable columns={['层级', '职责']} rows={architectureRows} />
      </Section>

      <Section eyebrow='06 / Work Plan' title='阶段计划与分工'>
        <DataTable columns={['阶段', '主要工作', '交付物']} rows={planRows} />
      </Section>

      <Section
        eyebrow='07 / Research Checklist'
        title='还需要本地检索确认的信息'
      >
        <div className='rounded-lg border border-semi-color-border bg-semi-color-bg-1 p-5'>
          <ul className='space-y-3 text-sm leading-7 text-semi-color-text-1'>
            {researchItems.map((item) => (
              <li key={item} className='flex gap-3'>
                <span className='mt-2 h-2 w-2 flex-none rounded-full bg-semi-color-primary'></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </main>
  </div>
);

export default Docs;
