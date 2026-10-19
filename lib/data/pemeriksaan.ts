import { ref, set } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { bacaDokumenWajib, bacaKoleksi, buatId, hargaStandar, sekarang, terbaruDulu, wajibMasuk } from "@/lib/data/dasar"
import { lampirkanRelasi } from "@/lib/data/relasi"
import { periksaJanjiTerkait, putuskanLayanan } from "@/lib/data/keputusan-dokter"
import { tanggalHariIni } from "@/lib/format"
import { validasiTanggalJadwal } from "@/lib/validasi-tanggal"
import type { KategoriPemeriksaan, Pemeriksaan } from "@/lib/tipe"

/** Isi node examinations/{id} (tanpa data relasi yang dilampirkan saat dibaca). */
type DataPemeriksaan = Omit<Pemeriksaan, "id" | "pet" | "owner" | "doctor">

export interface MasukanPemeriksaan {
  pet_id: string
  category: KategoriPemeriksaan
  type: string
  custom_name: string | null
  notes: string | null
  fee: number
  scheduled_date: string
  scheduled_time: string
  /** Janji temu yang ikut selesai saat pemeriksaan ini disetujui (opsional). */
  appointment_id?: string | null
}

/** Admin melihat semua pemeriksaan; dokter hanya yang ia sarankan. */
export async function ambilPemeriksaan(klien: KlienData, { diarsipkan = false } = {}): Promise<Pemeriksaan[]> {
  const daftar = await bacaKoleksi<DataPemeriksaan>(klien, "examinations", { bidangDokter: "doctor_id", diarsipkan })
  return terbaruDulu(await lampirkanRelasi(klien, daftar, { pet: true, doctor: true })) as Pemeriksaan[]
}

/** Dokter merekomendasikan pemeriksaan beserta usulan jadwalnya. */
export async function buatPemeriksaan(klien: KlienData, dokterId: string, masukan: MasukanPemeriksaan) {
  const { db } = wajibMasuk(klien)

  const galatTanggal = validasiTanggalJadwal(masukan.scheduled_date)
  if (galatTanggal) throw new Error(galatTanggal)

  const namaKustom = masukan.type === "Lainnya" ? masukan.custom_name?.trim() || null : null
  if (masukan.type === "Lainnya" && !namaKustom) throw new Error("Nama pemeriksaan wajib diisi bila memilih Lainnya.")

  await bacaDokumenWajib(db, "pets", masukan.pet_id, "Hewan tidak ditemukan atau bukan pasien Anda.")
  await periksaJanjiTerkait(db, masukan.appointment_id, masukan.pet_id)
  const biaya = masukan.fee > 0 ? masukan.fee : await hargaStandar(db, "pemeriksaan", 250000)

  const waktu = sekarang()
  await set(ref(db, `examinations/${buatId(db, "examinations")}`), {
    pet_id: masukan.pet_id,
    doctor_id: dokterId,
    appointment_id: masukan.appointment_id || null,
    category: masukan.category,
    type: masukan.type,
    custom_name: namaKustom,
    notes: masukan.notes?.trim() || null,
    fee: biaya,
    status: "dijadwalkan",
    recommended_date: tanggalHariIni(),
    scheduled_date: masukan.scheduled_date,
    scheduled_time: masukan.scheduled_time,
    consultation_id: null,
    is_archived: false,
    archived_at: null,
    archived_by: null,
    created_at: waktu,
    updated_at: waktu,
  })
}

/** Dokter menyetujui pemeriksaan yang ia sarankan; janji temu terkaitnya (bila ada) ikut selesai. */
export async function setujuiPemeriksaan(klien: KlienData, id: string) {
  return putuskanLayanan(klien, "examinations", id, "dikonfirmasi")
}

/** Dokter menolak pemeriksaan yang ia sarankan; alasan wajib diisi. */
export async function tolakPemeriksaan(klien: KlienData, id: string, alasan: string) {
  return putuskanLayanan(klien, "examinations", id, "dibatalkan", alasan)
}
