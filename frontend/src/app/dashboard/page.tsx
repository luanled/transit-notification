"use client"

import { useEffect, useState } from "react"
import { LineStatusCard } from "@/components/dashboard/LineStatusCard"
import { IncidentsList } from "@/components/dashboard/IncidentsList"
import { SystemStats } from "@/components/dashboard/SystemStats"

interface Analytics {
  timestamp: string
  messageCount: number
  analytics: {
    delaysByLine: Record<string, {
      avgDelay: number
      count: number
      delays: Array<{ delay: number; timestamp: string }>
      lastUpdated: string
    }>
    incidentsByStop: Record<string, {
      count: number
      incidents: Array<{ type: string; timestamp: string }>
      lastIncident: string
    }>
    serviceHealth: Record<string, {
      healthScore: number
      events: Array<{ isHealthy: boolean; timestamp: string }>
      lastUpdated: string
    }>
  }
  status: string
  consumingTopics: string[]
}

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3000/api/analytics/stream');

    eventSource.onmessage = (event) => {
      try {
        const analyticsData = JSON.parse(event.data);
        setData(analyticsData);
        setLoading(false);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setError('Failed to connect to server');
      setLoading(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data?.analytics) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transit Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(data.analytics.serviceHealth).map(([line, health]) => (
          <LineStatusCard
            key={line}
            line={line}
            health={health}
            delay={data.analytics.delaysByLine[line]}
          />
        ))}
      </div>

      <IncidentsList incidents={data.analytics.incidentsByStop} />
      
      <SystemStats 
        messageCount={data.messageCount} 
        status={data.status} 
      />
    </div>
  )
}