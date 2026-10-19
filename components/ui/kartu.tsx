import type { HTMLAttributes, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function Kartu({ className, ...sisa }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)} {...sisa} />
}

interface PropsPanelKartu {
  judul: string
  ikon?: LucideIcon
  /** Elemen di sisi kanan judul, mis. tombol. */
  aksi?: ReactNode
  className?: string
  children: ReactNode
}

/** Kartu dengan judul (dan ikon) di bagian atas. */
export function PanelKartu({ judul, ikon: Ikon, aksi, className, children }: PropsPanelKartu) {
  return (
    <Kartu className={cn("p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Ikon && <Ikon className="h-5 w-5 text-primary" />}
          <h2 className="text-lg font-bold">{judul}</h2>
        </div>
        {aksi}
      </div>
      {children}
    </Kartu>
  )
}

/** Kotak informasi kecil berisi judul dan keterangan. */
export function KotakInfo({ judul, keterangan }: { judul: string; keterangan: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="font-semibold">{judul}</p>
      <div className="text-sm text-muted-foreground">{keterangan}</div>
    </div>
  )
}
