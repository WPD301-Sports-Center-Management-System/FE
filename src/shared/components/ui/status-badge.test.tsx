import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge, statusLabel, statusLabels } from './status-badge'

const schemaPath = resolve(__dirname, '../../../../../BE/prisma/migrations/20261108000000_v2_baseline/migration.sql')

describe('StatusBadge', () => {
  it.skipIf(!existsSync(schemaPath))('has a Vietnamese label for every status enum value of the API', () => {
    const schema = readFileSync(schemaPath, 'utf8')
    const values = [...new Set([...schema.matchAll(/CHECK \((?:status|state) IN \(([^)]*)\)\)/g)]
      .flatMap(([, body]) => [...body.matchAll(/'([^']+)'/g)].map(m => m[1])))]
    expect(values.length).toBeGreaterThan(50)
    expect(values.filter((v) => !statusLabels[v])).toEqual([])
  })

  it('reads the same value differently per domain', () => {
    expect(statusLabel('OPEN', 'slot')).toBe('Khung giờ trống')
    expect(statusLabel('OPEN', 'support')).toBe('Mới gửi')
    expect(statusLabel('OPEN')).toBe('Đang mở')
    expect(statusLabel('IN_PROGRESS', 'session')).toBe('Đang tập')
  })

  it('shows unknown values as-is instead of hiding them', () => {
    render(<StatusBadge status="SOMETHING_NEW" />)
    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument()
  })
})
