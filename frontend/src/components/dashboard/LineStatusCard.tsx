import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LineHealthData {
  healthScore: number
  events: Array<{ isHealthy: boolean; timestamp: string }>
  lastUpdated: string
}

interface LineDelayData {
  avgDelay: number
  count: number
  delays: Array<{ delay: number; timestamp: string }>
  lastUpdated: string
}

interface LineStatusCardProps {
  line: string
  health: LineHealthData
  delay?: LineDelayData
}

const getLineColor = (line: string) => {
  const colors = {
    BLUE: "border-blue-500",
    GREEN: "border-green-500",
    ORANGE: "border-orange-500"
  }
  return colors[line as keyof typeof colors] || "border-gray-200"
}

const getHealthStatus = (score: number) => {
  if (score >= 90) return { color: "text-green-600", label: "Excellent" }
  if (score >= 75) return { color: "text-blue-600", label: "Good" }
  if (score >= 60) return { color: "text-yellow-600", label: "Fair" }
  return { color: "text-red-600", label: "Poor" }
}

export function LineStatusCard({ line, health, delay }: LineStatusCardProps) {
  return (
    <Card 
      className={cn(
        "border-2",
        getLineColor(line)
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{line} Line</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold">
              {health.healthScore.toFixed(1)}%
            </div>
            <p className={getHealthStatus(health.healthScore).color}>
              {getHealthStatus(health.healthScore).label}
            </p>
          </div>

          {delay && delay.avgDelay > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Average Delay
                </span>
                <span className="font-medium">
                  {delay.avgDelay.toFixed(1)} min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Recent Delays
                </span>
                <span className="font-medium">{delay.count}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}