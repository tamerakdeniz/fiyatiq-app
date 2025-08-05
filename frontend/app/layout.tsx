import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FiyatIQ - Akıllı Araç Fiyat Tahmin Platformu",
  description: "Gerçek zamanlı pazar verileri kullanarak AI destekli araç fiyat tahmini",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />

        </AuthProvider>
      </body>
    </html>
  )
}
