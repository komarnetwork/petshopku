import { ref, set, update } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { bacaDokumenWajib, bacaKoleksi, buatId, hargaStandar, sekarang, terbaruDulu, wajibMasuk } from "@/lib/data/dasar"
import { lampirkanRelasi } from "@/lib/data/relasi"
import { periksaJanjiTerkait, putuskanLayanan } from "@/lib/data/keputusan-dokter"
import { tanggalHariIni } from "@/lib/format"
import { validasiTanggalJadwal } from "@/lib/validasi-tanggal"
import type { Vaksinasi } from "@/lib/tipe"

/** Isi node vaccinations/{id} (tanpa data relasi yang dilampirkan saat dibaca). */
type DataVaksinasi = Omit<Vaksinasi, "id" | "pet" | "owner" | "doctor">

export interface MasukanVaksinasi {
  pet_id: string
  vaccine_name: string
  scheduled_date: string
  scheduled_time: string
  next_dose_date: string | null
  fee: number
  /** Janji temu yang ikut selesai saat vaksinasi ini disetujui (opsional). */
  appointment_id?: string | null
}

/** Admin melihat semua vaksinasi; dokter hanya yang ia usulkan. */
export async function ambilVaksinasi(klien: KlienData, { diarsipkan = false } = {}): Promise<Vaksinasi[]> {
  const daftar = await bacaKoleksi<DataVaksinasi>(klien, "vaccinations", { bidangDokter: "doctor_id", diarsipkan })
  return terbaruDulu(await lampirkanRelasi(klien, daftar, { pet: true, doctor: true })) as Vaksinasi[]
}

/**
 * Dokter mengusulkan jadwal vaksinasi. Status awal diisi di sini, bukan oleh pengguna;
 * harga standar dipakai bila biaya tidak diisi. Dokter kemudian menyetujui atau menolaknya sendiri.
 */
export async function buatVaksinasi(klien: KlienData, dokterId: string, masukan: MasukanVaksinasi) {
  const { db } = wajibMasuk(klien)

  const galatTanggal = validasiTanggalJadwal(masukan.scheduled_date)
  if (galatTanggal) throw new Error(galatTanggal)

  await bacaDokumenWajib(db, "pets", masukan.pet_id, "Hewan tidak ditemukan atau bukan pasien Anda.")
  await periksaJanjiTerkait(db, masukan.appointment_id, masukan.pet_id)
  const biaya = masukan.fee > 0 ? masukan.fee : await hargaStandar(db, "vaksin", 150000)

  const waktu = sekarang()
  await set(ref(db, `vaccinations/${buatId(db, "vaccinations")}`), {
    pet_id: masukan.pet_id,
    doctor_id: dokterId,
    appointment_id: masukan.appointment_id || null,
    vaccine_name: masukan.vaccine_name.trim(),
    status: "dijadwalkan",
    recommended_date: tanggalHariIni(),
    scheduled_date: masukan.scheduled_date,
    scheduled_time: masukan.scheduled_time,
    injected_date: null,
    next_dose_date: masukan.next_dose_date,
    fee: biaya,
    is_archived: false,
    archived_at: null,
    archived_by: null,
    created_at: waktu,
    updated_at: waktu,
  })
}

/** Dokter menyetujui vaksinasi yang ia usulkan; janji temu terkaitnya (bila ada) ikut selesai. */
export async function setujuiVaksinasi(klien: KlienData, id: string) {
  return putuskanLayanan(klien, "vaccinations", id, "dikonfirmasi")
}

/** Dokter menolak vaksinasi yang ia usulkan; alasan wajib diisi. */
export async function tolakVaksinasi(klien: KlienData, id: string, alasan: string) {
  return putuskanLayanan(klien, "vaccinations", id, "dibatalkan", alasan)
}

/** Dokter menandai vaksin yang sudah disetujui sebagai sudah disuntik. */
export async function tandaiSudahDisuntik(klien: KlienData, id: string, dosisBerikutnya: string | null) {
  const { db } = wajibMasuk(klien)
  const vaksin = await bacaDokumenWajib<DataVaksinasi>(db, "vaccinations", id, "Vaksinasi tidak ditemukan.")

  if (vaksin.status !== "dikonfirmasi") {
    throw new Error("Hanya vaksin yang sudah disetujui yang dapat ditandai sudah disuntik.")
  }

  await update(ref(db, `vaccinations/${id}`), {
    status: "sudah_disuntik",
    injected_date: vaksin.injected_date ?? tanggalHariIni(),
    next_dose_date: dosisBerikutnya,
    updated_at: sekarang(),
  })
}
