"use client"

import { useState, type FormEvent } from "react"
import { FlaskConical } from "lucide-react"
import { Tombol } from "@/components/ui/tombol"
import { Input, KolomFormulir, Pilihan, Textarea } from "@/components/ui/input"
import { PanelKartu } from "@/components/ui/kartu"
import { PilihanJanjiTemu, janjiBerjalan, janjiTerbaik } from "@/components/dokter/pilihan-janji-temu"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanToast } from "@/context/toast-context"
import { buatPemeriksaan } from "@/lib/data/pemeriksaan"
import { jenisPemeriksaanPerKategori, labelKategoriPemeriksaan } from "@/lib/label"
import { tanggalJadwalMaksimum, tanggalJadwalMinimum, validasiTanggalJadwal } from "@/lib/validasi-tanggal"
import type { Hewan, JanjiTemu, KategoriPemeriksaan } from "@/lib/tipe"

const BIAYA_PEMERIKSAAN_STANDAR = "250000"

interface PropsFormPemeriksaan {
  daftarHewan: Hewan[]
  /** Janji temu dokter; dipakai untuk mengaitkan pemeriksaan ke janji temu yang akan selesai saat disetujui. */
  daftarJanjiTemu: JanjiTemu[]
  onTersimpan: () => void
}

/** Dokter menyarankan pemeriksaan pencitraan / laboratorium, lalu menyetujui atau menolaknya sendiri. */
export function FormPemeriksaan({ daftarHewan, daftarJanjiTemu, onTersimpan }: PropsFormPemeriksaan) {
  const { klien, pengguna } = gunakanAuth()
  const { tampilkanToast } = gunakanToast()
  const jalankan = gunakanAksi()

  const [hewanId, setHewanId] = useState("")
  const [janjiId, setJanjiId] = useState("")
  const [kategori, setKategori] = useState<KategoriPemeriksaan>("pencitraan")
  const [jenis, setJenis] = useState(jenisPemeriksaanPerKategori.pencitraan[0])
  const [namaKustom, setNamaKustom] = useState("")
  const [biaya, setBiaya] = useState(BIAYA_PEMERIKSAAN_STANDAR)
  const [tanggalJadwal, setTanggalJadwal] = useState("")
  const [jamJadwal, setJamJadwal] = useState("")
  const [catatan, setCatatan] = useState("")
  const [menyimpan, setMenyimpan] = useState(false)

  function pilihHewan(id: string) {
    setHewanId(id)
    setJanjiId(janjiTerbaik(janjiBerjalan(daftarJanjiTemu, id), "pemeriksaan"))
  }

  function ubahKategori(kategoriBaru: KategoriPemeriksaan) {
    setKategori(kategoriBaru)
    setJenis(jenisPemeriksaanPerKategori[kategoriBaru][0])
  }

  async function tanganiKirim(kejadian: FormEvent) {
    kejadian.preventDefault()
    if (!pengguna) return

    const galatTanggal = validasiTanggalJadwal(tanggalJadwal)
    if (galatTanggal) {
      tampilkanToast(galatTanggal, "galat")
      return
    }

    setMenyimpan(true)
    const berhasil = await jalankan(
      () =>
        buatPemeriksaan(klien, pengguna.id, {
          pet_id: hewanId,
          category: kategori,
          type: jenis,
          custom_name: namaKustom,
          notes: catatan,
          fee: Number(biaya),
          scheduled_date: tanggalJadwal,
          scheduled_time: jamJadwal,
          appointment_id: janjiId || null,
        }),
      "Pemeriksaan berhasil disarankan. Setujui atau tolak di daftar pemeriksaan di bawah.",
    )
    setMenyimpan(false)

    if (berhasil) {
      setJanjiId("")
      setNamaKustom("")
      setBiaya(BIAYA_PEMERIKSAAN_STANDAR)
      setTanggalJadwal("")
      setJamJadwal("")
      setCatatan("")
      onTersimpan()
    }
  }

  return (
    <PanelKartu judul="Sarankan Pemeriksaan" ikon={FlaskConical}>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <KolomFormulir label="Kategori">
            <Pilihan value={kategori} onChange={(kejadian) => ubahKategori(kejadian.target.value as KategoriPemeriksaan)}>
              {Object.entries(labelKategoriPemeriksaan).map(([nilai, label]) => (
                <option key={nilai} value={nilai}>
                  {label}
                </option>
              ))}
            </Pilihan>
          </KolomFormulir>
          <KolomFormulir label="Jenis pemeriksaan">
            <Pilihan value={jenis} onChange={(kejadian) => setJenis(kejadian.target.value)}>
              {jenisPemeriksaanPerKategori[kategori].map((pilihan) => (
                <option key={pilihan} value={pilihan}>
                  {pilihan}
                </option>
              ))}
            </Pilihan>
          </KolomFormulir>
        </div>

        {jenis === "Lainnya" && (
          <KolomFormulir label="Nama pemeriksaan">
            <Input required value={namaKustom} onChange={(kejadian) => setNamaKustom(kejadian.target.value)} />
          </KolomFormulir>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
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
          <KolomFormulir label="Biaya (Rp)">
            <Input type="number" required min="0" step="1000" value={biaya} onChange={(kejadian) => setBiaya(kejadian.target.value)} />
          </KolomFormulir>
        </div>

        <KolomFormulir label="Catatan (opsional)">
          <Textarea value={catatan} onChange={(kejadian) => setCatatan(kejadian.target.value)} />
        </KolomFormulir>

        <Tombol type="submit" className="w-full" memuat={menyimpan} disabled={daftarHewan.length === 0}>
          Sarankan pemeriksaan
        </Tombol>
      </form>
    </PanelKartu>
  )
}
