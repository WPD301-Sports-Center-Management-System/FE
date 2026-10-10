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
