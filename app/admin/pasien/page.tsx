"use client"

import { useState } from "react"
import { PawPrint, Plus } from "lucide-react"
import { JudulHalaman } from "@/components/admin/judul-halaman"
import { KotakCari, cocokPencarian } from "@/components/admin/kotak-cari"
import { TombolAksiArsip } from "@/components/admin/tombol-aksi-arsip"
import { FormPasien } from "@/components/umum/form-pasien"
import { Tombol } from "@/components/ui/tombol"
import { Modal } from "@/components/ui/modal"
import { KeadaanKosong, Memuat, PesanGalat } from "@/components/ui/status"
import { BadanTabel, KepalaTabel, Sel, SelKepala, Tabel } from "@/components/ui/tabel"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanAksiArsip } from "@/hooks/gunakan-aksi-arsip"
import { gunakanData } from "@/hooks/gunakan-data"
import { ambilHewan, tambahHewan, ubahHewan, type MasukanHewan } from "@/lib/data/hewan"
import { formatTanggal } from "@/lib/format"
import { labelJenisHewan } from "@/lib/label"
import type { Hewan } from "@/lib/tipe"

/** Jendela yang sedang terbuka: daftarkan pasien baru atau ubah pasien yang dipilih. */
type JendelaPasien = { mode: "tambah" } | { mode: "ubah"; pasien: Hewan } | null

export default function HalamanPasienAdmin() {
  const { klien } = gunakanAuth()
  const jalankan = gunakanAksi()

  const [kataCari, setKataCari] = useState("")
  const [jendela, setJendela] = useState<JendelaPasien>(null)
  const [menyimpan, setMenyimpan] = useState(false)

  const { data: daftarPasien, memuat, galat, muatUlang } = gunakanData<Hewan[]>(() => ambilHewan(klien), [])
  const { arsipkanItem, hapusItem } = gunakanAksiArsip("pets", muatUlang)

  async function simpanPasien(masukan: MasukanHewan) {
    setMenyimpan(true)
    const berhasil = await jalankan(
      () => (jendela?.mode === "ubah" ? ubahHewan(klien, jendela.pasien.id, masukan) : tambahHewan(klien, masukan)),
      jendela?.mode === "ubah" ? "Data pasien diperbarui." : "Pasien berhasil didaftarkan.",
    )
    setMenyimpan(false)

    if (berhasil) {
      setJendela(null)
      muatUlang()
    }
  }

  if (memuat) return <Memuat />

  const pasienTersaring = daftarPasien.filter((pasien) =>
    cocokPencarian(
      kataCari,
      pasien.name,
      pasien.breed,
      pasien.owner_name,
      pasien.owner_phone,
      labelJenisHewan[pasien.species],
    ),
  )

  return (
    <div className="space-y-6">
      <JudulHalaman
        judul="Pasien"
        deskripsi="Data pemilik dan hewannya dicatat bersama dalam satu formulir."
        aksi={
          <Tombol onClick={() => setJendela({ mode: "tambah" })}>
            <Plus className="h-4 w-4" />
            Tambah pasien
          </Tombol>
        }
      />
      {galat && <PesanGalat>{galat}</PesanGalat>}

      <div className="max-w-md">
        <KotakCari nilai={kataCari} onUbah={setKataCari} placeholder="Cari hewan, ras, atau pemilik" />
      </div>

      {pasienTersaring.length === 0 ? (
        <KeadaanKosong ikon={PawPrint} teks={kataCari ? "Tidak ada pasien yang cocok dengan pencarian." : "Belum ada pasien terdaftar."} />
      ) : (
        <Tabel>
          <KepalaTabel>
            <tr>
              <SelKepala>Hewan</SelKepala>
              <SelKepala>Pemilik</SelKepala>
              <SelKepala>Lahir</SelKepala>
              <SelKepala>Berat</SelKepala>
              <SelKepala>Aksi</SelKepala>
            </tr>
          </KepalaTabel>
          <BadanTabel>
            {pasienTersaring.map((pasien) => (
              <tr key={pasien.id}>
                <Sel>
                  <p className="font-medium">{pasien.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {labelJenisHewan[pasien.species]} · {pasien.breed}
                  </p>
                </Sel>
                <Sel>
                  <p className="font-medium">{pasien.owner_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[pasien.owner_phone, pasien.owner_email].filter(Boolean).join(" · ") || "-"}
                  </p>
                  {pasien.owner_address && <p className="max-w-56 truncate text-xs text-muted-foreground">{pasien.owner_address}</p>}
                </Sel>
                <Sel>{formatTanggal(pasien.birth_date)}</Sel>
                <Sel>{pasien.weight_kg ? `${pasien.weight_kg} kg` : "-"}</Sel>
                <Sel>
                  <div className="flex flex-wrap gap-2">
                    <Tombol varian="garis" ukuran="kecil" onClick={() => setJendela({ mode: "ubah", pasien })}>
                      Ubah
                    </Tombol>
                    <TombolAksiArsip onArsip={() => arsipkanItem(pasien.id)} onHapus={() => hapusItem(pasien.id)} />
                  </div>
                </Sel>
              </tr>
            ))}
          </BadanTabel>
        </Tabel>
      )}

      <Modal
        terbuka={jendela !== null}
        onTutup={() => setJendela(null)}
        judul={jendela?.mode === "ubah" ? "Ubah Data Pasien" : "Tambah Pasien"}
      >
        <FormPasien
          pasienAwal={jendela?.mode === "ubah" ? jendela.pasien : null}
          sedangMenyimpan={menyimpan}
          labelTombol={jendela?.mode === "ubah" ? "Simpan perubahan" : "Simpan pasien"}
          onSimpan={simpanPasien}
        />
      </Modal>
    </div>
  )
}
