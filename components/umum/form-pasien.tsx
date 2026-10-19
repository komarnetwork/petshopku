"use client"

import { useState, type FormEvent } from "react"
import { Tombol } from "@/components/ui/tombol"
import { Input, KolomFormulir, Pilihan, Textarea } from "@/components/ui/input"
import { labelJenisHewan } from "@/lib/label"
import type { MasukanHewan } from "@/lib/data/hewan"
import type { Hewan, JenisHewan } from "@/lib/tipe"

interface PropsFormPasien {
  /** Diisi saat mengubah pasien yang sudah ada. */
  pasienAwal?: Hewan | null
  sedangMenyimpan: boolean
  labelTombol: string
  onSimpan: (masukan: MasukanHewan) => void
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-primary">{judul}</legend>
      {children}
    </fieldset>
  )
}

/** Satu formulir untuk mendaftarkan pasien: data pemilik dan data hewannya sekaligus. */
export function FormPasien({ pasienAwal, sedangMenyimpan, labelTombol, onSimpan }: PropsFormPasien) {
  const [namaPemilik, setNamaPemilik] = useState(pasienAwal?.owner_name ?? "")
  const [telepon, setTelepon] = useState(pasienAwal?.owner_phone ?? "")
  const [email, setEmail] = useState(pasienAwal?.owner_email ?? "")
  const [alamat, setAlamat] = useState(pasienAwal?.owner_address ?? "")

  const [nama, setNama] = useState(pasienAwal?.name ?? "")
  const [jenis, setJenis] = useState<JenisHewan>(pasienAwal?.species ?? "anjing")
  const [ras, setRas] = useState(pasienAwal?.breed ?? "")
  const [tanggalLahir, setTanggalLahir] = useState(pasienAwal?.birth_date ?? "")
  const [beratKg, setBeratKg] = useState(pasienAwal?.weight_kg?.toString() ?? "")

  function tanganiKirim(kejadian: FormEvent) {
    kejadian.preventDefault()
    onSimpan({
      owner_name: namaPemilik,
      owner_phone: telepon || null,
      owner_email: email || null,
      owner_address: alamat || null,
      name: nama,
      species: jenis,
      breed: ras,
      birth_date: tanggalLahir || null,
      weight_kg: beratKg ? Number(beratKg) : null,
    })
  }

  return (
    <form onSubmit={tanganiKirim} className="space-y-6">
      <Bagian judul="Pemilik">
        <KolomFormulir label="Nama pemilik">
          <Input required autoComplete="off" value={namaPemilik} onChange={(kejadian) => setNamaPemilik(kejadian.target.value)} />
        </KolomFormulir>

        <div className="grid gap-4 sm:grid-cols-2">
          <KolomFormulir label="Nomor telepon">
            <Input
              type="tel"
              autoComplete="off"
              placeholder="08123456789"
              value={telepon}
              onChange={(kejadian) => setTelepon(kejadian.target.value)}
            />
          </KolomFormulir>
          <KolomFormulir label="Email (opsional)">
            <Input
              type="email"
              autoComplete="off"
              placeholder="nama@email.com"
              value={email}
              onChange={(kejadian) => setEmail(kejadian.target.value)}
            />
          </KolomFormulir>
        </div>

        <KolomFormulir label="Alamat (opsional)">
          <Textarea value={alamat} onChange={(kejadian) => setAlamat(kejadian.target.value)} />
        </KolomFormulir>
      </Bagian>

      <Bagian judul="Hewan">
        <KolomFormulir label="Nama hewan">
          <Input required autoComplete="off" value={nama} onChange={(kejadian) => setNama(kejadian.target.value)} />
        </KolomFormulir>

        <div className="grid gap-4 sm:grid-cols-2">
          <KolomFormulir label="Jenis hewan">
            <Pilihan value={jenis} onChange={(kejadian) => setJenis(kejadian.target.value as JenisHewan)}>
              {Object.entries(labelJenisHewan).map(([nilai, label]) => (
                <option key={nilai} value={nilai}>
                  {label}
                </option>
              ))}
            </Pilihan>
          </KolomFormulir>
          <KolomFormulir label="Ras">
            <Input required placeholder="Mis. Persia" value={ras} onChange={(kejadian) => setRas(kejadian.target.value)} />
          </KolomFormulir>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <KolomFormulir label="Tanggal lahir (opsional)">
            <Input type="date" value={tanggalLahir} onChange={(kejadian) => setTanggalLahir(kejadian.target.value)} />
          </KolomFormulir>
          <KolomFormulir label="Berat, kg (opsional)">
            <Input type="number" min="0.01" step="0.01" value={beratKg} onChange={(kejadian) => setBeratKg(kejadian.target.value)} />
          </KolomFormulir>
        </div>
      </Bagian>

      <Tombol type="submit" className="w-full" memuat={sedangMenyimpan}>
        {labelTombol}
      </Tombol>
    </form>
  )
}
