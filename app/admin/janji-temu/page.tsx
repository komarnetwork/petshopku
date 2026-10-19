"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { JudulHalaman } from "@/components/admin/judul-halaman"
import { AgendaMingguan, LegendaStatus, ambilHariDalamMinggu } from "@/components/admin/agenda-mingguan"
import { DetailJanjiTemu } from "@/components/admin/detail-janji-temu"
import { FormJanjiTemu } from "@/components/umum/form-janji-temu"
import { Tombol } from "@/components/ui/tombol"
import { Modal } from "@/components/ui/modal"
import { Memuat, PesanGalat } from "@/components/ui/status"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanAksiArsip } from "@/hooks/gunakan-aksi-arsip"
import { gunakanData } from "@/hooks/gunakan-data"
import { ambilHewan } from "@/lib/data/hewan"
import { ambilJanjiTemu, tetapkanDokterJanjiTemu, ubahStatusJanjiTemu } from "@/lib/data/janji-temu"
import { ambilDokterHewanAktif } from "@/lib/data/profil"
import type { Hewan, JanjiTemu, Profil } from "@/lib/tipe"

const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

export default function HalamanJanjiTemuAdmin() {
  const { klien } = gunakanAuth()
  const jalankan = gunakanAksi()

  const [acuan, setAcuan] = useState(new Date())
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [idDipilih, setIdDipilih] = useState<string | null>(null)

  const { data, memuat, galat, muatUlang } = gunakanData<{ janjiTemu: JanjiTemu[]; hewan: Hewan[]; dokter: Profil[] }>(
    async () => {
      const [janjiTemu, hewan, dokter] = await Promise.all([ambilJanjiTemu(klien), ambilHewan(klien), ambilDokterHewanAktif(klien)])
      return { janjiTemu, hewan, dokter }
    },
    { janjiTemu: [], hewan: [], dokter: [] },
  )
  const { arsipkanItem, hapusItem } = gunakanAksiArsip("appointments", muatUlang)

  // Data jendela detail selalu diambil dari daftar terbaru agar ikut berubah setelah disimpan.
  const janjiDipilih = data.janjiTemu.find((janji) => janji.id === idDipilih) ?? null
  const hariMinggu = ambilHariDalamMinggu(acuan)

  function geserMinggu(arah: 1 | -1) {
    const tanggalBaru = new Date(acuan)
    tanggalBaru.setDate(tanggalBaru.getDate() + arah * 7)
    setAcuan(tanggalBaru)
  }

  async function ubahStatus(janji: JanjiTemu, status: "dijadwalkan" | "dibatalkan") {
    const pesan = status === "dibatalkan" ? "Janji temu dibatalkan." : "Janji temu dijadwalkan kembali."
    if (await jalankan(() => ubahStatusJanjiTemu(klien, janji.id, status), pesan)) muatUlang()
  }

  async function ubahDokter(janji: JanjiTemu, dokterId: string | null) {
    if (await jalankan(() => tetapkanDokterJanjiTemu(klien, janji.id, dokterId), "Dokter hewan diperbarui.")) muatUlang()
  }

  if (memuat) return <Memuat />

  return (
    <div className="space-y-6">
      <JudulHalaman
        judul="Janji Temu"
        deskripsi="Lihat dan kelola jadwal kunjungan klinik per minggu."
        aksi={
          <Tombol onClick={() => setFormTerbuka(true)}>
            <Plus className="h-4 w-4" />
            Janji temu baru
          </Tombol>
        }
      />
      {galat && <PesanGalat>{galat}</PesanGalat>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tombol varian="garis" ukuran="ikon" onClick={() => geserMinggu(-1)} aria-label="Minggu sebelumnya">
            <ChevronLeft className="h-4 w-4" />
          </Tombol>
          <Tombol varian="garis" onClick={() => setAcuan(new Date())}>
            Hari ini
          </Tombol>
          <Tombol varian="garis" ukuran="ikon" onClick={() => geserMinggu(1)} aria-label="Minggu berikutnya">
            <ChevronRight className="h-4 w-4" />
          </Tombol>
        </div>
        <h2 className="text-lg font-bold">
          {namaBulan[hariMinggu[0].getMonth()]} {hariMinggu[0].getFullYear()}
        </h2>
        <LegendaStatus />
      </div>

      <AgendaMingguan hari={hariMinggu} daftarJanjiTemu={data.janjiTemu} onPilih={(janji) => setIdDipilih(janji.id)} />

      <Modal terbuka={formTerbuka} onTutup={() => setFormTerbuka(false)} judul="Buat Janji Temu">
        <FormJanjiTemu
          daftarHewan={data.hewan}
          daftarDokter={data.dokter}
          onTersimpan={() => {
            setFormTerbuka(false)
            muatUlang()
          }}
        />
      </Modal>

      <Modal terbuka={janjiDipilih !== null} onTutup={() => setIdDipilih(null)} judul="Detail Janji Temu">
        {janjiDipilih && (
          <DetailJanjiTemu
            janji={janjiDipilih}
            daftarDokter={data.dokter}
            onUbahStatus={(status) => ubahStatus(janjiDipilih, status)}
            onUbahDokter={(dokterId) => ubahDokter(janjiDipilih, dokterId)}
            onArsip={async () => {
              if (await arsipkanItem(janjiDipilih.id)) setIdDipilih(null)
            }}
            onHapus={async () => {
              if (await hapusItem(janjiDipilih.id)) setIdDipilih(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
