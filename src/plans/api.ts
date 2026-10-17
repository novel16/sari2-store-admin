import { writeWithCsrf } from '../api/http'
import type { Plan, PlanInput } from './types'
export function savePlan(input: PlanInput, id?: number) {
  return writeWithCsrf<{ data: Plan }>(
    id ? 'patch' : 'post',
    `/api/v1/admin/plans${id ? `/${id}` : ''}`,
    input,
  )
}
