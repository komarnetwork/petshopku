import { KolomFormulir, Pilihan } from "@/components/ui/input"
import { formatJam, formatTanggal } from "@/lib/format"
import type { JanjiTemu } from "@/lib/tipe"

/** Janji temu dokter yang masih berjalan untuk seorang pasien. */
export function janjiBerjalan(daftar: JanjiTemu[], hewanId: string) {
  return daftar.filter((janji) => janji.pet_id === hewanId && janji.status === "dijadwalkan")
}

/** Janji temu yang paling cocok: satu-satunya, atau yang keperluannya memuat kata kunci ("vaksin" / "pemeriksaan"). */
export function janjiTerbaik(kandidat: JanjiTemu[], kataKunci: string) {
  if (kandidat.length === 1) return kandidat[0].id
  return kandidat.find((janji) => janji.purpose.toLowerCase().includes(kataKunci))?.id ?? ""
}

interface PropsPilihanJanjiTemu {
  kandidat: JanjiTemu[]
  nilai: string
  onUbah: (id: string) => void
}

/** Memilih janji temu yang ikut selesai saat usulan disetujui dokter. Tidak tampil bila pasien tak punya janji temu berjalan. */
export function PilihanJanjiTemu({ kandidat, nilai, onUbah }: PropsPilihanJanjiTemu) {
  if (kandidat.length === 0) return null

  return (
    <KolomFormulir label="Janji temu terkait (opsional)" petunjuk="Bila dipilih, janji temu ini otomatis selesai saat Anda menyetujui usulan di bawah.">
      <Pilihan value={nilai} onChange={(kejadian) => onUbah(kejadian.target.value)}>
        <option value="">Tanpa janji temu</option>
        {kandidat.map((janji) => (
          <option key={janji.id} value={janji.id}>
            {formatTanggal(janji.date)} {formatJam(janji.start_time)} - {janji.purpose}
          </option>
        ))}
      </Pilihan>
    </KolomFormulir>
  )
}
