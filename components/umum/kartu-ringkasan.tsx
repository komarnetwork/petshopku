import type { LucideIcon } from "lucide-react"
import { Kartu } from "@/components/ui/kartu"

interface PropsKartuRingkasan {
  ikon: LucideIcon
  label: string
  nilai: string | number
}

/** Kartu angka ringkasan (jumlah hewan, total biaya, dll). */
export function KartuRingkasan({ ikon: Ikon, label, nilai }: PropsKartuRingkasan) {
  return (
    <Kartu className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Ikon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold">{nilai}</p>
    </Kartu>
  )
}
