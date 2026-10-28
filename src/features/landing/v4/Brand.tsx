import { Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'

// ApexFIT logo: dumbbell mark + condensed wordmark.
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="ApexFIT – Trang chủ">
      <span className="brand-icon" aria-hidden="true">
        <Dumbbell strokeWidth={2.4} />
      </span>
      APEX<span className="brand-light">FIT</span>
    </Link>
  )
}
