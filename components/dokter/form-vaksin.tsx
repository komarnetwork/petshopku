"use client"

import { useState, type FormEvent } from "react"
import { Syringe } from "lucide-react"
import { Tombol } from "@/components/ui/tombol"
import { Input, KolomFormulir, Pilihan } from "@/components/ui/input"
import { PanelKartu } from "@/components/ui/kartu"
import { PilihanJanjiTemu, janjiBerjalan, janjiTerbaik } from "@/components/dokter/pilihan-janji-temu"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanToast } from "@/context/toast-context"
import { buatVaksinasi } from "@/lib/data/vaksinasi"
import { tanggalJadwalMaksimum, tanggalJadwalMinimum, validasiTanggalJadwal } from "@/lib/validasi-tanggal"
import type { Hewan, JanjiTemu } from "@/lib/tipe"

const BIAYA_VAKSIN_STANDAR = "150000"

interface PropsFormVaksin {
  daftarHewan: Hewan[]
  /** Janji temu dokter; dipakai untuk mengaitkan vaksinasi ke janji temu yang akan selesai saat disetujui. */
  daftarJanjiTemu: JanjiTemu[]
  onTersimpan: () => void
}

/** Dokter mengusulkan vaksinasi, lalu menyetujui atau menolaknya sendiri di daftar vaksinasi. */
export function FormVaksin({ daftarHewan, daftarJanjiTemu, onTersimpan }: PropsFormVaksin) {
  const { klien, pengguna } = gunakanAuth()
  const { tampilkanToast } = gunakanToast()
  const jalankan = gunakanAksi()

  const [hewanId, setHewanId] = useState("")
  const [janjiId, setJanjiId] = useState("")
  const [namaVaksin, setNamaVaksin] = useState("")
  const [tanggalJadwal, setTanggalJadwal] = useState("")
  const [jamJadwal, setJamJadwal] = useState("")
  const [dosisBerikutnya, setDosisBerikutnya] = useState("")
  const [biaya, setBiaya] = useState(BIAYA_VAKSIN_STANDAR)
  const [menyimpan, setMenyimpan] = useState(false)

  function pilihHewan(id: string) {
    setHewanId(id)
    setJanjiId(janjiTerbaik(janjiBerjalan(daftarJanjiTemu, id), "vaksin"))
  }

  async function tanganiKirim(kejadian: FormEvent) {
    kejadian.preventDefault()
    if (!pengguna) return

    const galatTanggal = validasiTanggalJadwal(tanggalJadwal) ?? validasiTanggalJadwal(dosisBerikutnya)
    if (galatTanggal) {
      tampilkanToast(galatTanggal, "galat")
      return
    }

    setMenyimpan(true)
    const berhasil = await jalankan(
      () =>
        buatVaksinasi(klien, pengguna.id, {
          pet_id: hewanId,
          vaccine_name: namaVaksin,
          scheduled_date: tanggalJadwal,
          scheduled_time: jamJadwal,
          next_dose_date: dosisBerikutnya || null,
          fee: Number(biaya),
          appointment_id: janjiId || null,
        }),
      "Vaksinasi berhasil diusulkan. Setujui atau tolak di daftar vaksinasi di bawah.",
    )
    setMenyimpan(false)

    if (berhasil) {
      setJanjiId("")
      setNamaVaksin("")
      setTanggalJadwal("")
      setJamJadwal("")
      setDosisBerikutnya("")
      setBiaya(BIAYA_VAKSIN_STANDAR)
      onTersimpan()
    }
  }

  return (
    <PanelKartu judul="Usulkan Vaksinasi" ikon={Syringe}>
      <form onSubmit={tanganiKirim} className="space-y-4">
        <KolomFormulir label="Hewan">
          <Pilihan required value={hewanId} onChange={(kejadian) => pilihHewan(kejadian.target.value)}>
            <option value="">Pilih hewan</option>
            {daftarHewan.map((hewan) => (
              <option key={hewan.id} value={hewan.id}>
                {hewan.name} - {hewan.owner_name}
              </option>
            ))}
          </Pilihan>
        </KolomFormulir>

        <PilihanJanjiTemu kandidat={janjiBerjalan(daftarJanjiTemu, hewanId)} nilai={janjiId} onUbah={setJanjiId} />

        <KolomFormulir label="Nama vaksin">
          <Input required placeholder="Mis. Vaksin Rabies" value={namaVaksin} onChange={(kejadian) => setNamaVaksin(kejadian.target.value)} />
        </KolomFormulir>

        <div className="grid gap-4 sm:grid-cols-2">
          <KolomFormulir label="Tanggal usulan">
            <Input
              type="date"
              required
              min={tanggalJadwalMinimum()}
              max={tanggalJadwalMaksimum()}
              value={tanggalJadwal}
              onChange={(kejadian) => setTanggalJadwal(kejadian.target.value)}
            />
          </KolomFormulir>
          <KolomFormulir label="Jam usulan">
            <Input type="time" required value={jamJadwal} onChange={(kejadian) => setJamJadwal(kejadian.target.value)} />
          </KolomFormulir>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <KolomFormulir label="Dosis berikutnya (opsional)">
            <Input
              type="date"
              min={tanggalJadwalMinimum()}
              value={dosisBerikutnya}
              onChange={(kejadian) => setDosisBerikutnya(kejadian.target.value)}
            />
          </KolomFormulir>
          <KolomFormulir label="Biaya (Rp)">
            <Input type="number" required min="0" step="1000" value={biaya} onChange={(kejadian) => setBiaya(kejadian.target.value)} />
          </KolomFormulir>
        </div>

        <Tombol type="submit" className="w-full" memuat={menyimpan} disabled={daftarHewan.length === 0}>
          Usulkan vaksinasi
        </Tombol>
        {daftarHewan.length === 0 && (
          <p className="text-xs text-muted-foreground">Belum ada hewan yang bisa dipilih. Hewan muncul setelah ada janji temu dengan Anda.</p>
        )}
      </form>
    </PanelKartu>
  )
}
