// Mengubah galat dari Firebase (Realtime Database dan Authentication) menjadi pesan yang mudah dipahami.

/**
 * Kode galat Firebase, mis. "permission-denied" atau "auth/invalid-credential".
 * Realtime Database memakai gaya "PERMISSION_DENIED"; disamakan menjadi "permission-denied".
 */
export function kodeGalat(galat: unknown): string | undefined {
  if (typeof galat === "object" && galat !== null && "code" in galat) {
    const kode = (galat as { code?: unknown }).code
    if (typeof kode === "string") return kode.includes("/") ? kode : kode.toLowerCase().replace(/_/g, "-")
  }
  // Pembacaan (get) yang ditolak aturan akses Realtime Database berupa Error("Permission denied") tanpa kode.
  if (galat instanceof Error && galat.message.toLowerCase() === "permission denied") return "permission-denied"
  return undefined
}

const PESAN_KONEKSI = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi."

/** Pesan galat dalam bahasa Indonesia untuk ditampilkan ke pengguna. */
export function pesanGalat(galat: unknown): string {
  const kode = kodeGalat(galat)

  if (kode?.startsWith("auth/")) return pesanGalatAuth(galat as { code?: string })

  // Pelanggaran aturan akses (database.rules.json).
  if (kode === "permission-denied") {
    return (
      "Anda tidak memiliki izin untuk melakukan tindakan ini. " +
      "Bila seharusnya berhak, pastikan aturan database terbaru (database.rules.json) sudah dipublikasikan di Firebase Console."
    )
  }
  if (kode === "disconnected" || kode === "network-error" || kode === "unavailable") return PESAN_KONEKSI

  if (galat instanceof Error) return galat.message
  return "Terjadi kesalahan yang tidak diketahui."
}

/** Pesan galat untuk proses login / pendaftaran (Firebase Authentication). */
export function pesanGalatAuth(galat: { code?: string; message?: string } | null | undefined): string {
  switch (galat?.code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau kata sandi salah. Silakan coba lagi."
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Silakan masuk."
    case "auth/weak-password":
      return "Kata sandi minimal 6 karakter."
    case "auth/invalid-email":
      return "Format email tidak valid."
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi."
    case "auth/user-disabled":
      return "Akun ini dinonaktifkan. Hubungi pengelola klinik."
    case "auth/network-request-failed":
      return PESAN_KONEKSI
    case "auth/operation-not-allowed":
      return "Login dengan email dan kata sandi belum diaktifkan di Firebase Authentication."
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
    case "auth/configuration-not-found":
      return "Konfigurasi Firebase tidak valid. Periksa berkas .env."
    default:
      return "Terjadi kesalahan. Silakan coba lagi."
  }
}

/**
 * Memastikan alamat tujuan setelah login berupa jalur di dalam aplikasi ini
 * (mencegah pengalihan ke situs lain lewat parameter ?lanjut=...).
 */
export function jalurAmanAtauNull(jalur: string | null): string | null {
  if (!jalur) return null
  return jalur.startsWith("/") && !jalur.startsWith("//") ? jalur : null
}
