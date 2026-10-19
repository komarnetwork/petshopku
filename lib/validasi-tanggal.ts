import { keTanggalInput, tanggalHariIni } from "@/lib/format"

/** Jadwal hanya boleh dibuat sampai sekian bulan ke depan. */
export const BATAS_BULAN_JADWAL = 3

/** Tanggal paling awal untuk jadwal (hari ini). */
export function tanggalJadwalMinimum() {
  return tanggalHariIni()
}

/** Tanggal paling akhir untuk jadwal. */
export function tanggalJadwalMaksimum() {
  const batas = new Date()
  batas.setMonth(batas.getMonth() + BATAS_BULAN_JADWAL)
  return keTanggalInput(batas)
}

/** Mengembalikan pesan galat bila tanggal di luar batas, atau null bila valid. */
export function validasiTanggalJadwal(tanggal: string): string | null {
  if (!tanggal) return null
  if (tanggal < tanggalJadwalMinimum()) return "Tanggal tidak boleh sebelum hari ini."
  if (tanggal > tanggalJadwalMaksimum()) {
    return `Tanggal tidak boleh lebih dari ${BATAS_BULAN_JADWAL} bulan ke depan.`
  }
  return null
}
