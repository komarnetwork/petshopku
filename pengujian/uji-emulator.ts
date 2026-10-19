// Uji integrasi lapisan data + aturan keamanan Realtime Database, dijalankan di Firebase Emulator:
//
//   npm run uji
//
// Setiap pemeriksaan mencetak LULUS / GAGAL; proses berakhir dengan kode 1 bila ada yang gagal.

import { initializeApp } from "firebase/app"
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from "firebase/auth"
import {
  connectDatabaseEmulator,
  equalTo,
  get,
  getDatabase,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
  update,
  type Database,
} from "firebase/database"
import type { KlienData } from "@/lib/firebase"
import { kodeGalat } from "@/lib/galat"
import type { Peran } from "@/lib/tipe"
import { buatProfilBaru } from "@/lib/data/profil"
import { setujuiAkun, tolakAkun, ambilAkunMenunggu, ambilAkunTerdaftar, ambilDokterHewanAktif } from "@/lib/data/profil"
import { ambilHewan, tambahHewan, ubahHewan, type MasukanHewan } from "@/lib/data/hewan"
import {
  ambilJanjiTemu,
  ambilJanjiTemuMendatang,
  buatJanjiTemu,
  selesaikanJanjiTemu,
  sembunyikanJanjiTemu,
  tetapkanDokterJanjiTemu,
  ubahStatusJanjiTemu,
} from "@/lib/data/janji-temu"
import { ambilKonsultasi, catatHasilKonsultasi } from "@/lib/data/konsultasi"
import { ambilVaksinasi, buatVaksinasi, setujuiVaksinasi, tandaiSudahDisuntik, tolakVaksinasi } from "@/lib/data/vaksinasi"
import { ambilPemeriksaan, buatPemeriksaan, setujuiPemeriksaan, tolakPemeriksaan } from "@/lib/data/pemeriksaan"
import { ambilTransaksi, catatTransaksiManual, hitungRingkasanBulanan } from "@/lib/data/transaksi"
import { ambilRiwayatMedis } from "@/lib/data/riwayat-medis"
import { arsipkan, hapusPermanen, pulihkan } from "@/lib/data/arsip"
import { keTanggalInput } from "@/lib/format"

const PROYEK = "demo-petshopku"
const URL_DATABASE = `https://${PROYEK}-default-rtdb.firebaseio.com`
const NAMESPACE = `${PROYEK}-default-rtdb`
const [HOST_DATABASE, PORT_DATABASE] = (process.env.FIREBASE_DATABASE_EMULATOR_HOST ?? "127.0.0.1:9000").split(":")
const HOST_AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099"

let lulus = 0
let gagal = 0

function laporkan(nama: string, berhasil: boolean, rincian = "") {
  if (berhasil) lulus += 1
  else gagal += 1
  console.log(`${berhasil ? "  LULUS" : "  GAGAL"}  ${nama}${!berhasil && rincian ? `  -> ${rincian}` : ""}`)
}

function cek(nama: string, kondisi: boolean, rincian = "") {
  laporkan(nama, kondisi, rincian)
}

/** Operasi ini WAJIB ditolak aturan keamanan (permission-denied). */
async function harusDitolak(nama: string, kerja: () => Promise<unknown>) {
  try {
    await kerja()
    laporkan(nama, false, "operasi berhasil, padahal seharusnya ditolak")
  } catch (galat) {
    const kode = kodeGalat(galat)
    laporkan(nama, kode === "permission-denied", `galat tak terduga: ${kode ?? (galat as Error).message}`)
  }
}

/** Operasi ini WAJIB gagal dengan pesan tertentu (aturan bisnis di lib/data). */
async function harusGagalDengan(nama: string, potonganPesan: string, kerja: () => Promise<unknown>) {
  try {
    await kerja()
    laporkan(nama, false, "operasi berhasil, padahal seharusnya gagal")
  } catch (galat) {
    const pesan = galat instanceof Error ? galat.message : String(galat)
    laporkan(nama, pesan.includes(potonganPesan), `pesan: ${pesan}`)
  }
}

async function harusBerhasil<T>(nama: string, kerja: () => Promise<T>): Promise<T | null> {
  try {
    const hasil = await kerja()
    laporkan(nama, true)
    return hasil
  } catch (galat) {
    laporkan(nama, false, galat instanceof Error ? galat.message : String(galat))
    return null
  }
}

/** true bila kerja gagal (melempar galat). */
async function melempar(kerja: () => Promise<unknown>) {
  try {
    await kerja()
    return false
  } catch {
    return true
  }
}

// ---------- Penyiapan ----------

interface Akun {
  uid: string
  email: string
  db: Database
  klien: (peran: Peran | null) => KlienData
}

async function buatAkun(nama: string): Promise<Akun> {
  const aplikasi = initializeApp({ apiKey: "kunci-uji", projectId: PROYEK, appId: "uji", databaseURL: URL_DATABASE }, nama)
  const auth = getAuth(aplikasi)
  connectAuthEmulator(auth, `http://${HOST_AUTH}`, { disableWarnings: true })
  const db = getDatabase(aplikasi)
  connectDatabaseEmulator(db, HOST_DATABASE, Number(PORT_DATABASE))

  const { user } = await createUserWithEmailAndPassword(auth, `${nama}@uji.test`, "sandi-rahasia")
  return { uid: user.uid, email: user.email!, db, klien: (peran) => ({ db, uid: user.uid, peran }) }
}

/** Akses admin ke emulator (melewati aturan keamanan), hanya untuk menyiapkan data awal. */
async function tulisTanpaAturan(metode: "PUT" | "PATCH", path: string, nilai: unknown) {
  const respons = await fetch(`http://${HOST_DATABASE}:${PORT_DATABASE}/${path}.json?ns=${NAMESPACE}`, {
    method: metode,
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify(nilai),
  })
  if (!respons.ok) throw new Error(`Gagal menulis ${path}: ${respons.status} ${await respons.text()}`)
}

const hariIni = new Date()
const tanggal = (selisihHari: number) => keTanggalInput(new Date(hariIni.getTime() + selisihHari * 86_400_000))

async function utama() {
  console.log("\n=== 1. Pendaftaran akun & aturan profil ===")
  const admin = await buatAkun("admin")
  const dokterA = await buatAkun("dokter-a")
  const dokterB = await buatAkun("dokter-b")
  const dokterC = await buatAkun("dokter-c")
  const penyusup = await buatAkun("penyusup")

  for (const akun of [admin, dokterA, dokterB, dokterC]) {
    await harusBerhasil(`profil ${akun.email} dibuat (dokter, menunggu)`, () =>
      buatProfilBaru(akun.db, { id: akun.uid, email: akun.email, namaLengkap: akun.email.split("@")[0], noTelepon: "0812" }),
    )
  }

  const profilSah = (akun: Akun, ubah: Record<string, unknown> = {}) => ({
    full_name: "Penyusup", email: akun.email, role: "doctor", approval_status: "menunggu",
    created_at: "x", updated_at: "x", ...ubah,
  })
  await harusDitolak("mendaftar langsung sebagai admin ditolak", () =>
    set(ref(penyusup.db, `profiles/${penyusup.uid}`), profilSah(penyusup, { role: "admin" })),
  )
  await harusDitolak("mendaftar langsung dengan status disetujui ditolak", () =>
    set(ref(penyusup.db, `profiles/${penyusup.uid}`), profilSah(penyusup, { approval_status: "disetujui" })),
  )
  await harusDitolak("mendaftar dengan email orang lain ditolak", () =>
    set(ref(penyusup.db, `profiles/${penyusup.uid}`), profilSah(penyusup, { email: "korban@uji.test" })),
  )
  await harusDitolak("mendaftar dengan nomor STR terisi ditolak", () =>
    set(ref(penyusup.db, `profiles/${penyusup.uid}`), profilSah(penyusup, { license_number: "STR-PALSU" })),
  )
  await harusDitolak("membuat profil atas nama akun lain ditolak", () =>
    set(ref(penyusup.db, `profiles/${dokterA.uid}x`), profilSah(penyusup)),
  )
  await harusDitolak("dokter menyetujui dirinya sendiri ditolak", () =>
    update(ref(dokterA.db, `profiles/${dokterA.uid}`), { approval_status: "disetujui" }),
  )
  await harusDitolak("dokter menjadikan dirinya admin ditolak", () =>
    update(ref(dokterA.db, `profiles/${dokterA.uid}`), { role: "admin" }),
  )
  await harusDitolak("dokter menghapus lalu membuat ulang profilnya ditolak", () => remove(ref(dokterA.db, `profiles/${dokterA.uid}`)))
  await harusBerhasil("pengguna boleh mengubah nama & telepon sendiri", () =>
    update(ref(dokterA.db, `profiles/${dokterA.uid}`), { full_name: "Dokter A", phone: "0811", updated_at: "y" }),
  )
  await harusBerhasil("pengguna boleh membaca profilnya sendiri", () => get(ref(dokterA.db, `profiles/${dokterA.uid}`)))
  await harusDitolak("pengguna tidak bisa membaca profil orang lain", () => get(ref(dokterA.db, `profiles/${dokterB.uid}`)))

  console.log("\n=== 2. Akun yang belum disetujui tidak punya akses data ===")
  await harusDitolak("akun menunggu tidak bisa membaca daftar pasien", () => get(ref(dokterA.db, "pets")))
  await harusDitolak("akun menunggu tidak bisa membaca keuangan", () => get(ref(dokterA.db, "transactions")))
  await harusDitolak("akun menunggu tidak bisa membaca daftar layanan", () => get(ref(dokterA.db, "services")))
  await harusDitolak("pengguna tanpa profil tidak bisa membaca pasien", () => get(ref(penyusup.db, "pets")))

  await harusBerhasil("penyusup mendaftar secara sah (menunggu persetujuan)", () =>
    buatProfilBaru(penyusup.db, { id: penyusup.uid, email: penyusup.email, namaLengkap: "Penyusup", noTelepon: null }),
  )
  await harusDitolak("akun menunggu (dengan profil) tetap tidak bisa membaca pasien", () => get(ref(penyusup.db, "pets")))

  // Admin pertama dibuat lewat akses langsung (di aplikasi nyata: Firebase Console).
  await tulisTanpaAturan("PATCH", `profiles/${admin.uid}`, { role: "admin", approval_status: "disetujui" })
  await tulisTanpaAturan("PUT", "services/layanan-konsultasi", { name: "Konsultasi", type: "konsultasi", price: 120000, is_active: true })
  await tulisTanpaAturan("PUT", "services/layanan-vaksin", { name: "Vaksin Rabies", type: "vaksin", price: 175000, is_active: true })
  await tulisTanpaAturan("PUT", "services/layanan-tidak-aktif", { name: "Lama", type: "vaksin", price: 10, is_active: false })

  const kAdmin = admin.klien("admin")

  console.log("\n=== 3. Persetujuan akun oleh admin ===")
  await harusBerhasil("admin menyetujui dokter A", () => setujuiAkun(kAdmin, dokterA.uid, { role: "doctor", license_number: " STR-001 " }))
  await harusBerhasil("admin menyetujui dokter B", () => setujuiAkun(kAdmin, dokterB.uid, { role: "doctor", license_number: "STR-002" }))
  await harusBerhasil("admin menolak dokter C", () => tolakAkun(kAdmin, dokterC.uid, "Dokumen tidak lengkap"))

  const menunggu = await ambilAkunMenunggu(kAdmin)
  cek("daftar menunggu hanya berisi penyusup", menunggu.length === 1 && menunggu[0].id === penyusup.uid, JSON.stringify(menunggu.map((m) => m.email)))
  const terdaftar = await ambilAkunTerdaftar(kAdmin)
  cek("akun terdaftar berisi admin, A, B, C", terdaftar.length === 4, `jumlah: ${terdaftar.length}`)
  const profilA = terdaftar.find((akun) => akun.id === dokterA.uid)
  cek("nomor STR dirapikan dan tersimpan", profilA?.license_number === "STR-001", String(profilA?.license_number))
  cek("kolom kosong dibaca sebagai null", profilA?.rejection_reason === null)
  const profilC = terdaftar.find((akun) => akun.id === dokterC.uid)
  cek("alasan penolakan tersimpan", profilC?.approval_status === "ditolak" && profilC.rejection_reason === "Dokumen tidak lengkap")
  const dokterAktif = await ambilDokterHewanAktif(kAdmin)
  cek("dokter aktif = A dan B", dokterAktif.map((d) => d.id).sort().join() === [dokterA.uid, dokterB.uid].sort().join())

  const kA = dokterA.klien("doctor")
  const kB = dokterB.klien("doctor")
  await harusDitolak("dokter tidak bisa membaca daftar profil", () => ambilDokterHewanAktif(kA))
  await harusDitolak("dokter tidak bisa membaca semua profil", () => get(ref(dokterA.db, "profiles")))
  await harusDitolak("dokter tidak bisa mengubah peran akun lain", () => update(ref(dokterA.db, `profiles/${dokterB.uid}`), { role: "admin" }))
  await harusBerhasil("dokter yang disetujui boleh membaca daftar layanan", () => get(ref(dokterA.db, "services")))
  await harusDitolak("dokter tidak bisa mengubah daftar layanan", () => update(ref(dokterA.db, "services/layanan-vaksin"), { price: 1 }))

  console.log("\n=== 4. Pasien (pemilik + hewan dalam satu formulir) dan janji temu ===")
  const masukanMimi: MasukanHewan = {
    owner_name: " Budi Santoso ", owner_phone: "0812345", owner_email: null, owner_address: " Jl. Mawar 1 ",
    name: " Mimi ", species: "kucing", breed: "Persia", birth_date: "2022-01-01", weight_kg: 4.2,
  }
  const kucing = await harusBerhasil("admin mendaftarkan pasien: kucing Mimi + pemiliknya sekaligus", () => tambahHewan(kAdmin, masukanMimi))
  cek("pemilik dan hewan tersimpan dalam satu data, nilainya dirapikan",
    kucing?.owner_name === "Budi Santoso" && kucing.name === "Mimi" && kucing.owner_address === "Jl. Mawar 1",
    JSON.stringify([kucing?.owner_name, kucing?.name]))
  cek("ringkasan pemilik diturunkan dari data pasien", kucing?.owner.full_name === "Budi Santoso" && kucing.owner.phone === "0812345")
  cek("kolom kosong pasien dibaca sebagai null", kucing?.owner_email === null)
  const anjing = await harusBerhasil("admin mendaftarkan pasien kedua (anjing Rex)", () =>
    tambahHewan(kAdmin, { ...masukanMimi, name: "Rex", species: "anjing", breed: "Labrador", birth_date: null, weight_kg: null }),
  )
  cek("hewan tanpa tanggal lahir: kolom null", anjing?.birth_date === null && anjing.weight_kg === null)
  const burung = await harusBerhasil("admin mendaftarkan pasien ketiga (burung Kiko, pemilik lain)", () =>
    tambahHewan(kAdmin, {
      owner_name: "Ani", owner_phone: null, owner_email: "ani@uji.test", owner_address: null,
      name: "Kiko", species: "burung", breed: "Beo", birth_date: null, weight_kg: null,
    }),
  )
  await harusGagalDengan("pasien tanpa nama pemilik ditolak", "Nama pemilik wajib diisi", () =>
    tambahHewan(kAdmin, { ...masukanMimi, owner_name: "   " }),
  )
  await harusGagalDengan("pasien tanpa nama hewan ditolak", "Nama hewan wajib diisi", () => tambahHewan(kAdmin, { ...masukanMimi, name: "" }))
  await harusGagalDengan("pasien tanpa ras ditolak", "Ras hewan wajib diisi", () => tambahHewan(kAdmin, { ...masukanMimi, breed: " " }))
  cek("admin melihat 3 pasien", (await ambilHewan(kAdmin)).length === 3)
  await harusBerhasil("admin mengubah data pemilik dan hewan sekaligus", () =>
    ubahHewan(kAdmin, kucing!.id, { ...masukanMimi, owner_phone: "0899", weight_kg: 4.5 }),
  )
  const mimiBaru = (await ambilHewan(kAdmin)).find((h) => h.id === kucing!.id)
  cek("perubahan pemilik dan hewan tersimpan", mimiBaru?.owner_phone === "0899" && mimiBaru.weight_kg === 4.5 && mimiBaru.owner.phone === "0899")

  const janji = await harusBerhasil("admin membuat janji temu untuk dokter A", () =>
    buatJanjiTemu(kAdmin, { pet_id: kucing!.id, doctor_id: dokterA.uid, date: tanggal(0), start_time: "10:00", purpose: "Konsultasi", notes: "  demam " }),
  )
  cek("jam selesai otomatis = jam mulai + 1 jam", janji?.end_time === "11:00", String(janji?.end_time))
  cek("janji temu memuat pasien dan pemiliknya", janji?.pet?.name === "Mimi" && janji.owner?.full_name === "Budi Santoso")
  cek("harga janji temu diambil dari daftar layanan", janji?.estimated_price === 120000, String(janji?.estimated_price))
  cek("catatan dirapikan, dokter terlampir, belum selesai", janji?.notes === "demam" && janji.doctor?.full_name === "Dokter A" && janji.completed_at === null)
  cek("janji temu baru berstatus dijadwalkan", janji?.status === "dijadwalkan")
  await harusGagalDengan("janji temu untuk pasien yang tidak ada ditolak", "Hewan tidak ditemukan", () =>
    buatJanjiTemu(kAdmin, { pet_id: "tidak-ada", doctor_id: null, date: tanggal(0), start_time: "08:00", purpose: "Konsultasi" }),
  )
  const janjiMalam = await harusBerhasil("janji temu jam 23:30 dibuat", () =>
    buatJanjiTemu(kAdmin, { pet_id: anjing!.id, doctor_id: null, date: tanggal(0), start_time: "23:30", purpose: "Vaksin rabies" }),
  )
  cek("jam selesai melewati tengah malam = 00:30", janjiMalam?.end_time === "00:30", String(janjiMalam?.end_time))
  cek("janji temu vaksin memakai harga layanan vaksin", janjiMalam?.estimated_price === 175000, String(janjiMalam?.estimated_price))
  cek("janji temu tanpa dokter: doctor_id null", janjiMalam?.doctor_id === null && janjiMalam.doctor === null)

  console.log("\n=== 5. Dokter hanya melihat pasien yang ia tangani ===")
  const hewanA = await ambilHewan(kA)
  cek("dokter A melihat Mimi saja", hewanA.length === 1 && hewanA[0].name === "Mimi", hewanA.map((h) => h.name).join())
  cek("dokter A melihat data pemilik pasiennya", hewanA[0]?.owner.full_name === "Budi Santoso")
  cek("dokter B tidak melihat pasien apa pun", (await ambilHewan(kB)).length === 0)
  const janjiA = await ambilJanjiTemu(kA)
  cek("dokter A melihat 1 janji temu lengkap dengan pasien dan pemilik", janjiA.length === 1 && janjiA[0].pet?.name === "Mimi" && janjiA[0].owner?.full_name === "Budi Santoso")
  cek("dokter B tidak melihat janji temu", (await ambilJanjiTemu(kB)).length === 0)
  cek("admin melihat 2 janji temu", (await ambilJanjiTemu(kAdmin)).length === 2)
  cek("janji temu mendatang urut jam", (await ambilJanjiTemuMendatang(kAdmin)).map((j) => j.id).join() === [janji!.id, janjiMalam!.id].join())
  await harusDitolak("dokter B tidak bisa membaca semua pasien lewat kueri langsung", () => get(ref(dokterB.db, "pets")))
  await harusDitolak("dokter B tidak bisa membaca pasien dokter A lewat id", () => get(ref(dokterB.db, `pets/${kucing!.id}`)))
  await harusBerhasil("dokter A bisa membaca pasiennya lewat id", () => get(ref(dokterA.db, `pets/${kucing!.id}`)))
  await harusDitolak("dokter A tidak bisa membaca pasien yang bukan miliknya", () => get(ref(dokterA.db, `pets/${burung!.id}`)))
  await harusDitolak("dokter B tidak bisa membaca semua janji temu lewat kueri langsung", () => get(ref(dokterB.db, "appointments")))
  await harusDitolak("dokter B tidak bisa mengkueri janji temu dokter A", () =>
    get(query(ref(dokterB.db, "appointments"), orderByChild("doctor_id"), equalTo(dokterA.uid))),
  )
  await harusDitolak("dokter B tidak bisa mengkueri janji temu lewat kolom lain", () =>
    get(query(ref(dokterB.db, "appointments"), orderByChild("pet_id"), equalTo(kucing!.id))),
  )
  await harusDitolak("dokter B tidak bisa membaca daftar akses dokter A", () => get(ref(dokterB.db, `doctor_access/${dokterA.uid}`)))
  await harusBerhasil("dokter A bisa membaca daftar aksesnya sendiri", () => get(ref(dokterA.db, `doctor_access/${dokterA.uid}/pets`)))
  await harusDitolak("dokter B tidak bisa memberi dirinya akses ke pasien dokter A", () =>
    set(ref(dokterB.db, `doctor_access/${dokterB.uid}/pets/${kucing!.id}`), true),
  )
  await harusDitolak("dokter tidak bisa membuat janji temu", () =>
    set(ref(dokterA.db, `appointments/${push(ref(dokterA.db, "appointments")).key}`), { pet_id: kucing!.id, doctor_id: dokterA.uid }),
  )
  await harusDitolak("dokter tidak bisa menambah pasien", () => set(ref(dokterA.db, `pets/${push(ref(dokterA.db, "pets")).key}`), { name: "Z" }))
  await harusDitolak("dokter tidak bisa mengubah data pasien", () => update(ref(dokterA.db, `pets/${kucing!.id}`), { owner_name: "Diubah" }))
  cek("dokter tidak bisa membaca keuangan (data layer)", await melempar(() => ambilTransaksi(kA)))

  console.log("\n=== 6. Dokter menyelesaikan pemeriksaan (hasil konsultasi + tanggal & jam selesai) ===")
  await harusDitolak("dokter tidak bisa membatalkan janji temu", () =>
    update(ref(dokterA.db, `appointments/${janji!.id}`), { status: "dibatalkan", updated_at: "z" }),
  )
  await harusDitolak("status 'selesai' tanpa tanggal & jam selesai ditolak", () =>
    update(ref(dokterA.db, `appointments/${janji!.id}`), { status: "selesai", updated_at: "z" }),
  )
  await harusDitolak("tanggal selesai tanpa menyelesaikan janji temu ditolak", () =>
    update(ref(dokterA.db, `appointments/${janji!.id}`), { completed_at: new Date().toISOString() }),
  )
  await harusDitolak("dokter tidak bisa mengubah harga janji temu", () =>
    update(ref(dokterA.db, `appointments/${janji!.id}`), { estimated_price: 1 }),
  )
  await harusDitolak("dokter tidak bisa memindahkan janji temu ke dokter lain", () =>
    update(ref(dokterA.db, `appointments/${janji!.id}`), { doctor_id: dokterB.uid }),
  )
  await harusGagalDengan("dokter B tidak bisa mencatat hasil untuk janji temu dokter A", "tidak ditemukan", () =>
    catatHasilKonsultasi(kB, { appointment_id: janji!.id, doctor_notes: "palsu", completed_at: new Date().toISOString() }),
  )
  const waktuSelesai = new Date(Date.now() - 30 * 60_000)
  const konsultasiSah = (ubah: Record<string, unknown> = {}) => ({
    appointment_id: janji!.id, pet_id: kucing!.id, doctor_id: dokterA.uid, date: keTanggalInput(waktuSelesai),
    time: "10:00", doctor_notes: "ok", fee: 120000, completed_at: waktuSelesai.toISOString(), is_archived: false,
    created_at: "x", updated_at: "x", ...ubah,
  })
  await harusDitolak("hasil konsultasi dengan biaya dimanipulasi ditolak", () =>
    set(ref(dokterA.db, `consultations/${janji!.id}`), konsultasiSah({ fee: 1 })),
  )
  await harusDitolak("hasil konsultasi tanpa isi ditolak", () =>
    set(ref(dokterA.db, `consultations/${janji!.id}`), konsultasiSah({ doctor_notes: "" })),
  )
  await harusDitolak("hasil konsultasi atas nama dokter lain ditolak", () =>
    set(ref(dokterA.db, `consultations/${janji!.id}`), konsultasiSah({ doctor_id: dokterB.uid })),
  )
  await harusDitolak("penulisan atomik dengan konsultasi bermasalah ditolak seluruhnya", () =>
    update(ref(dokterA.db), {
      [`consultations/${janji!.id}`]: konsultasiSah({ fee: 1 }),
      [`appointments/${janji!.id}/status`]: "selesai",
      [`appointments/${janji!.id}/completed_at`]: waktuSelesai.toISOString(),
    }),
  )
  await harusDitolak("status 'selesai' tanpa tanggal selesai ditolak", () =>
    update(ref(dokterA.db), {
      [`consultations/${janji!.id}`]: konsultasiSah(),
      [`appointments/${janji!.id}/status`]: "selesai",
    }),
  )
  cek("... dan janji temu tetap 'dijadwalkan' tanpa tanggal selesai (tidak setengah tertulis)",
    (await ambilJanjiTemu(kA))[0].status === "dijadwalkan" && (await ambilJanjiTemu(kA))[0].completed_at === null)
  await harusGagalDengan("hasil konsultasi kosong ditolak", "wajib diisi", () =>
    catatHasilKonsultasi(kA, { appointment_id: janji!.id, doctor_notes: "  ", completed_at: waktuSelesai.toISOString() }),
  )
  await harusGagalDengan("waktu selesai di masa depan ditolak", "masa depan", () =>
    catatHasilKonsultasi(kA, { appointment_id: janji!.id, doctor_notes: "x", completed_at: new Date(Date.now() + 3_600_000).toISOString() }),
  )
  await harusGagalDengan("waktu selesai yang tidak valid ditolak", "tidak valid", () =>
    catatHasilKonsultasi(kA, { appointment_id: janji!.id, doctor_notes: "x", completed_at: "bukan tanggal" }),
  )
  await harusBerhasil("dokter A mencatat hasil dan langsung menyelesaikan janji temu", () =>
    catatHasilKonsultasi(kA, { appointment_id: janji!.id, doctor_notes: "  Flu ringan, beri vitamin  ", completed_at: waktuSelesai.toISOString() }),
  )
  await harusGagalDengan("janji temu yang sudah selesai tidak bisa diselesaikan dua kali", "sudah dicatat", () =>
    catatHasilKonsultasi(kA, { appointment_id: janji!.id, doctor_notes: "lagi", completed_at: waktuSelesai.toISOString() }),
  )
  const janjiSetelah = (await ambilJanjiTemu(kA))[0]
  cek("janji temu langsung 'selesai' tanpa menunggu siapa pun", janjiSetelah.status === "selesai", janjiSetelah.status)
  cek("tanggal & jam selesai tercatat pada janji temu", janjiSetelah.completed_at === waktuSelesai.toISOString(), String(janjiSetelah.completed_at))
  cek("janji temu memuat ringkasan hasil konsultasi", janjiSetelah.consultation?.doctor_notes === "Flu ringan, beri vitamin")
  const konsultasiA = await ambilKonsultasi(kA)
  cek("dokter melihat konsultasinya (biaya = harga janji temu)", konsultasiA.length === 1 && konsultasiA[0].fee === 120000 && konsultasiA[0].doctor?.full_name === "Dokter A")
  cek("konsultasi memuat tanggal & jam selesai", konsultasiA[0].completed_at === waktuSelesai.toISOString() && konsultasiA[0].date === keTanggalInput(waktuSelesai))
  cek("dokter B tidak melihat konsultasi", (await ambilKonsultasi(kB)).length === 0)
  await harusDitolak("dokter tidak bisa mengubah hasil konsultasi", () => update(ref(dokterA.db, `consultations/${janji!.id}`), { doctor_notes: "diubah" }))
  await harusDitolak("dokter tidak bisa menimpa hasil konsultasi", () => set(ref(dokterA.db, `consultations/${janji!.id}`), konsultasiSah()))
  await harusDitolak("dokter tidak bisa mengubah tanggal selesai setelahnya", () =>
    update(ref(dokterA.db, `appointments/${janji!.id}`), { completed_at: "2020-01-01T00:00:00.000Z" }),
  )
  await harusDitolak("dokter B tidak bisa membaca konsultasi dokter A", () => get(ref(dokterB.db, `consultations/${janji!.id}`)))
  await harusGagalDengan("janji temu yang sudah selesai tidak bisa dibatalkan admin", "sudah diselesaikan dokter", () =>
    ubahStatusJanjiTemu(kAdmin, janji!.id, "dibatalkan"),
  )
  await harusBerhasil("admin membatalkan janji temu yang belum selesai", () => ubahStatusJanjiTemu(kAdmin, janjiMalam!.id, "dibatalkan"))
  await harusBerhasil("admin menyerahkan janji temu itu ke dokter A", () => tetapkanDokterJanjiTemu(kAdmin, janjiMalam!.id, dokterA.uid))
  await harusGagalDengan("janji temu dibatalkan tidak bisa diselesaikan dokter", "dibatalkan", () =>
    catatHasilKonsultasi(kA, { appointment_id: janjiMalam!.id, doctor_notes: "x", completed_at: waktuSelesai.toISOString() }),
  )
  await harusBerhasil("admin menjadwalkan kembali janji temu itu", () => ubahStatusJanjiTemu(kAdmin, janjiMalam!.id, "dijadwalkan"))
  await harusBerhasil("... lalu membatalkannya lagi", () => ubahStatusJanjiTemu(kAdmin, janjiMalam!.id, "dibatalkan"))
  await harusBerhasil("dokter A menyembunyikan janji temunya", () => sembunyikanJanjiTemu(kA, janji!.id, true))
  cek("janji temu tersembunyi bertanda doctor_archived_at", (await ambilJanjiTemu(kA)).find((j) => j.id === janji!.id)?.doctor_archived_at != null)
  await harusBerhasil("dokter A menampilkan kembali janji temunya", () => sembunyikanJanjiTemu(kA, janji!.id, false))
  cek("... dan penanda itu kembali null", (await ambilJanjiTemu(kA)).find((j) => j.id === janji!.id)?.doctor_archived_at === null)

  console.log("\n=== 7. Vaksinasi: dokter yang menyetujui atau menolak ===")
  await harusGagalDengan("tanggal vaksinasi di masa lalu ditolak", "sebelum hari ini", () =>
    buatVaksinasi(kA, dokterA.uid, { pet_id: kucing!.id, vaccine_name: "Rabies", scheduled_date: tanggal(-5), scheduled_time: "09:00", next_dose_date: null, fee: 0 }),
  )
  await harusGagalDengan("tanggal vaksinasi > 3 bulan ditolak", "3 bulan", () =>
    buatVaksinasi(kA, dokterA.uid, { pet_id: kucing!.id, vaccine_name: "Rabies", scheduled_date: tanggal(200), scheduled_time: "09:00", next_dose_date: null, fee: 0 }),
  )
  await harusGagalDengan("dokter B tidak bisa mengusulkan vaksin untuk pasien dokter A", "bukan pasien Anda", () =>
    buatVaksinasi(kB, dokterB.uid, { pet_id: kucing!.id, vaccine_name: "Rabies", scheduled_date: tanggal(3), scheduled_time: "09:00", next_dose_date: null, fee: 0 }),
  )
  const vaksinSah = (dokter: Akun, ubah: Record<string, unknown> = {}) => ({
    pet_id: kucing!.id, doctor_id: dokter.uid, vaccine_name: "R", status: "dijadwalkan",
    recommended_date: tanggal(0), scheduled_date: tanggal(0), scheduled_time: "09:00", fee: 100,
    is_archived: false, created_at: "x", updated_at: "x", ...ubah,
  })
  const idPembanding = push(ref(dokterA.db, "vaccinations")).key!
  await harusBerhasil("dokumen vaksin yang sah dapat dibuat dokter A (pembanding)", () =>
    set(ref(dokterA.db, `vaccinations/${idPembanding}`), vaksinSah(dokterA)),
  )
  await hapusPermanen(kAdmin, "vaccinations", idPembanding)
  const idBaru = () => push(ref(dokterA.db, "vaccinations")).key!
  await harusDitolak("dokter A tidak bisa mengusulkan vaksin atas nama dokter lain", () =>
    set(ref(dokterA.db, `vaccinations/${idBaru()}`), vaksinSah(dokterB)),
  )
  await harusDitolak("dokter tidak bisa membuat vaksin langsung berstatus 'sudah_disuntik'", () =>
    set(ref(dokterA.db, `vaccinations/${idBaru()}`), vaksinSah(dokterA, { status: "sudah_disuntik" })),
  )
  await harusDitolak("dokter tidak bisa membuat vaksin langsung 'dikonfirmasi' (harus lewat keputusan)", () =>
    set(ref(dokterA.db, `vaccinations/${idBaru()}`), vaksinSah(dokterA, { status: "dikonfirmasi" })),
  )
  await harusDitolak("dokter tidak bisa membuat vaksin berbiaya negatif", () =>
    set(ref(dokterA.db, `vaccinations/${idBaru()}`), vaksinSah(dokterA, { fee: -1 })),
  )
  await harusDitolak("dokter tidak bisa membuat vaksin untuk pasien yang bukan miliknya", () =>
    set(ref(dokterA.db, `vaccinations/${idBaru()}`), vaksinSah(dokterA, { pet_id: burung!.id })),
  )
  await harusDitolak("dokter B tidak bisa membuat vaksin untuk pasien dokter A", () =>
    set(ref(dokterB.db, `vaccinations/${idBaru()}`), vaksinSah(dokterB)),
  )
  await harusDitolak("vaksin dengan status tidak dikenal ditolak", () =>
    set(ref(dokterA.db, `vaccinations/${idBaru()}`), vaksinSah(dokterA, { status: "terserah" })),
  )
  await harusDitolak("vaksin dengan status lama 'direkomendasikan' ditolak", () =>
    set(ref(dokterA.db, `vaccinations/${idBaru()}`), vaksinSah(dokterA, { status: "direkomendasikan" })),
  )

  await harusBerhasil("dokter A mengusulkan vaksin pertama (biaya kosong)", () =>
    buatVaksinasi(kA, dokterA.uid, { pet_id: kucing!.id, vaccine_name: " Rabies ", scheduled_date: tanggal(0), scheduled_time: "09:00", next_dose_date: tanggal(300), fee: 0 }),
  )
  await harusBerhasil("dokter A mengusulkan vaksin kedua", () =>
    buatVaksinasi(kA, dokterA.uid, { pet_id: kucing!.id, vaccine_name: "Distemper", scheduled_date: tanggal(1), scheduled_time: "11:00", next_dose_date: null, fee: 90000 }),
  )
  let vaksinA = await ambilVaksinasi(kA)
  const rabies = vaksinA.find((v) => v.vaccine_name === "Rabies")!
  const distemper = vaksinA.find((v) => v.vaccine_name === "Distemper")!
  cek("vaksin memakai harga layanan & nama dirapikan", rabies.fee === 175000 && distemper.fee === 90000, JSON.stringify(vaksinA.map((v) => [v.vaccine_name, v.fee])))
  cek("vaksin baru menunggu keputusan dokter dan memuat pemilik", rabies.status === "dijadwalkan" && rabies.owner?.full_name === "Budi Santoso")
  await harusGagalDengan("belum disetujui: tidak bisa ditandai suntik", "sudah disetujui", () => tandaiSudahDisuntik(kA, rabies.id, null))
  await harusDitolak("dokter tidak bisa langsung 'sudah_disuntik' sebelum disetujui", () => update(ref(dokterA.db, `vaccinations/${rabies.id}`), { status: "sudah_disuntik" }))
  await harusDitolak("dokter B tidak bisa memutuskan vaksin dokter A", () => update(ref(dokterB.db, `vaccinations/${rabies.id}`), { status: "dikonfirmasi" }))
  await harusDitolak("menolak vaksin tanpa alasan ditolak aturan", () => update(ref(dokterA.db, `vaccinations/${rabies.id}`), { status: "dibatalkan" }))
  await harusGagalDengan("menolak vaksin tanpa alasan ditolak", "Alasan penolakan wajib diisi", () => tolakVaksinasi(kA, distemper.id, "  "))
  await harusBerhasil("dokter A menolak vaksin kedua dengan alasan", () => tolakVaksinasi(kA, distemper.id, "Pasien sedang sakit"))
  await harusGagalDengan("vaksin yang sudah ditolak tidak bisa diputuskan lagi", "sudah diputuskan", () => setujuiVaksinasi(kA, distemper.id))
  await harusBerhasil("dokter A menyetujui vaksin pertama", () => setujuiVaksinasi(kA, rabies.id))
  vaksinA = await ambilVaksinasi(kA)
  const distemperSetelah = vaksinA.find((v) => v.id === distemper.id)!
  cek("vaksin ditolak tercatat beserta alasannya", distemperSetelah.status === "dibatalkan" && distemperSetelah.cancellation_reason === "Pasien sedang sakit")
  cek("vaksin disetujui berstatus dikonfirmasi tanpa alasan penolakan", vaksinA.find((v) => v.id === rabies.id)?.status === "dikonfirmasi" && vaksinA.find((v) => v.id === rabies.id)?.cancellation_reason === null)
  await harusDitolak("vaksin yang sudah disetujui tidak bisa ditolak lagi oleh dokter (lewat aturan)", () =>
    update(ref(dokterA.db, `vaccinations/${rabies.id}`), { status: "dibatalkan", cancellation_reason: "ubah pikiran" }),
  )
  await harusDitolak("dokter tidak bisa mengubah biaya vaksin", () => update(ref(dokterA.db, `vaccinations/${rabies.id}`), { fee: 1 }))
  await harusDitolak("dokter tidak bisa mengubah pasien vaksin", () => update(ref(dokterA.db, `vaccinations/${rabies.id}`), { pet_id: burung!.id }))
  await harusDitolak("dokter B tidak bisa menandai vaksin dokter A", () => update(ref(dokterB.db, `vaccinations/${rabies.id}`), { status: "sudah_disuntik" }))
  await harusBerhasil("dokter A menandai vaksin pertama sudah disuntik", () => tandaiSudahDisuntik(kA, rabies.id, tanggal(365)))
  vaksinA = await ambilVaksinasi(kA)
  const rabiesSetelah = vaksinA.find((v) => v.id === rabies.id)!
  cek("vaksin berstatus sudah_disuntik dengan tanggal suntik hari ini", rabiesSetelah.status === "sudah_disuntik" && rabiesSetelah.injected_date === tanggal(0) && rabiesSetelah.next_dose_date === tanggal(365))
  cek("dokter B tidak melihat vaksin dokter A", (await ambilVaksinasi(kB)).length === 0)
  await harusDitolak("dokter tidak bisa menghapus vaksin", () => remove(ref(dokterA.db, `vaccinations/${rabies.id}`)))

  console.log("\n=== 8. Pemeriksaan: dokter yang menyetujui atau menolak ===")
  await harusGagalDengan("pemeriksaan 'Lainnya' tanpa nama ditolak", "Nama pemeriksaan", () =>
    buatPemeriksaan(kA, dokterA.uid, { pet_id: kucing!.id, category: "laboratorium", type: "Lainnya", custom_name: " ", notes: null, fee: 0, scheduled_date: tanggal(2), scheduled_time: "08:00" }),
  )
  await harusBerhasil("dokter A menyarankan pemeriksaan", () =>
    buatPemeriksaan(kA, dokterA.uid, { pet_id: kucing!.id, category: "laboratorium", type: "Darah Lengkap", custom_name: "diabaikan", notes: " puasa ", fee: 300000, scheduled_date: tanggal(0), scheduled_time: "08:00" }),
  )
  await harusBerhasil("dokter A menyarankan pemeriksaan kedua", () =>
    buatPemeriksaan(kA, dokterA.uid, { pet_id: kucing!.id, category: "pencitraan", type: "Lainnya", custom_name: "USG Perut", notes: null, fee: 0, scheduled_date: tanggal(0), scheduled_time: "13:00" }),
  )
  const daftarPeriksa = await ambilPemeriksaan(kA)
  const periksa = daftarPeriksa.find((p) => p.type === "Darah Lengkap")!
  const periksaKedua = daftarPeriksa.find((p) => p.type === "Lainnya")!
  cek("pemeriksaan tersimpan (nama kustom hanya untuk 'Lainnya')", periksa.custom_name === null && periksa.notes === "puasa" && periksa.fee === 300000)
  cek("pemeriksaan baru menunggu keputusan dokter", periksa.status === "dijadwalkan")
  cek("pemeriksaan tanpa biaya memakai harga cadangan 250.000", periksaKedua.fee === 250000, String(periksaKedua.fee))
  await harusDitolak("dokter tidak bisa mengubah biaya pemeriksaan", () => update(ref(dokterA.db, `examinations/${periksa.id}`), { fee: 1 }))
  await harusDitolak("dokter B tidak bisa memutuskan pemeriksaan dokter A", () => update(ref(dokterB.db, `examinations/${periksa.id}`), { status: "dikonfirmasi" }))
  await harusGagalDengan("menolak pemeriksaan tanpa alasan ditolak", "Alasan penolakan wajib diisi", () => tolakPemeriksaan(kA, periksaKedua.id, ""))
  await harusBerhasil("dokter A menyetujui pemeriksaan pertama", () => setujuiPemeriksaan(kA, periksa.id))
  await harusBerhasil("dokter A menolak pemeriksaan kedua dengan alasan", () => tolakPemeriksaan(kA, periksaKedua.id, "Tidak diperlukan"))
  await harusGagalDengan("pemeriksaan yang sudah diputuskan tidak bisa diputuskan lagi", "sudah diputuskan", () => setujuiPemeriksaan(kA, periksaKedua.id))
  const periksaDitolak = (await ambilPemeriksaan(kAdmin)).find((p) => p.id === periksaKedua.id)!
  cek("pemeriksaan ditolak tercatat beserta alasannya", periksaDitolak.status === "dibatalkan" && periksaDitolak.cancellation_reason === "Tidak diperlukan")
  cek("pemeriksaan disetujui berstatus dikonfirmasi", (await ambilPemeriksaan(kAdmin)).find((p) => p.id === periksa.id)?.status === "dikonfirmasi")

  console.log("\n=== 8b. Janji temu selesai: langsung oleh dokter, atau lewat persetujuan vaksinasi / pemeriksaan ===")
  const janjiKonsul = await harusBerhasil("admin membuat janji temu 'Konsultasi' untuk Rex (dokter A)", () =>
    buatJanjiTemu(kAdmin, { pet_id: anjing!.id, doctor_id: dokterA.uid, date: tanggal(0), start_time: "17:00", purpose: "Konsultasi" }),
  )
  const janjiVaksin = await harusBerhasil("admin membuat janji temu 'Vaksinasi' untuk Rex (dokter A)", () =>
    buatJanjiTemu(kAdmin, { pet_id: anjing!.id, doctor_id: dokterA.uid, date: tanggal(0), start_time: "14:00", purpose: "Vaksinasi" }),
  )
  const janjiPeriksa = await harusBerhasil("admin membuat janji temu 'Pemeriksaan' untuk Rex (dokter A)", () =>
    buatJanjiTemu(kAdmin, { pet_id: anjing!.id, doctor_id: dokterA.uid, date: tanggal(0), start_time: "15:00", purpose: "Pemeriksaan" }),
  )
  const janjiB = await harusBerhasil("admin membuat janji temu Rex untuk dokter B (sementara)", () =>
    buatJanjiTemu(kAdmin, { pet_id: anjing!.id, doctor_id: dokterB.uid, date: tanggal(0), start_time: "16:00", purpose: "Vaksinasi" }),
  )
  const masukanParvo = { vaccine_name: "Parvo", scheduled_date: tanggal(0), scheduled_time: "14:00", next_dose_date: null, fee: 90000 }
  await harusGagalDengan("mengaitkan vaksin ke janji temu dokter lain ditolak", "tidak sesuai", () =>
    buatVaksinasi(kA, dokterA.uid, { ...masukanParvo, pet_id: anjing!.id, appointment_id: janjiB!.id }),
  )
  await harusGagalDengan("mengaitkan vaksin ke janji temu pasien lain ditolak", "tidak sesuai", () =>
    buatVaksinasi(kA, dokterA.uid, { ...masukanParvo, pet_id: kucing!.id, appointment_id: janjiVaksin!.id }),
  )
  await harusDitolak("aturan: vaksin terkait janji temu dokter lain ditolak", () =>
    set(ref(dokterA.db, `vaccinations/${idBaru()}`), vaksinSah(dokterA, { pet_id: anjing!.id, appointment_id: janjiB!.id })),
  )
  await harusDitolak("aturan: vaksin terkait janji temu pasien lain ditolak", () =>
    set(ref(dokterA.db, `vaccinations/${idBaru()}`), vaksinSah(dokterA, { appointment_id: janjiVaksin!.id })),
  )

  await harusBerhasil("dokter A mengusulkan vaksin terkait janji temu 'Vaksinasi'", () =>
    buatVaksinasi(kA, dokterA.uid, { ...masukanParvo, pet_id: anjing!.id, appointment_id: janjiVaksin!.id }),
  )
  const parvo = (await ambilVaksinasi(kA)).find((v) => v.vaccine_name === "Parvo")!
  const statusJanji = async (id: string) => (await ambilJanjiTemu(kA)).find((j) => j.id === id)
  cek("vaksin tercatat terkait janji temu dan janji temu belum selesai", parvo.appointment_id === janjiVaksin!.id && (await statusJanji(janjiVaksin!.id))?.status === "dijadwalkan")
  const iniIso = new Date().toISOString()
  await harusDitolak("janji temu tidak bisa diselesaikan lewat vaksin yang belum disetujui", () =>
    update(ref(dokterA.db), {
      [`appointments/${janjiVaksin!.id}/status`]: "selesai",
      [`appointments/${janjiVaksin!.id}/completed_at`]: iniIso,
      [`appointments/${janjiVaksin!.id}/vaccination_id`]: parvo.id,
    }),
  )
  await harusDitolak("janji temu tidak bisa diselesaikan lewat vaksin milik janji temu lain", () =>
    update(ref(dokterA.db), {
      [`vaccinations/${parvo.id}/status`]: "dikonfirmasi",
      [`appointments/${janjiPeriksa!.id}/status`]: "selesai",
      [`appointments/${janjiPeriksa!.id}/completed_at`]: iniIso,
      [`appointments/${janjiPeriksa!.id}/vaccination_id`]: parvo.id,
    }),
  )
  cek("... dan tidak ada yang tertulis setengah (vaksin tetap menunggu, janji temu tetap dijadwalkan)",
    (await ambilVaksinasi(kA)).find((v) => v.id === parvo.id)?.status === "dijadwalkan" && (await statusJanji(janjiPeriksa!.id))?.status === "dijadwalkan")
  await harusDitolak("dokter B tidak bisa menyelesaikan janji temu dokter A lewat vaksin", () =>
    update(ref(dokterB.db, `appointments/${janjiVaksin!.id}`), { status: "selesai" }),
  )
  const hasilSetuju = await harusBerhasil("dokter A menyetujui vaksin terkait", () => setujuiVaksinasi(kA, parvo.id))
  cek("menyetujui vaksin melaporkan janji temu ikut selesai", hasilSetuju?.janjiSelesai === true)
  const janjiVaksinSelesai = await statusJanji(janjiVaksin!.id)
  cek("janji temu langsung selesai: tanggal & jam terisi, layanan pencatatnya tersimpan",
    janjiVaksinSelesai?.status === "selesai" && typeof janjiVaksinSelesai.completed_at === "string" && janjiVaksinSelesai.vaccination_id === parvo.id)
  cek("janji temu selesai tidak lagi tampil di 'Janji Temu Mendatang' admin", !(await ambilJanjiTemuMendatang(kAdmin, 50)).some((j) => j.id === janjiVaksin!.id))
  await harusDitolak("dokter tidak bisa mengubah tanggal selesai hasil layanan", () =>
    update(ref(dokterA.db, `appointments/${janjiVaksin!.id}`), { completed_at: "2020-01-01T00:00:00.000Z" }),
  )
  await harusDitolak("dokter tidak bisa mengganti layanan pencatat setelahnya", () =>
    update(ref(dokterA.db, `appointments/${janjiVaksin!.id}`), { vaccination_id: "lain" }),
  )

  await harusBerhasil("dokter A menyarankan pemeriksaan terkait janji temu 'Pemeriksaan' (akan ditolak)", () =>
    buatPemeriksaan(kA, dokterA.uid, { pet_id: anjing!.id, category: "pencitraan", type: "Rontgen", custom_name: null, notes: null, fee: 150000, scheduled_date: tanggal(0), scheduled_time: "15:00", appointment_id: janjiPeriksa!.id }),
  )
  const rontgen = (await ambilPemeriksaan(kA)).find((p) => p.type === "Rontgen")!
  const hasilTolak = await harusBerhasil("dokter A menolak pemeriksaan terkait", () => tolakPemeriksaan(kA, rontgen.id, "Tidak diperlukan"))
  cek("menolak pemeriksaan TIDAK menyelesaikan janji temu", hasilTolak?.janjiSelesai === false && (await statusJanji(janjiPeriksa!.id))?.status === "dijadwalkan")
  await harusBerhasil("dokter A menyarankan pemeriksaan kedua terkait janji temu yang sama", () =>
    buatPemeriksaan(kA, dokterA.uid, { pet_id: anjing!.id, category: "pencitraan", type: "USG", custom_name: null, notes: null, fee: 200000, scheduled_date: tanggal(0), scheduled_time: "15:00", appointment_id: janjiPeriksa!.id }),
  )
  const usg = (await ambilPemeriksaan(kA)).find((p) => p.type === "USG")!
  const hasilSetujuiUsg = await harusBerhasil("dokter A menyetujui pemeriksaan terkait", () => setujuiPemeriksaan(kA, usg.id))
  const janjiPeriksaSelesai = await statusJanji(janjiPeriksa!.id)
  cek("menyetujui pemeriksaan menyelesaikan janji temu dan mencatat layanannya",
    hasilSetujuiUsg?.janjiSelesai === true && janjiPeriksaSelesai?.status === "selesai" && janjiPeriksaSelesai.examination_id === usg.id)
  await harusGagalDengan("layanan terkait janji temu yang sudah selesai tidak bisa dikaitkan lagi", "tidak sesuai", () =>
    buatPemeriksaan(kA, dokterA.uid, { pet_id: anjing!.id, category: "pencitraan", type: "USG", custom_name: null, notes: null, fee: 1, scheduled_date: tanggal(0), scheduled_time: "15:00", appointment_id: janjiPeriksa!.id }),
  )
  // Pencocokan otomatis: usulan TANPA janji temu terpilih tetap menyelesaikan janji temu yang keperluannya cocok.
  const janjiOtomatis = await harusBerhasil("admin membuat janji temu 'Pemeriksaan' untuk Rex (dokter A)", () =>
    buatJanjiTemu(kAdmin, { pet_id: anjing!.id, doctor_id: dokterA.uid, date: tanggal(0), start_time: "18:00", purpose: "Pemeriksaan" }),
  )
  await harusBerhasil("dokter A menyarankan pemeriksaan TANPA memilih janji temu", () =>
    buatPemeriksaan(kA, dokterA.uid, { pet_id: anjing!.id, category: "laboratorium", type: "Urinalisis", custom_name: null, notes: null, fee: 100000, scheduled_date: tanggal(0), scheduled_time: "18:00" }),
  )
  const urinalisis = (await ambilPemeriksaan(kA)).find((p) => p.type === "Urinalisis")!
  cek("pemeriksaan itu belum terkait janji temu", urinalisis.appointment_id === null)
  const hasilOtomatis = await harusBerhasil("dokter A menyetujui pemeriksaan tanpa tautan", () => setujuiPemeriksaan(kA, urinalisis.id))
  const janjiOtomatisSelesai = await statusJanji(janjiOtomatis!.id)
  cek("janji temu 'Pemeriksaan' yang cocok otomatis selesai dan tertaut", hasilOtomatis?.janjiSelesai === true && janjiOtomatisSelesai?.status === "selesai" && janjiOtomatisSelesai.examination_id === urinalisis.id)
  cek("pemeriksaan kini tercatat terkait janji temu itu", (await ambilPemeriksaan(kA)).find((p) => p.id === urinalisis.id)?.appointment_id === janjiOtomatis!.id)
  cek("janji temu 'Konsultasi' tidak ikut selesai (keperluan tidak cocok)", (await statusJanji(janjiKonsul!.id))?.status === "dijadwalkan")

  // Tandai selesai langsung, tanpa hasil konsultasi.
  await harusDitolak("dokter B tidak bisa menandai selesai janji temu dokter A", () =>
    update(ref(dokterB.db, `appointments/${janjiKonsul!.id}`), { status: "selesai", completed_at: new Date().toISOString() }),
  )
  await harusDitolak("dokter tidak bisa menandai selesai janji temu yang sudah dibatalkan", () =>
    update(ref(dokterA.db, `appointments/${janjiMalam!.id}`), { status: "selesai", completed_at: new Date().toISOString() }),
  )
  await harusGagalDengan("tandai selesai: janji temu dibatalkan ditolak", "dibatalkan", () => selesaikanJanjiTemu(kA, janjiMalam!.id, new Date().toISOString()))
  await harusGagalDengan("tandai selesai: waktu di masa depan ditolak", "masa depan", () => selesaikanJanjiTemu(kA, janjiKonsul!.id, new Date(Date.now() + 3_600_000).toISOString()))
  await harusGagalDengan("tandai selesai: waktu tidak valid ditolak", "tidak valid", () => selesaikanJanjiTemu(kA, janjiKonsul!.id, "bukan tanggal"))
  await harusGagalDengan("tandai selesai: janji temu dokter lain tidak ditemukan", "tidak ditemukan", () => selesaikanJanjiTemu(kB, janjiKonsul!.id, new Date().toISOString()))
  const selesaiLangsung = new Date(Date.now() - 10 * 60_000)
  await harusBerhasil("dokter A menandai janji temu 'Konsultasi' selesai langsung (tanpa hasil konsultasi)", () =>
    selesaikanJanjiTemu(kA, janjiKonsul!.id, selesaiLangsung.toISOString()),
  )
  const janjiKonsulSelesai = await statusJanji(janjiKonsul!.id)
  cek("janji temu selesai langsung dengan tanggal & jam yang dipilih dokter", janjiKonsulSelesai?.status === "selesai" && janjiKonsulSelesai.completed_at === selesaiLangsung.toISOString() && janjiKonsulSelesai.consultation === null)
  await harusGagalDengan("janji temu yang sudah selesai tidak bisa ditandai selesai lagi", "sudah selesai", () => selesaikanJanjiTemu(kA, janjiKonsul!.id, new Date().toISOString()))
  await harusGagalDengan("janji temu yang selesai langsung tidak bisa diberi hasil konsultasi lagi", "sudah dicatat", () =>
    catatHasilKonsultasi(kA, { appointment_id: janjiKonsul!.id, doctor_notes: "x", completed_at: new Date().toISOString() }),
  )

  await harusBerhasil("admin menghapus janji temu sementara dokter B", () => hapusPermanen(kAdmin, "appointments", janjiB!.id))
  cek("akses dokter B ke Rex dicabut setelah janji temunya dihapus", (await ambilHewan(kB)).length === 0)

  console.log("\n=== 9. Keuangan & riwayat medis (admin) ===")
  await harusBerhasil("admin mencatat pengeluaran manual", () =>
    catatTransaksiManual(kAdmin, { description: " Beli obat ", type: "pengeluaran", amount: 50000, date: tanggal(0), category: "Obat" }),
  )
  await harusGagalDengan("transaksi manual negatif ditolak", "tidak valid", () => catatTransaksiManual(kAdmin, { description: "x", type: "pemasukan", amount: -5, date: tanggal(0), category: "Lainnya" }))
  await harusDitolak("dokter tidak bisa menulis transaksi", () => set(ref(dokterA.db, `transactions/${push(ref(dokterA.db, "transactions")).key}`), { amount: 1 }))
  await harusDitolak("transaksi dengan jumlah negatif ditolak aturan", () => set(ref(admin.db, `transactions/${push(ref(admin.db, "transactions")).key}`), { amount: -1 }))
  const transaksi = await ambilTransaksi(kAdmin)
  cek("transaksi: 2 janji temu selesai + 2 vaksin + 3 pemeriksaan disetujui + 1 manual = 8", transaksi.length === 8, transaksi.map((t) => t.description).join(" | "))
  cek("janji temu yang selesai lewat layanan tidak ditagih dua kali", !transaksi.some((t) => [janjiVaksin!.id, janjiPeriksa!.id, janjiOtomatis!.id].includes(t.appointment_id ?? "")))
  cek("janji temu yang ditandai selesai langsung ditagih sebesar harga standarnya", transaksi.some((t) => t.appointment_id === janjiKonsul!.id && t.amount === 120000))
  cek("biaya layanan terkait janji temu tetap tercatat", transaksi.some((t) => t.vaccination_id === parvo.id && t.amount === 90000) && transaksi.some((t) => t.examination_id === usg.id && t.amount === 200000))
  cek("transaksi janji temu memuat nama hewan & harga", transaksi.some((t) => t.appointment_id === janji!.id && t.description === "Konsultasi - Mimi" && t.amount === 120000 && t.category === "Konsultasi"))
  cek("transaksi vaksin memakai tanggal suntik", transaksi.some((t) => t.vaccination_id === rabies.id && t.date === tanggal(0) && t.description === "Vaksin Rabies - Mimi"))
  cek("vaksin & pemeriksaan yang ditolak tidak jadi transaksi", !transaksi.some((t) => t.examination_id === periksaKedua.id || t.vaccination_id === distemper.id))
  cek("janji temu dibatalkan tidak jadi transaksi", !transaksi.some((t) => t.appointment_id === janjiMalam!.id))
  const ringkasan = hitungRingkasanBulanan(transaksi)
  cek("ringkasan: pemasukan 1.105.000, pengeluaran 50.000", ringkasan.pemasukan === 120000 + 120000 + 175000 + 90000 + 300000 + 200000 + 100000 && ringkasan.pengeluaran === 50000, JSON.stringify(ringkasan))

  const riwayat = await ambilRiwayatMedis(kAdmin)
  const hitungRiwayat = (tipe: string) => riwayat.filter((r) => r.record_type === tipe).length
  cek("riwayat medis = 1 konsultasi + 2 vaksin + 3 pemeriksaan yang disetujui", hitungRiwayat("konsultasi") === 1 && hitungRiwayat("vaksinasi") === 2 && hitungRiwayat("pemeriksaan") === 3, riwayat.map((r) => r.record_type).join())
  cek("riwayat memuat judul & nama dokter", riwayat.some((r) => r.title === "Pemeriksaan laboratorium: Darah Lengkap" && r.doctor_name === "Dokter A" && r.pet_name === "Mimi"))

  console.log("\n=== 10. Perpindahan dokter, arsip, dan penghapusan ===")
  await harusBerhasil("admin memindahkan janji temu ke dokter B", () => tetapkanDokterJanjiTemu(kAdmin, janji!.id, dokterB.uid))
  cek("dokter B kini melihat Mimi", (await ambilHewan(kB)).map((h) => h.name).join() === "Mimi")
  cek("dokter A tidak lagi menangani Mimi (hanya Rex dari janji temu lain)", (await ambilHewan(kA)).map((h) => h.name).join() === "Rex")
  await harusDitolak("dokter A kehilangan akses baca ke Mimi", () => get(ref(dokterA.db, `pets/${kucing!.id}`)))
  await harusBerhasil("admin mengembalikan janji temu ke dokter A", () => tetapkanDokterJanjiTemu(kAdmin, janji!.id, dokterA.uid))

  await harusGagalDengan("pasien dengan riwayat tidak bisa dihapus permanen", "Gunakan Arsipkan", () => hapusPermanen(kAdmin, "pets", kucing!.id))
  await harusGagalDengan("vaksin yang sudah masuk keuangan tidak bisa dihapus", "Gunakan Arsipkan", () => hapusPermanen(kAdmin, "vaccinations", rabies.id))
  await harusGagalDengan("janji temu yang punya hasil konsultasi tidak bisa dihapus", "Gunakan Arsipkan", () => hapusPermanen(kAdmin, "appointments", janji!.id))
  await harusDitolak("dokter tidak bisa mengarsipkan data", () => arsipkan(kA, "vaccinations", rabies.id))
  await harusDitolak("dokter tidak bisa menghapus data", () => hapusPermanen(kA, "examinations", periksaKedua.id))

  await harusBerhasil("admin mengarsipkan vaksin yang disuntik", () => arsipkan(kAdmin, "vaccinations", rabies.id))
  cek("vaksin terarsip hilang dari daftar aktif", !(await ambilVaksinasi(kAdmin)).some((v) => v.id === rabies.id))
  const terarsip = await ambilVaksinasi(kAdmin, { diarsipkan: true })
  cek("vaksin terarsip tercatat waktu & pelakunya", terarsip.length === 1 && terarsip[0].is_archived && terarsip[0].archived_at != null)
  cek("dokter A tidak lagi melihat vaksin terarsip di daftar aktif", !(await ambilVaksinasi(kA)).some((v) => v.id === rabies.id))
  cek("arsip tidak menghapus catatan keuangan", (await ambilTransaksi(kAdmin)).some((t) => t.vaccination_id === rabies.id))
  await harusBerhasil("admin memulihkan vaksin", () => pulihkan(kAdmin, "vaccinations", rabies.id))
  cek("vaksin pulih ke daftar aktif dan kolom arsip kembali null", (await ambilVaksinasi(kAdmin)).find((v) => v.id === rabies.id)?.archived_at === null)

  await harusBerhasil("admin menghapus permanen vaksin yang ditolak", () => hapusPermanen(kAdmin, "vaccinations", distemper.id))
  await harusBerhasil("admin menghapus permanen pemeriksaan yang ditolak", () => hapusPermanen(kAdmin, "examinations", periksaKedua.id))
  await harusBerhasil("admin menghapus permanen rontgen yang ditolak", () => hapusPermanen(kAdmin, "examinations", rontgen.id))
  cek("vaksin dan pemeriksaan yang ditolak terhapus (sisa: 2 vaksin, 3 pemeriksaan disetujui)", (await ambilVaksinasi(kAdmin)).length === 2 && (await ambilPemeriksaan(kAdmin)).length === 3)
  await harusGagalDengan("janji temu yang selesai lewat layanan tidak bisa dihapus permanen", "Gunakan Arsipkan", () => hapusPermanen(kAdmin, "appointments", janjiVaksin!.id))

  const kosong = await harusBerhasil("admin menambah janji temu lalu menghapusnya", async () => {
    const baru = await buatJanjiTemu(kAdmin, { pet_id: anjing!.id, doctor_id: dokterB.uid, date: tanggal(0), start_time: "09:00", purpose: "Konsultasi" })
    cek("dokter B menangani Rex setelah janji temu dibuat", (await ambilHewan(kB)).some((h) => h.name === "Rex"))
    await hapusPermanen(kAdmin, "appointments", baru.id)
    return baru
  })
  cek("setelah janji temu dihapus dokter B tidak lagi menangani Rex", kosong != null && !(await ambilHewan(kB)).some((h) => h.name === "Rex"))

  await harusBerhasil("admin mengarsipkan pasien yang belum punya riwayat", () => arsipkan(kAdmin, "pets", burung!.id))
  cek("pasien terarsip hilang dari daftar aktif", !(await ambilHewan(kAdmin)).some((h) => h.id === burung!.id))
  await harusBerhasil("admin menghapus permanen pasien tanpa riwayat", () => hapusPermanen(kAdmin, "pets", burung!.id))
  cek("pasien terhapus (pemilik ikut terhapus karena satu data)", (await ambilHewan(kAdmin, { diarsipkan: true })).length === 0)

  console.log("\n=== 11. Pengguna anonim ===")
  const anonim = getDatabase(initializeApp({ apiKey: "k", projectId: PROYEK, appId: "a", databaseURL: URL_DATABASE }, "anonim"))
  connectDatabaseEmulator(anonim, HOST_DATABASE, Number(PORT_DATABASE))
  await harusDitolak("anonim tidak bisa membaca pasien", () => get(ref(anonim, "pets")))
  await harusDitolak("anonim tidak bisa membaca layanan", () => get(ref(anonim, "services")))
  await harusDitolak("anonim tidak bisa membaca profil", () => get(ref(anonim, "profiles")))
  await harusDitolak("anonim tidak bisa menulis pasien", () => set(ref(anonim, `pets/${push(ref(anonim, "pets")).key}`), { name: "x" }))
  await harusDitolak("anonim tidak bisa membaca seluruh database", () => get(ref(anonim)))

  console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal`)
  process.exit(gagal > 0 ? 1 : 0)
}

utama().catch((galat) => {
  console.error("\nUji berhenti karena galat tak terduga:", galat)
  process.exit(1)
})
