import Image from "next/image"

export default function StationsPage() {
  return (
    <main className="flex-1 container py-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Stations Map</h1>
        </div>

        <div className="relative w-full h-[80vh] rounded-lg overflow-hidden border">
          <Image
            src="/vta_map.webp"
            alt="VTA Light Rail Map"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </main>
  )
}