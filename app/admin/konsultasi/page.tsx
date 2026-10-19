"use client"

import { useState } from "react"
import { ClipboardList, Stethoscope } from "lucide-react"
import { JudulHalaman } from "@/components/admin/judul-halaman"
import { KotakCari, cocokPencarian } from "@/components/admin/kotak-cari"
import { TombolAksiArsip } from "@/components/admin/tombol-aksi-arsip"
import { DaftarRiwayatMedis } from "@/components/umum/daftar-riwayat-medis"
import { KolomFormulir, Input } from "@/components/ui/input"
import { PanelKartu } from "@/components/ui/kartu"
import { KeadaanKosong, Memuat, PesanGalat } from "@/components/ui/status"
import { BadanTabel, KepalaTabel, Sel, SelKepala, Tabel } from "@/components/ui/tabel"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanAksiArsip } from "@/hooks/gunakan-aksi-arsip"
import { gunakanData } from "@/hooks/gunakan-data"
import { ambilKonsultasi } from "@/lib/data/konsultasi"
import { ambilRiwayatMedis } from "@/lib/data/riwayat-medis"
import { formatRupiah, formatTanggal } from "@/lib/format"
import type { Konsultasi, RiwayatMedis } from "@/lib/tipe"

export default function HalamanKonsultasiAdmin() {
  const { klien } = gunakanAuth()
  const [kataCari, setKataCari] = useState("")
  const [tanggalFilter, setTanggalFilter] = useState("")

  const { data, memuat, galat, muatUlang } = gunakanData<{ konsultasi: Konsultasi[]; riwayat: RiwayatMedis[] }>(
    async () => {
      const [konsultasi, riwayat] = await Promise.all([ambilKonsultasi(klien), ambilRiwayatMedis(klien)])
      return { konsultasi, riwayat }
    },
    { konsultasi: [], riwayat: [] },
  )
  const { arsipkanItem, hapusItem } = gunakanAksiArsip("consultations", muatUlang)

  if (memuat) return <Memuat />

  const konsultasiTersaring = data.konsultasi.filter(
    (konsultasi) =>
      (!tanggalFilter || konsultasi.date === tanggalFilter) &&
      cocokPencarian(kataCari, konsultasi.pet?.name, konsultasi.owner?.full_name, konsultasi.doctor?.full_name, konsultasi.doctor_notes),
  )

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Konsultasi" deskripsi="Hasil konsultasi yang dicatat dokter hewan." />
      {galat && <PesanGalat>{galat}</PesanGalat>}

      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <KotakCari nilai={kataCari} onUbah={setKataCari} placeholder="Cari hewan, pemilik, dokter, atau catatan" />
        <KolomFormulir label="Tanggal" className="sm:flex sm:items-center sm:gap-2 sm:space-y-0">
          <Input type="date" value={tanggalFilter} onChange={(kejadian) => setTanggalFilter(kejadian.target.value)} />
        </KolomFormulir>
      </div>

      {konsultasiTersaring.length === 0 ? (
        <KeadaanKosong ikon={Stethoscope} teks="Belum ada konsultasi yang cocok." />
      ) : (
        <Tabel>
          <KepalaTabel>
            <tr>
              <SelKepala>Tanggal</SelKepala>
              <SelKepala>Hewan</SelKepala>
              <SelKepala>Pemilik</SelKepala>
              <SelKepala>Dokter</SelKepala>
              <SelKepala>Hasil konsultasi</SelKepala>
              <SelKepala>Biaya</SelKepala>
              <SelKepala>Aksi</SelKepala>
            </tr>
          </KepalaTabel>
          <BadanTabel>
            {konsultasiTersaring.map((konsultasi) => (
              <tr key={konsultasi.id}>
                <Sel className="whitespace-nowrap">{formatTanggal(konsultasi.date)}</Sel>
                <Sel className="font-medium">{konsultasi.pet?.name ?? "-"}</Sel>
                <Sel>{konsultasi.owner?.full_name ?? "-"}</Sel>
                <Sel>{konsultasi.doctor?.full_name ?? "-"}</Sel>
                <Sel className="max-w-xs whitespace-pre-line">{konsultasi.doctor_notes}</Sel>
                <Sel className="whitespace-nowrap">{formatRupiah(konsultasi.fee)}</Sel>
                <Sel>
                  <TombolAksiArsip onArsip={() => arsipkanItem(konsultasi.id)} onHapus={() => hapusItem(konsultasi.id)} />
                </Sel>
              </tr>
            ))}
          </BadanTabel>
        </Tabel>
      )}

      <PanelKartu judul="Riwayat Medis Seluruh Hewan" ikon={ClipboardList}>
        <DaftarRiwayatMedis riwayat={data.riwayat} />
      </PanelKartu>
    </div>
  )
}
