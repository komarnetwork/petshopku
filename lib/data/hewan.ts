import { ref, set, update } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { bacaKoleksi, buatId, sekarang, terbaruDulu, wajibMasuk, type Dokumen } from "@/lib/data/dasar"
import { ringkasPemilik } from "@/lib/data/relasi"
import type { Hewan, JenisHewan } from "@/lib/tipe"

/** Isi node pets/{id}: hewan beserta pemiliknya (kolom owner_*), tanpa ringkasan turunan. */
type DataHewan = Omit<Hewan, "id" | "owner">

/** Isian satu formulir pasien: data pemilik dan data hewannya. */
export interface MasukanHewan {
  owner_name: string
  owner_phone: string | null
  owner_email: string | null
  owner_address: string | null
  name: string
  species: JenisHewan
  breed: string
  birth_date: string | null
  weight_kg: number | null
}

function bentukHewan(data: Dokumen<DataHewan>): Hewan {
  return { ...data, owner: ringkasPemilik(data) }
}

function rapikanMasukan(masukan: MasukanHewan): MasukanHewan {
  const rapi = {
    ...masukan,
    owner_name: masukan.owner_name.trim(),
    owner_phone: masukan.owner_phone?.trim() || null,
    owner_email: masukan.owner_email?.trim() || null,
    owner_address: masukan.owner_address?.trim() || null,
    name: masukan.name.trim(),
    breed: masukan.breed.trim(),
  }
  if (!rapi.owner_name) throw new Error("Nama pemilik wajib diisi.")
  if (!rapi.name) throw new Error("Nama hewan wajib diisi.")
  if (!rapi.breed) throw new Error("Ras hewan wajib diisi.")
  return rapi
}

/**
 * Daftar pasien (hewan beserta pemiliknya) yang boleh dilihat pengguna saat ini:
 * admin semuanya, dokter hanya pasien yang ditanganinya.
 */
export async function ambilHewan(klien: KlienData, { diarsipkan = false } = {}): Promise<Hewan[]> {
  const daftar = await bacaKoleksi<DataHewan>(klien, "pets", { aksesDokter: "pets", diarsipkan })
  return terbaruDulu(daftar.map(bentukHewan))
}

/** Mendaftarkan pasien baru, pemilik dan hewannya tersimpan dalam satu data. */
export async function tambahHewan(klien: KlienData, masukan: MasukanHewan): Promise<Hewan> {
  const { db } = wajibMasuk(klien)
  const id = buatId(db, "pets")
  const waktu = sekarang()

  const data: DataHewan = {
    ...rapikanMasukan(masukan),
    photo_url: null,
    is_archived: false,
    archived_at: null,
    created_at: waktu,
  }
  await set(ref(db, `pets/${id}`), { ...data, updated_at: waktu })

  return bentukHewan({ ...data, id })
}

export async function ubahHewan(klien: KlienData, id: string, masukan: MasukanHewan) {
  const { db } = wajibMasuk(klien)
  await update(ref(db, `pets/${id}`), { ...rapikanMasukan(masukan), updated_at: sekarang() })
}
