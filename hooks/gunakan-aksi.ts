"use client"

import { useCallback } from "react"
import { gunakanToast } from "@/context/toast-context"
import { pesanGalat } from "@/lib/galat"

/**
 * Menjalankan sebuah aksi (simpan, hapus, dll) dan menampilkan notifikasi
 * berhasil / gagal secara otomatis.
 *
 *   const jalankan = gunakanAksi()
 *   const berhasil = await jalankan(() => arsipkan(klien, "hewan", id), "Hewan diarsipkan.")
 *
 * `pesanSukses` boleh berupa fungsi yang menerima hasil aksi, bila pesannya bergantung pada hasil itu.
 * Mengembalikan true bila aksi berhasil.
 */
export function gunakanAksi() {
  const { tampilkanToast } = gunakanToast()

  return useCallback(
    async (kerja: () => Promise<unknown>, pesanSukses: string | ((hasil: unknown) => string)) => {
      try {
        const hasil = await kerja()
        tampilkanToast(typeof pesanSukses === "function" ? pesanSukses(hasil) : pesanSukses)
        return true
      } catch (kesalahan) {
        tampilkanToast(pesanGalat(kesalahan), "galat")
        return false
      }
    },
    [tampilkanToast],
  )
}
