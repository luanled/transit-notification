import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Train, Bell, Info } from "lucide-react"

export default function Home() {
  return (
    <main className="container flex-1">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
            Transit Notification System
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Real-time monitoring and alerts for public transportation
          </p>
          <div className="space-x-4">
            <Button size="lg">
              View Dashboard
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <Card>
            <CardHeader>
              <Train className="w-14 h-14 mb-4" />
              <CardTitle>Real-Time Tracking</CardTitle>
              <CardDescription>
                Monitor transit lines in real-time with accurate location updates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="w-14 h-14 mb-4" />
              <CardTitle>Instant Alerts</CardTitle>
              <CardDescription>
                Get immediate notifications about delays, changes, and disruptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Info className="w-14 h-14 mb-4" />
              <CardTitle>Service Updates</CardTitle>
              <CardDescription>
                Stay informed about maintenance, special events, and service changes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </main>
  )
}