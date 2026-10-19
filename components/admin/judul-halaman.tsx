import type { ReactNode } from "react"

interface PropsJudulHalaman {
  judul: string
  deskripsi: string
  /** Elemen di sisi kanan, mis. tombol "Tambah". */
  aksi?: ReactNode
}

/** Judul di bagian atas setiap halaman admin. */
export function JudulHalaman({ judul, deskripsi, aksi }: PropsJudulHalaman) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold">{judul}</h1>
        <p className="mt-1 text-muted-foreground">{deskripsi}</p>
      </div>
      {aksi}
    </div>
  )
}
