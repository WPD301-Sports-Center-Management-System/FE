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
  pendingPayments: number
  expiringSubscriptions: number
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


