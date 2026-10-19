import type { ButtonHTMLAttributes } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const kelasVarian = {
  utama: "bg-primary text-primary-foreground hover:bg-primary/90",
  sekunder: "bg-accent text-accent-foreground hover:bg-accent/70",
  garis: "border border-border bg-card text-foreground hover:bg-muted",
  hantu: "text-foreground hover:bg-muted",
  bahaya: "bg-destructive text-white hover:bg-destructive/90",
}

const kelasUkuran = {
  kecil: "h-8 gap-1.5 px-3 text-sm",
  normal: "h-10 gap-2 px-4 text-sm",
  besar: "h-12 gap-2 px-6 text-base",
  ikon: "h-10 w-10",
}

export interface OpsiTombol {
  varian?: keyof typeof kelasVarian
  ukuran?: keyof typeof kelasUkuran
  className?: string
}

/** Class tombol; bisa dipakai juga pada <Link> agar tampilannya seperti tombol. */
export function kelasTombol({ varian = "utama", ukuran = "normal", className }: OpsiTombol = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    kelasVarian[varian],
    kelasUkuran[ukuran],
    className,
  )
}

interface PropsTombol extends ButtonHTMLAttributes<HTMLButtonElement>, OpsiTombol {
  /** Menampilkan spinner dan menonaktifkan tombol. */
  memuat?: boolean
}

export function Tombol({ varian, ukuran, className, memuat, disabled, children, type = "button", ...sisa }: PropsTombol) {
  return (
    <button
      type={type}
      disabled={disabled || memuat}
      className={kelasTombol({ varian, ukuran, className })}
      {...sisa}
    >
      {memuat && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
