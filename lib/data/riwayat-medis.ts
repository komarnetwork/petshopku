import type { KlienData } from "@/lib/firebase"
import { bacaKoleksi } from "@/lib/data/dasar"
import { lampirkanRelasi } from "@/lib/data/relasi"
import type { Konsultasi, Pemeriksaan, RiwayatMedis, Vaksinasi } from "@/lib/tipe"

/** Satu catatan riwayat beserta waktu dibuatnya (hanya untuk mengurutkan). */
interface Catatan {
  riwayat: RiwayatMedis
  dibuat: string
}

/**
 * Riwayat gabungan konsultasi, vaksinasi, dan pemeriksaan; yang terbaru di atas.
 * Menggantikan view medical_records: Realtime Database tidak punya view, jadi digabung di sini.
 */
export async function ambilRiwayatMedis(klien: KlienData): Promise<RiwayatMedis[]> {
  const pilihan = { bidangDokter: "doctor_id", diarsipkan: false } as const

  const [konsultasi, vaksinasi, pemeriksaan] = await Promise.all([
    bacaKoleksi<Omit<Konsultasi, "id">>(klien, "consultations", pilihan),
    bacaKoleksi<Omit<Vaksinasi, "id">>(klien, "vaccinations", pilihan),
    bacaKoleksi<Omit<Pemeriksaan, "id">>(klien, "examinations", pilihan),
  ])

  const relasi = { pet: true, doctor: true }
  const [daftarKonsultasi, daftarVaksinasi, daftarPemeriksaan] = await Promise.all([
    lampirkanRelasi(klien, konsultasi, relasi),
    lampirkanRelasi(
      klien,
      vaksinasi.filter((vaksin) => vaksin.status === "dikonfirmasi" || vaksin.status === "sudah_disuntik"),
      relasi,
    ),
    lampirkanRelasi(
      klien,
      pemeriksaan.filter((periksa) => periksa.status === "dikonfirmasi"),
      relasi,
    ),
  ])

  const catatan: Catatan[] = []

  for (const item of daftarKonsultasi) {
    if (!item.pet) continue
    catatan.push({
      dibuat: item.created_at,
      riwayat: {
        id: `konsultasi:${item.id}`,
        record_type: "konsultasi",
        pet_id: item.pet_id,
        doctor_id: item.doctor_id,
        pet_name: item.pet.name,
        doctor_name: item.doctor?.full_name ?? null,
        date: item.date,
        title: "Konsultasi",
        description: item.doctor_notes,
      },
    })
  }

  for (const item of daftarVaksinasi) {
    if (!item.pet) continue
    catatan.push({
      dibuat: item.created_at,
      riwayat: {
        id: `vaksinasi:${item.id}`,
        record_type: "vaksinasi",
        pet_id: item.pet_id,
        doctor_id: item.doctor_id,
        pet_name: item.pet.name,
        doctor_name: item.doctor?.full_name ?? null,
        date: item.injected_date ?? item.scheduled_date ?? item.recommended_date,
        title: `Vaksinasi: ${item.vaccine_name}`,
        description: item.status === "sudah_disuntik" ? "Sudah disuntik" : "Disetujui dokter",
      },
    })
  }

  for (const item of daftarPemeriksaan) {
    if (!item.pet) continue
    catatan.push({
      dibuat: item.created_at,
      riwayat: {
        id: `pemeriksaan:${item.id}`,
        record_type: "pemeriksaan",
        pet_id: item.pet_id,
        doctor_id: item.doctor_id,
        pet_name: item.pet.name,
        doctor_name: item.doctor?.full_name ?? null,
        date: item.scheduled_date ?? item.recommended_date,
        title: `Pemeriksaan ${item.category}: ${item.type === "Lainnya" ? item.custom_name : item.type}`,
        description: item.notes,
      },
    })
  }

  return catatan
    .sort((a, b) => b.riwayat.date.localeCompare(a.riwayat.date) || b.dibuat.localeCompare(a.dibuat))
    .map((item) => item.riwayat)
}
