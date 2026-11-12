import { ApplicationsPanel } from '@/features/fixed-pt/pages/application-page'
import { PageHeader, LinkBtn } from '@/features/workspace/ui'
import { useMgrShell } from '../shell'
import { CoachTierPanel } from '../components/coach-tier-panel'
export function MgrApprovalsPage() {
  const { refresh } = useMgrShell()
  return <div className="space-y-5"><PageHeader title="Hồ sơ Coach" actions={<LinkBtn to="/manager/pt-packages">Quản lý gói trung tâm</LinkBtn>} /><CoachTierPanel /><ApplicationsPanel onChange={refresh} /></div>
}
