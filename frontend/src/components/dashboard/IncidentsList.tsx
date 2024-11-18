import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Clock, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Your existing interfaces and type definitions remain the same...
type EventType = 'DELAY' | 'CANCELLATION';

interface Incident {
  eventId: string
  type: EventType
  timestamp: string
  reason?: string
  delayMinutes?: number
}

interface IncidentDetails {
  eventId: string
  eventType: EventType
  lineId: string
  stopId: string
  timestamp: string
  status: string
  reason?: string
  delayMinutes?: number
  weather?: string
  scheduledTime: string
  actualTime: string
}

interface IncidentData {
  count: number
  incidents: Incident[]
  lastIncident: string
  type: EventType
  lastEventId: string
}

interface IncidentsListProps {
  incidents: Record<string, IncidentData>
}

// Your existing STATION_TO_LINE mapping remains the same...
const STATION_TO_LINE: Record<string, string> = {
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

  // Green Line stations
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

  // Orange Line stations
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
};

const getLineColor = (line: string, type: EventType) => {
  const baseColors = {
    BLUE: {
      DELAY: "border-blue-500 bg-blue-50",
      CANCELLATION: "border-blue-500 bg-red-50"
    },
    GREEN: {
      DELAY: "border-green-500 bg-green-50",
      CANCELLATION: "border-green-500 bg-red-50"
    },
    ORANGE: {
      DELAY: "border-orange-500 bg-orange-50",
      CANCELLATION: "border-orange-500 bg-red-50"
    }
  };
  const lineColors = baseColors[line as keyof typeof baseColors];
  return lineColors ? lineColors[type] || lineColors.DELAY : "border-gray-200 bg-gray-50";
}

const getTextColor = (line: string) => {
  const colors = {
    BLUE: "text-blue-900",
    GREEN: "text-green-900",
    ORANGE: "text-orange-900"
  }
  return colors[line as keyof typeof colors] || "text-gray-900"
}

const getIcon = (type: EventType) => {
  switch (type) {
    case 'DELAY':
      return <Clock className="h-4 w-4" />;
    case 'CANCELLATION':
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

const getIncidentMessage = (type: EventType, count: number) => {
  if (type === 'DELAY') {
    return `${count} delay${count > 1 ? 's' : ''} reported`;
  } else if (type === 'CANCELLATION') {
    return `${count} cancellation${count > 1 ? 's' : ''} reported`;
  }
  return `${count} incident${count > 1 ? 's' : ''} reported`;
}

export function IncidentsList({ incidents }: IncidentsListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<IncidentDetails | null>(null)

  const handleIncidentClick = async (eventId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3000/api/events/${eventId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch incident details')
      }
      const details = await response.json()
      setSelectedIncident(details)
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error fetching incident details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sort incidents by timestamp
  const sortedIncidents = Object.entries(incidents)
    .sort(([, a], [, b]) => {
      const timeA = new Date(a.lastIncident).getTime()
      const timeB = new Date(b.lastIncident).getTime()
      return timeB - timeA // Sort in descending order (latest first)
    })

  return (
    <>
      <div className="space-y-4">
        {sortedIncidents.map(
          ([stop, data]) =>
            data.count > 0 && (
              <div key={stop} className="relative">
                <Alert 
                  variant="default"
                  className={cn(
                    "border-2 rounded-r-lg",
                    "hover:bg-gray-50 cursor-pointer pr-16"
                  )}
                  onClick={() => handleIncidentClick(data.lastEventId)}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(data.type)}
                    <div className="flex-1">
                      <AlertTitle className={getTextColor(STATION_TO_LINE[stop])}>
                        {stop}
                      </AlertTitle>
                      <AlertDescription className={cn(
                        data.type === 'CANCELLATION' ? 'text-red-700' : getTextColor(STATION_TO_LINE[stop])
                      )}>
                        {getIncidentMessage(data.type, data.count)}
                        <span className="block text-sm opacity-80">
                          Last {data.type.toLowerCase()}: {new Date(data.lastIncident).toLocaleTimeString()}
                        </span>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
                <div 
                  className={cn(
                    "absolute right-0 top-0 bottom-0 w-8 rounded-r-lg",
                    STATION_TO_LINE[stop] === 'BLUE' && "bg-blue-500",
                    STATION_TO_LINE[stop] === 'GREEN' && "bg-green-500",
                    STATION_TO_LINE[stop] === 'ORANGE' && "bg-orange-500"
                  )}
                />
              </div>
            )
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {loading ? 'Loading...' : 'Incident Details'}
            </DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading details...
            </div>
          ) : selectedIncident ? (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-x-4">
                <div className="text-sm text-muted-foreground">Line</div>
                <div className="text-sm font-medium">{selectedIncident.lineId} Line</div>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="text-sm font-medium">{selectedIncident.status}</div>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <div className="text-sm text-muted-foreground">Station</div>
                <div className="text-sm font-medium">{selectedIncident.stopId}</div>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <div className="text-sm text-muted-foreground">Scheduled Time</div>
                <div className="text-sm font-medium">
                  {new Date(selectedIncident.scheduledTime).toLocaleTimeString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <div className="text-sm text-muted-foreground">Actual Time</div>
                <div className="text-sm font-medium">
                  {new Date(selectedIncident.actualTime).toLocaleTimeString()}
                </div>
              </div>

              {selectedIncident.reason && (
                <div className="grid grid-cols-2 gap-x-4">
                  <div className="text-sm text-muted-foreground">Reason</div>
                  <div className="text-sm font-medium">{selectedIncident.reason}</div>
                </div>
              )}

              {typeof selectedIncident.delayMinutes === 'number' && selectedIncident.delayMinutes > 0 && (
                <div className="grid grid-cols-2 gap-x-4">
                  <div className="text-sm text-muted-foreground">Delay Duration</div>
                  <div className="text-sm font-medium">{selectedIncident.delayMinutes} minutes</div>
                </div>
              )}

              {selectedIncident.weather && (
                <div className="grid grid-cols-2 gap-x-4">
                  <div className="text-sm text-muted-foreground">Weather</div>
                  <div className="text-sm font-medium">{selectedIncident.weather}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No details available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}