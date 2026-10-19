"use client"

import { useMemo, useState } from "react"
import { CalendarDays } from "lucide-react"
import { FilterPilihan } from "@/components/umum/filter-pilihan"
import { Lencana } from "@/components/ui/lencana"
import { Tombol } from "@/components/ui/tombol"
import { PanelKartu } from "@/components/ui/kartu"
import { KeadaanKosong } from "@/components/ui/status"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanAuth } from "@/context/auth-context"
import { sembunyikanJanjiTemu } from "@/lib/data/janji-temu"
import { formatJam, formatTanggal, formatTanggalWaktu } from "@/lib/format"
import { labelStatusJanjiTemu, nadaStatusJanjiTemu } from "@/lib/label"
import { cn } from "@/lib/utils"
import type { JanjiTemu } from "@/lib/tipe"

type FilterHasil = "semua" | "belum" | "sudah"
type Urutan = "terdekat" | "terjauh" | "terbaru" | "terlama"

interface PropsJanjiTemuDokter {
  daftarJanjiTemu: JanjiTemu[]
  idDipilih: string
  onPilih: (id: string) => void
  onBerubah: () => void
}

/** Daftar janji temu milik dokter, dengan penyaring status, hasil konsultasi, dan urutan. */
export function JanjiTemuDokter({ daftarJanjiTemu, idDipilih, onPilih, onBerubah }: PropsJanjiTemuDokter) {
  const { klien } = gunakanAuth()
  const jalankan = gunakanAksi()

  const [filterStatus, setFilterStatus] = useState("semua")
  const [filterHasil, setFilterHasil] = useState<FilterHasil>("semua")
  const [urutan, setUrutan] = useState<Urutan>("terdekat")

  const janjiTersaring = useMemo(() => {
    return daftarJanjiTemu
      .filter((janji) => filterStatus === "semua" || janji.status === filterStatus)
      .filter((janji) => {
        if (filterHasil === "belum") return !janji.consultation
        if (filterHasil === "sudah") return Boolean(janji.consultation)
        return true
      })
      .sort((a, b) => {
        if (urutan === "terbaru" || urutan === "terlama") {
          const selisih = a.created_at.localeCompare(b.created_at)
          return urutan === "terbaru" ? -selisih : selisih
        }
        const selisih = `${a.date}T${a.start_time}`.localeCompare(`${b.date}T${b.start_time}`)
        return urutan === "terdekat" ? selisih : -selisih
      })
  }, [daftarJanjiTemu, filterStatus, filterHasil, urutan])

  const janjiAktif = janjiTersaring.filter((janji) => !janji.doctor_archived_at)
  const janjiDisembunyikan = janjiTersaring.filter((janji) => janji.doctor_archived_at)

  async function ubahPenyembunyian(janji: JanjiTemu, sembunyikan: boolean) {
    const berhasil = await jalankan(
      () => sembunyikanJanjiTemu(klien, janji.id, sembunyikan),
      sembunyikan ? "Janji temu disembunyikan." : "Janji temu ditampilkan kembali.",
    )
    if (berhasil) onBerubah()
  }

  function kartuJanji(janji: JanjiTemu, sembunyi: boolean) {
    const dipilih = janji.id === idDipilih

    return (
      <div
        key={janji.id}
        className={cn(
          "rounded-lg border p-4 transition-colors",
          dipilih ? "border-primary bg-accent/50" : "border-border bg-background hover:bg-muted/50",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button type="button" onClick={() => onPilih(janji.id)} className="text-left">
            <p className="font-semibold">{janji.pet?.name ?? "Hewan"}</p>
            <p className="text-sm text-muted-foreground">Pemilik: {janji.owner?.full_name ?? "-"}</p>
            <p className="text-sm text-muted-foreground">{janji.purpose}</p>
          </button>

          <div className="flex flex-col items-end gap-1.5">
            <p className="text-sm font-medium">
              {formatTanggal(janji.date)}, {formatJam(janji.start_time)}
            </p>
            <Lencana nada={nadaStatusJanjiTemu[janji.status]}>{labelStatusJanjiTemu[janji.status]}</Lencana>
            {(janji.consultation || janji.status === "dijadwalkan") && (
              <Lencana nada={janji.consultation ? "sukses" : "netral"}>
                {janji.consultation ? "Hasil tercatat" : "Hasil belum dicatat"}
              </Lencana>
            )}
            {janji.status === "selesai" && janji.completed_at && (
              <p className="text-xs text-muted-foreground">Selesai {formatTanggalWaktu(janji.completed_at)}</p>
            )}
            <Tombol varian="garis" ukuran="kecil" onClick={() => ubahPenyembunyian(janji, !sembunyi)}>
              {sembunyi ? "Tampilkan" : "Sembunyikan"}
            </Tombol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PanelKartu judul="Janji Temu Saya" ikon={CalendarDays}>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <FilterPilihan
          label="Status"
          nilai={filterStatus}
          onUbah={setFilterStatus}
          pilihan={[
            ["semua", "Semua"],
            ["dijadwalkan", "Dijadwalkan"],
            ["selesai", "Selesai"],
            ["dibatalkan", "Dibatalkan"],
          ]}
        />
        <FilterPilihan
          label="Hasil konsultasi"
          nilai={filterHasil}
          onUbah={(nilai) => setFilterHasil(nilai as FilterHasil)}
          pilihan={[
            ["semua", "Semua"],
            ["belum", "Belum dicatat"],
            ["sudah", "Sudah dicatat"],
          ]}
        />
        <FilterPilihan
          label="Urutan"
          nilai={urutan}
          onUbah={(nilai) => setUrutan(nilai as Urutan)}
          pilihan={[
            ["terdekat", "Jadwal terdekat"],
            ["terjauh", "Jadwal terjauh"],
            ["terbaru", "Dibuat terbaru"],
            ["terlama", "Dibuat terlama"],
          ]}
        />
      </div>

      {janjiAktif.length === 0 ? (
        <KeadaanKosong teks="Tidak ada janji temu untuk penyaring yang dipilih." />
      ) : (
        <div className="space-y-3">{janjiAktif.map((janji) => kartuJanji(janji, false))}</div>
      )}

      {janjiDisembunyikan.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold text-muted-foreground">Disembunyikan</h3>
          <div className="space-y-3">{janjiDisembunyikan.map((janji) => kartuJanji(janji, true))}</div>
        </div>
      )}
    </PanelKartu>
  )
}
