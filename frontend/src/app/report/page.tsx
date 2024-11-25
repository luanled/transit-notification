"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, AlertCircle, History } from "lucide-react"
import IncidentReportForm from "@/components/incident-report/IncidentReportForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportPage() {
  return (
    <main className="container py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Report Transit Incident</h1>
          <p className="text-muted-foreground">
            Use this form to report delays, cancellations, or other transit incidents.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Report Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  New Incident Report
                </CardTitle>
                <CardDescription>
                  Please provide as much detail as possible about the incident.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncidentReportForm />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Additional Features */}
          <div className="space-y-6">
            {/* Common Issues Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Reporting Guidelines</CardTitle>
                <CardDescription>Common scenarios and how to report them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Delays</h4>
                  <p className="text-sm text-muted-foreground">
                    Report when trains are running behind schedule by 5 minutes or more.
                    Include weather conditions if relevant.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Cancellations</h4>
                  <p className="text-sm text-muted-foreground">
                    Report when a scheduled service has been cancelled.
                    Include the reason if known.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}