export interface ManagerDashboardRevenue {
  membershipRevenue: number
  ptGross: number
  ptGymShare: number
  coachPayable: number
  coachPending: number
  paymentCount: number
}

export interface ManagerDashboardData {
  members: number
  coaches: number
  revenue: ManagerDashboardRevenue
  bookingsToday: number
  equipmentIssues: number
}

export interface ReceptionistDashboardData {
  checkinsToday: number
  /** Members currently inside the gym (open visits). */
  insideGym: number
  pendingPayments: number
  expiringSubscriptions: number
  activeMembers: number
  ptSessionsToday: number
  openSupportRequests: number
}

export interface CoachDashboardData {
  todayBookings: number
  openSlots: number
  activeMembers: number
}

export interface MemberDashboardData {
  membership: any | null
  packages: any[]
  upcomingBookings: any[]
}


