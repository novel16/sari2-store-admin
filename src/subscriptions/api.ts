import { postWithCsrf } from '../api/http'
import type { Activation, PreviewInput, SubscriptionReview } from './types'

export const subscriptionPath = (accountId: number) =>
  `/api/v1/admin/accounts/${accountId}/subscription`

export const previewSubscription = (accountId: number, input: PreviewInput) =>
  postWithCsrf<{ data: SubscriptionReview }>(`${subscriptionPath(accountId)}/preview`, input)

export const confirmSubscription = (accountId: number, quote: string, requestKey: string) =>
  postWithCsrf<{ data: Activation; replayed: boolean }>(
    `${subscriptionPath(accountId)}/activations`,
    { quote, request_key: requestKey },
  )
