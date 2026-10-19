import { pageNumber } from '../platform/directory'
import type { PaymentFilters } from './types'

export const paymentStatuses = {
  all: 'All payments',
  creating: 'Creating checkout',
  pending: 'Awaiting payment',
  unknown: 'Checking provider',
  paid: 'Paid',
  expired: 'Expired',
  failed: 'Failed',
} as const
export const fulfillmentStatuses = {
  all: 'All activations',
  pending: 'Processing',
  fulfilled: 'Activated',
  needs_attention: 'Needs attention',
} as const
export function readPaymentFilters(params: URLSearchParams): PaymentFilters {
  const payment = params.get('payment_status'),
    fulfillment = params.get('fulfillment_status')
  return {
    q: params.get('q') ?? '',
    payment_status:
      payment && Object.hasOwn(paymentStatuses, payment)
        ? (payment as PaymentFilters['payment_status'])
        : 'all',
    fulfillment_status:
      fulfillment && Object.hasOwn(fulfillmentStatuses, fulfillment)
        ? (fulfillment as PaymentFilters['fulfillment_status'])
        : 'all',
    page: pageNumber(params.get('page')),
  }
}
export const paymentsPath = (filters: PaymentFilters) =>
  `/api/v1/admin/subscription-payments?${new URLSearchParams({ q: filters.q.trim(), payment_status: filters.payment_status, fulfillment_status: filters.fulfillment_status, page: String(filters.page), per_page: '20' })}`
