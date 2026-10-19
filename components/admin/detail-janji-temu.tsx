"use client"

import { Tombol } from "@/components/ui/tombol"
import { KolomFormulir, Pilihan } from "@/components/ui/input"
import { Lencana } from "@/components/ui/lencana"
import { formatJam, formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/format"
import { labelStatusJanjiTemu, nadaStatusJanjiTemu } from "@/lib/label"
import type { JanjiTemu, Profil } from "@/lib/tipe"

interface PropsDetailJanjiTemu {
  janji: JanjiTemu
  daftarDokter: Profil[]
  onUbahStatus: (status: "dijadwalkan" | "dibatalkan") => void
  onUbahDokter: (dokterId: string | null) => void
  onArsip: () => void
  onHapus: () => void
}

/**
 * Isi jendela detail janji temu: admin dapat membatalkan / menjadwalkan ulang, mengganti dokter,
 * mengarsipkan, atau menghapus. Menyelesaikan janji temu adalah tugas dokter.
 */
export function DetailJanjiTemu({ janji, daftarDokter, onUbahStatus, onUbahDokter, onArsip, onHapus }: PropsDetailJanjiTemu) {
  return (
    <div className="space-y-4">
      <div className="space-y-1 rounded-lg border border-border bg-background p-4 text-sm">
        <p className="text-base font-semibold">
          {janji.pet?.name ?? "Hewan"} - {janji.purpose}
        </p>
        <p>
          Pemilik: {janji.owner?.full_name ?? "-"}
          {janji.owner?.phone ? ` (${janji.owner.phone})` : ""}
        </p>
        <p>
          Jadwal: {formatTanggal(janji.date)}, {formatJam(janji.start_time)}-{formatJam(janji.end_time)}
        </p>
        <p>Perkiraan biaya: {formatRupiah(janji.estimated_price)}</p>
        {janji.notes && <p>Catatan: {janji.notes}</p>}
        <div className="pt-1">
          <Lencana nada={nadaStatusJanjiTemu[janji.status]}>{labelStatusJanjiTemu[janji.status]}</Lencana>
        </div>
        {janji.status === "selesai" && <p className="pt-1">Selesai diperiksa: {formatTanggalWaktu(janji.completed_at)}</p>}
      </div>

      {janji.status === "dijadwalkan" && (
        <Tombol varian="garis" className="w-full text-destructive" onClick={() => onUbahStatus("dibatalkan")}>
          Batalkan janji temu
        </Tombol>
      )}
      {janji.status === "dibatalkan" && (
        <Tombol varian="garis" className="w-full" onClick={() => onUbahStatus("dijadwalkan")}>
          Jadwalkan kembali
        </Tombol>
      )}

      <KolomFormulir label="Dokter hewan">
        <Pilihan value={janji.doctor_id ?? ""} onChange={(kejadian) => onUbahDokter(kejadian.target.value || null)}>
          <option value="">Belum ditentukan</option>
          {daftarDokter.map((dokter) => (
            <option key={dokter.id} value={dokter.id}>
              {dokter.full_name || "Dokter tanpa nama"}
            </option>
          ))}
        </Pilihan>
      </KolomFormulir>

      {janji.consultation && (
        <div className="rounded-lg bg-accent/60 p-3 text-sm">
          <p className="font-medium text-accent-foreground">Hasil konsultasi</p>
          <p className="mt-1 whitespace-pre-line">{janji.consultation.doctor_notes}</p>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Tombol varian="garis" onClick={onArsip}>
          Arsipkan
        </Tombol>
        <Tombol varian="bahaya" onClick={onHapus}>
          Hapus permanen
        </Tombol>
      </div>
    </div>
  )
}
