import { useState } from 'react'
import { Btn, Card } from '@/features/workspace/ui'
import { JourneyMemberPage } from './journey-pages'
export function MemberGoalSummary() { const [open,setOpen]=useState(false); return <Card title="Lộ trình & tiến độ" actions={<Btn onClick={()=>setOpen(!open)}>{open?'Thu gọn':'Xem tiến độ'}</Btn>}>{open?<JourneyMemberPage embedded/>:<p className="text-sm text-text-muted">Theo dõi số đo, mục tiêu và dự kiến cuối lộ trình cùng Coach.</p>}</Card> }
