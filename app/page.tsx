
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Petshopku - Klinik Hewan & Pet Shop',
  description:
    'Kelola janji temu, vaksinasi, pemeriksaan, dan keuangan klinik hewan dalam satu tempat.',
};

const tombol =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';
const tombolUtama = `${tombol} bg-teal-700 text-white hover:bg-teal-700/90`;
const tombolGaris = `${tombol} border border-slate-200 bg-white text-teal-950 hover:bg-slate-50`;

const menu = [
  { href: '#fitur', label: 'Fitur' },
  { href: '#layanan', label: 'Layanan' },
  { href: '#cara-kerja', label: 'Cara Kerja' },
  { href: '#peran', label: 'Untuk Siapa' },
];

// Contoh tampilan saja, nanti diganti dengan data janji temu dari database.
const jadwalContoh = [
  {
    jam: '09.00',
    hewan: 'Milo',
    jenis: 'Kucing persia',
    pemilik: 'Bu Rina',
    dokter: 'drh. Sari',
    status: 'selesai',
  },
  {
    jam: '10.30',
    hewan: 'Bruno',
    jenis: 'Golden retriever',
    pemilik: 'Pak Dedi',
    dokter: 'drh. Sari',
    status: 'dijadwalkan',
  },
  {
    jam: '13.00',
    hewan: 'Kiki',
    jenis: 'Kelinci',
    pemilik: 'Laras',
    dokter: 'drh. Anton',
    status: 'dijadwalkan',
  },
  {
    jam: '15.30',
    hewan: 'Oyen',
    jenis: 'Kucing kampung',
    pemilik: 'Pak Joko',
    dokter: 'drh. Anton',
    status: 'dibatalkan',
  },
];

const warnaStatus: Record<string, string> = {
  dijadwalkan: 'bg-teal-50 text-teal-800',
  selesai: 'bg-emerald-100 text-emerald-800',
  dibatalkan: 'bg-slate-100 text-slate-500',
};

const fitur = [
  {
    judul: 'Satu formulir pasien',
    teks: 'Data pemilik dan hewannya (jenis, ras, tanggal lahir, berat) diisi sekali jalan.',
  },
  {
    judul: 'Janji temu',
    teks: 'Admin membuat jadwal dan memilih dokter. Dokter menandai pemeriksaan selesai lengkap dengan tanggal dan jamnya.',
  },
  {
    judul: 'Vaksinasi',
    teks: 'Dokter mengusulkan jadwal vaksin lalu menyetujui atau menolaknya sendiri. Dosis berikutnya ikut tercatat.',
  },
  {
    judul: 'Pemeriksaan penunjang',
    teks: 'Rontgen, USG, sampai tes laboratorium bisa disarankan dokter langsung dari data pasien.',
  },
  {
    judul: 'Riwayat medis',
    teks: 'Hasil konsultasi, vaksin, dan pemeriksaan tiap hewan terkumpul dalam satu riwayat.',
  },
  {
    judul: 'Keuangan',
    teks: 'Pemasukan dari layanan yang sudah selesai tercatat otomatis, sehingga admin tinggal memantau.',
  },
];

const layanan = [
  {
    nama: 'Konsultasi dokter hewan',
    isi: [
      'Pemeriksaan umum',
      'Konsultasi kesehatan',
      'Kontrol setelah tindakan',
    ],
  },
  {
    nama: 'Vaksinasi',
    isi: [
      'Rabies',
      'Vaksin kombinasi',
      'Vaksin lanjutan sesuai jadwal',
    ],
  },
  {
    nama: 'Laboratorium & pencitraan',
    isi: ['Tes darah, urin, feses', 'Rontgen', 'USG'],
  },
  {
    nama: 'Perawatan hewan',
    isi: ['Grooming', 'Tindakan medis ringan'],
  },
];

const langkah = [
  {
    judul: 'Daftar akun staf',
    teks: 'Dokter atau admin mendaftar menggunakan email. Admin menyetujui akun baru dan menentukan perannya.',
  },
  {
    judul: 'Daftarkan pasien',
    teks: 'Admin mengisi data pemilik dan hewannya, lalu membuat janji temu dengan dokter yang bertugas.',
  },
  {
    judul: 'Tangani dan pantau',
    teks: 'Dokter menyelesaikan pemeriksaan dan memutuskan vaksin atau pemeriksaan lanjutan. Admin memantau keuangan.',
  },
];

const peran = [
  {
    judul: 'Dokter hewan',
    gelap: false,
    poin: [
      'Melihat janji temu pasiennya',
      'Menyelesaikan pemeriksaan dan mencatat hasil',
      'Mengusulkan, menyetujui, atau menolak vaksin dan pemeriksaan',
      'Menandai vaksin yang sudah disuntik',
    ],
  },
  {
    judul: 'Admin klinik',
    gelap: true,
    poin: [
      'Mendaftarkan pasien (pemilik dan hewan)',
      'Mengatur jadwal dan dokter',
      'Memantau konsultasi, vaksinasi, dan pemeriksaan',
      'Menyetujui akun baru, mengelola keuangan, dan arsip',
    ],
  },
];

function Logo({ ukuran = 36 }: { ukuran?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={ukuran}
        height={ukuran}
        viewBox="0 0 40 40"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="#0f766e" />
        <g fill="#ffffff">
          <ellipse
            cx="12"
            cy="17"
            rx="3"
            ry="4"
            transform="rotate(-18 12 17)"
          />
          <ellipse
            cx="17.5"
            cy="11.5"
            rx="3"
            ry="4.2"
            transform="rotate(-6 17.5 11.5)"
          />
          <ellipse
            cx="24.5"
            cy="11.5"
            rx="3"
            ry="4.2"
            transform="rotate(6 24.5 11.5)"
          />
          <ellipse
            cx="30"
            cy="17"
            rx="3"
            ry="4"
            transform="rotate(18 30 17)"
          />
          <path d="M21 20.5c-4.8 0-9 4.2-9 8 0 2.6 2 4 4.3 4 1.8 0 2.9-.9 4.7-.9s2.9.9 4.7.9c2.3 0 4.3-1.4 4.3-4 0-3.8-4.2-8-9-8z" />
        </g>
      </svg>

      <span className="text-xl font-extrabold tracking-tight text-teal-700">
        Petshop<span className="text-orange-500">ku</span>
      </span>
    </span>
  );
}

function JudulBagian({
  label,
  judul,
  teks,
}: {
  label: string;
  judul: string;
  teks: string;
}) {
  return (
    <div className="mb-12 max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
        {label}
      </p>
      <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{judul}</h2>
      <p className="mt-3 text-slate-600">{teks}</p>
    </div>
  );
}

export default function Beranda() {
  return (
    <div className="flex-1 bg-[#f6f8f7] font-sans text-teal-950 antialiased">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#f6f8f7]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Petshopku - beranda">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {menu.map((m) => (
              <a
                key={m.href}
                href={m.href}
                className="text-sm font-medium text-slate-600 hover:text-teal-700"
              >
                {m.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/masuk"
              className={`${tombolGaris} h-10 px-4 text-sm`}
            >
              Masuk
            </Link>

            <Link
              href="/daftar"
              className={`${tombolUtama} hidden h-10 px-4 text-sm sm:inline-flex`}
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-100 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div>
              <span className="inline-block rounded-full bg-teal-100 px-4 py-1.5 text-sm font-semibold text-teal-800">
                Klinik hewan & pet shop
              </span>

              <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
                Perawatan terbaik untuk{' '}
                <span className="text-teal-700">sahabat berbulu</span> Anda
              </h1>

              <p className="mt-5 max-w-xl text-lg text-slate-600">
                Catat data pasien (pemilik dan hewannya), jadwal janji temu,
                vaksinasi, pemeriksaan, serta keuangan klinik di satu tempat.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/daftar"
                  className={`${tombolUtama} h-12 px-6`}
                >
                  Daftar akun staf
                </Link>

                <Link
                  href="/masuk"
                  className={`${tombolGaris} h-12 px-6`}
                >
                  Sudah punya akun? Masuk
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Jadwal hari ini
                  </p>
                  <p className="font-bold">2 dokter bertugas</p>
                </div>

                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  {jadwalContoh.length} janji temu
                </span>
              </div>

              <ul className="mt-3 divide-y divide-slate-100">
                {jadwalContoh.map((j) => (
                  <li
                    key={j.jam}
                    className="flex items-center gap-4 py-3"
                  >
                    <span className="w-12 shrink-0 text-sm font-bold text-teal-700">
                      {j.jam}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {j.hewan}{' '}
                        <span className="font-normal text-slate-500">
                          ({j.jenis})
                        </span>
                      </p>

                      <p className="truncate text-sm text-slate-500">
                        {j.pemilik} · {j.dokter}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${warnaStatus[j.status]}`}
                    >
                      {j.status}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-2 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800">
                Pengingat: vaksin rabies dosis kedua untuk Bruno jatuh tempo
                minggu depan.
              </p>
            </div>
          </div>
        </section>

        <section id="fitur" className="scroll-mt-16 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <JudulBagian
              label="Fitur"
              judul="Semua yang dibutuhkan klinik hewan"
              teks="Admin dan dokter hewan bekerja di sistem yang sama, jadi data pasien tidak tercecer di buku dan chat."
            />

            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {fitur.map((f) => (
                <div
                  key={f.judul}
                  className="border-t-2 border-teal-700 pt-5"
                >
                  <h3 className="text-lg font-bold">{f.judul}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {f.teks}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="layanan" className="scroll-mt-16 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <JudulBagian
              label="Layanan"
              judul="Layanan klinik kami"
              teks="Pilih layanan yang dibutuhkan saat membuat janji temu."
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {layanan.map((l) => (
                <div
                  key={l.nama}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-bold">{l.nama}</h3>

                  <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                    {l.isi.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="scroll-mt-16 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <JudulBagian
              label="Cara kerja"
              judul="Mulai dalam tiga langkah"
              teks="Alur kerja klinik dari pendaftaran akun sampai laporan keuangan."
            />

            <ol className="grid gap-10 md:grid-cols-3">
              {langkah.map((l, i) => (
                <li key={l.judul}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-lg font-extrabold text-white">
                    {i + 1}
                  </span>

                  <h3 className="mt-4 text-lg font-bold">{l.judul}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {l.teks}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="peran" className="scroll-mt-16 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <JudulBagian
              label="Untuk siapa"
              judul="Dua peran, satu sistem"
              teks="Tiap peran punya tampilan sendiri dan hanya bisa melihat data yang menjadi haknya."
            />

            <div className="grid gap-6 md:grid-cols-2">
              {peran.map((p) => (
                <div
                  key={p.judul}
                  className={
                    p.gelap
                      ? 'rounded-2xl bg-[#0d3b37] p-6 text-white'
                      : 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'
                  }
                >
                  <h3 className="text-xl font-bold">{p.judul}</h3>

                  <ul
                    className={`mt-4 space-y-2 text-sm ${
                      p.gelap ? 'text-white/80' : 'text-slate-600'
                    }`}
                  >
                    {p.poin.map((isi) => (
                      <li key={isi} className="flex gap-2">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            p.gelap ? 'bg-orange-400' : 'bg-teal-700'
                          }`}
                        />
                        {isi}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-teal-700 px-6 py-14 text-center text-white">
            <h2 className="text-3xl font-extrabold">
              Siap mengelola klinik dengan lebih rapi?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Buat akun staf dan mulai pakai Petshopku untuk mencatat pasien
              dan layanan klinik.
            </p>

            <Link
              href="/daftar"
              className={`${tombol} mt-8 h-12 bg-white px-6 text-teal-700 hover:bg-white/90`}
            >
              Daftar akun staf
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Logo ukuran={30} />

          <nav className="flex gap-6 text-sm text-slate-600">
            <Link href="/masuk" className="hover:text-teal-700">
              Masuk
            </Link>
            <Link href="/daftar" className="hover:text-teal-700">
              Daftar
            </Link>
          </nav>

          <p className="text-sm text-slate-600">
            © 2026 Petshopku. Sistem informasi klinik hewan.
          </p>
        </div>
      </footer>
    </div>
  );
}
