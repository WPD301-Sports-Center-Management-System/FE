import { describe, it, expect } from 'vitest'
import { isBeforeCutoff } from './date'

describe('4-Hour PT Cancellation Cutoff Rule', () => {
  it('returns true when appointment is at least 4 hours in the future (Early cancellation eligible for refund/makeup)', () => {
    // 5 hours from now
    const fiveHoursFromNow = new Date(Date.now() + 5 * 3600 * 1000).toISOString()
    expect(isBeforeCutoff(fiveHoursFromNow, 4)).toBe(true)
  })

  it('returns false when appointment is less than 4 hours in the future (Late cancellation, credit consumed)', () => {
    // 2 hours from now
    const twoHoursFromNow = new Date(Date.now() + 2 * 3600 * 1000).toISOString()
    expect(isBeforeCutoff(twoHoursFromNow, 4)).toBe(false)
  })

  it('returns false when appointment is in the past', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 3600 * 1000).toISOString()
    expect(isBeforeCutoff(oneHourAgo, 4)).toBe(false)
  })
})
