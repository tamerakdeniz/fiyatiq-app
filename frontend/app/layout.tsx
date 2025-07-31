import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { MockDataViewer } from "@/components/mock-data-viewer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart Vehicle Price Estimation Platform",
  description: "AI-powered vehicle price estimation using real-time market data",
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
          <MockDataViewer />
        </AuthProvider>
      </body>
    </html>
  )
}
