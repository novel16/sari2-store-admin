import { fulfillmentStatuses, paymentStatuses } from './filters'
import type { PaymentFilters } from './types'

export default function PaymentControls({
  filters,
  onChange,
  onReset,
}: {
  filters: PaymentFilters
  onChange: (key: keyof PaymentFilters, value: string) => void
  onReset: () => void
}) {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]">
      <label className="text-xs font-medium text-slate-600">
        Search payments
        <input
          className="input mt-2 w-full"
          maxLength={100}
          value={filters.q}
          onChange={(event) => onChange('q', event.target.value)}
          placeholder="Account, owner, email, or order reference"
        />
      </label>
      <label className="text-xs font-medium text-slate-600">
        Payment status
        <select
          className="input mt-2 w-full"
          value={filters.payment_status}
          onChange={(event) => onChange('payment_status', event.target.value)}
        >
          {Object.entries(paymentStatuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-600">
        Activation status
        <select
          className="input mt-2 w-full"
          value={filters.fulfillment_status}
          onChange={(event) => onChange('fulfillment_status', event.target.value)}
        >
          {Object.entries(fulfillmentStatuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button className="btn btn-secondary self-end" onClick={onReset}>
        Reset filters
      </button>
    </div>
  )
}
