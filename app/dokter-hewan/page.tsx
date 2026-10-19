"use client"

import { useState } from "react"
import { CalendarDays, ClipboardList, Stethoscope } from "lucide-react"
import { BilahPortal, SapaanPortal } from "@/components/umum/bilah-portal"
import { KartuRingkasan } from "@/components/umum/kartu-ringkasan"
import { JanjiTemuDokter } from "@/components/dokter/janji-temu-dokter"
import { FormHasilKonsultasi } from "@/components/dokter/form-hasil-konsultasi"
import { FormVaksin } from "@/components/dokter/form-vaksin"
import { FormPemeriksaan } from "@/components/dokter/form-pemeriksaan"
import { DaftarPemeriksaanDokter, DaftarVaksinasiDokter } from "@/components/dokter/daftar-layanan-dokter"
import { Memuat, PesanGalat } from "@/components/ui/status"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanData } from "@/hooks/gunakan-data"
import { ambilHewan } from "@/lib/data/hewan"
import { ambilJanjiTemu } from "@/lib/data/janji-temu"
import { ambilPemeriksaan } from "@/lib/data/pemeriksaan"
import { ambilVaksinasi } from "@/lib/data/vaksinasi"
import type { Hewan, JanjiTemu, Pemeriksaan, Vaksinasi } from "@/lib/tipe"

/** Semua data yang ditampilkan di portal dokter hewan. */
interface DataDokter {
  janjiTemu: JanjiTemu[]
  hewan: Hewan[]
  vaksinasi: Vaksinasi[]
  pemeriksaan: Pemeriksaan[]
}

const dataKosong: DataDokter = { janjiTemu: [], hewan: [], vaksinasi: [], pemeriksaan: [] }

export default function HalamanDokterHewan() {
  const { klien, profil, pengguna } = gunakanAuth()
  const [idDipilih, setIdDipilih] = useState("")

  // Aturan akses di database memastikan dokter hanya menerima data pasien yang ia tangani.
  const { data, memuat, galat, muatUlang } = gunakanData<DataDokter>(async () => {
    const [janjiTemu, hewan, vaksinasi, pemeriksaan] = await Promise.all([
      ambilJanjiTemu(klien),
      ambilHewan(klien),
      ambilVaksinasi(klien),
      ambilPemeriksaan(klien),
    ])
    return { janjiTemu, hewan, vaksinasi, pemeriksaan }
  }, dataKosong)

  if (memuat) return <Memuat layarPenuh />

  const namaDokter = profil?.full_name || pengguna?.email || "Dokter"
  const janjiDipilih = data.janjiTemu.find((janji) => janji.id === idDipilih) ?? null
  const janjiAktif = data.janjiTemu.filter((janji) => janji.status === "dijadwalkan")
  const jumlahHasil = data.janjiTemu.filter((janji) => janji.consultation).length

  return (
    <div className="min-h-screen">
      <BilahPortal />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SapaanPortal
          label="Area dokter hewan"
          nama={namaDokter}
          deskripsi="Lihat janji temu Anda, tandai selesai setelah memeriksa (hasil konsultasi opsional), serta usulkan dan putuskan vaksinasi dan pemeriksaan untuk pasien."
        />

        {galat && <PesanGalat>{galat}</PesanGalat>}

        <section className="grid gap-4 md:grid-cols-3">
          <KartuRingkasan ikon={CalendarDays} label="Janji Temu" nilai={data.janjiTemu.length} />
          <KartuRingkasan ikon={Stethoscope} label="Perlu Ditangani" nilai={janjiAktif.length} />
          <KartuRingkasan ikon={ClipboardList} label="Hasil Konsultasi Tercatat" nilai={jumlahHasil} />
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
          <JanjiTemuDokter
            daftarJanjiTemu={data.janjiTemu}
            idDipilih={idDipilih}
            onPilih={setIdDipilih}
            onBerubah={muatUlang}
          />
          {/* key membuat formulir kosong kembali setiap janji temu lain dipilih */}
          <FormHasilKonsultasi key={janjiDipilih?.id ?? "kosong"} janji={janjiDipilih} onTersimpan={muatUlang} />
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-2">
          <FormVaksin daftarHewan={data.hewan} daftarJanjiTemu={data.janjiTemu} onTersimpan={muatUlang} />
          <FormPemeriksaan daftarHewan={data.hewan} daftarJanjiTemu={data.janjiTemu} onTersimpan={muatUlang} />
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-2">
          <DaftarVaksinasiDokter daftarVaksinasi={data.vaksinasi} onBerubah={muatUlang} />
          <DaftarPemeriksaanDokter daftarPemeriksaan={data.pemeriksaan} onBerubah={muatUlang} />
        </section>
      </main>
    </div>
  )
}
