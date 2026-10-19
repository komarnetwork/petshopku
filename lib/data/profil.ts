import { equalTo, get, orderByChild, query, ref, set, update, type Database, type DataSnapshot } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { bandingkanTeks, sekarang, wajibMasuk } from "@/lib/data/dasar"
import type { Peran, Profil } from "@/lib/tipe"

/** Mengubah isi node profiles/{uid} menjadi objek Profil (kolom yang kosong diisi null). */
export function bentukProfil(id: string, data: Record<string, unknown>): Profil {
  return {
    id,
    full_name: (data.full_name as string | undefined) ?? null,
    email: (data.email as string | undefined) ?? null,
    phone: (data.phone as string | undefined) ?? null,
    role: data.role as Profil["role"],
    license_number: (data.license_number as string | undefined) ?? null,
    approval_status: data.approval_status as Profil["approval_status"],
    rejection_reason: (data.rejection_reason as string | undefined) ?? null,
    created_at: (data.created_at as string | undefined) ?? "",
  }
}

function daftarProfil(snapshot: DataSnapshot): Profil[] {
  const nilai = snapshot.val() as Record<string, Record<string, unknown>> | null
  return Object.entries(nilai ?? {}).map(([id, data]) => bentukProfil(id, data))
}

/** Membaca profil satu akun; null bila belum ada. */
export async function bacaProfil(db: Database, id: string): Promise<Profil | null> {
  const snapshot = await get(ref(db, `profiles/${id}`))
  return snapshot.exists() ? bentukProfil(id, snapshot.val()) : null
}

interface DataAkunBaru {
  id: string
  email: string | null
  namaLengkap: string | null
  noTelepon: string | null
}

/**
 * Membuat profil untuk akun yang baru mendaftar. Selalu berperan dokter dan berstatus menunggu;
 * aturan akses menolak nilai lain, jadi hanya admin yang dapat mengubahnya.
 */
export async function buatProfilBaru(db: Database, akun: DataAkunBaru): Promise<Profil> {
  const waktu = sekarang()
  // Kolom yang kosong tidak ditulis: Realtime Database tidak menyimpan nilai null.
  const data = {
    ...(akun.namaLengkap?.trim() && { full_name: akun.namaLengkap.trim() }),
    ...(akun.email && { email: akun.email }),
    ...(akun.noTelepon?.trim() && { phone: akun.noTelepon.trim() }),
    role: "doctor" as Peran,
    approval_status: "menunggu",
    created_at: waktu,
    updated_at: waktu,
  }
  await set(ref(db, `profiles/${akun.id}`), data)
  return bentukProfil(akun.id, data)
}

/** Dokter hewan yang sudah disetujui (untuk pilihan dokter pada formulir). */
export async function ambilDokterHewanAktif(klien: KlienData): Promise<Profil[]> {
  const { db } = wajibMasuk(klien)
  const hasil = await get(query(ref(db, "profiles"), orderByChild("role"), equalTo("doctor")))
  return daftarProfil(hasil)
    .filter((akun) => akun.approval_status === "disetujui")
    .sort((a, b) => bandingkanTeks(a.full_name, b.full_name))
}

/** Akun yang menunggu keputusan admin, yang paling lama mendaftar di atas. */
export async function ambilAkunMenunggu(klien: KlienData): Promise<Profil[]> {
  const { db } = wajibMasuk(klien)
  const hasil = await get(query(ref(db, "profiles"), orderByChild("approval_status"), equalTo("menunggu")))
  return daftarProfil(hasil).sort((a, b) => bandingkanTeks(a.created_at, b.created_at))
}

/** Semua akun yang sudah diputuskan (disetujui / ditolak), yang terbaru di atas. */
export async function ambilAkunTerdaftar(klien: KlienData): Promise<Profil[]> {
  const { db } = wajibMasuk(klien)
  return daftarProfil(await get(ref(db, "profiles")))
    .filter((akun) => akun.approval_status !== "menunggu")
    .sort((a, b) => bandingkanTeks(b.created_at, a.created_at))
}

interface MasukanPersetujuan {
  role: Peran
  license_number?: string | null
}

function nomorStrUntuk(masukan: MasukanPersetujuan) {
  return masukan.role === "doctor" ? masukan.license_number?.trim() || null : null
}

/** Menyetujui akun sekaligus menentukan perannya. */
export async function setujuiAkun(klien: KlienData, id: string, masukan: MasukanPersetujuan) {
  const { db, uid } = wajibMasuk(klien)
  const waktu = sekarang()
  await update(ref(db, `profiles/${id}`), {
    approval_status: "disetujui",
    role: masukan.role,
    license_number: nomorStrUntuk(masukan),
    approved_at: waktu,
    approved_by: uid,
    rejected_at: null,
    rejected_by: null,
    rejection_reason: null,
    updated_at: waktu,
  })
}

export async function tolakAkun(klien: KlienData, id: string, alasan: string) {
  const { db, uid } = wajibMasuk(klien)
  const waktu = sekarang()
  await update(ref(db, `profiles/${id}`), {
    approval_status: "ditolak",
    rejection_reason: alasan.trim() || null,
    rejected_at: waktu,
    rejected_by: uid,
    approved_at: null,
    approved_by: null,
    updated_at: waktu,
  })
}

/** Mengubah peran akun yang sudah disetujui. */
export async function ubahPeranAkun(klien: KlienData, id: string, masukan: MasukanPersetujuan) {
  const { db } = wajibMasuk(klien)
  await update(ref(db, `profiles/${id}`), {
    role: masukan.role,
    license_number: nomorStrUntuk(masukan),
    updated_at: sekarang(),
  })
}
