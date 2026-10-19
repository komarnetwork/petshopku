"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Memuat } from "@/components/ui/status"
import { gunakanAuth, type Pengguna } from "@/context/auth-context"
import { adalahPeran, adalahStatusPersetujuan, halamanUtamaPeran } from "@/lib/peran"
import type { Peran, Profil } from "@/lib/tipe"

// Penjaga akses (dulu proxy.ts): memastikan pengunjung sudah login, sudah disetujui, dan hanya
// membuka halaman sesuai perannya. Firebase Authentication hidup di browser, jadi pemeriksaan
// ini berjalan di browser. Pengaman sebenarnya tetap aturan akses database (database.rules.json):
// halaman yang terbuka tanpa hak akses hanya menampilkan kesalahan, bukan data.

/**
 *  peran      halaman khusus satu peran (admin / dokter hewan)
 *  tamu       halaman masuk / daftar: hanya untuk yang belum login
 *  menunggu   halaman "menunggu persetujuan"
 */
export type AturanAkses = { jenis: "peran"; peran: Peran } | { jenis: "tamu" } | { jenis: "menunggu" }

type Keputusan = { aksi: "izinkan" } | { aksi: "tolak" } | { aksi: "alihkan"; tujuan: string }

const izinkan: Keputusan = { aksi: "izinkan" }

function alihkan(tujuan: string): Keputusan {
  return { aksi: "alihkan", tujuan }
}

function tentukanKeputusan(aturan: AturanAkses, pengguna: Pengguna | null, profil: Profil | null, jalur: string): Keputusan {
  // 1. Belum login.
  if (!pengguna) {
    return aturan.jenis === "tamu" ? izinkan : alihkan(`/masuk?${new URLSearchParams({ lanjut: jalur })}`)
  }

  // 2. Sudah login: lihat peran dan status persetujuannya. Tanpa profil (atau peran tidak
  //    dikenal) akun diperlakukan seperti belum disetujui.
  const status = adalahStatusPersetujuan(profil?.approval_status) ? profil.approval_status : "menunggu"
  const peran = adalahPeran(profil?.role) ? profil.role : null

  if (status === "menunggu" || !peran) {
    return aturan.jenis === "menunggu" ? izinkan : alihkan("/menunggu-persetujuan")
  }

  if (status === "ditolak") {
    return aturan.jenis === "tamu" ? izinkan : { aksi: "tolak" }
  }

  // 3. Disetujui: halaman tamu & halaman menunggu tidak diperlukan lagi.
  if (aturan.jenis !== "peran") return alihkan(halamanUtamaPeran(peran))

  // Hanya boleh membuka halaman milik perannya sendiri.
  return peran === aturan.peran ? izinkan : alihkan(halamanUtamaPeran(peran))
}

export function PenjagaAkses({ aturan, children }: { aturan: AturanAkses; children: ReactNode }) {
  const router = useRouter()
  const jalur = usePathname()
  const { pengguna, profil, memuat, baruKeluar, keluar } = gunakanAuth()
  const sudahDiperiksa = useRef(false)

  const keputusan = memuat ? null : tentukanKeputusan(aturan, pengguna, profil, jalur)
  const kunci = !keputusan ? "memuat" : keputusan.aksi === "alihkan" ? `alihkan:${keputusan.tujuan}` : keputusan.aksi

  useEffect(() => {
    if (!keputusan || keputusan.aksi === "izinkan") return

    // Halaman tamu hanya memeriksa keadaan saat dibuka. Setelah itu halaman masuk / daftar
    // sendiri yang mengarahkan pengguna (mis. kembali ke alamat ?lanjut=...).
    if (aturan.jenis === "tamu") {
      if (sudahDiperiksa.current) return
      sudahDiperiksa.current = true
    }

    // Pengguna menekan Keluar: tujuan ditentukan oleh tombol itu, bukan oleh penjaga.
    if (!pengguna && baruKeluar) return

    if (keputusan.aksi === "tolak") {
      keluar().then(() => router.replace("/masuk?ditolak=1"))
      return
    }

    router.replace(keputusan.tujuan)
    // Keputusan dihitung ulang tiap render; yang perlu dijalankan ulang hanya bila hasilnya berubah.
  }, [kunci])

  // Halaman tamu langsung tampil; halaman lain menunggu sampai akses terbukti sah.
  if (aturan.jenis === "tamu") return <>{children}</>
  return keputusan?.aksi === "izinkan" ? <>{children}</> : <Memuat layarPenuh />
}
