import type { ReactNode } from "react"
import Link from "next/link"
import {
  CalendarCheck,
  ClipboardList,
  FlaskConical,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { kelasTombol } from "@/components/ui/tombol"

/** Judul dan pengantar singkat untuk tiap bagian beranda. */
function JudulBagian({ label, judul, deskripsi }: { label: string; judul: string; deskripsi: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-sorot">{label}</p>
      <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{judul}</h2>
      <p className="mt-3 text-muted-foreground">{deskripsi}</p>
    </div>
  )
}

function Bagian({ id, terang = false, children }: { id?: string; terang?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={terang ? "bg-card py-20" : "py-20"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

export function BagianUtama() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
            <PawPrint className="h-4 w-4" />
            Klinik hewan &amp; pet shop
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
            Perawatan terbaik untuk <span className="text-primary">sahabat berbulu</span> Anda
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Kelola data pasien (pemilik dan hewannya), jadwal janji temu, vaksinasi, pemeriksaan, serta keuangan klinik
            dalam satu tempat.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/daftar" className={kelasTombol({ ukuran: "besar" })}>
              Daftar akun staf
            </Link>
            <Link href="/masuk" className={kelasTombol({ ukuran: "besar", varian: "garis" })}>
              Sudah punya akun? Masuk
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { ikon: CalendarCheck, judul: "Janji temu terjadwal", teks: "Atur dokter, tanggal, dan jam kunjungan di kalender mingguan." },
            { ikon: Syringe, judul: "Jadwal vaksin", teks: "Dokter memutuskan sendiri dan dosis berikutnya terpantau." },
            { ikon: ClipboardList, judul: "Riwayat medis", teks: "Semua catatan dokter tersimpan rapi." },
            { ikon: Wallet, judul: "Keuangan otomatis", teks: "Pemasukan layanan tercatat otomatis oleh sistem." },
          ].map(({ ikon: Ikon, judul, teks }) => (
            <div key={judul} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Ikon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold">{judul}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{teks}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const daftarFitur: { ikon: LucideIcon; judul: string; teks: string }[] = [
  { ikon: PawPrint, judul: "Satu formulir pasien", teks: "Data pemilik beserta jenis, ras, tanggal lahir, dan berat hewan diisi sekali jalan." },
  { ikon: CalendarCheck, judul: "Janji temu mudah", teks: "Admin menjadwalkan; dokter menyelesaikannya langsung dengan tanggal dan jam selesai." },
  { ikon: Syringe, judul: "Vaksinasi terpantau", teks: "Dokter mengusulkan jadwal, lalu menyetujui atau menolaknya sendiri." },
  { ikon: FlaskConical, judul: "Pemeriksaan penunjang", teks: "Rontgen, USG, hingga tes laboratorium disarankan langsung oleh dokter." },
  { ikon: ClipboardList, judul: "Riwayat medis digital", teks: "Hasil konsultasi, vaksin, dan pemeriksaan terkumpul dalam satu riwayat." },
  { ikon: ShieldCheck, judul: "Data aman", teks: "Setiap pengguna hanya dapat melihat data yang menjadi haknya." },
]

export function BagianFitur() {
  return (
    <Bagian id="fitur" terang>
      <JudulBagian label="Fitur" judul="Semua yang dibutuhkan klinik hewan" deskripsi="Dirancang agar admin dan dokter hewan bekerja dalam satu sistem yang sama." />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {daftarFitur.map(({ ikon: Ikon, judul, teks }) => (
          <div key={judul} className="rounded-2xl border border-border bg-background p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Ikon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold">{judul}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{teks}</p>
          </div>
        ))}
      </div>
    </Bagian>
  )
}

const daftarLayanan: { ikon: LucideIcon; judul: string; teks: string }[] = [
  { ikon: Stethoscope, judul: "Konsultasi dokter hewan", teks: "Pemeriksaan umum dan konsultasi kesehatan hewan peliharaan." },
  { ikon: Syringe, judul: "Vaksinasi", teks: "Vaksin rabies, kombinasi, dan vaksin lanjutan sesuai kebutuhan." },
  { ikon: FlaskConical, judul: "Laboratorium & pencitraan", teks: "Tes darah, urin, feses, rontgen, dan USG." },
  { ikon: PawPrint, judul: "Perawatan hewan", teks: "Grooming dan tindakan medis ringan oleh tenaga berpengalaman." },
]

export function BagianLayanan() {
  return (
    <Bagian id="layanan">
      <JudulBagian label="Layanan" judul="Layanan klinik kami" deskripsi="Pilih layanan yang dibutuhkan saat membuat janji temu." />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {daftarLayanan.map(({ ikon: Ikon, judul, teks }) => (
          <div key={judul} className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Ikon className="h-7 w-7" />
            </span>
            <h3 className="mt-4 font-bold">{judul}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{teks}</p>
          </div>
        ))}
      </div>
    </Bagian>
  )
}

const langkahKerja = [
  { judul: "Daftar akun staf", teks: "Dokter atau admin membuat akun dengan email. Admin menyetujui pendaftaran dan menentukan perannya." },
  { judul: "Daftarkan pasien", teks: "Admin mengisi data pemilik dan hewannya dalam satu formulir, lalu membuat janji temu dengan dokter." },
  { judul: "Tangani & pantau", teks: "Dokter menyelesaikan pemeriksaan, lalu menyetujui atau menolak vaksin dan pemeriksaan yang ia usulkan; admin memantau keuangan." },
]

export function BagianCaraKerja() {
  return (
    <Bagian id="cara-kerja" terang>
      <JudulBagian label="Cara kerja" judul="Mulai dalam tiga langkah" deskripsi="Alur kerja klinik dari pendaftaran hingga laporan keuangan." />
      <ol className="grid gap-6 md:grid-cols-3">
        {langkahKerja.map((langkah, urutan) => (
          <li key={langkah.judul} className="relative rounded-2xl border border-border bg-background p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sorot text-lg font-extrabold text-white">
              {urutan + 1}
            </span>
            <h3 className="mt-4 text-lg font-bold">{langkah.judul}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{langkah.teks}</p>
          </li>
        ))}
      </ol>
    </Bagian>
  )
}

const daftarPeran: { ikon: LucideIcon; judul: string; poin: string[] }[] = [
  { ikon: Stethoscope, judul: "Dokter hewan", poin: ["Melihat janji temu pasien", "Menyelesaikan pemeriksaan & mencatat hasil", "Mengusulkan, menyetujui, atau menolak vaksin & pemeriksaan", "Menandai vaksin yang sudah disuntik"] },
  { ikon: UserCog, judul: "Admin klinik", poin: ["Mendaftarkan pasien (pemilik & hewan)", "Mengatur jadwal & dokter", "Memantau konsultasi, vaksinasi, dan pemeriksaan", "Menyetujui akun baru, mengelola keuangan & arsip"] },
]

export function BagianPeran() {
  return (
    <Bagian id="peran">
      <JudulBagian label="Untuk siapa" judul="Dua peran, satu sistem" deskripsi="Setiap peran mendapat tampilan dan hak akses yang sesuai." />
      <div className="grid gap-6 md:grid-cols-2">
        {daftarPeran.map(({ ikon: Ikon, judul, poin }) => (
          <div key={judul} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Ikon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-xl font-bold">{judul}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {poin.map((isi) => (
                <li key={isi} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {isi}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Bagian>
  )
}

export function BagianAjakan() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground">
        <h2 className="text-3xl font-extrabold">Siap mengelola klinik dengan lebih rapi?</h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
          Buat akun staf dan mulai gunakan Petshopku untuk mencatat pasien dan layanan klinik.
        </p>
        <Link href="/daftar" className={kelasTombol({ ukuran: "besar", className: "mt-8 bg-white text-primary hover:bg-white/90" })}>
          Daftar akun staf
        </Link>
      </div>
    </section>
  )
}
