import { ref, set, update } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { sinkronkanAksesDokter } from "@/lib/data/akses-dokter"
import { bacaDokumenWajib, bacaKoleksi, bacaWaktuSelesai, buatId, hargaStandar, sekarang, wajibMasuk, type Dokumen } from "@/lib/data/dasar"
import { lampirkanRelasi } from "@/lib/data/relasi"
import { tanggalHariIni } from "@/lib/format"
import type { JanjiTemu, Konsultasi } from "@/lib/tipe"

/** Isi node appointments/{id} (tanpa data relasi yang dilampirkan saat dibaca). */
type DataJanjiTemu = Omit<JanjiTemu, "id" | "pet" | "owner" | "doctor" | "consultation">

export interface MasukanJanjiTemu {
  pet_id: string
  doctor_id: string | null
  date: string
  start_time: string
  end_time?: string | null
  purpose: string
  notes?: string | null
}

/** Jam selesai bawaan: satu jam setelah jam mulai ("23:30" -> "00:30"). */
function tambahSatuJam(jam: string) {
  const [jamMulai, menit] = jam.split(":")
  return `${String((Number(jamMulai) + 1) % 24).padStart(2, "0")}:${menit ?? "00"}`
}

/** Melampirkan pasien, pemilik, dokter, dan hasil konsultasi ke setiap janji temu. */
async function lengkapi(klien: KlienData, daftar: Dokumen<DataJanjiTemu>[]): Promise<JanjiTemu[]> {
  const [denganRelasi, daftarKonsultasi] = await Promise.all([
    lampirkanRelasi(klien, daftar, { pet: true, doctor: true }),
    bacaKoleksi<Konsultasi>(klien, "consultations", { bidangDokter: "doctor_id" }),
  ])

  const konsultasiPerJanji = new Map(
    daftarKonsultasi.map((konsultasi) => [
      konsultasi.appointment_id,
      { id: konsultasi.id, doctor_notes: konsultasi.doctor_notes, date: konsultasi.date },
    ]),
  )

  return denganRelasi.map((janji) => ({ ...janji, consultation: konsultasiPerJanji.get(janji.id) ?? null })) as JanjiTemu[]
}

function urutkanJadwal(daftar: JanjiTemu[]) {
  return [...daftar].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
}

/** Daftar janji temu yang boleh dilihat pengguna saat ini, urut dari yang terdekat. */
export async function ambilJanjiTemu(klien: KlienData, { diarsipkan = false } = {}): Promise<JanjiTemu[]> {
  const daftar = await bacaKoleksi<DataJanjiTemu>(klien, "appointments", { bidangDokter: "doctor_id", diarsipkan })
  return urutkanJadwal(await lengkapi(klien, daftar))
}

/** Janji temu yang akan datang (untuk dasbor admin). */
export async function ambilJanjiTemuMendatang(klien: KlienData, batas = 5): Promise<JanjiTemu[]> {
  const daftar = await bacaKoleksi<DataJanjiTemu>(klien, "appointments", { bidangDokter: "doctor_id", diarsipkan: false })
  const hariIni = tanggalHariIni()

  const terdekat = daftar
    .filter((janji) => janji.date >= hariIni && janji.status === "dijadwalkan")
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    .slice(0, batas)

  return lengkapi(klien, terdekat)
}

export async function buatJanjiTemu(klien: KlienData, masukan: MasukanJanjiTemu): Promise<JanjiTemu> {
  const { db } = wajibMasuk(klien)

  // Pasien harus ada; harga diambil dari daftar layanan. Pengguna tidak menentukannya.
  await bacaDokumenWajib(db, "pets", masukan.pet_id, "Hewan tidak ditemukan.")
  const harga = await hargaStandar(db, masukan.purpose.toLowerCase().includes("vaksin") ? "vaksin" : "konsultasi", 100000)

  const waktu = sekarang()
  const data: DataJanjiTemu = {
    pet_id: masukan.pet_id,
    doctor_id: masukan.doctor_id,
    date: masukan.date,
    start_time: masukan.start_time,
    end_time: masukan.end_time || tambahSatuJam(masukan.start_time),
    purpose: masukan.purpose,
    notes: masukan.notes?.trim() || null,
    status: "dijadwalkan",
    estimated_price: harga,
    completed_at: null,
    vaccination_id: null,
    examination_id: null,
    doctor_archived_at: null,
    is_archived: false,
    archived_at: null,
    created_at: waktu,
  }
  const id = buatId(db, "appointments")
  await set(ref(db, `appointments/${id}`), { ...data, updated_at: waktu })

  if (data.doctor_id) await sinkronkanAksesDokter(klien, data.pet_id)

  const [janji] = await lampirkanRelasi(klien, [{ ...data, id }], { pet: true, doctor: true })
  return { ...janji, consultation: null } as JanjiTemu
}

/**
 * Dokter menandai janji temunya selesai langsung, tanpa menunggu siapa pun dan tanpa wajib mengisi hasil
 * konsultasi. Tanggal dan jam selesai pemeriksaan dicatat di `completed_at`.
 */
export async function selesaikanJanjiTemu(klien: KlienData, id: string, selesaiPada: string) {
  const { db } = wajibMasuk(klien)
  const waktuSelesai = bacaWaktuSelesai(selesaiPada)

  const janji = await bacaDokumenWajib<DataJanjiTemu>(db, "appointments", id, "Janji temu tidak ditemukan.")
  if (janji.status === "dibatalkan") throw new Error("Janji temu yang dibatalkan tidak dapat diselesaikan.")
  if (janji.status === "selesai") throw new Error("Janji temu ini sudah selesai.")

  await update(ref(db, `appointments/${id}`), {
    status: "selesai",
    completed_at: waktuSelesai.toISOString(),
    updated_at: sekarang(),
  })
}

/**
 * Admin membatalkan janji temu, atau menjadwalkannya kembali. Menyelesaikan janji temu adalah tugas
 * dokter (lewat hasil konsultasi), jadi status "selesai" tidak bisa diubah dari sini.
 */
export async function ubahStatusJanjiTemu(klien: KlienData, id: string, status: "dijadwalkan" | "dibatalkan") {
  const { db } = wajibMasuk(klien)
  const janji = await bacaDokumenWajib<DataJanjiTemu>(db, "appointments", id, "Janji temu tidak ditemukan.")
  if (janji.status === "selesai") throw new Error("Janji temu yang sudah diselesaikan dokter tidak dapat diubah.")

  await update(ref(db, `appointments/${id}`), { status, updated_at: sekarang() })
}

export async function tetapkanDokterJanjiTemu(klien: KlienData, id: string, dokterId: string | null) {
  const { db } = wajibMasuk(klien)
  const janji = await bacaDokumenWajib<DataJanjiTemu>(db, "appointments", id, "Janji temu tidak ditemukan.")

  await update(ref(db, `appointments/${id}`), { doctor_id: dokterId, updated_at: sekarang() })
  await sinkronkanAksesDokter(klien, janji.pet_id)
}

/**
 * Menyembunyikan (atau menampilkan kembali) janji temu dari daftar dokter.
 * Datanya tetap tersimpan di database.
 */
export async function sembunyikanJanjiTemu(klien: KlienData, id: string, sembunyikan: boolean) {
  const { db } = wajibMasuk(klien)
  const waktu = sekarang()
  await update(ref(db, `appointments/${id}`), {
    doctor_archived_at: sembunyikan ? waktu : null,
    updated_at: waktu,
  })
}
