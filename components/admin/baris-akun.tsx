"use client"

import { useState } from "react"
import { Tombol } from "@/components/ui/tombol"
import { Input, Pilihan } from "@/components/ui/input"
import { Lencana } from "@/components/ui/lencana"
import { Sel } from "@/components/ui/tabel"
import { formatTanggal } from "@/lib/format"
import { labelPeran, labelStatusPersetujuan } from "@/lib/label"
import type { Peran, Profil } from "@/lib/tipe"

interface PropsBarisAkun {
  akun: Profil
  /** Akun milik admin yang sedang login tidak boleh diubah perannya. */
  akunSendiri: boolean
  onSimpan: (peran: Peran, nomorStr: string) => Promise<void>
}

/** Satu baris tabel akun terdaftar: admin dapat mengubah peran dan nomor STR. */
export function BarisAkun({ akun, akunSendiri, onSimpan }: PropsBarisAkun) {
  const [peran, setPeran] = useState<Peran>(akun.role)
  const [nomorStr, setNomorStr] = useState(akun.license_number ?? "")
  const [menyimpan, setMenyimpan] = useState(false)

  const adaPerubahan = peran !== akun.role || (peran === "doctor" && nomorStr !== (akun.license_number ?? ""))

  async function simpan() {
    setMenyimpan(true)
    await onSimpan(peran, nomorStr)
    setMenyimpan(false)
  }

  return (
    <tr>
      <Sel>
        <p className="font-medium">{akun.full_name || "Tanpa nama"}</p>
        <p className="text-xs text-muted-foreground">{akun.email}</p>
      </Sel>
      <Sel>
        <Lencana nada={akun.approval_status === "disetujui" ? "sukses" : "bahaya"}>
          {labelStatusPersetujuan[akun.approval_status]}
        </Lencana>
      </Sel>
      <Sel>{formatTanggal(akun.created_at)}</Sel>
      <Sel>
        {akun.approval_status === "disetujui" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Pilihan
              value={peran}
              disabled={akunSendiri}
              onChange={(kejadian) => setPeran(kejadian.target.value as Peran)}
              className="h-9 w-40"
            >
              {Object.entries(labelPeran).map(([nilai, label]) => (
                <option key={nilai} value={nilai}>
                  {label}
                </option>
              ))}
            </Pilihan>
            {peran === "doctor" && (
              <Input
                placeholder="Nomor STR"
                value={nomorStr}
                onChange={(kejadian) => setNomorStr(kejadian.target.value)}
                className="h-9 w-36"
              />
            )}
            <Tombol ukuran="kecil" onClick={simpan} memuat={menyimpan} disabled={!adaPerubahan || akunSendiri}>
              Simpan
            </Tombol>
          </div>
        ) : (
          <span className="text-muted-foreground">{labelPeran[akun.role]}</span>
        )}
      </Sel>
    </tr>
  )
}
