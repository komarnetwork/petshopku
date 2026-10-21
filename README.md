# Petshopku

Sistem informasi klinik hewan dengan dua peran: **admin** dan **dokter hewan**. Admin mendaftarkan pasien (pemilik beserta hewannya, dalam satu formulir) dan mengatur janji temu. Dokter hewan menyelesaikan pemeriksaan, mencatat hasil konsultasi, serta mengusulkan lalu menyetujui atau menolak vaksinasi dan pemeriksaan sendiri. Pemilik hewan tidak memiliki akun. Pengunjung beranda dapat bertanya seputar perawatan hewan kepada chatbot AI.

Dibuat dengan **Next.js 16**, **React 19**, **TypeScript**, dan **Tailwind CSS 4**. Layanan cloud yang dipakai: **Firebase Authentication**, **Firebase Realtime Database**, **Firebase AI Logic** (model Gemini) untuk chatbot, dan **Vercel** untuk hosting.

## Tautan

| | |
| --- | --- |
| Repositori GitHub | <https://github.com/komarnetwork/petshopku> |
| Website (Vercel) | <https://petshopku-swart.vercel.app> |
| Video demo (YouTube) | Menyusul |

## Pemenuhan syarat proyek

| Syarat | Implementasi | Rincian |
| --- | --- | --- |
| 12 CRUD yang terhubung ke Firebase Realtime Database | 12 operasi pada node `pets`, `appointments`, dan `vaccinations`: 3 create, 3 read, dan 3 update dengan fungsinya masing-masing, serta 3 delete melalui satu fungsi umum `hapusPermanen`. Fungsi CRUD lain ada di [lib/data/](lib/data/) | [CRUD ke Realtime Database](#crud-ke-realtime-database) |
| Register dan login dengan Firebase Authentication | Email/Password di halaman `/daftar` dan `/masuk` | [Register dan login](#register-dan-login) |
| Webmailer: email verifikasi dikirim setelah register | `sendEmailVerification` dari Firebase Authentication dan halaman `/verifikasi-email` | [Verifikasi email](#verifikasi-email) |
| Layanan cloud tambahan | Firebase AI Logic (Gemini) untuk chatbot Petshopku AI | [Layanan cloud tambahan](#layanan-cloud-tambahan) |
| Kode di GitHub, website di cloud hosting | GitHub dan Vercel | [Tautan](#tautan), [Deploy ke Vercel](#deploy-ke-vercel) |
| Video demo di YouTube | Menyusul | [Tautan](#tautan) |

## CRUD ke Realtime Database

Semua akses database ada di [lib/data/](lib/data/), satu berkas per topik, memakai Firebase JS SDK (`firebase/database`). Dua belas operasi berikut membentuk CRUD untuk tiga data utama. Create, read, dan update memakai sembilan fungsi terpisah. Ketiga delete memakai satu fungsi umum, `hapusPermanen(klien, tabel, id)`, dengan nama tabel yang berbeda.

Kolom terakhir menunjukkan tempat operasi itu dijalankan. *Admin* = panel admin (`/admin`); nama tebal pertama adalah menu di sidebar. *Dokter* = portal dokter hewan (`/dokter-hewan`), yaitu satu halaman tanpa sidebar; nama tebal pertama adalah judul panel di halaman itu.

| Operasi | Fungsi | Node | Perintah SDK | Di aplikasi |
| --- | --- | --- | --- | --- |
| Create | [`tambahHewan`](lib/data/hewan.ts#L53) | `pets` | `set()` | Admin > **Pasien** > **Tambah pasien** > **Simpan pasien** |
| Create | [`buatJanjiTemu`](lib/data/janji-temu.ts#L68) | `appointments` | `set()` | Admin > **Janji Temu** > **Janji temu baru** > **Buat janji temu** |
| Create | [`buatVaksinasi`](lib/data/vaksinasi.ts#L34) | `vaccinations` | `set()` | Dokter > **Usulkan Vaksinasi** > **Usulkan vaksinasi** |
| Read | [`ambilHewan`](lib/data/hewan.ts#L47) | `pets` | `get()` | Admin > **Pasien** (tabel pasien) |
| Read | [`ambilJanjiTemu`](lib/data/janji-temu.ts#L50) | `appointments` | `get()`; untuk dokter `query(orderByChild("doctor_id"), equalTo(uid))` | Admin > **Janji Temu** (agenda mingguan); Dokter > **Janji Temu Saya** |
| Read | [`ambilVaksinasi`](lib/data/vaksinasi.ts#L25) | `vaccinations` | `get()`; untuk dokter `query(orderByChild("doctor_id"), equalTo(uid))` | Admin > **Vaksinasi**; Dokter > **Vaksinasi yang Saya Usulkan** |
| Update | [`ubahHewan`](lib/data/hewan.ts#L70) | `pets/{id}` | `update()` | Admin > **Pasien** > **Ubah** > **Simpan perubahan** |
| Update | [`ubahStatusJanjiTemu`](lib/data/janji-temu.ts#L126) | `appointments/{id}` | `update()` | Admin > **Janji Temu** > klik janji temu > **Batalkan janji temu** / **Jadwalkan kembali** |
| Update | [`setujuiVaksinasi`](lib/data/vaksinasi.ts#L66), yang memanggil [`putuskanLayanan`](lib/data/keputusan-dokter.ts#L60) | `vaccinations/{id}` dan `appointments/{id}` terkait | `update()` multi-path | Dokter > **Vaksinasi yang Saya Usulkan** > **Setujui** |
| Delete | [`hapusPermanen`](lib/data/arsip.ts#L46) dengan tabel `"pets"` | `pets/{id}` | `remove()` | Admin > **Pasien** > **Hapus** |
| Delete | `hapusPermanen` dengan tabel `"appointments"` | `appointments/{id}` | `remove()` | Admin > **Janji Temu** > klik janji temu > **Hapus permanen** |
| Delete | `hapusPermanen` dengan tabel `"vaccinations"` | `vaccinations/{id}` | `remove()` | Admin > **Vaksinasi** > **Hapus** |

Catatan:

- Karena Realtime Database tidak punya foreign key, `hapusPermanen` memeriksa keterkaitan data lebih dulu. Penghapusan ditolak dengan saran **Arsipkan** dalam empat kasus:
  - pasien yang masih punya janji temu, konsultasi, vaksinasi, atau pemeriksaan (termasuk yang sudah diarsipkan);
  - janji temu yang sudah selesai atau punya hasil konsultasi;
  - vaksinasi yang sudah disetujui atau disuntik;
  - pemeriksaan yang sudah disetujui.
- Fungsi yang sama juga menghapus konsultasi dan pemeriksaan (tombol **Hapus** di menu **Konsultasi**, **Pemeriksaan**, dan **Arsip**). Konsultasi dihapus dengan `update()` multi-path bernilai `null`, agar rujukan `consultation_id` pada pemeriksaan ikut dilepas.
- Setelah janji temu tersimpan, `buatJanjiTemu` memperbarui `doctor_access/{uid}/pets/{petId}` dalam penulisan kedua. Dengan begitu dokter yang ditunjuk dapat membaca data pasien itu.
- `setujuiVaksinasi` menyelesaikan janji temu terkait dalam penulisan yang sama. Janji temu itu adalah yang dipilih dokter saat mengusulkan. Bila dokter tidak memilih, dipakai janji temu dokter itu untuk pasien yang sama yang keperluannya mengandung kata "vaksin".
- Data dibaca dengan `get()` sekali jalan, lalu halaman memuat ulang datanya setelah setiap aksi. Aplikasi tidak memakai listener `onValue`.

<details>
<summary>Fungsi CRUD lainnya</summary>

| Operasi | Fungsi |
| --- | --- |
| Create | `buatPemeriksaan` ([pemeriksaan.ts](lib/data/pemeriksaan.ts)), `catatHasilKonsultasi` ([konsultasi.ts](lib/data/konsultasi.ts)), `catatTransaksiManual` ([transaksi.ts](lib/data/transaksi.ts)), `buatProfilBaru` ([profil.ts](lib/data/profil.ts)) |
| Read | `ambilJanjiTemuMendatang` ([janji-temu.ts](lib/data/janji-temu.ts)), `ambilKonsultasi` ([konsultasi.ts](lib/data/konsultasi.ts)), `ambilPemeriksaan` ([pemeriksaan.ts](lib/data/pemeriksaan.ts)), `ambilRiwayatMedis` ([riwayat-medis.ts](lib/data/riwayat-medis.ts)), `ambilTransaksi` ([transaksi.ts](lib/data/transaksi.ts)), `bacaProfil`, `ambilDokterHewanAktif`, `ambilAkunMenunggu`, `ambilAkunTerdaftar` ([profil.ts](lib/data/profil.ts)) |
| Update | `selesaikanJanjiTemu`, `tetapkanDokterJanjiTemu`, `sembunyikanJanjiTemu` ([janji-temu.ts](lib/data/janji-temu.ts)), `tolakVaksinasi`, `tandaiSudahDisuntik` ([vaksinasi.ts](lib/data/vaksinasi.ts)), `setujuiPemeriksaan`, `tolakPemeriksaan` ([pemeriksaan.ts](lib/data/pemeriksaan.ts)), `setujuiAkun`, `tolakAkun`, `ubahPeranAkun` ([profil.ts](lib/data/profil.ts)), `arsipkan`, `pulihkan` ([arsip.ts](lib/data/arsip.ts)) |
| Delete | Fungsi yang sama, `hapusPermanen`, dengan tabel `consultations` dan `examinations` ([arsip.ts](lib/data/arsip.ts)) |
| Fungsi bantu | `sinkronkanAksesDokter` ([akses-dokter.ts](lib/data/akses-dokter.ts)) menulis `doctor_access`; `putuskanLayanan` ([keputusan-dokter.ts](lib/data/keputusan-dokter.ts)) dipakai fungsi setujui/tolak vaksinasi dan pemeriksaan; pembaca umum `bacaKoleksi`, `bacaDokumen`, `cariId`, dan `hargaStandar` ([dasar.ts](lib/data/dasar.ts)) |

</details>

## Register dan login

Memakai **Firebase Authentication** dengan metode Email/Password. Logikanya ada di [context/auth-context.tsx](context/auth-context.tsx).

- **Register** (`/daftar`): pengguna mengisi nama lengkap, email, nomor telepon (opsional), kata sandi (minimal 6 karakter), dan ulangi kata sandi. Aplikasi menjalankan tiga langkah berurutan: `createUserWithEmailAndPassword`, lalu `sendEmailVerification`, lalu membuat profil di `profiles/{uid}` sebagai dokter berstatus **menunggu persetujuan**. Bila pengiriman email atau penulisan profil gagal, aplikasi mencoba menghapus akun itu lagi (`deleteUser`) agar tidak ada akun tanpa profil.
- **Login** (`/masuk`): `signInWithEmailAndPassword`, lalu profil dibaca dari `profiles/{uid}`. Bila profil belum ada (misalnya akun dibuat lewat Firebase Console), profil dibuat otomatis sebagai dokter berstatus menunggu. Setelah itu:
  - akun yang masih menunggu diarahkan ke `/menunggu-persetujuan`;
  - akun yang ditolak langsung dikeluarkan dengan pesan penolakan;
  - akun yang disetujui masuk ke `/admin` atau `/dokter-hewan` sesuai perannya.
- **Logout**: tombol **Keluar** (`signOut`). Firebase menyimpan sesi di browser, sehingga pengguna tetap masuk setelah halaman dimuat ulang.
- **Persetujuan akun**: di menu **Persetujuan Akun**, admin menyetujui pendaftar (sekaligus memilih peran Dokter Hewan atau Admin) atau menolaknya.
- Pesan galat dari Firebase (email sudah terdaftar, kata sandi salah, terlalu banyak percobaan, dan sebagainya) diterjemahkan ke bahasa Indonesia di [lib/galat.ts](lib/galat.ts).

## Verifikasi email

Email verifikasi dikirim oleh **Firebase Authentication** lewat `sendEmailVerification`, sehingga tidak perlu server email (SMTP) sendiri.

1. Tepat setelah akun dibuat di `/daftar`, Firebase mengirim email berisi tautan verifikasi ke alamat pendaftar.
2. Halaman `/verifikasi-email` ([app/verifikasi-email/page.tsx](app/verifikasi-email/page.tsx)) dapat dibuka oleh pengguna yang sudah login. Halaman ini menampilkan alamat email tujuan dan tiga tombol:
   - **Saya sudah verifikasi**: memuat ulang data pengguna (`reload`) dan memeriksa `emailVerified`. Bila sudah terverifikasi, pengguna diarahkan ke halaman *Menunggu persetujuan*.
   - **Kirim ulang email**: mengirim email verifikasi sekali lagi bila email belum terverifikasi.
   - **Keluar dari akun**.
3. Pengguna mengklik tautan di email. Tautan itu membuka halaman konfirmasi bawaan Firebase, dan sejak saat itu email akun tercatat sudah terverifikasi.

Nama pengirim, subjek, dan bahasa email diatur di Firebase Console, **Authentication > Templates > Email address verification**. Verifikasi email tidak menjadi syarat login. Akses ke data tetap ditentukan oleh persetujuan admin dan Security Rules.

## Layanan cloud tambahan

Di luar Authentication, Realtime Database, dan hosting, aplikasi memakai **Firebase AI Logic** untuk chatbot **Petshopku AI**.

- Tombol **Tanya AI** di pojok kanan bawah beranda membuka panel chat. Versi satu halaman penuh ada di `/chatbot`. Chatbot dapat dipakai tanpa login.
- [lib/ai.ts](lib/ai.ts) memakai `firebase/ai` (`getAI` dengan `GoogleAIBackend`, yaitu Gemini Developer API) dan model `gemini-3.5-flash-lite`. Instruksi sistemnya meminta asisten menjawab dalam bahasa Indonesia, menyarankan pengguna menghubungi dokter hewan bila gejalanya serius, dan tidak memberi diagnosis pasti atau meresepkan obat.
- Chat bersifat multi-giliran (`startChat`), sehingga pertanyaan lanjutan dipahami sesuai konteks. Jawaban ditampilkan sebagai Markdown dengan `react-markdown` ([components/chatbot/chat-petshopku.tsx](components/chatbot/chat-petshopku.tsx)). Riwayat chat tidak disimpan ke database dan hilang saat panel ditutup.
- Chatbot memakai konfigurasi Firebase yang sama dengan bagian lain aplikasi, jadi tidak perlu API key Gemini terpisah. Aplikasi belum memasang Firebase App Check; lihat langkah 1.5 di [Cara menjalankan](#cara-menjalankan). Di mode emulator chatbot tidak tersedia.

## Fitur per peran

| Peran | Yang bisa dilakukan |
| --- | --- |
| **Pengunjung** (tanpa login) | Melihat beranda, bertanya kepada chatbot Petshopku AI, dan mendaftar akun |
| **Dokter hewan** (`doctor`) | Melihat janji temu miliknya; **menyelesaikan pemeriksaan** langsung dengan tanggal dan jam selesai, hasil konsultasi boleh diisi tetapi tidak wajib (janji temu langsung berstatus Selesai); mengusulkan vaksinasi dan pemeriksaan lalu **menyetujui atau menolaknya** (penolakan wajib beralasan); menandai vaksin yang sudah disuntik |
| **Admin** (`admin`) | Menyetujui akun dan menentukan perannya; mendaftarkan dan mengubah **pasien** (pemilik + hewan dalam satu formulir); membuat janji temu dan menentukan dokter, membatalkan janji temu atau menjadwalkannya kembali setelah dibatalkan; memantau konsultasi, vaksinasi, dan pemeriksaan; mengelola keuangan dan arsip |

Hanya ada dua peran akun (field `role`: `admin`, `doctor`). Pemilik hewan **tidak punya akun**: nama, telepon, email, dan alamatnya diisi admin bersama data hewan di menu **Pasien**.

Akun baru selalu berstatus **menunggu persetujuan** dan baru bisa membuka panel admin atau portal dokter setelah admin menyetujuinya.

## Cara menjalankan

Butuh Node.js 20.9 atau lebih baru dan sebuah project Firebase. Paket gratis **Spark** sudah cukup: Firebase Authentication, Realtime Database, dan Firebase AI Logic dengan Gemini Developer API dapat dipakai tanpa akun penagihan, dan aplikasi tidak memakai Cloud Functions maupun Cloud Storage.

```bash
npm install
cp .env.example .env   # lalu isi dengan konfigurasi Firebase
npm run dev                  # buka http://localhost:3001
```

### 1. Siapkan project Firebase

1. Buka [Firebase Console](https://console.firebase.google.com), buat project, lalu tambahkan **Web app** (ikon `</>`). Salin `apiKey`, `authDomain`, `projectId`, dan `appId` ke `.env`.
2. **Authentication > Get started > Sign-in method**: aktifkan **Email/Password**. Bila ingin, sesuaikan email verifikasi di **Authentication > Templates > Email address verification**.
3. **Realtime Database > Create database**: pilih lokasi dan mulai dalam **locked mode** (aturan sebenarnya dipasang di langkah berikut). Salin alamat database yang tampil di bagian atas tab **Data** ke `.env`:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://nama-project-default-rtdb.asia-southeast1.firebasedatabase.app
   ```

   Bentuk alamatnya bergantung pada lokasi yang dipilih, jadi salin persis dari Console.
4. Pasang aturan keamanan dari [database.rules.json](database.rules.json). Pilih salah satu:
   - tempel seluruh isinya di **Realtime Database > Rules** lalu klik **Publish**;
   - atau lewat CLI: `npm i -g firebase-tools`, `firebase login`, `firebase use --add` (pilih project), lalu `firebase deploy --only database`.
5. **AI Services > AI Logic > Get started**: pilih **Gemini Developer API** dan ikuti alurnya sampai selesai. Tanpa langkah ini bagian lain aplikasi tetap berjalan, hanya chatbot yang gagal menjawab.
   - **App Check:** sejak Juli 2026 alur penyiapan ini otomatis menerapkan (*enforce*) App Check untuk AI Logic, padahal aplikasi ini belum memasang App Check. Agar chatbot bisa menjawab, ubah **Firebase AI Logic** ke mode *Unenforced* di **Security > App Check > APIs**.
   - Menurut [dokumentasi Firebase](https://firebase.google.com/docs/ai-logic/app-check), App Check wajib untuk AI Logic mulai 2 November 2026. Setelah tanggal itu, chatbot memerlukan App Check (misalnya reCAPTCHA Enterprise) di kode.

Tanpa langkah 4 aplikasi tidak bisa membaca maupun menulis data apa pun:

- **Lewat `/daftar`**: pendaftaran gagal dengan pesan izin ditolak dan akun di Authentication langsung dihapus lagi. Email verifikasi sempat terkirim lebih dulu, tetapi tautannya tidak berlaku lagi.
- **Lewat Console**: bila akun dibuat di Console lalu masuk di `/masuk`, galatnya tampil di halaman *Menunggu persetujuan*.

**Setiap kali `database.rules.json` berubah (mis. setelah memperbarui kode), publikasikan ulang.** Aturan yang tertinggal membuat sebagian tindakan ditolak dengan pesan "Anda tidak memiliki izin untuk melakukan tindakan ini". Untuk memastikan aturan yang aktif sudah yang terbaru, buka tab **Rules** dan cari kata `cancellation_reason` pada bagian `vaccinations`; bila tidak ada, aturan di sana masih versi lama.

### 2. Buat admin pertama

Semua pendaftar baru berstatus dokter yang menunggu persetujuan, jadi admin pertama dibuat lewat Firebase Console:

1. Daftar lewat halaman `/daftar`. Cara lain: buat akun di **Authentication > Users > Add user**, lalu masuk sekali lewat `/masuk`.
2. Buka **Realtime Database > Data > `profiles`**. Setiap akun adalah satu node bernama UID-nya (UID juga tampil di **Authentication > Users**). Buka node akun Anda, lalu ubah dua nilai (klik nilainya, ketik yang baru, tekan Enter):
   - `role` menjadi `admin`
   - `approval_status` menjadi `disetujui`
3. Kembali ke aplikasi dan klik **Periksa status** di halaman *Menunggu persetujuan*. Cara lain: klik **Keluar dari akun**, lalu masuk lagi di `/masuk`. Admin yang sudah disetujui langsung diarahkan ke `/admin`.

Setelah itu akun lain disetujui dari menu **Persetujuan Akun**, tempat admin juga memilih apakah akun itu dokter hewan atau admin.

### 3. Daftar layanan (opsional)

Node `services` berisi harga standar dengan field `name`, `type`, `price` (angka), dan `is_active` (`true`/`false`). Bila ada beberapa layanan aktif dengan tipe yang sama, harga termurah yang dipakai. Node ini diisi lewat Firebase Console karena belum ada halaman untuk mengelolanya.

- **Janji temu** memakai tipe `konsultasi`, atau `vaksin` bila keperluannya mengandung kata "vaksin". Bila tidak ada layanan aktif yang cocok, dipakai harga cadangan Rp 100.000.
- **Vaksinasi dan pemeriksaan**: biayanya diisi dokter di kolom **Biaya (Rp)** saat mengusulkan, dengan nilai bawaan Rp 150.000 dan Rp 250.000. Bila diisi 0, harga diambil dari `services` tipe `vaksin` atau `pemeriksaan`. Bila di sana pun tidak ada layanan aktif yang cocok, dipakai harga cadangan Rp 150.000 untuk vaksinasi dan Rp 250.000 untuk pemeriksaan.

### Mode emulator (tanpa project Firebase)

Untuk mencoba atau mengembangkan tanpa menyentuh project Firebase sungguhan:

```bash
npm run emulator                                  # terminal 1: Auth + Realtime Database emulator (butuh Java 11+)
NEXT_PUBLIC_FIREBASE_EMULATOR=true npm run dev    # terminal 2
```

Mode ini mengabaikan isi `.env`. Data emulator hilang saat emulator dihentikan. Admin pertama dibuat lewat Emulator UI di <http://127.0.0.1:4000/database> dengan cara yang sama seperti langkah 2. Emulator tidak benar-benar mengirim email; tautan verifikasi muncul di log terminal emulator. Chatbot AI tidak tersedia di mode ini.

### Deploy ke Vercel

1. Di Vercel, buat project baru dan impor repositori GitHub ini. Next.js terdeteksi otomatis, jadi tidak perlu `vercel.json`.
2. Isi kelima variabel `NEXT_PUBLIC_FIREBASE_*` di **Settings > Environment Variables**, dengan nilai yang sama seperti `.env`. Jangan isi `NEXT_PUBLIC_FIREBASE_EMULATOR`.
3. Deploy. Nilai `NEXT_PUBLIC_` tertanam saat build, jadi setiap perubahan variabel memerlukan deploy ulang.
4. Vercel tidak memasang Security Rules. Publikasikan [database.rules.json](database.rules.json) lewat Firebase Console atau `firebase deploy --only database` (langkah 1.4).

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan |
| `npm run build` | Membuat versi produksi |
| `npm start` | Menjalankan hasil build |
| `npm run periksa` | Memeriksa tipe TypeScript |
| `npm run emulator` | Menjalankan Firebase Emulator (Auth + Realtime Database) |
| `npm run uji` | Menguji lapisan data dan aturan keamanan database di emulator |

## Struktur folder

```
app/                 Halaman (setiap folder = satu alamat URL)
  masuk, daftar, verifikasi-email, menunggu-persetujuan
  chatbot/           Chatbot AI satu halaman penuh
  dokter-hewan/      Portal dokter hewan
  admin/             Panel admin: page.tsx = dasbor, lalu persetujuan, pasien, janji-temu, konsultasi, vaksinasi, ...
components/
  ui/                Komponen dasar: tombol, input, kartu, tabel, modal
  umum/              Komponen yang dipakai beberapa halaman (termasuk penjaga-akses)
  chatbot/           Tampilan chat Petshopku AI
  dokter/ admin/ beranda/
context/             Status login (auth-context) dan notifikasi (toast-context)
hooks/               gunakan-data (memuat data), gunakan-aksi (simpan + notifikasi), gunakan-aksi-arsip
lib/
  firebase.ts        Konfigurasi dan koneksi Firebase
  ai.ts              Koneksi Firebase AI Logic (model Gemini) untuk chatbot
  data/              Semua akses ke Realtime Database, satu berkas per topik
  tipe.ts            Tipe data, sama dengan isi node di database
  label.ts           Teks tampilan untuk setiap status
  galat.ts           Terjemahan pesan galat Firebase
  ...                format, peran, validasi-tanggal, utils
database.rules.json  Aturan keamanan Realtime Database
firebase.json        Konfigurasi Firebase CLI dan emulator
pengujian/           Uji integrasi di emulator
```

Nama node dan field di database sama persis dengan nama field di kode (misalnya `appointments/{id}/start_time`), sehingga tidak ada lapisan pemetaan di antaranya. Sebagian besar nama tipe, fungsi, dan komponen di kode berbahasa Indonesia.

## Model data

Realtime Database adalah satu pohon JSON. Tiap koleksi berupa node berisi anak-anak yang diberi id otomatis:

| Node | Isi | Catatan |
| --- | --- | --- |
| `profiles/{uid}` | Profil akun admin / dokter | Id = UID di Firebase Authentication. Dibuat otomatis saat mendaftar, atau saat pertama kali masuk bila belum ada (selalu dokter, menunggu) |
| `pets` | **Pasien**: hewan beserta pemiliknya | Kolom `owner_name`, `owner_phone`, `owner_email`, `owner_address` berisi data pemilik; satu pendaftaran = satu hewan |
| `appointments` | Janji temu | `pet_id`, `doctor_id`, `status`, `completed_at` (tanggal dan jam selesai oleh dokter); `vaccination_id` / `examination_id` terisi bila selesai lewat layanan terkait |
| `consultations/{appointmentId}` | Hasil konsultasi | Id = id janji temu, sehingga satu janji temu hanya punya satu hasil |
| `vaccinations` | Vaksinasi | Diusulkan dan diputuskan dokter; `appointment_id` (opsional) = janji temu yang ikut selesai saat disetujui |
| `examinations` | Pemeriksaan penunjang | Alurnya sama dengan vaksinasi, tanpa langkah suntik; juga punya `appointment_id` opsional |
| `transactions` | Transaksi **manual** admin | Transaksi layanan dihitung dari status layanannya (lihat di bawah) |
| `services` | Daftar layanan dan harga standar | Diisi lewat Firebase Console; belum ada halaman untuk mengelolanya |
| `doctor_access/{uid}/pets` | Id pasien yang boleh dibaca dokter itu | Dihitung ulang dari semua janji temu pasien itu setiap kali janji temu dibuat dengan dokter, dipindahkan ke dokter lain, atau dihapus permanen |

Realtime Database tidak punya JOIN, foreign key, trigger, maupun view, jadi hal-hal tersebut ditangani di aplikasi:

- **Relasi** (nama pasien, pemilik, dokter pada tabel) dilampirkan di [lib/data/relasi.ts](lib/data/relasi.ts). Pemilik diturunkan dari kolom `owner_*` milik pasien.
- **Keterkaitan data** (pasien yang masih punya riwayat tidak bisa dihapus) diperiksa di [lib/data/arsip.ts](lib/data/arsip.ts).
- **Isian otomatis** diisi oleh fungsi di `lib/data`, bukan oleh pengguna: jam akhir jadwal (`end_time`, satu jam setelah jam mulai), harga janji temu, status awal, dan status "selesai". Tanggal dan jam selesai pemeriksaan (`completed_at`) dipilih dokter.
- **Riwayat medis** adalah gabungan konsultasi, vaksinasi, dan pemeriksaan yang dihitung di [lib/data/riwayat-medis.ts](lib/data/riwayat-medis.ts).
- **Penulisan yang harus atomik** memakai `update()` multi-path: hasil konsultasi, status "selesai", dan tanggal-jam selesai pada janji temu tersimpan bersamaan atau tidak sama sekali.
- **Nilai kosong**: Realtime Database tidak menyimpan `null` (field-nya hilang). Saat dibaca, field yang boleh kosong diisi `null` lagi (lihat `KOLOM_BOLEH_KOSONG` di [lib/data/dasar.ts](lib/data/dasar.ts)).
- **Penyaringan dan pengurutan** dilakukan di aplikasi. Admin membaca satu koleksi utuh lalu menyaringnya; ini cocok untuk satu klinik. Untuk data yang jauh lebih besar, batasi kueri dengan `limitToLast` dan indeks `.indexOn` di `database.rules.json`.

## Aturan bisnis

**Pasien**: pemilik dan hewannya didaftarkan dalam satu formulir. Satu pendaftaran memuat satu hewan; pemilik yang punya beberapa hewan didaftarkan sekali per hewan.

**Janji temu**: dibuat admin untuk seorang pasien dengan status `dijadwalkan`, lalu menjadi `selesai` (oleh dokter) atau `dibatalkan` (oleh admin).

- **Jadwalkan kembali**: janji temu yang dibatalkan dapat dijadwalkan kembali dengan tombol ini. Statusnya kembali ke `dijadwalkan` tanpa perubahan tanggal dan jam.
- **Menyelesaikan janji temu**: tidak ada langkah konfirmasi. Begitu dokter selesai memeriksa, ia memilih **tanggal dan jam selesai pemeriksaan** lalu menekan **Tandai selesai**. Bila hasil konsultasi diisi, tombol itu menjadi **Simpan hasil & tandai selesai**. Janji temu langsung berstatus Selesai dengan `completed_at` terisi.
- **Hasil konsultasi** tidak wajib. Namun bila dikosongkan, hasil tidak dapat ditambahkan lagi setelah janji temu selesai.

Cara kedua menyelesaikan janji temu adalah **menyetujui vaksinasi atau pemeriksaan yang terkait dengannya**:

- Bila pasien yang dipilih punya janji temu berjalan dengan dokter itu, formulir usulan menampilkan kolom **Janji temu terkait (opsional)**. Janji temu terpilih otomatis bila hanya ada satu, atau bila keperluannya cocok. Pilihan ini bisa diganti atau dikosongkan.
- Begitu usulan **disetujui**, janji temunya langsung Selesai dan hilang dari "Janji Temu Mendatang" admin.
- Bila kolom itu dikosongkan, sistem tetap mencari janji temu dokter itu untuk pasien yang sama dengan keperluan yang cocok: "Vaksinasi" untuk vaksin, "Pemeriksaan" untuk pemeriksaan. Bila ada beberapa, dipakai yang jadwalnya paling awal; janji temu yang diarsipkan dilewati.
- Menolak usulan tidak menyelesaikan janji temu.

Status janji temu yang sudah selesai tidak dapat diubah admin, tetapi admin masih dapat mengganti dokternya dan mengarsipkannya.

**Vaksinasi**: dokter mengusulkan jadwal (`dijadwalkan`, tampil "Menunggu keputusan dokter"), lalu dokter **menyetujui** (`dikonfirmasi`) atau **menolak** (`dibatalkan`, alasan wajib). Bila disetujui, dokter kemudian menandai `sudah_disuntik`. Tidak ada jawaban pemilik.

**Pemeriksaan**: alurnya sama dengan vaksinasi, tanpa langkah suntik: dokter menyarankan, lalu menyetujui atau menolak sendiri.

**Keuangan**: transaksi layanan **tidak disimpan terpisah**, melainkan dihitung langsung dari status layanannya sehingga selalu cocok:

| Layanan | Dihitung sebagai pemasukan saat status |
| --- | --- |
| Janji temu | `selesai` |
| Vaksinasi | `dikonfirmasi` atau `sudah_disuntik` |
| Pemeriksaan | `dikonfirmasi` |

Janji temu yang selesai lewat vaksinasi / pemeriksaan tidak ditagih dua kali: yang dihitung biaya layanannya. Layanan yang dibatalkan atau ditolak tidak muncul di keuangan. Admin juga dapat mencatat transaksi manual (pemasukan atau pengeluaran lain); hanya itu yang disimpan di node `transactions`.

Harga janji temu diambil dari node `services` (atau harga cadangan); formulir tidak menyediakan isian harga. Dokter mengisi biaya vaksinasi dan pemeriksaan saat mengusulkan, dan tidak dapat mengubahnya sesudahnya.

**Arsip**: admin mengarsipkan pasien, janji temu, konsultasi, vaksinasi, dan pemeriksaan agar tersembunyi dari daftar utama, lalu dapat memulihkan atau menghapus permanen. Data yang masih terhubung ke riwayat klinis atau keuangan tidak bisa dihapus permanen, hanya diarsipkan. Pengecualiannya hasil konsultasi: data ini selalu dapat dihapus permanen, dan rujukan pemeriksaan ke konsultasi itu dilepas. Dokter juga bisa menyembunyikan janji temu dari daftarnya sendiri. Halaman admin Konsultasi, Vaksinasi, dan Pemeriksaan bersifat memantau; keputusannya ada pada dokter.

## Keamanan

Aturan akses dijaga di Realtime Database Security Rules ([database.rules.json](database.rules.json)), bukan hanya di tampilan:

- Dokter hanya melihat pasien (beserta pemiliknya), janji temu, konsultasi, vaksinasi, dan pemeriksaan yang berkaitan dengan dirinya. Keuangan hanya terlihat oleh admin.
- Akun yang belum disetujui hanya dapat membuat profilnya sendiri, membaca serta mengubah nama dan teleponnya, dan membaca daftar `doctor_access` miliknya. Akun itu tidak dapat membaca data klinik apa pun. Pengguna yang belum login tidak punya akses ke data apa pun.
- Pendaftar selalu menjadi dokter berstatus menunggu; hanya admin yang dapat menyetujui, menolak, atau mengubah peran. Pengguna biasa hanya boleh mengubah nama dan nomor teleponnya.
- Batasan untuk dokter:
  - Tidak bisa mengubah biaya setelah usulan dibuat, membatalkan janji temu, atau mengubah kolom arsip admin (`is_archived`, `archived_at`, `archived_by`). Ia hanya boleh mengisi `doctor_archived_at` untuk menyembunyikan janji temu dari daftarnya.
  - Hanya boleh menyelesaikan janji temunya sendiri yang masih berstatus dijadwalkan, dengan `completed_at` ditulis bersamaan.
  - Layanan yang dicatat sebagai penyelesai janji temu (`vaccination_id` / `examination_id`) harus milik dokter itu, terkait janji temu itu, dan sudah disetujui.
  - Menyetujui atau menolak (dengan alasan) usulannya sendiri.
  - Pada data miliknya, ia juga boleh mengisi kolom pendukung: alasan penolakan, tanggal suntik, dosis berikutnya, dan `updated_at`.

  Aturan menolak perubahan lain walaupun dikirim langsung ke database.
- Aturan Realtime Database tidak menyaring data, melainkan menolak kueri yang bisa mengembalikan data terlarang. Karena itu dokter membaca daftar janji temu, konsultasi, vaksinasi, dan pemeriksaan hanya lewat kueri `orderByChild('doctor_id').equalTo(uid)`. Satu dokumen miliknya boleh dibaca langsung lewat id-nya. Pasien dibaca lewat daftar `doctor_access/{uid}/pets`. Bila Anda menulis kueri baru untuk dokter, ikuti pola yang sama.
- Halaman admin dan dokter dijaga di browser oleh [components/umum/penjaga-akses.tsx](components/umum/penjaga-akses.tsx): wajib login, wajib disetujui, dan sesuai peran. Halaman `/verifikasi-email` terbuka bagi semua pengguna yang sudah login. Penjaga ini hanya mengatur tampilan; pengaman sebenarnya adalah aturan di atas.
- Konfigurasi `NEXT_PUBLIC_FIREBASE_*` memang terlihat di browser dan aman, karena data dilindungi aturan, bukan kerahasiaan kunci.
- Chatbot dapat dipakai tanpa login dan belum memakai Firebase App Check. Akibatnya, kuota Gemini project dapat dipakai siapa pun yang memegang konfigurasi Firebase publik, termasuk dari luar website.

`npm run uji` menjalankan sekitar 260 pemeriksaan di emulator, termasuk percobaan serangan langsung ke database: naik jadi admin, menyetujui diri sendiri, membaca pasien dokter lain, memberi diri sendiri akses, memalsukan harga, menyelesaikan janji temu orang lain atau yang sudah dibatalkan, mencatat layanan yang belum disetujui sebagai penyelesai, menulis separuh data, dan sebagainya. Pengujian ini hanya mencakup lapisan data (`lib/data`) dan aturan database. Verifikasi email, chatbot, dan tampilan belum diuji.

## Catatan

- **Deploy**: website berjalan di Vercel (<https://petshopku-swart.vercel.app>), tetapi aplikasi ini dapat dijalankan di hosting Node.js mana pun. Lihat [Deploy ke Vercel](#deploy-ke-vercel).
- Tampilan hanya tersedia dalam mode terang.
