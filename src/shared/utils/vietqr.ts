// VietQR (NAPAS 247) payload, built locally per the EMVCo merchant-presented QR format.
// Any Vietnamese banking app can scan it to prefill bank, account, amount and transfer note.

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as required by EMVCo field 63. */
export function crc16(input: string) {
  let crc = 0xffff
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Transfer notes must stay ASCII and short for bank apps: strip accents and odd symbols. */
export function transferNote(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50)
}

export function vietQrPayload({ bin, accountNo, amount, note }: { bin: string; accountNo: string; amount?: number; note?: string }) {
  const beneficiary = field('00', bin) + field('01', accountNo)
  const merchant = field('00', 'A000000727') + field('01', beneficiary) + field('02', 'QRIBFTTA')
  let payload = field('00', '01') + field('01', amount ? '12' : '11') + field('38', merchant) + field('53', '704')
  if (amount) payload += field('54', String(Math.round(amount)))
  payload += field('58', 'VN')
  if (note) payload += field('62', field('08', transferNote(note)))
  payload += '6304'
  return payload + crc16(payload)
}
