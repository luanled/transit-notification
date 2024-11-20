import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { Clock } from "lucide-react"
  
  interface TimeFilterProps {
    onChange: (minutes: number) => void
    currentValue: number
  }
  
  const TIME_OPTIONS = [
    { label: 'Last 10 minutes', value: 10 },
    { label: 'Last 30 minutes', value: 30 },
    { label: 'Last 1 hour', value: 60 },
    { label: 'Last 6 hours', value: 360 },
    { label: 'Last 24 hours', value: 1440 }
  ]
  
  export function TimeFilter({ onChange, currentValue }: TimeFilterProps) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Select
          value={currentValue.toString()}
          onValueChange={(value) => onChange(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }