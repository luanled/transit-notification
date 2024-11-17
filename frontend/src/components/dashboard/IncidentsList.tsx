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