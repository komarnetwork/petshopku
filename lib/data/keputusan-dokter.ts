import { ref, update, type Database } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { bacaDokumen, bacaDokumenWajib, bacaKoleksi, sekarang, wajibMasuk } from "@/lib/data/dasar"

/**
 * Memastikan janji temu yang dikaitkan ke vaksinasi / pemeriksaan memang janji temu dokter ini,
 * untuk pasien yang sama, dan masih berjalan. Kosong berarti tidak dikaitkan ke janji temu mana pun.
 */
export async function periksaJanjiTerkait(db: Database, janjiId: string | null | undefined, petId: string) {
  if (!janjiId) return
  const janji = await bacaDokumen<{ pet_id: string; status: string }>(db, "appointments", janjiId)
  if (!janji || janji.pet_id !== petId || janji.status !== "dijadwalkan") {
    throw new Error("Janji temu yang dipilih tidak sesuai dengan pasien atau sudah selesai.")
  }
}

interface DataLayanan {
  status: string
  pet_id: string
  appointment_id: string | null
}

interface DataJanjiCocok {
  status: string
  pet_id: string
  purpose: string
  date: string
  start_time: string
}

/**
 * Janji temu yang selesai karena layanan ini disetujui: yang dipilih dokter saat mengusulkan, atau bila
 * tidak dipilih, janji temu berjalan milik dokter untuk pasien yang sama dengan keperluan yang cocok
 * ("Vaksinasi" untuk vaksin, "Pemeriksaan" untuk pemeriksaan; yang terdekat bila ada beberapa).
 */
async function cariJanjiUntukLayanan(klien: KlienData, koleksi: "vaccinations" | "examinations", layanan: DataLayanan) {
  const { db } = wajibMasuk(klien)

  if (layanan.appointment_id) {
    const janji = await bacaDokumen<DataJanjiCocok>(db, "appointments", layanan.appointment_id)
    return janji?.status === "dijadwalkan" ? { id: janji.id, sudahTerkait: true } : null
  }

  const kataKunci = koleksi === "vaccinations" ? "vaksin" : "pemeriksaan"
  const semua = await bacaKoleksi<DataJanjiCocok>(klien, "appointments", { bidangDokter: "doctor_id", diarsipkan: false })
  const cocok = semua
    .filter((janji) => janji.pet_id === layanan.pet_id && janji.status === "dijadwalkan" && janji.purpose.toLowerCase().includes(kataKunci))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))[0]

  return cocok ? { id: cocok.id, sudahTerkait: false } : null
}

/**
 * Dokter menyetujui atau menolak vaksinasi / pemeriksaan yang ia usulkan sendiri. Tidak ada jawaban
 * pemilik: keputusan dokter langsung berlaku. Penolakan wajib disertai alasan.
 *
 * MENYETUJUI usulan sekaligus menyelesaikan janji temu terkaitnya (dengan tanggal-jam selesai saat ini)
 * dalam satu penulisan atomik. Menolak tidak menyelesaikan janji temu apa pun.
 */
export async function putuskanLayanan(
  klien: KlienData,
  koleksi: "vaccinations" | "examinations",
  id: string,
  keputusan: "dikonfirmasi" | "dibatalkan",
  alasan = "",
): Promise<{ janjiSelesai: boolean }> {
  const { db } = wajibMasuk(klien)
  const saatIni = await bacaDokumenWajib<DataLayanan>(db, koleksi, id, "Data tidak ditemukan.")
  if (saatIni.status !== "dijadwalkan") throw new Error("Usulan ini sudah diputuskan.")

  const alasanBersih = alasan.trim()
  if (keputusan === "dibatalkan" && !alasanBersih) throw new Error("Alasan penolakan wajib diisi.")

  const waktu = sekarang()
  const perubahan: Record<string, string | null> = {
    [`${koleksi}/${id}/status`]: keputusan,
    [`${koleksi}/${id}/cancellation_reason`]: keputusan === "dibatalkan" ? alasanBersih : null,
    [`${koleksi}/${id}/updated_at`]: waktu,
  }

  let janjiSelesai = false
  const janji = keputusan === "dikonfirmasi" ? await cariJanjiUntukLayanan(klien, koleksi, saatIni) : null
  if (janji) {
    const kolomLayanan = koleksi === "vaccinations" ? "vaccination_id" : "examination_id"
    if (!janji.sudahTerkait) perubahan[`${koleksi}/${id}/appointment_id`] = janji.id
    perubahan[`appointments/${janji.id}/status`] = "selesai"
    perubahan[`appointments/${janji.id}/completed_at`] = waktu
    perubahan[`appointments/${janji.id}/${kolomLayanan}`] = id
    perubahan[`appointments/${janji.id}/updated_at`] = waktu
    janjiSelesai = true
  }

  await update(ref(db), perubahan)
  return { janjiSelesai }
}
