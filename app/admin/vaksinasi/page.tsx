"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Syringe } from "lucide-react"
import { JudulHalaman } from "@/components/admin/judul-halaman"
import { KotakCari, cocokPencarian } from "@/components/admin/kotak-cari"
import { TombolAksiArsip } from "@/components/admin/tombol-aksi-arsip"
import { FilterPilihan } from "@/components/umum/filter-pilihan"
import { Lencana } from "@/components/ui/lencana"
import { KeadaanKosong, Memuat, PesanGalat } from "@/components/ui/status"
import { BadanTabel, KepalaTabel, Sel, SelKepala, Tabel } from "@/components/ui/tabel"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanAksiArsip } from "@/hooks/gunakan-aksi-arsip"
import { gunakanData } from "@/hooks/gunakan-data"
import { ambilVaksinasi } from "@/lib/data/vaksinasi"
import { formatJam, formatRupiah, formatTanggal, tanggalHariIni } from "@/lib/format"
import { labelStatusVaksinasi, nadaStatusVaksinasi, type Nada } from "@/lib/label"
import type { Vaksinasi } from "@/lib/tipe"

const BATAS_HARI_SEGERA = 30

/** Status dosis berikutnya: tanpa dosis, terlambat, segera (<= 30 hari), atau masih lama. */
function statusDosisBerikutnya(tanggal: string | null): { teks: string; nada: Nada } {
  if (!tanggal) return { teks: "Tanpa dosis lanjutan", nada: "netral" }

  const selisihHari = Math.ceil(
    (new Date(`${tanggal}T00:00:00`).getTime() - new Date(`${tanggalHariIni()}T00:00:00`).getTime()) / 86_400_000,
  )
  if (selisihHari < 0) return { teks: "Terlambat", nada: "bahaya" }
  if (selisihHari <= BATAS_HARI_SEGERA) return { teks: "Segera", nada: "peringatan" }
  return { teks: "Terjadwal", nada: "sukses" }
}

export default function HalamanVaksinasiAdmin() {
  const { klien } = gunakanAuth()
  const [kataCari, setKataCari] = useState("")
  const [filterStatus, setFilterStatus] = useState("semua")

  const { data: daftarVaksinasi, memuat, galat, muatUlang } = gunakanData<Vaksinasi[]>(() => ambilVaksinasi(klien), [])
  const { arsipkanItem, hapusItem } = gunakanAksiArsip("vaccinations", muatUlang)

  if (memuat) return <Memuat />

  const vaksinasiTersaring = daftarVaksinasi.filter(
    (vaksin) =>
      (filterStatus === "semua" || vaksin.status === filterStatus) &&
      cocokPencarian(kataCari, vaksin.vaccine_name, vaksin.pet?.name, vaksin.owner?.full_name, vaksin.doctor?.full_name),
  )

  return (
    <div className="space-y-6">
      <JudulHalaman
        judul="Vaksinasi"
        deskripsi="Pantau vaksinasi yang diusulkan dokter. Dokter sendiri yang menyetujui atau menolaknya dan menandai yang sudah disuntik."
      />
      {galat && <PesanGalat>{galat}</PesanGalat>}

      <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
        <KotakCari nilai={kataCari} onUbah={setKataCari} placeholder="Cari vaksin, hewan, pemilik, atau dokter" />
        <FilterPilihan
          label="Status"
          nilai={filterStatus}
          onUbah={setFilterStatus}
          pilihan={[["semua", "Semua status"], ...Object.entries(labelStatusVaksinasi)]}
        />
      </div>

      {vaksinasiTersaring.length === 0 ? (
        <KeadaanKosong ikon={Syringe} teks="Belum ada vaksinasi yang cocok." />
      ) : (
        <Tabel>
          <KepalaTabel>
            <tr>
              <SelKepala>Hewan</SelKepala>
              <SelKepala>Vaksin</SelKepala>
              <SelKepala>Dokter</SelKepala>
              <SelKepala>Status</SelKepala>
              <SelKepala>Jadwal</SelKepala>
              <SelKepala>Dosis berikutnya</SelKepala>
              <SelKepala>Biaya</SelKepala>
              <SelKepala>Aksi</SelKepala>
            </tr>
          </KepalaTabel>
          <BadanTabel>
            {vaksinasiTersaring.map((vaksin) => {
              const dosis = statusDosisBerikutnya(vaksin.next_dose_date)
              return (
                <tr key={vaksin.id}>
                  <Sel>
                    <p className="font-medium">{vaksin.pet?.name ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {vaksin.owner?.full_name ?? "-"}
                      {vaksin.owner?.phone ? ` · ${vaksin.owner.phone}` : ""}
                    </p>
                  </Sel>
                  <Sel>{vaksin.vaccine_name}</Sel>
                  <Sel>{vaksin.doctor?.full_name ?? "-"}</Sel>
                  <Sel>
                    <Lencana nada={nadaStatusVaksinasi[vaksin.status]}>{labelStatusVaksinasi[vaksin.status]}</Lencana>
                    {vaksin.cancellation_reason && (
                      <p className="mt-1 max-w-48 text-xs text-muted-foreground">Alasan: {vaksin.cancellation_reason}</p>
                    )}
                  </Sel>
                  <Sel className="whitespace-nowrap">
                    {vaksin.scheduled_date ? `${formatTanggal(vaksin.scheduled_date)} ${formatJam(vaksin.scheduled_time)}` : "-"}
                  </Sel>
                  <Sel>
                    <div className="space-y-1">
                      <p className="whitespace-nowrap">{formatTanggal(vaksin.next_dose_date)}</p>
                      <Lencana nada={dosis.nada}>
                        {dosis.nada === "bahaya" && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {dosis.nada === "sukses" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {dosis.teks}
                      </Lencana>
                    </div>
                  </Sel>
                  <Sel className="whitespace-nowrap">{formatRupiah(vaksin.fee)}</Sel>
                  <Sel>
                    <TombolAksiArsip onArsip={() => arsipkanItem(vaksin.id)} onHapus={() => hapusItem(vaksin.id)} />
                  </Sel>
                </tr>
              )
            })}
          </BadanTabel>
        </Tabel>
      )}
    </div>
  )
}
