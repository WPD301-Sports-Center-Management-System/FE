import { TabbedPage } from '@/features/workspace/tabbed-page'
import { ReconciliationPage } from '@/features/fixed-pt/pages/reconciliation-page'
import { DeskPaymentsPage } from './desk-payments-page'
import { DeskPtCalendarPage } from './desk-pt-calendar-page'
import { DeskScheduleChangesPage } from './desk-schedule-changes-page'
import { useAuth } from '@/features/auth/context/auth-context'
import { RefundsPanel } from '@/features/fixed-pt/pages/refunds-panel'
import { PageHeader } from '@/features/workspace/ui'

// Pages that serve one job are tabs of one menu item; each tab keeps its own header with live figures.

/** PT at the desk: this week's sessions (arrival) and schedule changes waiting for the Member. */
export function DeskPtHubPage() {
  return <TabbedPage bare title="Lịch PT" tabs={[
    { key: 'calendar', label: 'Lịch & điểm danh', render: () => <DeskPtCalendarPage /> },
    { key: 'changes', label: 'Đổi lịch & học bù', render: () => <DeskScheduleChangesPage /> },
  ]} />
}

/** Money received: transactions/invoices, and receipts that could not be applied to an order. */
export function PaymentsHubPage() {
  const { user } = useAuth()
  return <TabbedPage bare title="Thanh toán" tabs={[
    { key: 'payments', label: 'Giao dịch & hóa đơn', render: () => <DeskPaymentsPage /> },
    { key: 'reconciliation', label: 'Đối soát tiền nhận', render: () => <ReconciliationPage /> },
    ...(user?.role === 'MANAGER' ? [{ key: 'refunds', label: 'Hoàn tiền PT', render: () => <div><PageHeader title="Hoàn tiền PT" /><RefundsPanel /></div> }] : []),
  ]} />
}
