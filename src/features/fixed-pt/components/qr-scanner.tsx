import { useEffect, useRef, useState } from 'react'
import { hybridSend } from '../hybrid-api'
import { useSubmit } from '../hooks'
import { Panel, Field, inputCls, ErrorBanner, Notice } from './ui'
import { Btn } from '@/features/workspace/ui'
type Detector = { detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
export function QrScanner({ onDone }: { onDone: (message: string) => void }) {
  const video = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null), running = useRef(false)
  const [camera, setCamera] = useState(false), [code, setCode] = useState(''), [message, setMessage] = useState('')
  const act = useSubmit()
  const stop = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setCamera(false) }
  useEffect(() => () => { stream.current?.getTracks().forEach(t => t.stop()) }, [])
  const scan = async (value: string) => {
    const result = await hybridSend<{ action: string }>('post', '/check-ins/scan', /^\d{6}$/.test(value.trim()) ? { code: value.trim() } : { token: value.trim() })
    const text = result.action === 'IN' ? 'Đã check-in vào gym và ghi đến buổi PT nếu trong cửa sổ cho phép.' : 'Đã check-out khỏi gym.'
    setMessage(text); onDone(text); setCode(''); stop()
  }
  useEffect(() => {
    if (!camera) return
    const Constructor = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => Detector }).BarcodeDetector
    if (!Constructor) return
    const detector = new Constructor({ formats: ['qr_code'] })
    const timer = setInterval(async () => {
      if (running.current || !video.current || video.current.readyState < 2) return
      running.current = true
      try { const hits = await detector.detect(video.current); if (hits[0]) await act.run(() => scan(hits[0].rawValue)) } catch { setMessage('Không đọc được QR. Giữ mã trong khung hoặc nhập mã dự phòng.') } finally { running.current = false }
    }, 700)
    return () => clearInterval(timer)
  }, [camera])
  return <Panel title="Quét QR vào / ra"><ErrorBanner message={act.error} />{message && <Notice>{message}</Notice>}<p className="mb-3 text-sm">Mỗi mã chỉ dùng một lần. Hội viên tạo mã mới khi ra gym.</p>
    <video className={camera ? 'mb-3 max-h-64 w-full rounded-xl bg-black' : 'hidden'} ref={video} autoPlay muted playsInline />
    <div className="mb-3 flex gap-2"><Btn busy={act.busy} onClick={() => void act.run(async () => {
      if (!('BarcodeDetector' in window)) throw new Error('Trình duyệt chưa hỗ trợ camera quét QR. Nhập mã 6 số dự phòng hoặc dùng Chrome có hỗ trợ quét mã.')
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); setCamera(true)
      if (video.current) { video.current.srcObject = stream.current; await video.current.play() }
    })}>Mở camera</Btn>{camera && <Btn onClick={stop}>Đóng camera</Btn>}</div>
    <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); void act.run(() => scan(code)) }}><Field label="Mã 6 số dự phòng"><input className={inputCls} autoComplete="off" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} /></Field><Btn type="submit" busy={act.busy}>Xác nhận quét</Btn></form>
  </Panel>
}
