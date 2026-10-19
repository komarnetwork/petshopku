import type { Peran, StatusPersetujuan } from "@/lib/tipe"

export const daftarPeran: Peran[] = ["admin", "doctor"]
export const daftarStatusPersetujuan: StatusPersetujuan[] = ["menunggu", "disetujui", "ditolak"]

export function adalahPeran(nilai: unknown): nilai is Peran {
  return daftarPeran.includes(nilai as Peran)
}

export function adalahStatusPersetujuan(nilai: unknown): nilai is StatusPersetujuan {
  return daftarStatusPersetujuan.includes(nilai as StatusPersetujuan)
}

/** Halaman utama untuk tiap peran setelah login. */
export function halamanUtamaPeran(peran: Peran | null | undefined) {
  if (peran === "admin") return "/admin"
  if (peran === "doctor") return "/dokter-hewan"
  return "/"
}
