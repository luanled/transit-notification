"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, XCircle, Train } from "lucide-react"

interface TransitEvent {
  event_id: string
  event_type: string
  timestamp: string
  delay_minutes?: number
  reason?: string
  status: string
}

interface StationEvents {
  station: string
  count: number
  events: TransitEvent[]
}

const LINES = [
  { id: 'BLUE', name: 'Blue Line', color: 'text-blue-600' },
  { id: 'GREEN', name: 'Green Line', color: 'text-green-600' },
  { id: 'ORANGE', name: 'Orange Line', color: 'text-orange-600' }
]

const STATION_TO_LINE: Record<string, string> = {
  // Blue Line
  'Santa Teresa': 'BLUE',
  'Cottle': 'BLUE',
  'Snell': 'BLUE',
  'Blossom Hill': 'BLUE',
  'Ohlone/Chynoweth': 'BLUE',
  'Branham': 'BLUE',
  'Capitol': 'BLUE',
  'Curtner': 'BLUE',
  'Tamien': 'BLUE',
  'Virginia': 'BLUE',
  "Children's Discovery Museum": 'BLUE',
  'Convention Center-B': 'BLUE',
  'Paseo de San Antonio-B': 'BLUE',
  'Santa Clara-B': 'BLUE',
  'St. James-B': 'BLUE',
  'Japantown/Ayer-B': 'BLUE',
  'Civic Center-B': 'BLUE',
  'Gish-B': 'BLUE',
  'Metro/Airport-B': 'BLUE',
  'Karina-B': 'BLUE',
  'Component-B': 'BLUE',
  'Bonaventura-B': 'BLUE',
  'Orchard-B': 'BLUE',
  'River Oaks-B': 'BLUE',
  'Tasman-B': 'BLUE',
  'Baypointe-B': 'BLUE',
  // Green Line
  'Winchester': 'GREEN',
  'Downtown Campbell': 'GREEN',
  'Hamilton': 'GREEN',
  'Bascom': 'GREEN',
  'Fruitdale': 'GREEN',
  'Race': 'GREEN',
  'San Jose Diridon': 'GREEN',
  'San Fernando': 'GREEN',
  'Convention Center-G': 'GREEN',
  'Paseo de San Antonio-G': 'GREEN',
  'Santa Clara-G': 'GREEN',
  'St. James-G': 'GREEN',
  'Japantown/Ayer-G': 'GREEN',
  'Civic Center-G': 'GREEN',
  'Gish-G': 'GREEN',
  'Metro/Airport-G': 'GREEN',
  'Karina-G': 'GREEN',
  'Component-G': 'GREEN',
  'Bonaventura-G': 'GREEN',
  'Orchard-G': 'GREEN',
  'River Oaks-G': 'GREEN',
  'Tasman-G': 'GREEN',
  'Champion-G': 'GREEN',
  'Lick Mill-G': 'GREEN',
  'Great America-G': 'GREEN',
  'Old Ironsides-G': 'GREEN',
  // Orange Line
  'Mountain View': 'ORANGE',
  'Whisman': 'ORANGE',
  'Middlefield': 'ORANGE',
  'Bayshore NASA': 'ORANGE',
  'Moffett Park': 'ORANGE',
  'Lockheed Martin': 'ORANGE',
  'Borregas': 'ORANGE',
  'Crossman': 'ORANGE',
  'Fair Oaks': 'ORANGE',
  'Vienna': 'ORANGE',
  'Reamwood': 'ORANGE',
  'Old Ironsides-O': 'ORANGE',
  'Great America-O': 'ORANGE',
  'Lick Mill-O': 'ORANGE',
  'Champion-O': 'ORANGE',
  'Baypointe-O': 'ORANGE',
  'Cisco Way': 'ORANGE',
  'Alder': 'ORANGE',
  'Great Mall': 'ORANGE',
  'Milpitas': 'ORANGE',
  'Cropley': 'ORANGE',
  'Hostetter': 'ORANGE',
  'Berryessa': 'ORANGE',
  'Penitencia Creek': 'ORANGE',
  'McKee': 'ORANGE',
  'Alum Rock': 'ORANGE'
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'DELAY':
      return <Clock className="h-5 w-5" />
    case 'CANCELLATION':
      return <XCircle className="h-5 w-5" />
    default:
      return <Train className="h-5 w-5" />
  }
}

const getLineColor = (lineId: string) => {
  return LINES.find(line => line.id === lineId)?.color || 'text-gray-600'
}

export default function StationsPage() {
  const [selectedLine, setSelectedLine] = useState("")
  const [selectedStation, setSelectedStation] = useState("")
  const [events, setEvents] = useState<StationEvents | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  const getStationsForLine = (lineId: string) => {
    return Object.entries(STATION_TO_LINE)
      .filter(([_, line]) => line === lineId)
      .map(([station]) => station)
      .sort()
  }

  const handleLineChange = (lineId: string) => {
    setSelectedLine(lineId)
    setSelectedStation("")
    setEvents(null)
    setError(null)
    
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
    }
  }

  const handleStationChange = async (stationId: string) => {
    setSelectedStation(stationId)
    if (!stationId) return

    if (eventSource) {
      eventSource.close()
    }

    setLoading(true)
    setError(null)

    const newEventSource = new EventSource(
      `http://localhost:3000/api/events/station/${encodeURIComponent(stationId)}/stream`
    )

    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setEvents(data)
        setLoading(false)
      } catch (err) {
        console.error("Error parsing SSE data:", err)
      }
    }

    newEventSource.onerror = (err) => {
      console.error("SSE Error:", err)
      setError("Failed to connect to server")
      setLoading(false)
      newEventSource.close()
    }

    setEventSource(newEventSource)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [eventSource])

  return (
    <main className="flex-1 container py-6">
      <Tabs defaultValue="map" className="space-y-6">
        <TabsList>
          <TabsTrigger value="map">System Map</TabsTrigger>
          <TabsTrigger value="search">Search Stations</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Stations Map</h1>
            <div className="relative w-full h-[80vh] rounded-lg overflow-hidden border">
              <Image
                src="/vta_map.webp"
                alt="VTA Light Rail Map"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Search Stations</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select value={selectedLine} onValueChange={handleLineChange}>
              <SelectTrigger className={selectedLine ? getLineColor(selectedLine) : ''}>
                <SelectValue placeholder="Select a line" />
              </SelectTrigger>
              <SelectContent>
                {LINES.map((line) => (
                  <SelectItem key={line.id} value={line.id} className={line.color}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedStation} 
              onValueChange={handleStationChange}
              disabled={!selectedLine}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a station" />
              </SelectTrigger>
              <SelectContent>
                {selectedLine && getStationsForLine(selectedLine).map((station) => (
                  <SelectItem key={station} value={station}>
                    {station}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading station events...
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {events?.events && events.events.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Events</h2>
              {events.events.map((event) => (
                <Card key={event.event_id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getEventIcon(event.event_type)}
                      {event.event_type}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div>
                        <span className="font-medium">Time: </span>
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                      
                        <div>
                          <span className="font-medium">Delay: </span>
                          {event.delay_minutes} minutes
                        </div>
                      
                      {event.reason && (
                        <div>
                          <span className="font-medium">Reason: </span>
                          {event.reason}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Status: </span>
                        {event.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {events?.events && events.events.length === 0 && (
            <Alert>
              <AlertDescription>
                No events found for this station.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}