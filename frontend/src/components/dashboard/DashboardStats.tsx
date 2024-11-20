import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, LineChart, CircleOff, XCircle } from "lucide-react"

interface DashboardStatsProps {
  analytics: {
    delaysByLine: Record<string, {
      count: number
    }>,
    cancelsByLine: Record<string, {
      count: number
    }>,
    serviceHealth: Record<string, {
      healthScore: number
      events: Array<{ 
        eventId: string
        type: string
        timestamp: string 
      }>
      lastUpdated: string
    }>
  }
}

export function DashboardStats({ analytics }: DashboardStatsProps) {
  // Calculate total events (all events from serviceHealth)
  const totalEvents = Object.values(analytics.serviceHealth).reduce(
    (sum, line) => sum + line.events.length,
    0
  )

  // Calculate total delays
  const totalDelays = Object.values(analytics.delaysByLine).reduce(
    (sum, line) => sum + line.count,
    0
  )

  // Calculate total cancellations
  const totalCancellations = Object.values(analytics.cancelsByLine).reduce(
    (sum, line) => sum + line.count,
    0
  )

  // Calculate total incidents (delays + cancellations)
  const totalIncidents = totalDelays + totalCancellations;

  // Calculate overall system health using the formula
  const overallHealth = totalEvents > 0 
    ? (1 - (totalIncidents / totalEvents)) * 100
    : 100;

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Event Volume</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEvents || 0}</div>
          <p className="text-xs text-muted-foreground">
            All events (arrivals, departures, delays, cancellations)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Delays</CardTitle>
          <CircleOff className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDelays || 0}</div>
          <p className="text-xs text-muted-foreground">
            Total delay events across all lines
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cancellations</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCancellations || 0}</div>
          <p className="text-xs text-muted-foreground">
            Total cancellations across all lines
          </p>
        </CardContent>
      </Card>
    </div>
  )
}