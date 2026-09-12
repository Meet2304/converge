import type { Metadata } from "next"
import { Kanit, Martian_Mono, Schibsted_Grotesk } from "next/font/google"
import "./globals.css"

// Three faces, three jobs, no overlap — docs/design/type.md.
// Kanit is a static family; only the weights actually used are loaded, and
// the Thai subset is dropped, which is most of its file size.
const kanit = Kanit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["200", "400", "600"],
  display: "swap",
})

const schibsted = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

const martianMono = Martian_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Converge",
  description:
    "Find hackathon teammates before the event, and find each other on the day.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${kanit.variable} ${schibsted.variable} ${martianMono.variable} dark h-full antialiased`}
    >
      <body className="bg-void text-ink flex min-h-full flex-col">{children}</body>
    </html>
  )
}
