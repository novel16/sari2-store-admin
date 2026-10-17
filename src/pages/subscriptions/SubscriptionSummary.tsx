import DetailsGrid from '../../components/DetailsGrid'
import { planMoney } from '../../plans/format'
import { dateTime } from '../../platform/format'
import type { SubscriptionOverview } from '../../subscriptions/types'

export default function SubscriptionSummary({ data }: { data: SubscriptionOverview }) {
  const { current, renewal } = data
  return (
    <section className="panel p-5 sm:p-7">
      <h2 className="mb-5 font-display text-lg font-bold">Current subscription</h2>
      <DetailsGrid
        items={[
          {
            label: 'Plan',
            value: `${current.plan.name} · ${planMoney(current.plan.monthly_price_centavos)}/month`,
          },
          {
            label: 'Active product allowance',
            value: current.plan.active_product_limit?.toLocaleString('en-PH') ?? 'Unlimited',
          },
          {
            label: 'Current period ends',
            value: current.ends_at
              ? dateTime(current.ends_at)
              : current.plan.code === 'free'
                ? 'No expiry on Free'
                : 'No expiry recorded',
          },
          { label: 'Renewal', value: 'Manual · no automatic charges' },
          { label: 'Scheduled periods', value: String(renewal.scheduled_periods) },
          {
            label: 'Next period',
            value: renewal.next_period
              ? `${renewal.next_period.plan.name} starts ${dateTime(renewal.next_period.starts_at)}`
              : 'No renewal scheduled',
          },
        ]}
      />
      {current.plan.code === 'free' && renewal.last_paid_ended_at && (
        <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          The last paid period ended {dateTime(renewal.last_paid_ended_at)}. Free allowances apply;
          store records remain available.
        </p>
      )}
    </section>
  )
}
