import type { ReactNode } from "react"
import type { Nada } from "@/lib/label"
import { cn } from "@/lib/utils"

const kelasNada: Record<Nada, string> = {
  netral: "bg-muted text-muted-foreground",
  info: "bg-sky-100 text-sky-800",
  sukses: "bg-emerald-100 text-emerald-800",
  peringatan: "bg-amber-100 text-amber-800",
  bahaya: "bg-red-100 text-red-800",
}

export function Lencana({ nada = "netral", children }: { nada?: Nada; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", kelasNada[nada])}>
      {children}
    </span>
  )
}
