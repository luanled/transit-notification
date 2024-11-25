import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/stations">Stations</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/report">Report Incident</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href="/" className="flex items-center space-x-2 font-semibold">
            <span className="flex text-xl">
              <span className="text-gray-900">Rail</span>
              <span className="text-blue-500">Watch</span>
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          <div className="hidden md:flex space-x-6">
            <Link
              href="/dashboard"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/stations"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Stations & Subscribe
            </Link>
            <Link
              href="/report"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Report Incident
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}