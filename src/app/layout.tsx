import type { Metadata } from "next"
import { Geist_Mono, Kanit } from "next/font/google"
import { Suspense } from "react"
import { SiteHeader } from "@/components/app/site-header"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const kanit = Kanit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Converge",
  description: "Hackathon team formation — find your people before and during the event.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${kanit.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Suspense fallback={null}>
          <SiteHeader />
        </Suspense>
        <div className="flex flex-1 flex-col">{children}</div>
        <Toaster />
      </body>
    </html>
  )
}
