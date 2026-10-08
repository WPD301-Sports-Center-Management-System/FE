// Centralized Currency & VND Formatting utilities

export function formatVND(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return '0 ₫'
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numeric)) return '0 ₫'

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numeric)
}

export function parseVND(val: string): number {
  const clean = val.replace(/\./g, '').replace(/[^0-9-]+/g, '')
  return parseFloat(clean) || 0
}
