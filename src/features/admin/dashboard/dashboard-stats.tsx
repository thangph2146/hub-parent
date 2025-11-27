import { getDashboardStats } from "./server/queries"
import { DashboardStatsClient } from "./dashboard-stats.client"

export async function DashboardStats() {
  const stats = await getDashboardStats()
  return <DashboardStatsClient stats={stats} />
}
