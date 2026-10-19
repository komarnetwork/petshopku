import { equalTo, get, orderByChild, query, ref, update } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { wajibMasuk } from "@/lib/data/dasar"

/**
 * Memperbarui daftar pasien yang boleh dibaca tiap dokter (doctor_access/{uid}/pets), dihitung ulang
 * dari seluruh janji temu pasien tersebut. Aturan akses (database.rules.json) memakai daftar ini agar
 * dokter hanya membaca pasien yang ia tangani. Dipanggil admin setiap janji temu dibuat, dipindahkan
 * ke dokter lain, atau dihapus.
 */
export async function sinkronkanAksesDokter(klien: KlienData, petId: string) {
  const { db } = wajibMasuk(klien)

  const [janjiPasien, aksesSaatIni] = await Promise.all([
    get(query(ref(db, "appointments"), orderByChild("pet_id"), equalTo(petId))),
    get(ref(db, "doctor_access")),
  ])

  const janji = Object.values((janjiPasien.val() as Record<string, { doctor_id?: string }> | null) ?? {})
  const dokterPasien = new Set(janji.map((item) => item.doctor_id).filter((dokterId): dokterId is string => Boolean(dokterId)))

  // Dokter yang sudah punya akses diperiksa ulang supaya akses yang tak berlaku lagi dicabut.
  const semuaDokter = new Set([...Object.keys((aksesSaatIni.val() as Record<string, unknown> | null) ?? {}), ...dokterPasien])

  const perubahan: Record<string, true | null> = {}
  for (const dokterId of semuaDokter) {
    perubahan[`doctor_access/${dokterId}/pets/${petId}`] = dokterPasien.has(dokterId) ? true : null
  }

  await update(ref(db), perubahan)
}
