import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Incident {
  type: string
  timestamp: string
}

interface IncidentData {
  count: number
  incidents: Incident[]
  lastIncident: string
}

interface IncidentsListProps {
  incidents: Record<string, IncidentData>
}

// Map stations to their lines
const STATION_TO_LINE: Record<string, string> = {
  // Blue Line stations
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
  'Children\'s Discovery Museum': 'BLUE',
  'Convention Center': 'BLUE',
  'Paseo de San Antonio': 'BLUE',
  'Santa Clara': 'BLUE',
  'St. James': 'BLUE',
  'Japantown/Ayer': 'BLUE',
  'Civic Center': 'BLUE',
  'Gish': 'BLUE',
  'Metro/Airport': 'BLUE',
  'Karina': 'BLUE',
  'Component': 'BLUE',
  'Bonaventura': 'BLUE',
  'River Oaks': 'BLUE',
  'Tasman': 'BLUE',
  'Reamwood': 'BLUE',
  'Vienna': 'BLUE',
  'Fair Oaks': 'BLUE',
  'Crossman': 'BLUE',
  'Borregas': 'BLUE',
  'Lockheed Martin': 'BLUE',
  'Baypointe': 'BLUE',

  // Green Line stations
  'Winchester': 'GREEN',
  'Downtown Campbell': 'GREEN',
  'Hamilton': 'GREEN',
  'Bascom': 'GREEN',
  'Fruitdale': 'GREEN',
  'Race': 'GREEN',
  'San Jose Diridon': 'GREEN',
  'San Fernando': 'GREEN',
  'Champion': 'GREEN',
  'Great America': 'GREEN',
  'Old Ironsides': 'GREEN',

  // Orange Line stations
  'Mountain View': 'ORANGE',
  'Whisman': 'ORANGE',
  'Middlefield': 'ORANGE',
  'Bayshore/NASA': 'ORANGE',
  'Moffett Park': 'ORANGE',
  'Lick Mill': 'ORANGE',
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

const getLineColor = (line: string) => {
  const colors = {
    BLUE: "border-blue-500 bg-blue-50",
    GREEN: "border-green-500 bg-green-50",
    ORANGE: "border-orange-500 bg-orange-50"
  }
  return colors[line as keyof typeof colors] || "border-gray-200 bg-gray-50"
}

const getTextColor = (line: string) => {
  const colors = {
    BLUE: "text-blue-900",
    GREEN: "text-green-900",
    ORANGE: "text-orange-900"
  }
  return colors[line as keyof typeof colors] || "text-gray-900"
}

export function IncidentsList({ incidents }: IncidentsListProps) {
  return (
    <div className="space-y-4">
      {Object.entries(incidents).map(
        ([stop, data]) =>
          data.count > 0 && (
            <Alert 
              key={stop}
              variant="default"
              className={cn(
                "border-2",
                getLineColor(STATION_TO_LINE[stop])
              )}
            >
              <AlertTriangle className={cn(
                "h-4 w-4",
                getTextColor(STATION_TO_LINE[stop])
              )} />
              <AlertTitle className={getTextColor(STATION_TO_LINE[stop])}>
                {stop}
              </AlertTitle>
              <AlertDescription className={getTextColor(STATION_TO_LINE[stop])}>
                {data.count} incident(s) reported. Last incident:{" "}
                {new Date(data.lastIncident).toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          )
      )}
    </div>
  )
}