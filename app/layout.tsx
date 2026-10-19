import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { PenyediaAuth } from "@/context/auth-context"
import { PenyediaToast } from "@/context/toast-context"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
})

export const metadata: Metadata = {
  title: "Petshopku - Klinik Hewan & Pet Shop",
  description:
    "Kelola janji temu, vaksinasi, pemeriksaan, dan keuangan klinik hewan Anda dalam satu tempat.",
}

export default function TataLetakUtama({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} font-sans`}>
        <PenyediaToast>
          <PenyediaAuth>{children}</PenyediaAuth>
        </PenyediaToast>
      </body>
    </html>
  )
}
