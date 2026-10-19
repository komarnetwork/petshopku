"use client"

import { useState, type FormEvent } from "react"
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp, Wallet } from "lucide-react"
import { JudulHalaman } from "@/components/admin/judul-halaman"
import { KartuRingkasan } from "@/components/umum/kartu-ringkasan"
import { Tombol } from "@/components/ui/tombol"
import { Input, InputRupiah, KolomFormulir, Pilihan } from "@/components/ui/input"
import { Lencana } from "@/components/ui/lencana"
import { Modal } from "@/components/ui/modal"
import { KeadaanKosong, Memuat, PesanGalat } from "@/components/ui/status"
import { BadanTabel, KepalaTabel, Sel, SelKepala, Tabel } from "@/components/ui/tabel"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanData } from "@/hooks/gunakan-data"
import { ambilTransaksi, catatTransaksiManual, hitungRingkasanBulanan } from "@/lib/data/transaksi"
import { formatRupiah, formatTanggal, tanggalHariIni } from "@/lib/format"
import { kategoriTransaksi } from "@/lib/label"
import type { JenisTransaksi, Transaksi } from "@/lib/tipe"

/** Isian awal formulir transaksi manual. */
const isianAwal = {
  description: "",
  type: "pemasukan" as JenisTransaksi,
  amount: "",
  date: tanggalHariIni(),
  category: kategoriTransaksi[0],
}

export default function HalamanKeuangan() {
  const { klien } = gunakanAuth()
  const jalankan = gunakanAksi()

  const [formTerbuka, setFormTerbuka] = useState(false)
  const [isian, setIsian] = useState(isianAwal)
  const [menyimpan, setMenyimpan] = useState(false)

  const { data: daftarTransaksi, memuat, galat, muatUlang } = gunakanData<Transaksi[]>(() => ambilTransaksi(klien), [])

  async function tanganiKirim(kejadian: FormEvent) {
    kejadian.preventDefault()

    setMenyimpan(true)
    const berhasil = await jalankan(
      () => catatTransaksiManual(klien, { ...isian, amount: Number(isian.amount) }),
      "Transaksi berhasil dicatat.",
    )
    setMenyimpan(false)

    if (berhasil) {
      setFormTerbuka(false)
      setIsian({ ...isianAwal, date: tanggalHariIni() })
      muatUlang()
    }
  }

  if (memuat) return <Memuat />

  const { pemasukan, pengeluaran, laba } = hitungRingkasanBulanan(daftarTransaksi)

  return (
    <div className="space-y-6">
      <JudulHalaman
        judul="Keuangan"
        deskripsi="Pemasukan dari layanan tercatat otomatis. Anda dapat menambahkan transaksi lain secara manual."
        aksi={
          <Tombol onClick={() => setFormTerbuka(true)}>
            <Plus className="h-4 w-4" />
            Catat transaksi
          </Tombol>
        }
      />
      {galat && <PesanGalat>{galat}</PesanGalat>}

      <div className="grid gap-4 sm:grid-cols-3">
        <KartuRingkasan ikon={ArrowUpRight} label="Pemasukan Bulan Ini" nilai={formatRupiah(pemasukan)} />
        <KartuRingkasan ikon={ArrowDownRight} label="Pengeluaran Bulan Ini" nilai={formatRupiah(pengeluaran)} />
        <KartuRingkasan ikon={TrendingUp} label="Laba Bulan Ini" nilai={formatRupiah(laba)} />
      </div>

      {daftarTransaksi.length === 0 ? (
        <KeadaanKosong ikon={Wallet} teks="Belum ada transaksi." deskripsi="Transaksi layanan muncul otomatis saat janji temu selesai atau dokter menyetujui vaksinasi / pemeriksaan." />
      ) : (
        <Tabel>
          <KepalaTabel>
            <tr>
              <SelKepala>Tanggal</SelKepala>
              <SelKepala>Deskripsi</SelKepala>
              <SelKepala>Kategori</SelKepala>
              <SelKepala>Sumber</SelKepala>
              <SelKepala>Status</SelKepala>
              <SelKepala className="text-right">Jumlah</SelKepala>
            </tr>
          </KepalaTabel>
          <BadanTabel>
            {daftarTransaksi.map((transaksi) => {
              const otomatis = Boolean(transaksi.appointment_id || transaksi.vaccination_id || transaksi.examination_id)
              return (
                <tr key={transaksi.id} className={transaksi.status === "dibatalkan" ? "opacity-50" : undefined}>
                  <Sel className="whitespace-nowrap">{formatTanggal(transaksi.date)}</Sel>
                  <Sel>{transaksi.description}</Sel>
                  <Sel>{transaksi.category}</Sel>
                  <Sel>
                    <Lencana nada={otomatis ? "info" : "netral"}>{otomatis ? "Otomatis" : "Manual"}</Lencana>
                  </Sel>
                  <Sel>
                    <Lencana nada={transaksi.status === "aktif" ? "sukses" : "bahaya"}>
                      {transaksi.status === "aktif" ? "Aktif" : "Dibatalkan"}
                    </Lencana>
                  </Sel>
                  <Sel className={`whitespace-nowrap text-right font-semibold ${transaksi.type === "pemasukan" ? "text-emerald-700" : "text-red-700"}`}>
                    {transaksi.type === "pemasukan" ? "+" : "-"} {formatRupiah(transaksi.amount)}
                  </Sel>
                </tr>
              )
            })}
          </BadanTabel>
        </Tabel>
      )}

      <Modal terbuka={formTerbuka} onTutup={() => setFormTerbuka(false)} judul="Catat Transaksi">
        <form onSubmit={tanganiKirim} className="space-y-4">
          <KolomFormulir label="Deskripsi">
            <Input
              required
              placeholder="Mis. Pembelian obat"
              value={isian.description}
              onChange={(kejadian) => setIsian({ ...isian, description: kejadian.target.value })}
            />
          </KolomFormulir>

          <div className="grid gap-4 sm:grid-cols-2">
            <KolomFormulir label="Jenis">
              <Pilihan value={isian.type} onChange={(kejadian) => setIsian({ ...isian, type: kejadian.target.value as JenisTransaksi })}>
                <option value="pemasukan">Pemasukan</option>
                <option value="pengeluaran">Pengeluaran</option>
              </Pilihan>
            </KolomFormulir>
            <KolomFormulir label="Kategori">
              <Pilihan value={isian.category} onChange={(kejadian) => setIsian({ ...isian, category: kejadian.target.value })}>
                {kategoriTransaksi.map((kategori) => (
                  <option key={kategori} value={kategori}>
                    {kategori}
                  </option>
                ))}
              </Pilihan>
            </KolomFormulir>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <KolomFormulir label="Jumlah (Rp)">
              <InputRupiah required nilai={isian.amount} onUbah={(angka) => setIsian({ ...isian, amount: angka })} />
            </KolomFormulir>
            <KolomFormulir label="Tanggal">
              <Input
                type="date"
                required
                value={isian.date}
                onChange={(kejadian) => setIsian({ ...isian, date: kejadian.target.value })}
              />
            </KolomFormulir>
          </div>

          <Tombol type="submit" className="w-full" memuat={menyimpan} disabled={!Number(isian.amount)}>
            Simpan transaksi
          </Tombol>
        </form>
      </Modal>
    </div>
  )
}
