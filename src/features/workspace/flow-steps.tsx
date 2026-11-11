import { Check } from 'lucide-react'
export function FlowSteps({ steps, current, label = 'Tiến trình' }: { steps: string[]; current: number; label?: string }) {
  return <ol aria-label={label} className="flex flex-wrap gap-x-4 gap-y-2 text-sm">{steps.map((step, i) => <li key={step} aria-current={i === current ? 'step' : undefined} className={i === current ? 'font-semibold text-text-primary' : 'text-text-muted'}>{i < current && <Check aria-hidden className="mr-1 inline h-3.5 w-3.5" />}{step}{i < steps.length - 1 && <span aria-hidden className="ml-4">→</span>}</li>)}</ol>
}
