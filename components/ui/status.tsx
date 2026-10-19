import type { ReactNode } from "react"
import { Loader2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Indikator memuat di tengah area. Pakai layarPenuh untuk halaman utuh. */
export function Memuat({ layarPenuh = false }: { layarPenuh?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center", layarPenuh ? "min-h-screen" : "min-h-[240px]")}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

interface PropsKeadaanKosong {
  teks: string
  deskripsi?: string
  ikon?: LucideIcon
}

/** Tampilan saat daftar belum berisi apa pun. */
export function KeadaanKosong({ teks, deskripsi, ikon: Ikon }: PropsKeadaanKosong) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background p-8 text-center">
      {Ikon && <Ikon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />}
      <p className="text-sm font-medium text-muted-foreground">{teks}</p>
      {deskripsi && <p className="mt-1 text-xs text-muted-foreground">{deskripsi}</p>}
    </div>
  )
}

/** Kotak pesan galat berwarna merah. */
export function PesanGalat({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </p>
  )
}
