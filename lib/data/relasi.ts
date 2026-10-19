// Realtime Database tidak punya JOIN, jadi data pasien (hewan dan pemiliknya) dan dokter yang
// ditampilkan bersama janji temu / vaksinasi / dst. dilampirkan di sini dengan membaca node-nya.

import type { Database } from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { bacaDokumen, wajibMasuk, type Dokumen, type NamaKoleksi } from "@/lib/data/dasar"
import type { RingkasanHewan, RingkasanPemilik, RingkasanProfil } from "@/lib/tipe"

interface BarisRelasi {
  pet_id?: string | null
  doctor_id?: string | null
}

/** Relasi yang ingin dilampirkan. `pet` melampirkan hewan sekaligus pemiliknya (satu pembacaan). */
interface PilihanRelasi {
  pet?: boolean
  doctor?: boolean
}

export interface HasilRelasi {
  pet?: RingkasanHewan | null
  owner?: RingkasanPemilik | null
  doctor?: RingkasanProfil | null
}

type Dok = Dokumen<Record<string, any>>

export const ringkasHewan = (d: Dok): RingkasanHewan => ({ id: d.id, name: d.name, species: d.species, breed: d.breed })

/** Pemilik disimpan di dalam data pasien (kolom owner_*), bukan di node tersendiri. */
export const ringkasPemilik = (d: Dok): RingkasanPemilik => ({
  full_name: d.owner_name,
  phone: d.owner_phone ?? null,
  email: d.owner_email ?? null,
})

const ringkasDokter = (d: Dok): RingkasanProfil => ({
  id: d.id,
  full_name: d.full_name ?? null,
  license_number: d.license_number ?? null,
})

/** Membaca dokumen-dokumen unik yang dirujuk, sekali baca per id. */
async function bacaBanyak(db: Database, nama: NamaKoleksi, id: (string | null | undefined)[]): Promise<Map<string, Dok | null>> {
  const unik = [...new Set(id.filter((nilai): nilai is string => Boolean(nilai)))]
  const entri = await Promise.all(unik.map(async (kunci) => [kunci, await bacaDokumen<Record<string, any>>(db, nama, kunci)] as const))
  return new Map(entri)
}

/**
 * Menambahkan pet / owner / doctor ke setiap baris. Dokumen yang tidak ditemukan atau
 * tidak boleh dibaca pengguna ini menghasilkan null.
 */
export async function lampirkanRelasi<T extends BarisRelasi>(
  klien: KlienData,
  daftar: T[],
  pilih: PilihanRelasi,
): Promise<(T & HasilRelasi)[]> {
  const { db } = wajibMasuk(klien)

  const [hewan, dokter] = await Promise.all([
    pilih.pet ? bacaBanyak(db, "pets", daftar.map((baris) => baris.pet_id)) : null,
    pilih.doctor ? bacaBanyak(db, "profiles", daftar.map((baris) => baris.doctor_id)) : null,
  ])

  return daftar.map((baris) => {
    const pasien = hewan?.get(baris.pet_id ?? "") ?? null
    const dokterBaris = dokter?.get(baris.doctor_id ?? "") ?? null
    return {
      ...baris,
      ...(hewan && { pet: pasien && ringkasHewan(pasien), owner: pasien && ringkasPemilik(pasien) }),
      ...(dokter && { doctor: dokterBaris && ringkasDokter(dokterBaris) }),
    }
  })
}
