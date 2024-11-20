"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Label, Pie, PieChart } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface LineHealthData {
  healthScore: number
  events: Array<{
    eventId: string
    type: string
    timestamp: string
  }>
  lastUpdated: string
}

interface LineDelayData {
  avgDelay: number
  count: number
  delays: Array<{ delay: number; timestamp: string }>
  lastUpdated: string
}

interface LineCancelData {
  count: number
  cancellations: Array<{ timestamp: string, reason: string }>
  lastCancellation: string
}

interface LineStatusCardProps {
  line: string
  health: LineHealthData
  delay?: LineDelayData
  cancellations?: LineCancelData
}

const chartConfig = {
  events: {
    label: "Events",
  },
  ARRIVAL: {
    label: "Arrivals",
    color: "hsl(var(--chart-1))",
  },
  DEPARTURE: {
    label: "Departures",
    color: "hsl(var(--chart-2))",
  },
  DELAY: {
    label: "Delays",
    color: "hsl(var(--chart-3))",
  },
  CANCELLATION: {
    label: "Cancellations",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function LineStatusCard({ line, health, delay, cancellations }: LineStatusCardProps) {
  // Calculate event counts
  const eventCounts = health.events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { type: 'ARRIVAL', events: eventCounts['ARRIVAL'] || 0, fill: chartConfig.ARRIVAL.color },
    { type: 'DEPARTURE', events: eventCounts['DEPARTURE'] || 0, fill: chartConfig.DEPARTURE.color },
    { type: 'DELAY', events: eventCounts['DELAY'] || 0, fill: chartConfig.DELAY.color },
    { type: 'CANCELLATION', events: eventCounts['CANCELLATION'] || 0, fill: chartConfig.CANCELLATION.color }
  ].filter(item => item.events > 0);

  const totalEvents = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.events, 0)
  }, [chartData]);

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { color: "text-green-600", label: "Excellent" }
    if (score >= 75) return { color: "text-blue-600", label: "Good" }
    if (score >= 60) return { color: "text-yellow-600", label: "Fair" }
    return { color: "text-red-600", label: "Poor" }
  }

  return (
    <Card
      className={cn(
        "border-2",
        line === 'BLUE' && "border-blue-500",
        line === 'GREEN' && "border-green-500",
        line === 'ORANGE' && "border-orange-500"
      )}
    >
      <div className="grid grid-cols-2">
        <div>
          <CardHeader className="pb-0">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">{line} Line</CardTitle>
              <div className="text-2xl font-bold">
                {health.healthScore.toFixed(1)}%
              </div>
              <p className={getHealthStatus(health.healthScore).color}>
                {getHealthStatus(health.healthScore).label}
              </p>
            </div>
          </CardHeader>

          <CardContent className="pb-0">
            <div className="space-y-2">
              {delay && delay.avgDelay > 0 && (
                <div className="space-y-4 pt-2 border-t">
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

              {cancellations && cancellations.count > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Recent Cancellations
                    </span>
                    <span className="font-medium text-red-600">
                      {cancellations.count}
                    </span>
                  </div>
                  <div></div>
                  <div></div>
                </div>
              )}
            </div>
          </CardContent>
        </div>

        <div className="flex items-center">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[180px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="events"
                nameKey="type"
                innerRadius="45%"
                outerRadius="80%"
                strokeWidth={1}
                cornerRadius={2}
                paddingAngle={1}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {totalEvents.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-xs"
                          >
                            Events
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </Card>
  )
}