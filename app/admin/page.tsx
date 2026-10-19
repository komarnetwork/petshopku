"use client"

import { CalendarDays, Clock, PawPrint, Stethoscope, Syringe, Wallet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { JudulHalaman } from "@/components/admin/judul-halaman"
import { KartuRingkasan } from "@/components/umum/kartu-ringkasan"
import { PanelKartu } from "@/components/ui/kartu"
import { KeadaanKosong, Memuat, PesanGalat } from "@/components/ui/status"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanData } from "@/hooks/gunakan-data"
import { ambilHewan } from "@/lib/data/hewan"
import { ambilJanjiTemuMendatang } from "@/lib/data/janji-temu"
import { ambilKonsultasi, hitungKonsultasiPerHari } from "@/lib/data/konsultasi"
import { ambilTransaksi, hitungRingkasanBulanan } from "@/lib/data/transaksi"
import { ambilVaksinasi } from "@/lib/data/vaksinasi"
import { formatJam, formatRupiah, formatTanggal, tanggalHariIni } from "@/lib/format"
import type { Hewan, JanjiTemu, Konsultasi, Transaksi, Vaksinasi } from "@/lib/tipe"

interface DataDasbor {
  hewan: Hewan[]
  konsultasi: Konsultasi[]
  vaksinasi: Vaksinasi[]
  transaksi: Transaksi[]
  janjiMendatang: JanjiTemu[]
}

const dataKosong: DataDasbor = { hewan: [], konsultasi: [], vaksinasi: [], transaksi: [], janjiMendatang: [] }

/** Vaksinasi yang masih menunggu proses (belum disuntik atau dibatalkan). */
const statusVaksinMenunggu = ["dijadwalkan", "dikonfirmasi"]

export default function HalamanDasbor() {
  const { klien } = gunakanAuth()

  const { data, memuat, galat } = gunakanData<DataDasbor>(async () => {
    const [hewan, konsultasi, vaksinasi, transaksi, janjiMendatang] = await Promise.all([
      ambilHewan(klien),
      ambilKonsultasi(klien),
      ambilVaksinasi(klien),
      ambilTransaksi(klien),
      ambilJanjiTemuMendatang(klien),
    ])
    return { hewan, konsultasi, vaksinasi, transaksi, janjiMendatang }
  }, dataKosong)

  if (memuat) return <Memuat />

  const konsultasiHariIni = data.konsultasi.filter((konsultasi) => konsultasi.date === tanggalHariIni()).length
  const vaksinMenunggu = data.vaksinasi.filter((vaksin) => statusVaksinMenunggu.includes(vaksin.status)).length
  const { pemasukan } = hitungRingkasanBulanan(data.transaksi)
  const konsultasiPerHari = hitungKonsultasiPerHari(data.konsultasi)
  const adaDataGrafik = konsultasiPerHari.some((hari) => hari.jumlah > 0)

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Dasbor" deskripsi="Ringkasan kondisi klinik hari ini." />
      {galat && <PesanGalat>{galat}</PesanGalat>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuRingkasan ikon={PawPrint} label="Total Hewan" nilai={data.hewan.length} />
        <KartuRingkasan ikon={Stethoscope} label="Konsultasi Hari Ini" nilai={konsultasiHariIni} />
        <KartuRingkasan ikon={Syringe} label="Vaksinasi Menunggu" nilai={vaksinMenunggu} />
        <KartuRingkasan ikon={Wallet} label="Pemasukan Bulan Ini" nilai={formatRupiah(pemasukan)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelKartu judul="Konsultasi per Hari dalam Seminggu" ikon={CalendarDays}>
          <div className="h-[250px]">
            {adaDataGrafik ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={konsultasiPerHari}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="nama" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    formatter={(nilai) => [nilai, "Konsultasi"]}
                    contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  />
                  <Bar dataKey="jumlah" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center">
                <KeadaanKosong ikon={Stethoscope} teks="Belum ada konsultasi untuk ditampilkan di grafik." />
              </div>
            )}
          </div>
        </PanelKartu>

        <PanelKartu judul="Janji Temu Mendatang" ikon={Clock}>
          {data.janjiMendatang.length === 0 ? (
            <KeadaanKosong ikon={CalendarDays} teks="Tidak ada janji temu mendatang." />
          ) : (
            <ul className="space-y-3">
              {data.janjiMendatang.map((janji) => (
                <li key={janji.id} className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
                  <div className="min-w-[72px] rounded-lg bg-primary px-3 py-2 text-center text-primary-foreground">
                    <p className="text-xs">{formatTanggal(janji.date)}</p>
                    <p className="text-sm font-bold">{formatJam(janji.start_time)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{janji.pet?.name ?? "Hewan"}</p>
                    <p className="truncate text-sm text-muted-foreground">Pemilik: {janji.owner?.full_name ?? "-"}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-primary">{janji.purpose}</p>
                    <p className="text-xs text-muted-foreground">{janji.doctor?.full_name ?? "Dokter belum ditentukan"}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PanelKartu>
      </div>
    </div>
  )
}
