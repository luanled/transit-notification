import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, XCircle, History, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const TRANSIT_LINES = [
  {
    id: 'BLUE',
    name: 'Blue Line',
    stops: ['Santa Teresa', 'Cottle', 'Snell', 'Blossom Hill', 'Ohlone/Chynoweth', 'Branham', 'Capitol', 'Curtner', 'Tamien', 'Virginia', "Children's Discovery Museum", 'Convention Center-B', 'Paseo de San Antonio-B', 'Santa Clara-B', 'St. James-B', 'Japantown/Ayer-B', 'Civic Center-B', 'Gish-B', 'Metro/Airport-B', 'Karina-B', 'Component-B', 'Bonaventura-B', 'Orchard-B', 'River Oaks-B', 'Tasman-B', 'Baypointe-B']
  },
  {
    id: 'GREEN',
    name: 'Green Line',
    stops: ['Winchester', 'Downtown Campbell', 'Hamilton', 'Bascom', 'Fruitdale', 'Race', 'San Jose Diridon', 'San Fernando', 'Convention Center-G', 'Paseo de San Antonio-G', 'Santa Clara-G', 'St. James-G', 'Japantown/Ayer-G', 'Civic Center-G', 'Gish-G', 'Metro/Airport-G', 'Karina-G', 'Component-G', 'Bonaventura-G', 'Orchard-G', 'River Oaks-G', 'Tasman-G', 'Champion-G', 'Lick Mill-G', 'Great America-G', 'Old Ironsides-G']
  },
  {
    id: 'ORANGE',
    name: 'Orange Line',
    stops: ['Mountain View', 'Whisman', 'Middlefield', 'Bayshore NASA', 'Moffett Park', 'Lockheed Martin', 'Borregas', 'Crossman', 'Fair Oaks', 'Vienna', 'Reamwood', 'Old Ironsides-O', 'Great America-O', 'Lick Mill-O', 'Champion-O', 'Baypointe-O', 'Cisco Way', 'Alder', 'Great Mall', 'Milpitas', 'Cropley', 'Hostetter', 'Berryessa', 'Penitencia Creek', 'McKee', 'Alum Rock']
  }
];

const formSchema = z.object({
  eventType: z.string().min(1, "Event type is required"),
  lineId: z.string().min(1, "Transit line is required"),
  stopId: z.string().min(1, "Station is required"),
  delayMinutes: z.string().optional(),
  reason: z.string().optional(),
  weather: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function IncidentReportForm() {
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: "",
      lineId: "",
      stopId: "",
      delayMinutes: "",
      reason: "",
      weather: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const selectedLineData = TRANSIT_LINES.find(line => line.id === data.lineId);

    const event = {
      eventId: `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventType: data.eventType,
      lineId: data.lineId,
      lineName: selectedLineData?.name || "",
      stopId: data.stopId,
      scheduledTime: new Date().toISOString(),
      actualTime: new Date(Date.now() + parseInt(data.delayMinutes || "0") * 60000).toISOString(),
      delayMinutes: parseInt(data.delayMinutes || "0"),
      status: data.eventType === 'CANCELLATION' ? 'CANCELLED' : 'ACTIVE',
      reason: data.reason || null,
      weather: data.weather || null,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error('Failed to submit incident report');
      }

      addToast({
        type: 'success',
        title: 'Incident Reported Successfully',
        message: 'The incident has been submitted and will appear on the dashboard.',
        data: {
          'Type': data.eventType,
          'Line': selectedLineData?.name || "",
          'Station': data.stopId
        }
      });

      form.reset();
      setTimeout(() => setOpen(false), 0);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error Submitting Report',
        message: err instanceof Error ? err.message : 'An error occurred while submitting the report',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Report Incident
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Transit Incident</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="DELAY">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Delay
                      </div>
                    </SelectItem>
                    <SelectItem value="CANCELLATION">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Cancellation
                      </div>
                    </SelectItem>
                  </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

<FormField
  control={form.control}
  name="lineId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Line</FormLabel>
      <Select 
        onValueChange={(value) => {
          field.onChange(value);
          form.setValue("stopId", "");
        }} 
        defaultValue={field.value}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select transit line">
              {field.value && (
                <div className={cn(
                  "font-medium",
                  field.value === "BLUE" && "text-blue-600",
                  field.value === "GREEN" && "text-green-600",
                  field.value === "ORANGE" && "text-orange-600"
                )}>
                  {TRANSIT_LINES.find(line => line.id === field.value)?.name}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {TRANSIT_LINES.map((line) => (
            <SelectItem 
              key={line.id} 
              value={line.id}
              className={cn(
                "font-medium",
                line.id === "BLUE" && "text-blue-600",
                line.id === "GREEN" && "text-green-600",
                line.id === "ORANGE" && "text-orange-600"
              )}
            >
              {line.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

            <FormField
              control={form.control}
              name="stopId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Station</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!form.watch("lineId")}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select station" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {form.watch("lineId") && TRANSIT_LINES
                        .find(line => line.id === form.watch("lineId"))
                        ?.stops.map((stop) => (
                          <SelectItem key={stop} value={stop}>
                            {stop}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("eventType") === "DELAY" && (
              <FormField
                control={form.control}
                name="delayMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter reason for the incident" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weather"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weather Conditions</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select weather conditions" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Clear">Clear</SelectItem>
                      <SelectItem value="Rain">Rain</SelectItem>
                      <SelectItem value="Snow">Snow</SelectItem>
                      <SelectItem value="Foggy">Foggy</SelectItem>
                      <SelectItem value="Stormy">Stormy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}