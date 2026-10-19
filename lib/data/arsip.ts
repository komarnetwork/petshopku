import { get, ref, remove, update } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { bacaDokumenWajib, cariId, sekarang, wajibMasuk, type NamaKoleksi } from "@/lib/data/dasar"
import { sinkronkanAksesDokter } from "@/lib/data/akses-dokter"

/** Koleksi yang punya kolom arsip (is_archived). */
export type TabelArsip = "pets" | "appointments" | "consultations" | "vaccinations" | "examinations"

const PESAN_MASIH_TERHUBUNG = "Data ini masih terhubung dengan data lain (riwayat klinis atau keuangan). Gunakan Arsipkan."

export async function arsipkan(klien: KlienData, tabel: TabelArsip, id: string) {
  const { db, uid } = wajibMasuk(klien)
  const waktu = sekarang()
  await update(ref(db, `${tabel}/${id}`), { is_archived: true, archived_at: waktu, archived_by: uid, updated_at: waktu })
}

export async function pulihkan(klien: KlienData, tabel: TabelArsip, id: string) {
  const { db } = wajibMasuk(klien)
  await update(ref(db, `${tabel}/${id}`), {
    is_archived: false,
    archived_at: null,
    archived_by: null,
    updated_at: sekarang(),
  })
}

/** Data hewan yang merujuk ke sebuah hewan; selama masih ada, hewan itu tidak boleh dihapus. */
const rujukanHewan: { koleksi: NamaKoleksi; kolom: string }[] = [
  { koleksi: "appointments", kolom: "pet_id" },
  { koleksi: "consultations", kolom: "pet_id" },
  { koleksi: "vaccinations", kolom: "pet_id" },
  { koleksi: "examinations", kolom: "pet_id" },
]

/** Status layanan yang sudah masuk catatan keuangan (lihat lib/data/transaksi.ts). */
const statusBerTransaksi: Partial<Record<TabelArsip, string[]>> = {
  appointments: ["selesai"],
  vaccinations: ["dikonfirmasi", "sudah_disuntik"],
  examinations: ["dikonfirmasi"],
}

/**
 * Menghapus data selamanya. Realtime Database tidak punya foreign key, jadi keterkaitan diperiksa di sini:
 * data yang masih dirujuk riwayat klinis atau keuangan ditolak, dan pesannya menyarankan arsip.
 */
export async function hapusPermanen(klien: KlienData, tabel: TabelArsip, id: string) {
  const { db } = wajibMasuk(klien)
  const data = await bacaDokumenWajib<{ status?: string; pet_id?: string }>(
    db,
    tabel,
    id,
    "Data tidak ditemukan.",
  )

  if (data.status && statusBerTransaksi[tabel]?.includes(data.status)) {
    throw new Error(PESAN_MASIH_TERHUBUNG)
  }

  if (tabel === "pets") {
    for (const { koleksi, kolom } of rujukanHewan) {
      if ((await cariId(db, koleksi, kolom, id)).length > 0) throw new Error(PESAN_MASIH_TERHUBUNG)
    }
  }

  if (tabel === "appointments" && (await get(ref(db, `consultations/${id}`))).exists()) {
    // Hasil konsultasi memakai id yang sama dengan janji temunya.
    throw new Error(PESAN_MASIH_TERHUBUNG)
  }

  if (tabel === "consultations") {
    // Pemeriksaan yang bersumber dari konsultasi ini tetap ada; hanya rujukannya dilepas.
    const pemeriksaan = await cariId(db, "examinations", "consultation_id", id)
    const perubahan: Record<string, null> = { [`consultations/${id}`]: null }
    for (const pemeriksaanId of pemeriksaan) perubahan[`examinations/${pemeriksaanId}/consultation_id`] = null
    await update(ref(db), perubahan)
    return
  }

  await remove(ref(db, `${tabel}/${id}`))

  if (tabel === "appointments" && data.pet_id) {
    await sinkronkanAksesDokter(klien, data.pet_id)
  }
}
