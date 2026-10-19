"use client"

import { useState } from "react"
import { Archive, RotateCcw, Trash2 } from "lucide-react"
import { JudulHalaman } from "@/components/admin/judul-halaman"
import { Tombol } from "@/components/ui/tombol"
import { KeadaanKosong, Memuat, PesanGalat } from "@/components/ui/status"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanData } from "@/hooks/gunakan-data"
import { hapusPermanen, pulihkan, type TabelArsip } from "@/lib/data/arsip"
import { ambilHewan } from "@/lib/data/hewan"
import { ambilJanjiTemu } from "@/lib/data/janji-temu"
import { ambilKonsultasi } from "@/lib/data/konsultasi"
import { ambilPemeriksaan } from "@/lib/data/pemeriksaan"
import { ambilVaksinasi } from "@/lib/data/vaksinasi"
import { formatJam, formatTanggal } from "@/lib/format"
import { labelJenisHewan, namaPemeriksaan } from "@/lib/label"
import { cn } from "@/lib/utils"

/** Satu baris di daftar arsip, sudah diratakan menjadi teks siap tampil. */
interface ItemArsip {
  id: string
  judul: string
  keterangan: string
  diarsipkanPada: string | null
}

type DataArsip = Record<TabelArsip, ItemArsip[]>

const daftarTab: { tabel: TabelArsip; label: string }[] = [
  { tabel: "pets", label: "Pasien" },
  { tabel: "appointments", label: "Janji Temu" },
  { tabel: "consultations", label: "Konsultasi" },
  { tabel: "vaccinations", label: "Vaksinasi" },
  { tabel: "examinations", label: "Pemeriksaan" },
]

const dataKosong: DataArsip = { pets: [], appointments: [], consultations: [], vaccinations: [], examinations: [] }

export default function HalamanArsip() {
  const { klien } = gunakanAuth()
  const jalankan = gunakanAksi()
  const [tabAktif, setTabAktif] = useState<TabelArsip>("pets")

  // Hanya mengambil data yang sudah diarsipkan, lalu meratakannya menjadi ItemArsip.
  const { data, memuat, galat, muatUlang } = gunakanData<DataArsip>(async () => {
    const [hewan, janjiTemu, konsultasi, vaksinasi, pemeriksaan] = await Promise.all([
      ambilHewan(klien, { diarsipkan: true }),
      ambilJanjiTemu(klien, { diarsipkan: true }),
      ambilKonsultasi(klien, { diarsipkan: true }),
      ambilVaksinasi(klien, { diarsipkan: true }),
      ambilPemeriksaan(klien, { diarsipkan: true }),
    ])

    return {
      pets: hewan.map((item) => ({
        id: item.id,
        judul: item.name,
        keterangan: `${labelJenisHewan[item.species]} · pemilik: ${item.owner?.full_name ?? "-"}`,
        diarsipkanPada: item.archived_at,
      })),
      appointments: janjiTemu.map((item) => ({
        id: item.id,
        judul: `${item.pet?.name ?? "Hewan"} - ${item.purpose}`,
        keterangan: `${formatTanggal(item.date)} ${formatJam(item.start_time)} · pemilik: ${item.owner?.full_name ?? "-"}`,
        diarsipkanPada: item.archived_at,
      })),
      consultations: konsultasi.map((item) => ({
        id: item.id,
        judul: `${item.pet?.name ?? "Hewan"} - konsultasi ${formatTanggal(item.date)}`,
        keterangan: item.doctor_notes,
        diarsipkanPada: item.archived_at,
      })),
      vaccinations: vaksinasi.map((item) => ({
        id: item.id,
        judul: `${item.pet?.name ?? "Hewan"} - ${item.vaccine_name}`,
        keterangan: `pemilik: ${item.owner?.full_name ?? "-"}`,
        diarsipkanPada: item.archived_at,
      })),
      examinations: pemeriksaan.map((item) => ({
        id: item.id,
        judul: `${item.pet?.name ?? "Hewan"} - ${namaPemeriksaan(item)}`,
        keterangan: `pemilik: ${item.owner?.full_name ?? "-"}`,
        diarsipkanPada: item.archived_at,
      })),
    }
  }, dataKosong)

  async function pulihkanItem(tabel: TabelArsip, id: string) {
    if (await jalankan(() => pulihkan(klien, tabel, id), "Data dipulihkan.")) await muatUlang()
  }

  async function hapusItem(tabel: TabelArsip, id: string) {
    if (!window.confirm("Hapus data ini secara permanen? Tindakan ini tidak dapat dibatalkan.")) return
    if (await jalankan(() => hapusPermanen(klien, tabel, id), "Data dihapus permanen.")) await muatUlang()
  }

  if (memuat) return <Memuat />

  const itemTab = data[tabAktif]

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Arsip" deskripsi="Data yang diarsipkan disembunyikan dari daftar utama. Pulihkan atau hapus permanen di sini." />
      {galat && <PesanGalat>{galat}</PesanGalat>}

      <div className="flex flex-wrap gap-2">
        {daftarTab.map(({ tabel, label }) => (
          <button
            key={tabel}
            type="button"
            onClick={() => setTabAktif(tabel)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tabel === tabAktif ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
            )}
          >
            {label} ({data[tabel].length})
          </button>
        ))}
      </div>

      {itemTab.length === 0 ? (
        <KeadaanKosong ikon={Archive} teks="Tidak ada data yang diarsipkan di kategori ini." />
      ) : (
        <ul className="space-y-3">
          {itemTab.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0">
                <p className="font-semibold">{item.judul}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{item.keterangan}</p>
                <p className="text-xs text-muted-foreground">Diarsipkan {formatTanggal(item.diarsipkanPada)}</p>
              </div>
              <div className="flex gap-2">
                <Tombol varian="garis" ukuran="kecil" onClick={() => pulihkanItem(tabAktif, item.id)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Pulihkan
                </Tombol>
                <Tombol varian="garis" ukuran="kecil" className="text-destructive" onClick={() => hapusItem(tabAktif, item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus
                </Tombol>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
