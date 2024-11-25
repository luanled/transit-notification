"use client"

import { useEffect, useState } from "react"
import { LineStatusCard } from "@/components/dashboard/LineStatusCard"
import { IncidentsList } from "@/components/dashboard/IncidentsList"
import { SystemStats } from "@/components/dashboard/SystemStats"
import { TimeFilter } from "@/components/dashboard/TimeFilter"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import IncidentReportForm from "@/components/incident-report/IncidentReportForm"

type EventType = 'DELAY' | 'CANCELLATION';

interface Analytics {
  timestamp: string
  messageCount: number
  analytics: {
    delaysByLine: Record<string, {
      avgDelay: number
      count: number
      delays: Array<{ 
        eventId: string
        delay: number
        timestamp: string 
      }>
      lastUpdated: string
    }>
    cancelsByLine: Record<string, {
      count: number
      cancellations: Array<{ 
        eventId: string
        timestamp: string
        reason: string 
      }>
      lastCancellation: string
    }>
    incidentsByStop: Record<string, {
      count: number
      incidents: Array<{ 
        eventId: string
        type: EventType
        timestamp: string
        reason?: string
        delayMinutes?: number
      }>
      lastIncident: string
      type: EventType
      lastEventId: string
    }>
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
  status: string
  consumingTopics: string[]
  windowSize: number
}

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  const handleTimeFilterChange = async (minutes: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/analytics/window/${minutes}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update time window');
      }
      
      // The updated data will come through the SSE connection
    } catch (error) {
      console.error('Error updating time window:', error);
      setError('Failed to update time filter');
    }
  };

  useEffect(() => {
    const newEventSource = new EventSource('http://localhost:3000/api/analytics/stream');
    setEventSource(newEventSource);

    newEventSource.onmessage = (event) => {
      try {
        const analyticsData = JSON.parse(event.data);
        setData(analyticsData);
        setLoading(false);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    newEventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setError('Failed to connect to server');
      setLoading(false);
      newEventSource.close();
    };

    return () => {
      newEventSource.close();
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
        <div className="flex items-center gap-4">
          <TimeFilter onChange={handleTimeFilterChange} currentValue={data.windowSize} />
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      {data?.analytics && (
        <DashboardStats analytics={data.analytics} />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(data.analytics.serviceHealth).map(([line, health]) => (
          <LineStatusCard
            key={line}
            line={line}
            health={health}
            delay={data.analytics.delaysByLine[line]}
            cancellations={data.analytics.cancelsByLine[line]}
          />
        ))}
      </div>

      <div className="max-h-[500px] overflow-y-auto border border-gray-300 rounded-lg p-4 shadow">
        <IncidentsList incidents={data.analytics.incidentsByStop} />
      </div>
      
      <SystemStats 
        messageCount={data.messageCount} 
        status={data.status} 
      />
    </div>
  )
}