"use client"

import { useState } from "react"
import { CheckCircle2, SearchCheck, XCircle } from "lucide-react"
import { JudulHalaman } from "@/components/admin/judul-halaman"
import { BarisAkun } from "@/components/admin/baris-akun"
import { Tombol } from "@/components/ui/tombol"
import { Input, KolomFormulir, Pilihan, Textarea } from "@/components/ui/input"
import { Kartu, PanelKartu } from "@/components/ui/kartu"
import { KeadaanKosong, Memuat, PesanGalat } from "@/components/ui/status"
import { BadanTabel, KepalaTabel, SelKepala, Tabel } from "@/components/ui/tabel"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanData } from "@/hooks/gunakan-data"
import { ambilAkunMenunggu, ambilAkunTerdaftar, setujuiAkun, tolakAkun, ubahPeranAkun } from "@/lib/data/profil"
import { formatTanggal } from "@/lib/format"
import { labelPeran } from "@/lib/label"
import type { Peran, Profil } from "@/lib/tipe"

/** Kartu satu akun yang menunggu keputusan: pilih peran lalu setujui atau tolak. */
function KartuAkunMenunggu({ akun, onSetuju, onTolak }: {
  akun: Profil
  onSetuju: (peran: Peran, nomorStr: string) => Promise<void>
  onTolak: (alasan: string) => Promise<void>
}) {
  const [peran, setPeran] = useState<Peran>("doctor")
  const [nomorStr, setNomorStr] = useState("")
  const [alasan, setAlasan] = useState("")
  const [memproses, setMemproses] = useState(false)

  async function jalankan(kerja: () => Promise<void>) {
    setMemproses(true)
    await kerja()
    setMemproses(false)
  }

  return (
    <Kartu className="p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{akun.full_name || "Nama belum diisi"}</h2>
          <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Email:</span> {akun.email || "-"}
            </p>
            <p>
              <span className="font-medium text-foreground">Telepon:</span> {akun.phone || "-"}
            </p>
            <p>
              <span className="font-medium text-foreground">Mendaftar:</span> {formatTanggal(akun.created_at)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <KolomFormulir label="Setujui sebagai">
            <Pilihan value={peran} onChange={(kejadian) => setPeran(kejadian.target.value as Peran)}>
              {Object.entries(labelPeran).map(([nilai, label]) => (
                <option key={nilai} value={nilai}>
                  {label}
                </option>
              ))}
            </Pilihan>
          </KolomFormulir>

          {peran === "doctor" && (
            <KolomFormulir label="Nomor STR (opsional)">
              <Input value={nomorStr} onChange={(kejadian) => setNomorStr(kejadian.target.value)} />
            </KolomFormulir>
          )}

          <Textarea
            placeholder="Alasan penolakan (opsional)"
            value={alasan}
            onChange={(kejadian) => setAlasan(kejadian.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
            <Tombol disabled={memproses} onClick={() => jalankan(() => onSetuju(peran, nomorStr))}>
              <CheckCircle2 className="h-4 w-4" />
              Setujui
            </Tombol>
            <Tombol varian="bahaya" disabled={memproses} onClick={() => jalankan(() => onTolak(alasan))}>
              <XCircle className="h-4 w-4" />
              Tolak
            </Tombol>
          </div>
        </div>
      </div>
    </Kartu>
  )
}

export default function HalamanPersetujuan() {
  const { klien, pengguna } = gunakanAuth()
  const jalankan = gunakanAksi()

  const { data, memuat, galat, muatUlang } = gunakanData<{ menunggu: Profil[]; terdaftar: Profil[] }>(
    async () => {
      const [menunggu, terdaftar] = await Promise.all([ambilAkunMenunggu(klien), ambilAkunTerdaftar(klien)])
      return { menunggu, terdaftar }
    },
    { menunggu: [], terdaftar: [] },
  )

  async function simpanDanMuatUlang(kerja: () => Promise<unknown>, pesan: string) {
    if (await jalankan(kerja, pesan)) await muatUlang()
  }

  if (memuat) return <Memuat />

  return (
    <div className="space-y-6">
      <JudulHalaman
        judul="Persetujuan Akun"
        deskripsi="Tinjau pendaftar baru, tentukan perannya, lalu setujui atau tolak."
      />
      {galat && <PesanGalat>{galat}</PesanGalat>}

      {data.menunggu.length === 0 ? (
        <Kartu className="py-14">
          <KeadaanKosong ikon={SearchCheck} teks="Tidak ada akun yang menunggu persetujuan." deskripsi="Pendaftar baru akan muncul di sini." />
        </Kartu>
      ) : (
        <div className="space-y-4">
          {data.menunggu.map((akun) => (
            <KartuAkunMenunggu
              key={akun.id}
              akun={akun}
              onSetuju={(peran, nomorStr) =>
                simpanDanMuatUlang(
                  () => setujuiAkun(klien, akun.id, { role: peran, license_number: nomorStr }),
                  `Akun ${akun.full_name || akun.email} disetujui sebagai ${labelPeran[peran]}.`,
                )
              }
              onTolak={(alasan) =>
                simpanDanMuatUlang(() => tolakAkun(klien, akun.id, alasan), `Akun ${akun.full_name || akun.email} ditolak.`)
              }
            />
          ))}
        </div>
      )}

      <PanelKartu judul="Akun Terdaftar" ikon={CheckCircle2}>
        {data.terdaftar.length === 0 ? (
          <KeadaanKosong teks="Belum ada akun yang diputuskan." />
        ) : (
          <Tabel>
            <KepalaTabel>
              <tr>
                <SelKepala>Akun</SelKepala>
                <SelKepala>Status</SelKepala>
                <SelKepala>Mendaftar</SelKepala>
                <SelKepala>Peran</SelKepala>
              </tr>
            </KepalaTabel>
            <BadanTabel>
              {data.terdaftar.map((akun) => (
                <BarisAkun
                  key={akun.id}
                  akun={akun}
                  akunSendiri={akun.id === pengguna?.id}
                  onSimpan={(peran, nomorStr) =>
                    simpanDanMuatUlang(
                      () => ubahPeranAkun(klien, akun.id, { role: peran, license_number: nomorStr }),
                      "Peran akun berhasil diperbarui.",
                    )
                  }
                />
              ))}
            </BadanTabel>
          </Tabel>
        )}
      </PanelKartu>
    </div>
  )
}
