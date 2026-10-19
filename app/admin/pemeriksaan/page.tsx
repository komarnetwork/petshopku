"use client"

import { useState } from "react"
import { FlaskConical } from "lucide-react"
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
import { ambilPemeriksaan } from "@/lib/data/pemeriksaan"
import { formatJam, formatRupiah, formatTanggal } from "@/lib/format"
import { labelKategoriPemeriksaan, labelStatusPemeriksaan, nadaStatusPemeriksaan, namaPemeriksaan } from "@/lib/label"
import type { Pemeriksaan } from "@/lib/tipe"

export default function HalamanPemeriksaanAdmin() {
  const { klien } = gunakanAuth()
  const [kataCari, setKataCari] = useState("")
  const [filterStatus, setFilterStatus] = useState("semua")

  const { data: daftarPemeriksaan, memuat, galat, muatUlang } = gunakanData<Pemeriksaan[]>(() => ambilPemeriksaan(klien), [])
  const { arsipkanItem, hapusItem } = gunakanAksiArsip("examinations", muatUlang)

  if (memuat) return <Memuat />

  const pemeriksaanTersaring = daftarPemeriksaan.filter(
    (pemeriksaan) =>
      (filterStatus === "semua" || pemeriksaan.status === filterStatus) &&
      cocokPencarian(
        kataCari,
        namaPemeriksaan(pemeriksaan),
        pemeriksaan.pet?.name,
        pemeriksaan.owner?.full_name,
        pemeriksaan.doctor?.full_name,
      ),
  )

  return (
    <div className="space-y-6">
      <JudulHalaman
        judul="Pemeriksaan"
        deskripsi="Pemeriksaan pencitraan dan laboratorium yang disarankan dokter hewan. Dokter sendiri yang menyetujui atau menolaknya."
      />
      {galat && <PesanGalat>{galat}</PesanGalat>}

      <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
        <KotakCari nilai={kataCari} onUbah={setKataCari} placeholder="Cari pemeriksaan, hewan, pemilik, atau dokter" />
        <FilterPilihan
          label="Status"
          nilai={filterStatus}
          onUbah={setFilterStatus}
          pilihan={[["semua", "Semua status"], ...Object.entries(labelStatusPemeriksaan)]}
        />
      </div>

      {pemeriksaanTersaring.length === 0 ? (
        <KeadaanKosong ikon={FlaskConical} teks="Belum ada pemeriksaan yang cocok." />
      ) : (
        <Tabel>
          <KepalaTabel>
            <tr>
              <SelKepala>Hewan</SelKepala>
              <SelKepala>Pemeriksaan</SelKepala>
              <SelKepala>Dokter</SelKepala>
              <SelKepala>Status</SelKepala>
              <SelKepala>Jadwal</SelKepala>
              <SelKepala>Biaya</SelKepala>
              <SelKepala>Aksi</SelKepala>
            </tr>
          </KepalaTabel>
          <BadanTabel>
            {pemeriksaanTersaring.map((pemeriksaan) => {
              return (
                <tr key={pemeriksaan.id}>
                  <Sel>
                    <p className="font-medium">{pemeriksaan.pet?.name ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {pemeriksaan.owner?.full_name ?? "-"}
                      {pemeriksaan.owner?.phone ? ` · ${pemeriksaan.owner.phone}` : ""}
                    </p>
                  </Sel>
                  <Sel>
                    <p>{namaPemeriksaan(pemeriksaan)}</p>
                    <p className="text-xs text-muted-foreground">{labelKategoriPemeriksaan[pemeriksaan.category]}</p>
                  </Sel>
                  <Sel>{pemeriksaan.doctor?.full_name ?? "-"}</Sel>
                  <Sel>
                    <Lencana nada={nadaStatusPemeriksaan[pemeriksaan.status]}>{labelStatusPemeriksaan[pemeriksaan.status]}</Lencana>
                    {pemeriksaan.cancellation_reason && (
                      <p className="mt-1 max-w-48 text-xs text-muted-foreground">Alasan: {pemeriksaan.cancellation_reason}</p>
                    )}
                  </Sel>
                  <Sel className="whitespace-nowrap">
                    {pemeriksaan.scheduled_date
                      ? `${formatTanggal(pemeriksaan.scheduled_date)} ${formatJam(pemeriksaan.scheduled_time)}`
                      : "-"}
                  </Sel>
                  <Sel className="whitespace-nowrap">{formatRupiah(pemeriksaan.fee)}</Sel>
                  <Sel>
                    <TombolAksiArsip onArsip={() => arsipkanItem(pemeriksaan.id)} onHapus={() => hapusItem(pemeriksaan.id)} />
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
