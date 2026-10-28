import { describe, expect, it } from 'vitest'
import { crc16, transferNote, vietQrPayload } from './vietqr'

describe('vietqr', () => {
  it('computes CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1')
  })

  it('builds a NAPAS payload with amount, note and a valid checksum', () => {
    const p = vietQrPayload({ bin: '970436', accountNo: '0071000987654', amount: 120000, note: 'HD-0363 Quầy 01' })
    expect(p.startsWith('000201010212')).toBe(true)
    expect(p).toContain('0010A000000727')
    expect(p).toContain('0006970436')
    expect(p).toContain('0113' + '0071000987654')
    expect(p).toContain('5406120000')
    expect(p).toContain('5802VN')
    expect(p).toContain('0815HD-0363 Quay 01')
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)))
  })

  it('uses a static QR when there is no amount', () => {
    expect(vietQrPayload({ bin: '970436', accountNo: '1' }).slice(10, 12)).toBe('11')
  })

  it('keeps transfer notes ASCII', () => {
    expect(transferNote('Vé gym Đặc biệt #12!')).toBe('Ve gym Dac biet 12')
  })
})
