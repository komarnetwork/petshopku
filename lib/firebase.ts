import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth"
import { connectDatabaseEmulator, getDatabase, type Database } from "firebase/database"
import type { Peran } from "@/lib/tipe"

/** Alamat emulator lokal (firebase emulators:start). */
const HOST_EMULATOR = "127.0.0.1"
const PORT_AUTH_EMULATOR = 9099
const PORT_DATABASE_EMULATOR = 9000

/** true bila aplikasi diminta memakai emulator Firebase di komputer sendiri. */
export function memakaiEmulator() {
  return process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true"
}

/** Baca konfigurasi Firebase dari variabel lingkungan. */
export function bacaKonfigurasiFirebase() {
  // Variabel NEXT_PUBLIC_ harus dibaca langsung (process.env.NAMA) agar
  // Next.js menyertakannya ke dalam kode browser saat build.
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim()
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim()
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim()

  if (memakaiEmulator()) {
    // Mode emulator selalu memakai project demo, apa pun isi .env, supaya tidak
    // pernah tercampur dengan project Firebase sungguhan (cocok dengan `npm run emulator`).
    return {
      apiKey: "kunci-emulator",
      authDomain: "localhost",
      projectId: "demo-petshopku",
      appId: "app-emulator",
      // Nama namespace emulator diambil dari bagian depan alamat ini.
      databaseURL: "https://demo-petshopku-default-rtdb.firebaseio.com",
    }
  }

  if (!apiKey || !authDomain || !projectId || !appId || !databaseURL) {
    throw new Error(
      "Konfigurasi Firebase belum lengkap. Isi NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID, dan NEXT_PUBLIC_FIREBASE_DATABASE_URL " +
        "di berkas .env (lihat .env.example), lalu jalankan ulang server.",
    )
  }

  return { apiKey, authDomain, projectId, appId, databaseURL }
}

interface KlienFirebase {
  aplikasi: FirebaseApp
  auth: Auth
  db: Database
}

let klienTersimpan: KlienFirebase | null = null

/**
 * Membuat (sekali saja) koneksi ke Firebase Authentication dan Realtime Database.
 * Hanya dipanggil dari komponen browser.
 */
export function buatKlienFirebase(): KlienFirebase {
  if (klienTersimpan) return klienTersimpan

  const aplikasi = getApps().length > 0 ? getApp() : initializeApp(bacaKonfigurasiFirebase())
  const auth = getAuth(aplikasi)
  const db = getDatabase(aplikasi)

  if (memakaiEmulator()) {
    // Emulator hanya boleh disambungkan sekali per instance (hot reload memuat modul ini ulang).
    const global = globalThis as { __petshopkuEmulatorTersambung?: boolean }
    if (!global.__petshopkuEmulatorTersambung) {
      connectAuthEmulator(auth, `http://${HOST_EMULATOR}:${PORT_AUTH_EMULATOR}`, { disableWarnings: true })
      connectDatabaseEmulator(db, HOST_EMULATOR, PORT_DATABASE_EMULATOR)
      global.__petshopkuEmulatorTersambung = true
    }
  }

  klienTersimpan = { aplikasi, auth, db }
  return klienTersimpan
}

/**
 * Yang dipakai seluruh fungsi di lib/data: koneksi Realtime Database beserta pengguna yang sedang login.
 * Peran dipakai untuk memilih kueri yang sesuai dengan aturan akses (database.rules.json).
 */
export interface KlienData {
  db: Database
  uid: string | null
  peran: Peran | null
}
