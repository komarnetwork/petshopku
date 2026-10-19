import { ref, set } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { bacaKoleksi, buatId, sekarang, wajibMasuk } from "@/lib/data/dasar"
import type { Hewan, JanjiTemu, JenisTransaksi, Pemeriksaan, Transaksi, Vaksinasi } from "@/lib/tipe"

export interface MasukanTransaksiManual {
  description: string
  type: JenisTransaksi
  amount: number
  date: string
  category: string
}

/** Status layanan yang dihitung sebagai pemasukan. Status lain berarti belum / tidak ada transaksi. */
const statusJanjiTemuBerbayar = ["selesai"]
const statusVaksinasiBerbayar = ["dikonfirmasi", "sudah_disuntik"]
const statusPemeriksaanBerbayar = ["dikonfirmasi"]

const tanpaTautan = { appointment_id: null, vaccination_id: null, examination_id: null }

/**
 * Semua transaksi (hanya admin yang boleh membacanya).
 *
 * Node `transactions` hanya menyimpan transaksi MANUAL yang dicatat admin. Transaksi layanan
 * (janji temu, vaksinasi, pemeriksaan) tidak disimpan terpisah: dihitung langsung dari status
 * layanannya. Dengan begitu catatan keuangan selalu cocok dengan status layanan dan dokter tidak
 * perlu hak menulis ke data keuangan.
 */
export async function ambilTransaksi(klien: KlienData): Promise<Transaksi[]> {
  const [manual, janjiTemu, vaksinasi, pemeriksaan, hewan] = await Promise.all([
    bacaKoleksi<Omit<Transaksi, "id">>(klien, "transactions"),
    bacaKoleksi<Omit<JanjiTemu, "id">>(klien, "appointments"),
    bacaKoleksi<Omit<Vaksinasi, "id">>(klien, "vaccinations"),
    bacaKoleksi<Omit<Pemeriksaan, "id">>(klien, "examinations"),
    bacaKoleksi<Omit<Hewan, "id">>(klien, "pets"),
  ])

  const namaHewan = new Map(hewan.map((item) => [item.id, item.name]))
  const nama = (petId: string) => namaHewan.get(petId) ?? "Hewan"

  // Janji temu yang selesai lewat vaksinasi / pemeriksaan tidak ditagih dua kali: biaya layanannya yang dihitung.
  const dariJanjiTemu: Transaksi[] = janjiTemu
    .filter((janji) => statusJanjiTemuBerbayar.includes(janji.status) && !janji.vaccination_id && !janji.examination_id)
    .map((janji) => ({
      id: `janji-temu-${janji.id}`,
      description: `${janji.purpose} - ${nama(janji.pet_id)}`,
      type: "pemasukan",
      amount: janji.estimated_price,
      date: janji.date,
      category: janji.purpose.toLowerCase().includes("vaksin") ? "Vaksinasi" : "Konsultasi",
      status: "aktif",
      ...tanpaTautan,
      appointment_id: janji.id,
      created_at: janji.created_at,
    }))

  const dariVaksinasi: Transaksi[] = vaksinasi
    .filter((vaksin) => statusVaksinasiBerbayar.includes(vaksin.status))
    .map((vaksin) => ({
      id: `vaksinasi-${vaksin.id}`,
      description: `Vaksin ${vaksin.vaccine_name} - ${nama(vaksin.pet_id)}`,
      type: "pemasukan",
      amount: vaksin.fee,
      date: vaksin.injected_date ?? vaksin.scheduled_date ?? vaksin.recommended_date,
      category: "Vaksinasi",
      status: "aktif",
      ...tanpaTautan,
      vaccination_id: vaksin.id,
      created_at: vaksin.created_at,
    }))

  const dariPemeriksaan: Transaksi[] = pemeriksaan
    .filter((periksa) => statusPemeriksaanBerbayar.includes(periksa.status))
    .map((periksa) => ({
      id: `pemeriksaan-${periksa.id}`,
      description: `Pemeriksaan ${periksa.type === "Lainnya" ? periksa.custom_name : periksa.type} - ${nama(periksa.pet_id)}`,
      type: "pemasukan",
      amount: periksa.fee,
      date: periksa.scheduled_date ?? periksa.recommended_date,
      category: "Pemeriksaan",
      status: "aktif",
      ...tanpaTautan,
      examination_id: periksa.id,
      created_at: periksa.created_at,
    }))

  return [...manual, ...dariJanjiTemu, ...dariVaksinasi, ...dariPemeriksaan].sort(
    (a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at),
  )
}

/** Admin mencatat pemasukan / pengeluaran di luar layanan klinik. */
export async function catatTransaksiManual(klien: KlienData, masukan: MasukanTransaksiManual) {
  const { db, uid } = wajibMasuk(klien)

  const deskripsi = masukan.description.trim()
  if (!deskripsi) throw new Error("Deskripsi transaksi wajib diisi.")
  if (!Number.isFinite(masukan.amount) || masukan.amount < 0) throw new Error("Jumlah transaksi tidak valid.")

  const waktu = sekarang()
  await set(ref(db, `transactions/${buatId(db, "transactions")}`), {
    description: deskripsi,
    type: masukan.type,
    amount: masukan.amount,
    date: masukan.date,
    category: masukan.category,
    status: "aktif",
    ...tanpaTautan,
    created_by: uid,
    created_at: waktu,
    updated_at: waktu,
  })
}

/** Ringkasan pemasukan, pengeluaran, dan laba untuk bulan tertentu. */
export function hitungRingkasanBulanan(daftar: Transaksi[], acuan = new Date()) {
  const transaksiBulanIni = daftar.filter((transaksi) => {
    const tanggal = new Date(`${transaksi.date}T00:00:00`)
    return (
      transaksi.status === "aktif" &&
      tanggal.getMonth() === acuan.getMonth() &&
      tanggal.getFullYear() === acuan.getFullYear()
    )
  })

  const jumlahJenis = (jenis: JenisTransaksi) =>
    transaksiBulanIni
      .filter((transaksi) => transaksi.type === jenis)
      .reduce((total, transaksi) => total + Number(transaksi.amount), 0)

  const pemasukan = jumlahJenis("pemasukan")
  const pengeluaran = jumlahJenis("pengeluaran")
  return { pemasukan, pengeluaran, laba: pemasukan - pengeluaran }
}
