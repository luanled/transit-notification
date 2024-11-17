import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock } from "lucide-react"

interface SystemStatsProps {
  messageCount: number
  status: string
}

export function SystemStats({ messageCount, status }: SystemStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">System Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Messages Processed:
            </span>
            <span className="font-medium">{messageCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className="font-medium">{status}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}