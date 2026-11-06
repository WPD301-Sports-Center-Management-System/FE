import { useContext, useEffect } from 'react'
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom'
import { Modal } from './modal'
import { Button } from './button'

/** Keep route/tab changes from silently discarding an unfinished editor. */
export function UnsavedChanges({ dirty, busy = false }: { dirty: boolean; busy?: boolean }) {
  const dataRouter = useContext(UNSAFE_DataRouterContext)
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  return dataRouter ? <RouteGuard dirty={dirty} busy={busy} /> : null
}
function RouteGuard({ dirty, busy }: { dirty: boolean; busy: boolean }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search))
  return <Modal isOpen={blocker.state === 'blocked'} onClose={() => { if (blocker.state === 'blocked') blocker.reset() }} title="Bạn còn nội dung chưa lưu" description={busy ? 'Đang lưu dữ liệu. Vui lòng chờ kết quả trước khi rời trang.' : 'Lưu bản nháp để giữ nội dung, hoặc chọn rời trang và bỏ phần chưa lưu.'}>
    <div className="flex flex-wrap justify-end gap-3"><Button variant="outline" onClick={() => { if (blocker.state === 'blocked') blocker.reset() }}>Ở lại để lưu</Button><Button variant="danger" disabled={busy} onClick={() => { if (blocker.state === 'blocked') blocker.proceed() }}>Rời trang, bỏ phần chưa lưu</Button></div>
  </Modal>
}
