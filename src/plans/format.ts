export const planMoney = (centavos: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(centavos / 100)
export const statusLabel = (status: string) =>
  ({ draft: 'Draft', published: 'Published', coming_soon: 'Coming soon', retired: 'Retired' })[
    status
  ] ?? status
export function priceCentavos(input: string): number | null {
  if (!/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(input.trim())) return null
  const [pesos, fraction = ''] = input.trim().split('.')
  const value = Number(pesos) * 100 + Number(fraction.padEnd(2, '0'))
  return value <= 100000000 ? value : null
}
