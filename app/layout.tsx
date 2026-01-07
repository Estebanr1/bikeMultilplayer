import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "🚴‍♂️ Bike Race Sensor Game V12 FIXED",
  description: "Juego de carreras de bicicleta con sensor infrarrojo HW-511 y NodeMCU",
  keywords: "bike, race, sensor, NodeMCU, HW-511, game, Arduino",
  authors: [{ name: "Bike Race Game" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
