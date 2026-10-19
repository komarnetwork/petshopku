"use client"

import { useState, type FormEvent } from "react"
import { Stethoscope } from "lucide-react"
import { Tombol } from "@/components/ui/tombol"
import { Input, KolomFormulir, Textarea } from "@/components/ui/input"
import { PanelKartu } from "@/components/ui/kartu"
import { KeadaanKosong } from "@/components/ui/status"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanAuth } from "@/context/auth-context"
import { selesaikanJanjiTemu } from "@/lib/data/janji-temu"
import { catatHasilKonsultasi } from "@/lib/data/konsultasi"
import { formatJam, formatTanggal, formatTanggalWaktu, waktuInputSekarang } from "@/lib/format"
import { labelJenisHewan, labelStatusJanjiTemu } from "@/lib/label"
import type { JanjiTemu } from "@/lib/tipe"

function BarisInfo({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{nilai}</span>
    </div>
  )
}

interface PropsFormHasilKonsultasi {
  janji: JanjiTemu | null
  onTersimpan: () => void
}

/**
 * Dokter menyelesaikan janji temu langsung dengan tanggal dan jam selesai. Hasil konsultasi boleh diisi
 * (disimpan bersamaan) tetapi tidak wajib.
 */
export function FormHasilKonsultasi({ janji, onTersimpan }: PropsFormHasilKonsultasi) {
  const { klien } = gunakanAuth()
  const jalankan = gunakanAksi()

  const [catatan, setCatatan] = useState("")
  const [waktuSelesai, setWaktuSelesai] = useState(waktuInputSekarang())
  const [menyimpan, setMenyimpan] = useState(false)

  if (!janji) {
    return (
      <PanelKartu judul="Selesaikan Pemeriksaan" ikon={Stethoscope}>
        <KeadaanKosong teks="Pilih janji temu di daftar untuk menyelesaikannya dan mencatat hasil konsultasi." />
      </PanelKartu>
    )
  }

  const sudahDicatat = Boolean(janji.consultation)
  const dibatalkan = janji.status === "dibatalkan"

  async function tanganiKirim(kejadian: FormEvent) {
    kejadian.preventDefault()
    if (!janji) return

    const selesaiPada = new Date(waktuSelesai).toISOString()
    const denganHasil = Boolean(catatan.trim())

    setMenyimpan(true)
    const berhasil = await jalankan(
      () =>
        denganHasil
          ? catatHasilKonsultasi(klien, { appointment_id: janji.id, doctor_notes: catatan, completed_at: selesaiPada })
          : selesaikanJanjiTemu(klien, janji.id, selesaiPada),
      denganHasil
        ? `Pemeriksaan ${janji.pet?.name ?? ""} selesai dan hasil konsultasi tersimpan.`
        : `Pemeriksaan ${janji.pet?.name ?? ""} ditandai selesai.`,
    )
    setMenyimpan(false)

    if (berhasil) {
      setCatatan("")
      onTersimpan()
    }
  }

  return (
    <PanelKartu judul="Selesaikan Pemeriksaan" ikon={Stethoscope}>
      <div className="mb-4 space-y-1.5 rounded-lg border border-border bg-background p-4 text-sm">
        <BarisInfo
          label="Hewan"
          nilai={`${janji.pet?.name ?? "-"}${janji.pet ? ` (${labelJenisHewan[janji.pet.species]}, ${janji.pet.breed})` : ""}`}
        />
        <BarisInfo label="Pemilik" nilai={janji.owner?.full_name ?? "-"} />
        <BarisInfo label="Jadwal" nilai={`${formatTanggal(janji.date)}, ${formatJam(janji.start_time)}-${formatJam(janji.end_time)}`} />
        <BarisInfo label="Status" nilai={labelStatusJanjiTemu[janji.status]} />
        {janji.notes && <BarisInfo label="Catatan" nilai={janji.notes} />}
        {janji.completed_at && <BarisInfo label="Selesai" nilai={formatTanggalWaktu(janji.completed_at)} />}
      </div>

      {sudahDicatat && janji.consultation ? (
        <div className="rounded-lg bg-accent/60 p-4 text-sm">
          <p className="font-semibold text-accent-foreground">Hasil konsultasi sudah dicatat</p>
          <p className="mt-1 whitespace-pre-line">{janji.consultation.doctor_notes}</p>
        </div>
      ) : dibatalkan ? (
        <KeadaanKosong teks="Janji temu yang dibatalkan tidak dapat diberi hasil konsultasi." />
      ) : janji.status === "selesai" ? (
        <KeadaanKosong teks="Janji temu ini sudah selesai tanpa hasil konsultasi." />
      ) : (
        <form onSubmit={tanganiKirim} className="space-y-4">
          <KolomFormulir label="Tanggal dan jam selesai pemeriksaan" petunjuk="Janji temu langsung berstatus Selesai setelah disimpan.">
            <Input
              type="datetime-local"
              required
              max={waktuInputSekarang()}
              value={waktuSelesai}
              onChange={(kejadian) => setWaktuSelesai(kejadian.target.value)}
            />
          </KolomFormulir>
          <KolomFormulir label="Hasil konsultasi (opsional)" petunjuk="Boleh dikosongkan. Hasil yang disimpan tidak dapat diubah.">
            <Textarea
              className="min-h-32"
              placeholder="Diagnosis, tindakan, dan saran perawatan"
              value={catatan}
              onChange={(kejadian) => setCatatan(kejadian.target.value)}
            />
          </KolomFormulir>
          <Tombol type="submit" className="w-full" memuat={menyimpan}>
            {catatan.trim() ? "Simpan hasil & tandai selesai" : "Tandai selesai"}
          </Tombol>
        </form>
      )}
    </PanelKartu>
  )
}
