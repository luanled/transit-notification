import Link from "next/link"
import Image from "next/image"
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
                  <Link href="/alerts">Alerts</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/stations">Stations</Link>
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
              href="/alerts"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Alerts
            </Link>
            <Link
              href="/stations"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Stations
            </Link>
          </div>
          <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
            Sign In
          </Button>
        </nav>
      </div>
    </header>
  )
}