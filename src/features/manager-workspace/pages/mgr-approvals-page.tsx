import { ApplicationsPanel } from '@/features/fixed-pt/pages/application-page'
import { PageHeader, LinkBtn } from '@/features/workspace/ui'
import { FlowSteps } from '@/features/workspace/flow-steps'
import { useMgrShell } from '../shell'
import { CoachTierPanel } from '../components/coach-tier-panel'
export function MgrApprovalsPage() {
  const { refresh } = useMgrShell()
  return <div className="space-y-5"><PageHeader title="Hồ sơ Coach" subtitle="Duyệt năng lực và thiết lập bậc giá Coach." actions={<LinkBtn to="/manager/pt-packages">Quản lý gói trung tâm</LinkBtn>} /><FlowSteps steps={['Coach nộp hồ sơ', 'Manager duyệt và chọn bậc', 'Coach mở giờ, nhận học viên']} current={1} /><CoachTierPanel /><ApplicationsPanel onChange={refresh} /></div>
}
