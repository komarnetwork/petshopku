// Fungsi bantu yang dipakai semua berkas di lib/data untuk membaca Firebase Realtime Database.
//
// Realtime Database adalah satu pohon JSON. Ia tidak punya JOIN dan tidak menyaring data diam-diam:
// aturan akses (database.rules.json) menolak kueri yang BISA mengembalikan data terlarang. Karena itu
// dokter tidak pernah membaca satu koleksi utuh, melainkan:
//   * kueri berfilter doctor_id (janji temu, konsultasi, vaksinasi, pemeriksaan), atau
//   * daftar doctor_access/{uid}/pets lalu membaca dokumennya satu per satu (pasien).

import { equalTo, get, orderByChild, push, query, ref, type DataSnapshot, type Database } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { kodeGalat } from "@/lib/galat"
import type { Peran } from "@/lib/tipe"

/** Nama koleksi (node di bawah akar pohon). Sama dengan nama tabel pada rancangan awal. */
export type NamaKoleksi =
  | "profiles"
  | "services"
  | "pets"
  | "appointments"
  | "consultations"
  | "vaccinations"
  | "examinations"
  | "transactions"

/** Isi dokumen ditambah id-nya. */
export type Dokumen<T> = T & { id: string }

/**
 * Kolom yang boleh kosong pada tiap koleksi. Realtime Database tidak menyimpan nilai null
 * (kolomnya hilang), jadi saat dibaca kolom yang hilang diisi null lagi agar sesuai lib/tipe.ts.
 */
const KOLOM_BOLEH_KOSONG: Record<NamaKoleksi, string[]> = {
  profiles: ["full_name", "email", "phone", "license_number", "approved_at", "approved_by", "rejected_at", "rejected_by", "rejection_reason"],
  services: [],
  pets: ["owner_phone", "owner_email", "owner_address", "birth_date", "weight_kg", "photo_url", "archived_at", "archived_by"],
  appointments: ["doctor_id", "notes", "completed_at", "vaccination_id", "examination_id", "doctor_archived_at", "archived_at", "archived_by"],
  consultations: ["doctor_id", "time", "archived_at", "archived_by"],
  vaccinations: ["scheduled_date", "scheduled_time", "injected_date", "next_dose_date", "cancellation_reason", "appointment_id", "archived_at", "archived_by"],
  examinations: ["custom_name", "notes", "scheduled_date", "scheduled_time", "cancellation_reason", "consultation_id", "appointment_id", "archived_at", "archived_by"],
  transactions: ["appointment_id", "vaccination_id", "examination_id", "created_by"],
}

/** Waktu sekarang dalam format ISO, seperti kolom created_at / updated_at. */
export function sekarang() {
  return new Date().toISOString()
}

/** Membaca tanggal-jam selesai (ISO) dari dokter; galat bila tidak valid atau di masa depan. */
export function bacaWaktuSelesai(waktuIso: string): Date {
  const waktu = new Date(waktuIso)
  if (Number.isNaN(waktu.getTime())) throw new Error("Tanggal dan jam selesai tidak valid.")
  if (waktu.getTime() > Date.now() + 5 * 60_000) throw new Error("Waktu selesai tidak boleh di masa depan.")
  return waktu
}

/** Mengambil koneksi, id, dan peran pengguna; galat bila belum login. */
export function wajibMasuk(klien: KlienData): { db: Database; uid: string; peran: Peran } {
  if (!klien.uid || !klien.peran) throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.")
  return { db: klien.db, uid: klien.uid, peran: klien.peran }
}

/** Membuat id baru untuk dokumen (urut menurut waktu) tanpa menulis apa pun. */
export function buatId(db: Database, nama: NamaKoleksi) {
  const kunci = push(ref(db, nama)).key
  if (!kunci) throw new Error("Gagal membuat id baru.")
  return kunci
}

export function keDokumen<T>(nama: NamaKoleksi, id: string, data: object): Dokumen<T> {
  const kosong = Object.fromEntries(KOLOM_BOLEH_KOSONG[nama].map((kolom) => [kolom, null]))
  return { ...kosong, ...data, id } as Dokumen<T>
}

function sebagaiDaftar<T>(nama: NamaKoleksi, snapshot: DataSnapshot): Dokumen<T>[] {
  const nilai = snapshot.val() as Record<string, object> | null
  return Object.entries(nilai ?? {}).map(([id, data]) => keDokumen<T>(nama, id, data))
}

/** Daftar id pasien yang ditangani seorang dokter (diisi admin saat janji temu dibuat). */
export type AksesDokter = "pets"

interface PilihanBaca {
  /** Dokter menemukan dokumennya lewat kolom doctor_id (kueri berfilter). */
  bidangDokter?: "doctor_id"
  /** Dokter menemukan dokumennya lewat doctor_access/{uid}/pets. */
  aksesDokter?: AksesDokter
  /** true / false menyaring kolom is_archived; kosong berarti semua. */
  diarsipkan?: boolean
}

/** Membaca satu koleksi sesuai hak akses pengguna: admin semuanya, dokter hanya miliknya. */
export async function bacaKoleksi<T extends object>(
  klien: KlienData,
  nama: NamaKoleksi,
  { bidangDokter, aksesDokter, diarsipkan }: PilihanBaca = {},
): Promise<Dokumen<T>[]> {
  const { db, uid, peran } = wajibMasuk(klien)
  let daftar: Dokumen<T>[]

  if (peran === "admin") {
    daftar = sebagaiDaftar<T>(nama, await get(ref(db, nama)))
  } else if (bidangDokter) {
    daftar = sebagaiDaftar<T>(nama, await get(query(ref(db, nama), orderByChild(bidangDokter), equalTo(uid))))
  } else if (aksesDokter) {
    const akses = (await get(ref(db, `doctor_access/${uid}/${aksesDokter}`))).val() as Record<string, true> | null
    const dokumen: (Dokumen<T> | null)[] = await Promise.all(Object.keys(akses ?? {}).map((id) => bacaDokumen<T>(db, nama, id)))
    daftar = dokumen.filter((item): item is Dokumen<T> => item !== null)
  } else {
    throw new Error("Anda tidak memiliki izin untuk melakukan tindakan ini.")
  }

  // Penyaringan arsip dilakukan di sini agar kueri tidak butuh indeks tambahan.
  return diarsipkan === undefined
    ? daftar
    : daftar.filter((baris) => Boolean((baris as { is_archived?: boolean }).is_archived) === diarsipkan)
}

/**
 * Membaca satu dokumen. Null bila tidak ada atau bukan hak pengguna ini
 * (sama seperti relasi yang tersaring RLS: data terlarang tampil kosong).
 */
export async function bacaDokumen<T>(db: Database, nama: NamaKoleksi, id: string): Promise<Dokumen<T> | null> {
  try {
    const snapshot = await get(ref(db, `${nama}/${id}`))
    return snapshot.exists() ? keDokumen<T>(nama, id, snapshot.val()) : null
  } catch (galat) {
    if (kodeGalat(galat) === "permission-denied") return null
    throw galat
  }
}

/** Seperti bacaDokumen, tetapi melempar galat dengan pesan tertentu bila tidak ditemukan. */
export async function bacaDokumenWajib<T>(db: Database, nama: NamaKoleksi, id: string, pesan: string): Promise<Dokumen<T>> {
  const dokumen = await bacaDokumen<T>(db, nama, id)
  if (!dokumen) throw new Error(pesan)
  return dokumen
}

/** Id semua dokumen di koleksi yang kolom `kolom`-nya bernilai `nilai` (kolom itu harus punya .indexOn). */
export async function cariId(db: Database, nama: NamaKoleksi, kolom: string, nilai: string): Promise<string[]> {
  const hasil = await get(query(ref(db, nama), orderByChild(kolom), equalTo(nilai)))
  return Object.keys((hasil.val() as Record<string, unknown> | null) ?? {})
}

/** Harga standar sebuah jenis layanan (termurah yang aktif); cadangan bila daftar layanan kosong. */
export async function hargaStandar(db: Database, jenis: string, cadangan: number) {
  try {
    const hasil = await get(query(ref(db, "services"), orderByChild("type"), equalTo(jenis)))
    const layanan = Object.values((hasil.val() as Record<string, { price?: unknown; is_active?: unknown }> | null) ?? {})
    const harga = layanan
      .filter((item) => item.is_active === true)
      .map((item) => Number(item.price))
      .filter((nilai) => Number.isFinite(nilai))
    return harga.length > 0 ? Math.min(...harga) : cadangan
  } catch {
    return cadangan
  }
}

/** Pengurutan teks naik / turun yang aman untuk nilai kosong. */
export function bandingkanTeks(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? "").localeCompare(b ?? "")
}

/** Mengurutkan dari yang dibuat paling akhir. */
export function terbaruDulu<T extends { created_at: string }>(daftar: T[]) {
  return [...daftar].sort((a, b) => bandingkanTeks(b.created_at, a.created_at))
}
