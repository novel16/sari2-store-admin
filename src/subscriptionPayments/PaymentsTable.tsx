import { Link } from 'react-router-dom'
import { dateTime } from '../platform/format'
import { fulfillmentStatuses, paymentStatuses } from './filters'
import type { SubscriptionPayment } from './types'

const money = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value / 100)
export default function PaymentsTable({ payments }: { payments: SubscriptionPayment[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-xs">
        <thead className="border-y border-slate-100 bg-slate-50/50 text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            {['Account / owner', 'Purchase', 'Payment', 'Activation', 'Dates (PHT)', ''].map(
              (label, index) => (
                <th className="px-5 py-3 font-medium" key={index}>
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="max-w-64 px-5 py-4">
                <Link
                  className="font-semibold text-brand hover:underline"
                  to={`/accounts/${payment.account.id}`}
                >
                  {payment.account.name}
                </Link>
                <p className="mt-1 text-slate-500">{payment.owner.name}</p>
                <p className="mt-1 break-all text-[11px] text-slate-400">{payment.owner.email}</p>
                {payment.account.status !== 'active' && (
                  <p className="mt-2 text-amber-700">Account {payment.account.status}</p>
                )}
              </td>
              <td className="max-w-64 px-5 py-4">
                <p className="font-medium">
                  {payment.plan.name} · {payment.months} month(s)
                </p>
                <p className="mt-1 font-semibold text-brand">{money(payment.amount_centavos)}</p>
                <p className="mt-2 break-all text-[10px] text-slate-400">{payment.id}</p>
              </td>
              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${payment.payment_status === 'paid' ? 'bg-green-50 text-green-800' : payment.payment_status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}
                >
                  {paymentStatuses[payment.payment_status]}
                </span>
              </td>
              <td className="max-w-56 px-5 py-4">
                <p
                  className={
                    payment.fulfillment_status === 'needs_attention'
                      ? 'font-semibold text-amber-800'
                      : 'text-slate-600'
                  }
                >
                  {fulfillmentStatuses[payment.fulfillment_status]}
                </p>
                {payment.issue_code && (
                  <p className="mt-2 break-words text-[10px] text-slate-400">
                    {payment.issue_code}
                  </p>
                )}
                {payment.payment_status === 'paid' &&
                  payment.fulfillment_status !== 'fulfilled' && (
                    <p className="mt-2 text-[10px] text-amber-700">
                      Payment recorded. Avoid a second charge.
                    </p>
                  )}
              </td>
              <td className="px-5 py-4 text-[10px] leading-relaxed text-slate-500">
                <p>Created {dateTime(payment.created_at)}</p>
                {payment.paid_at && <p>Paid {dateTime(payment.paid_at)}</p>}
                {payment.fulfilled_at && <p>Activated {dateTime(payment.fulfilled_at)}</p>}
              </td>
              <td className="px-5 py-4">
                <Link
                  className="btn btn-secondary whitespace-nowrap"
                  to={`/accounts/${payment.account.id}/subscription`}
                >
                  View subscription
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
