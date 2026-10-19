const formatRupiahIntl = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

/** 150000 -> "Rp 150.000" */
export function formatRupiah(nilai: number | string | null | undefined) {
  return formatRupiahIntl.format(Number(nilai ?? 0))
}

/** "2026-10-05" -> "5 Okt 2026" */
export function formatTanggal(tanggal: string | null | undefined) {
  if (!tanggal) return "-"
  // Ditambah jam agar tidak bergeser sehari karena zona waktu.
  return new Date(`${tanggal.slice(0, 10)}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** "2026-10-09T03:45:00.000Z" -> "9 Okt 2026, 10.45" (menurut zona waktu pengguna). */
export function formatTanggalWaktu(waktuIso: string | null | undefined) {
  if (!waktuIso) return "-"
  const waktu = new Date(waktuIso)
  if (Number.isNaN(waktu.getTime())) return "-"
  return waktu.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

/** Waktu sekarang untuk kolom <input type="datetime-local">, mis. "2026-10-09T10:45". */
export function waktuInputSekarang() {
  const sekarang = new Date()
  const jam = String(sekarang.getHours()).padStart(2, "0")
  const menit = String(sekarang.getMinutes()).padStart(2, "0")
  return `${keTanggalInput(sekarang)}T${jam}:${menit}`
}

/** "10:00:00" -> "10:00" */
export function formatJam(jam: string | null | undefined) {
  return jam ? jam.slice(0, 5) : "-"
}

/** Mengubah objek Date menjadi "YYYY-MM-DD" menurut zona waktu pengguna. */
export function keTanggalInput(tanggal: Date) {
  const tahun = tanggal.getFullYear()
  const bulan = String(tanggal.getMonth() + 1).padStart(2, "0")
  const hari = String(tanggal.getDate()).padStart(2, "0")
  return `${tahun}-${bulan}-${hari}`
}

/** Tanggal hari ini dalam format "YYYY-MM-DD". */
export function tanggalHariIni() {
  return keTanggalInput(new Date())
}
