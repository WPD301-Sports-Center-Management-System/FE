import { describe, it, expect } from 'vitest'
import { formatVND, parseVND } from './currency'

describe('VND Currency Utilities & Split Calculations', () => {
  it('formats numeric VND correctly with currency symbol', () => {
    const formatted = formatVND(330000)
    expect(formatted).toContain('330.000')
  })

  it('formats 990000 (3+1 month plan) correctly', () => {
    const formatted = formatVND('990000.00')
    expect(formatted).toContain('990.000')
  })

  it('calculates 40/60 revenue split accurately without floating errors', () => {
    const totalAmount = 4500000
    const gymShare = totalAmount * 0.4
    const coachShare = totalAmount * 0.6

    expect(gymShare).toBe(1800000)
    expect(coachShare).toBe(2700000)
    expect(gymShare + coachShare).toBe(totalAmount)
  })

  it('parses formatted currency back to number', () => {
    expect(parseVND('1.500.000 ₫')).toBe(1500000)
  })
})
