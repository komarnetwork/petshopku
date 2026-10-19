"use client"

import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanAuth } from "@/context/auth-context"
import { arsipkan, hapusPermanen, type TabelArsip } from "@/lib/data/arsip"

const PESAN_KONFIRMASI_HAPUS = "Hapus data ini secara permanen? Tindakan ini tidak dapat dibatalkan."

/**
 * Aksi arsipkan dan hapus untuk halaman admin.
 * Setelah berhasil, daftar dimuat ulang lewat `muatUlang`.
 * Kedua fungsi mengembalikan true bila aksinya benar-benar dilakukan.
 */
export function gunakanAksiArsip(tabel: TabelArsip, muatUlang: () => void) {
  const { klien } = gunakanAuth()
  const jalankan = gunakanAksi()

  async function arsipkanItem(id: string) {
    const berhasil = await jalankan(() => arsipkan(klien, tabel, id), "Data dipindahkan ke arsip.")
    if (berhasil) muatUlang()
    return berhasil
  }

  async function hapusItem(id: string) {
    if (!window.confirm(PESAN_KONFIRMASI_HAPUS)) return false

    const berhasil = await jalankan(() => hapusPermanen(klien, tabel, id), "Data dihapus permanen.")
    if (berhasil) muatUlang()
    return berhasil
  }

  return { arsipkanItem, hapusItem }
}
