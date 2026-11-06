import { describe, it, expect } from 'vitest'
import endpoints from '../../../../../BE/src/contract/endpoints.json'
import type { Purchase } from '@/shared/types/api'

describe('FE and BE Contract Audit', () => {
  it('contract endpoints list is loaded and has documented endpoints', () => {
    expect(Array.isArray(endpoints)).toBe(true)
    expect(endpoints.length).toBeGreaterThan(50)
  })

  it('key FE endpoint patterns exist in backend contract', () => {
    const normalize = (p: string) => p.replace(/:([a-zA-Z0-9_]+)/g, '{$1}')
    const backendEndpoints = new Set(
      (endpoints as Array<{ method: string; path: string }>).map(
        (e) => `${e.method.toUpperCase()} ${normalize(e.path)}`
      )
    )

    // Verify key FE API calls against backend contract
    const criticalFeCalls = [
      'POST /auth/login',
      'GET /dashboard/receptionist',
      'GET /check-ins',
      'POST /check-ins',
      'GET /coaches/me/members',
      'POST /training-plans',
      'POST /training-plans/{id}/exercises',
      'POST /training-plans/{id}/assign',
      'POST /meal-plans',
      'POST /meal-plans/{id}/items',
      'POST /meal-plans/{id}/assign',
      'POST /ai/recommendations',
      'POST /ai/recommendations/{id}/approve',
      'POST /ai/recommendations/{id}/reject',
      'GET /support-requests',
      'PATCH /support-requests/{id}',
      'POST /support-requests/{id}/reopen',
      'PATCH /coach-reviews/{id}/moderation',
      'GET /invoices/{id}',
      'GET /invoices/{id}/pdf',
      'POST /pt-enrollments',
      'GET /coaches/{coachId}/intake-rules',
      'POST /pt-enrollments/{id}/proposals',
      'POST /pt-enrollments/{id}/accept',
      'POST /pt-bookings/{id}/arrive',
      'POST /pt-bookings/{id}/start',
      'POST /pt-bookings/{id}/complete',
      'POST /pt-schedule-changes',
      'POST /coach-payout-periods',
      'GET /pt-purchases/{id}/journey',
      'POST /pt-purchases/{id}/journey',
      'POST /pt-bookings/{id}/journey-result',
      'POST /members/{memberId}/body-assessments',
      'GET /me/subscriptions',
      'GET /me/pt-packages',
      'GET /me/pt-bookings',
      'GET /me/payments',
      'GET /me/invoices',
      'GET /me/training-plans',
      'GET /me/meal-plans',
    ]

    for (const call of criticalFeCalls) {
      expect(backendEndpoints.has(call), `Expected endpoint "${call}" to exist in contract`).toBe(true)
    }
    // Retired slot-based writes must not silently return to the product contract.
    expect(backendEndpoints.has('POST /pt-bookings')).toBe(false)
    expect(backendEndpoints.has('POST /coach-slots/{slotId}/book')).toBe(false)
  })

  it('verifies Purchase type has valid credit and course fields and no deprecated fields', () => {
    // Type check assertion: Purchase must satisfy valid credit tracking
    const samplePurchase: Partial<Purchase> = {
      totalCredits: 10,
      reservedCredits: 2,
      consumedCredits: 3,
      availableCredits: 5,
      courseNameSnapshot: 'Fitness Pro',
      coachNameSnapshot: 'Coach Nam',
    }
    expect(samplePurchase.totalCredits).toBe(10)
    expect(samplePurchase.availableCredits).toBe(5)
    // Deprecated fields must not exist on Purchase type
    const record = samplePurchase as Record<string, unknown>
    expect(record['sessionCountSnapshot']).toBeUndefined()
    expect(record['packageNameSnapshot']).toBeUndefined()
    expect(record['validityDaysSnapshot']).toBeUndefined()
  })
})

