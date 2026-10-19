import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface PropsKotakCari {
  nilai: string
  placeholder: string
  onUbah: (nilai: string) => void
}

/** Kolom pencarian dengan ikon kaca pembesar. */
export function KotakCari({ nilai, placeholder, onUbah }: PropsKotakCari) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        className="pl-9"
        placeholder={placeholder}
        value={nilai}
        onChange={(kejadian) => onUbah(kejadian.target.value)}
      />
    </div>
  )
}

/** True bila salah satu teks mengandung kata pencarian (tanpa membedakan huruf besar/kecil). */
export function cocokPencarian(kataCari: string, ...teks: (string | null | undefined)[]) {
  const kata = kataCari.trim().toLowerCase()
  if (!kata) return true
  return teks.some((isi) => isi?.toLowerCase().includes(kata))
}
