"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { pesanGalat } from "@/lib/galat"

/**
 * Memuat data saat komponen tampil pertama kali.
 *
 *   const { data, memuat, galat, muatUlang } = gunakanData(() => ambilHewan(klien), [])
 *
 * - data       hasil terakhir (nilai awal selama belum selesai)
 * - memuat     true hanya pada pemuatan pertama
 * - galat      pesan galat bila gagal
 * - muatUlang  panggil setelah menyimpan data agar daftar diperbarui
 */
export function gunakanData<T>(pengambil: () => Promise<T>, nilaiAwal: T) {
  const [data, setData] = useState<T>(nilaiAwal)
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState<string | null>(null)

  // Selalu memakai pengambil versi terbaru tanpa memicu pemuatan ulang.
  const pengambilTerbaru = useRef(pengambil)
  useEffect(() => {
    pengambilTerbaru.current = pengambil
  })

  const muatUlang = useCallback(async () => {
    setGalat(null)
    try {
      setData(await pengambilTerbaru.current())
    } catch (kesalahan) {
      setGalat(pesanGalat(kesalahan))
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    muatUlang()
  }, [muatUlang])

  return { data, memuat, galat, muatUlang }
}
