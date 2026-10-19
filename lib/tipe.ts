// Tipe data yang mengikuti isi node di Firebase Realtime Database.
// Nama field sengaja berbahasa Inggris dan sama persis dengan yang tersimpan di database
// (node profiles, pets, appointments, ...) agar tidak perlu pemetaan. Nama tipe dan nilai
// statusnya tetap bahasa Indonesia.

export type Peran = "admin" | "doctor"
export type StatusPersetujuan = "menunggu" | "disetujui" | "ditolak"
export type JenisHewan = "anjing" | "kucing" | "burung" | "hewan_pengerat" | "kelinci" | "lainnya"
/** Admin menjadwalkan; dokter menyelesaikan; admin dapat membatalkan. */
export type StatusJanjiTemu = "dijadwalkan" | "selesai" | "dibatalkan"
/** Dokter mengusulkan (dijadwalkan), lalu dokter pula yang menyetujui (dikonfirmasi) atau menolak (dibatalkan). */
export type StatusVaksinasi = "dijadwalkan" | "dikonfirmasi" | "sudah_disuntik" | "dibatalkan"
export type StatusPemeriksaan = "dijadwalkan" | "dikonfirmasi" | "dibatalkan"
export type KategoriPemeriksaan = "pencitraan" | "laboratorium"
export type JenisTransaksi = "pemasukan" | "pengeluaran"
export type StatusTransaksi = "aktif" | "dibatalkan"
export type TipeRiwayat = "konsultasi" | "vaksinasi" | "pemeriksaan"

/** Kolom arsip yang dimiliki node pets, appointments, consultations, vaccinations, examinations. */
interface DataArsip {
  is_archived: boolean
  archived_at: string | null
}

/** Satu node profiles/{uid}: akun admin atau dokter hewan. */
export interface Profil {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: Peran
  license_number: string | null
  approval_status: StatusPersetujuan
  rejection_reason: string | null
  created_at: string
}

/** Ringkasan dokter yang dilampirkan bersama data lain. */
export interface RingkasanProfil {
  id: string
  full_name: string | null
  email?: string | null
  license_number?: string | null
}

/** Ringkasan pemilik hewan. Pemilik tidak punya akun; datanya disimpan bersama hewannya. */
export interface RingkasanPemilik {
  full_name: string
  phone?: string | null
  email?: string | null
}

export interface RingkasanHewan {
  id: string
  name: string
  species: JenisHewan
  breed: string
}

/** Pasien: satu hewan beserta pemiliknya, dicatat admin dalam satu formulir. */
export interface Hewan extends DataArsip {
  id: string
  name: string
  species: JenisHewan
  breed: string
  birth_date: string | null
  weight_kg: number | null
  photo_url: string | null
  created_at: string
  owner_name: string
  owner_phone: string | null
  owner_email: string | null
  owner_address: string | null
  /** Ringkasan pemilik, dihitung dari kolom owner_*. */
  owner: RingkasanPemilik
}

export interface JanjiTemu extends DataArsip {
  id: string
  pet_id: string
  doctor_id: string | null
  date: string
  start_time: string
  end_time: string
  purpose: string
  notes: string | null
  status: StatusJanjiTemu
  estimated_price: number
  /** Tanggal dan jam (ISO) dokter menyelesaikan pemeriksaan; terisi saat status "selesai". */
  completed_at: string | null
  /** Terisi bila janji temu selesai karena dokter menyetujui vaksinasi / pemeriksaan terkait (bukan hasil konsultasi). */
  vaccination_id: string | null
  examination_id: string | null
  doctor_archived_at: string | null
  created_at: string
  pet?: RingkasanHewan | null
  owner?: RingkasanPemilik | null
  doctor?: RingkasanProfil | null
  consultation?: { id: string; doctor_notes: string; date: string } | null
}

export interface Konsultasi extends DataArsip {
  id: string
  appointment_id: string
  pet_id: string
  doctor_id: string | null
  date: string
  time: string | null
  doctor_notes: string
  fee: number
  /** Tanggal dan jam (ISO) dokter menyelesaikan pemeriksaan. */
  completed_at: string
  created_at: string
  pet?: RingkasanHewan | null
  owner?: RingkasanPemilik | null
  doctor?: RingkasanProfil | null
}

export interface Vaksinasi extends DataArsip {
  id: string
  pet_id: string
  doctor_id: string
  vaccine_name: string
  status: StatusVaksinasi
  recommended_date: string
  scheduled_date: string | null
  scheduled_time: string | null
  injected_date: string | null
  next_dose_date: string | null
  fee: number
  cancellation_reason: string | null
  /** Janji temu yang ikut selesai saat vaksinasi ini disetujui dokter. */
  appointment_id: string | null
  created_at: string
  pet?: RingkasanHewan | null
  owner?: RingkasanPemilik | null
  doctor?: RingkasanProfil | null
}

export interface Pemeriksaan extends DataArsip {
  id: string
  pet_id: string
  doctor_id: string
  category: KategoriPemeriksaan
  type: string
  custom_name: string | null
  notes: string | null
  fee: number
  status: StatusPemeriksaan
  recommended_date: string
  scheduled_date: string | null
  scheduled_time: string | null
  cancellation_reason: string | null
  /** Janji temu yang ikut selesai saat pemeriksaan ini disetujui dokter. */
  appointment_id: string | null
  created_at: string
  pet?: RingkasanHewan | null
  owner?: RingkasanPemilik | null
  doctor?: RingkasanProfil | null
}

export interface Transaksi {
  id: string
  description: string
  type: JenisTransaksi
  amount: number
  date: string
  category: string
  status: StatusTransaksi
  appointment_id: string | null
  vaccination_id: string | null
  examination_id: string | null
  created_at: string
}

/** Satu catatan riwayat medis (gabungan konsultasi, vaksinasi, dan pemeriksaan). */
export interface RiwayatMedis {
  id: string
  record_type: TipeRiwayat
  pet_id: string
  doctor_id: string | null
  pet_name: string
  doctor_name: string | null
  date: string
  title: string
  description: string | null
}
