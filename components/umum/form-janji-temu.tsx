"use client"

import { useState, type FormEvent } from "react"
import { Tombol } from "@/components/ui/tombol"
import { Input, KolomFormulir, Pilihan, Textarea } from "@/components/ui/input"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanToast } from "@/context/toast-context"
import { buatJanjiTemu } from "@/lib/data/janji-temu"
import { tanggalJadwalMaksimum, tanggalJadwalMinimum, validasiTanggalJadwal } from "@/lib/validasi-tanggal"
import type { Hewan, Profil } from "@/lib/tipe"

interface PropsFormJanjiTemu {
  daftarHewan: Hewan[]
  daftarDokter: Profil[]
  onTersimpan: () => void
}

const pilihanKeperluan = ["Konsultasi", "Vaksinasi", "Pemeriksaan", "Tindakan medis", "Grooming"]

/** Formulir admin untuk membuat janji temu bagi seorang pasien. */
export function FormJanjiTemu({ daftarHewan, daftarDokter, onTersimpan }: PropsFormJanjiTemu) {
  const { klien } = gunakanAuth()
  const { tampilkanToast } = gunakanToast()
  const jalankan = gunakanAksi()

  const [hewanId, setHewanId] = useState("")
  // Dokter boleh dikosongkan dan ditentukan belakangan.
  const [dokterId, setDokterId] = useState("")
  const [tanggal, setTanggal] = useState("")
  const [jamMulai, setJamMulai] = useState("")
  const [keperluan, setKeperluan] = useState("Konsultasi")
  const [catatan, setCatatan] = useState("")
  const [menyimpan, setMenyimpan] = useState(false)

  async function tanganiKirim(kejadian: FormEvent) {
    kejadian.preventDefault()

    const galatTanggal = validasiTanggalJadwal(tanggal)
    if (galatTanggal) {
      tampilkanToast(galatTanggal, "galat")
      return
    }

    setMenyimpan(true)
    const berhasil = await jalankan(
      () =>
        buatJanjiTemu(klien, {
          pet_id: hewanId,
          doctor_id: dokterId || null,
          date: tanggal,
          start_time: jamMulai,
          purpose: keperluan,
          notes: catatan,
        }),
      "Janji temu berhasil dibuat.",
    )
    setMenyimpan(false)

    if (berhasil) {
      setHewanId("")
      setTanggal("")
      setJamMulai("")
      setCatatan("")
      onTersimpan()
    }
  }

  return (
    <form onSubmit={tanganiKirim} className="space-y-4">
      <KolomFormulir label="Pasien">
        <Pilihan required value={hewanId} onChange={(kejadian) => setHewanId(kejadian.target.value)}>
          <option value="">Pilih pasien (hewan - pemilik)</option>
          {daftarHewan.map((hewan) => (
            <option key={hewan.id} value={hewan.id}>
              {hewan.name} - {hewan.owner_name}
            </option>
          ))}
        </Pilihan>
      </KolomFormulir>

      <div className="grid gap-4 sm:grid-cols-2">
        <KolomFormulir label="Tanggal">
          <Input
            type="date"
            required
            min={tanggalJadwalMinimum()}
            max={tanggalJadwalMaksimum()}
            value={tanggal}
            onChange={(kejadian) => setTanggal(kejadian.target.value)}
          />
        </KolomFormulir>
        <KolomFormulir label="Jam">
          <Input type="time" required value={jamMulai} onChange={(kejadian) => setJamMulai(kejadian.target.value)} />
        </KolomFormulir>
      </div>

      <KolomFormulir label="Dokter hewan">
        <Pilihan value={dokterId} onChange={(kejadian) => setDokterId(kejadian.target.value)}>
          <option value="">Belum ditentukan</option>
          {daftarDokter.map((dokter) => (
            <option key={dokter.id} value={dokter.id}>
              {dokter.full_name || "Dokter tanpa nama"}
              {dokter.license_number ? ` - ${dokter.license_number}` : ""}
            </option>
          ))}
        </Pilihan>
      </KolomFormulir>

      <KolomFormulir label="Keperluan">
        <Pilihan value={keperluan} onChange={(kejadian) => setKeperluan(kejadian.target.value)}>
          {pilihanKeperluan.map((pilihan) => (
            <option key={pilihan} value={pilihan}>
              {pilihan}
            </option>
          ))}
        </Pilihan>
      </KolomFormulir>

      <KolomFormulir label="Catatan (opsional)">
        <Textarea
          placeholder="Keluhan atau hal yang perlu diketahui dokter"
          value={catatan}
          onChange={(kejadian) => setCatatan(kejadian.target.value)}
        />
      </KolomFormulir>

      <Tombol type="submit" className="w-full" memuat={menyimpan} disabled={daftarHewan.length === 0}>
        Buat janji temu
      </Tombol>
      {daftarHewan.length === 0 && (
        <p className="text-xs text-muted-foreground">Belum ada pasien terdaftar. Tambahkan pasien di menu Pasien.</p>
      )}
    </form>
  )
}
