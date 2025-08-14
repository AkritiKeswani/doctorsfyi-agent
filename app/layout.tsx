import type React from "react"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "doctors.fyi-scribe",
  description: "AI-powered medical transcription and SOAP note generation",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${manrope.style.fontFamily};
  --font-sans: ${manrope.variable};
}
        `}</style>
      </head>
      <body className={manrope.className}>{children}</body>
    </html>
  )
}
