// Teks tampilan (bahasa Indonesia) dan warna lencana untuk setiap nilai enum.
import type {
  JenisHewan,
  KategoriPemeriksaan,
  Peran,
  StatusJanjiTemu,
  StatusPemeriksaan,
  StatusPersetujuan,
  StatusVaksinasi,
} from "@/lib/tipe"

/** Warna lencana status. */
export type Nada = "netral" | "info" | "sukses" | "peringatan" | "bahaya"

export const labelPeran: Record<Peran, string> = {
  doctor: "Dokter Hewan",
  admin: "Admin",
}

export const labelStatusPersetujuan: Record<StatusPersetujuan, string> = {
  menunggu: "Menunggu persetujuan",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
}

export const labelJenisHewan: Record<JenisHewan, string> = {
  anjing: "Anjing",
  kucing: "Kucing",
  burung: "Burung",
  hewan_pengerat: "Hewan Pengerat",
  kelinci: "Kelinci",
  lainnya: "Lainnya",
}

export const labelStatusJanjiTemu: Record<StatusJanjiTemu, string> = {
  dijadwalkan: "Dijadwalkan",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
}

export const nadaStatusJanjiTemu: Record<StatusJanjiTemu, Nada> = {
  dijadwalkan: "peringatan",
  selesai: "sukses",
  dibatalkan: "bahaya",
}

// Vaksinasi dan pemeriksaan diputuskan dokter sendiri (tidak ada jawaban pemilik).
export const labelStatusVaksinasi: Record<StatusVaksinasi, string> = {
  dijadwalkan: "Menunggu keputusan dokter",
  dikonfirmasi: "Disetujui",
  sudah_disuntik: "Sudah disuntik",
  dibatalkan: "Ditolak",
}

export const nadaStatusVaksinasi: Record<StatusVaksinasi, Nada> = {
  dijadwalkan: "peringatan",
  dikonfirmasi: "info",
  sudah_disuntik: "sukses",
  dibatalkan: "bahaya",
}

export const labelStatusPemeriksaan: Record<StatusPemeriksaan, string> = {
  dijadwalkan: "Menunggu keputusan dokter",
  dikonfirmasi: "Disetujui",
  dibatalkan: "Ditolak",
}

export const nadaStatusPemeriksaan: Record<StatusPemeriksaan, Nada> = {
  dijadwalkan: "peringatan",
  dikonfirmasi: "sukses",
  dibatalkan: "bahaya",
}

export const labelKategoriPemeriksaan: Record<KategoriPemeriksaan, string> = {
  pencitraan: "Pemeriksaan pencitraan",
  laboratorium: "Pemeriksaan laboratorium",
}

/** Pilihan jenis pemeriksaan per kategori. "Lainnya" meminta nama sendiri. */
export const jenisPemeriksaanPerKategori: Record<KategoriPemeriksaan, string[]> = {
  pencitraan: ["Rontgen", "USG", "CT Scan", "MRI", "Ekokardiografi", "Endoskopi", "Lainnya"],
  laboratorium: [
    "Darah Lengkap",
    "Kimia Darah",
    "Urinalisis",
    "Feses",
    "Serologi",
    "Sitologi",
    "Hormon",
    "Parasit",
    "Lainnya",
  ],
}

/** Kategori yang bisa dipilih admin saat mencatat transaksi manual. */
export const kategoriTransaksi = [
  "Konsultasi",
  "Vaksinasi",
  "Pemeriksaan",
  "Tindakan Medis",
  "Obat-obatan",
  "Grooming",
  "Sewa",
  "Utilitas",
  "Gaji",
  "Lainnya",
]

/** Nama pemeriksaan untuk ditampilkan (memakai nama kustom bila jenisnya "Lainnya"). */
export function namaPemeriksaan(pemeriksaan: { type: string; custom_name: string | null }) {
  return pemeriksaan.type === "Lainnya" && pemeriksaan.custom_name ? pemeriksaan.custom_name : pemeriksaan.type
}
