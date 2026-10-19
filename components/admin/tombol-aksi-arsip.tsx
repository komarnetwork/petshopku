import { Archive, Trash2 } from "lucide-react"
import { Tombol } from "@/components/ui/tombol"

interface PropsTombolAksiArsip {
  onArsip: () => void
  onHapus: () => void
}

/** Sepasang tombol kecil "Arsipkan" dan "Hapus" untuk baris tabel admin. */
export function TombolAksiArsip({ onArsip, onHapus }: PropsTombolAksiArsip) {
  return (
    <div className="flex gap-2">
      <Tombol varian="garis" ukuran="kecil" onClick={onArsip}>
        <Archive className="h-3.5 w-3.5" />
        Arsipkan
      </Tombol>
      <Tombol varian="garis" ukuran="kecil" onClick={onHapus} className="text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
        Hapus
      </Tombol>
    </div>
  )
}
