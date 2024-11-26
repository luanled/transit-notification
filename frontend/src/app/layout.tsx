import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { ToastProvider } from "@/components/ui/toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RailWatch",
  description: "Real-time transit monitoring system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body className={cn("min-h-screen bg-background antialiased", inter.className)}>
      <ToastProvider>
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t bg-background">
            <div className="container flex h-14 items-center">
              <p className="text-sm text-foreground">
              © 2024 RailWatch. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </body>
  </html>
  )
}