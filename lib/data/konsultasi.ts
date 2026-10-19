import { ref, update } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { bacaDokumenWajib, bacaKoleksi, bacaWaktuSelesai, sekarang, wajibMasuk } from "@/lib/data/dasar"
import { keTanggalInput } from "@/lib/format"
import { lampirkanRelasi } from "@/lib/data/relasi"
import type { JanjiTemu, Konsultasi } from "@/lib/tipe"

/** Isi node consultations/{id} (tanpa data relasi yang dilampirkan saat dibaca). */
type DataKonsultasi = Omit<Konsultasi, "id" | "pet" | "owner" | "doctor">

export async function ambilKonsultasi(klien: KlienData, { diarsipkan = false } = {}): Promise<Konsultasi[]> {
  const daftar = await bacaKoleksi<DataKonsultasi>(klien, "consultations", { bidangDokter: "doctor_id", diarsipkan })
  const hasil = await lampirkanRelasi(klien, daftar, { pet: true, doctor: true })

  return (hasil as Konsultasi[]).sort(
    (a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at),
  )
}

interface MasukanHasilKonsultasi {
  appointment_id: string
  doctor_notes: string
  /** Tanggal dan jam (ISO) dokter selesai memeriksa. */
  completed_at: string
}

/**
 * Dokter mencatat hasil konsultasi sekaligus menyelesaikan janji temu, langsung tanpa menunggu siapa pun.
 * Konsultasi memakai id yang sama dengan janji temunya, sehingga satu janji temu hanya bisa punya satu
 * hasil. Hasil, status "selesai", dan tanggal-jam selesai tersimpan dalam satu penulisan atomik.
 */
export async function catatHasilKonsultasi(klien: KlienData, masukan: MasukanHasilKonsultasi) {
  const { db } = wajibMasuk(klien)

  const catatan = masukan.doctor_notes.trim()
  if (!catatan) throw new Error("Hasil konsultasi wajib diisi.")

  const selesaiPada = bacaWaktuSelesai(masukan.completed_at)

  const janji = await bacaDokumenWajib<Omit<JanjiTemu, "id">>(db, "appointments", masukan.appointment_id, "Janji temu tidak ditemukan.")
  if (janji.status === "dibatalkan") {
    throw new Error("Janji temu yang dibatalkan tidak dapat diberi hasil konsultasi.")
  }
  if (janji.status === "selesai") throw new Error("Hasil konsultasi untuk janji temu ini sudah dicatat.")

  // Dokter tidak boleh membaca konsultasi yang belum ada, jadi keberadaannya dicek lewat daftar miliknya.
  const milikSaya = await bacaKoleksi<DataKonsultasi>(klien, "consultations", { bidangDokter: "doctor_id" })
  if (milikSaya.some((konsultasi) => konsultasi.id === janji.id)) {
    throw new Error("Hasil konsultasi untuk janji temu ini sudah dicatat.")
  }

  const waktu = sekarang()
  const waktuSelesai = selesaiPada.toISOString()
  await update(ref(db), {
    [`consultations/${janji.id}`]: {
      appointment_id: janji.id,
      pet_id: janji.pet_id,
      doctor_id: janji.doctor_id,
      date: keTanggalInput(selesaiPada),
      time: janji.start_time,
      doctor_notes: catatan,
      fee: janji.estimated_price,
      completed_at: waktuSelesai,
      is_archived: false,
      created_at: waktu,
      updated_at: waktu,
    },
    [`appointments/${janji.id}/status`]: "selesai",
    [`appointments/${janji.id}/completed_at`]: waktuSelesai,
    [`appointments/${janji.id}/updated_at`]: waktu,
  })
}

const namaHari = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

/** Jumlah konsultasi untuk tiap hari dalam seminggu (Senin sampai Minggu). */
export function hitungKonsultasiPerHari(daftar: { date: string }[]) {
  const hitungan = namaHari.map((nama) => ({ nama, jumlah: 0 }))

  for (const { date } of daftar) {
    const hari = new Date(`${date}T00:00:00`).getDay() // 0 = Minggu
    hitungan[(hari + 6) % 7].jumlah += 1
  }

  return hitungan
}
