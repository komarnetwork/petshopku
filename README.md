# Petshopku

Sistem informasi klinik hewan dan pet shop dengan dua peran: **admin** dan **dokter hewan**. Admin mendaftarkan pasien (pemilik beserta hewannya, dalam satu formulir) dan mengatur janji temu. Dokter hewan menyelesaikan pemeriksaan, mencatat hasil konsultasi, serta mengusulkan lalu menyetujui atau menolak vaksinasi dan pemeriksaan sendiri. Pemilik hewan tidak memiliki akun dan tidak ada langkah menunggu jawaban pemilik.

Dibuat dengan **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, dan **Firebase** (Authentication + Realtime Database).

## Fitur per peran

| Peran | Yang bisa dilakukan |
| --- | --- |
| **Dokter hewan** (`doctor`) | Melihat janji temu miliknya; **menyelesaikan pemeriksaan** langsung dengan tanggal dan jam selesai, hasil konsultasi boleh diisi tetapi tidak wajib (janji temu langsung berstatus Selesai); mengusulkan vaksinasi dan pemeriksaan lalu **menyetujui atau menolaknya** (penolakan wajib beralasan); menandai vaksin yang sudah disuntik |
| **Admin** (`admin`) | Menyetujui akun dan menentukan perannya; mendaftarkan dan mengubah **pasien** (pemilik + hewan dalam satu formulir); membuat janji temu dan menentukan dokter, membatalkan atau menjadwalkan ulang; memantau konsultasi, vaksinasi, dan pemeriksaan; mengelola keuangan dan arsip |

Hanya ada dua peran (field `role`: `admin`, `doctor`). Pemilik hewan **tidak punya akun**: nama, telepon, email, dan alamatnya diisi admin bersama data hewan di menu **Pasien**.

Akun baru selalu berstatus **menunggu persetujuan** dan baru bisa dipakai setelah admin menyetujuinya.

## Cara menjalankan

Butuh Node.js 20.9 atau lebih baru dan sebuah project Firebase (paket gratis **Spark** sudah cukup; tidak ada Cloud Functions).

```bash
npm install
cp .env.example .env   # lalu isi dengan konfigurasi Firebase
npm run dev                  # buka http://localhost:3001
```

### 1. Siapkan project Firebase

1. Buka [Firebase Console](https://console.firebase.google.com), buat project, lalu tambahkan **Web app** (ikon `</>`). Salin `apiKey`, `authDomain`, `projectId`, dan `appId` ke `.env`.
2. **Build > Authentication > Get started > Sign-in method**: aktifkan **Email/Password**.
3. **Build > Realtime Database > Create database**: pilih lokasi dan mulai dalam **locked mode** (aturan sebenarnya dipasang di langkah berikut). Salin alamat database yang tampil di bagian atas tab **Data** ke `.env`:

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

Tanpa langkah 4 aplikasi tidak bisa membaca maupun menulis data apa pun, dan halaman *menunggu persetujuan* akan menampilkan galat yang menyebutkannya.

**Setiap kali `database.rules.json` berubah (mis. setelah memperbarui kode), publikasikan ulang.** Aturan yang tertinggal membuat sebagian tindakan ditolak dengan pesan "Anda tidak memiliki izin untuk melakukan tindakan ini". Untuk memastikan aturan yang aktif sudah yang terbaru, buka tab **Rules** dan cari kata `cancellation_reason` pada bagian `vaccinations`; bila tidak ada, aturan di sana masih versi lama.

### 2. Buat admin pertama

Semua pendaftar baru berstatus dokter yang menunggu persetujuan, jadi admin pertama dibuat lewat Firebase Console:

1. Daftar lewat halaman `/daftar` (atau **Authentication > Users > Add user**, lalu masuk sekali lewat `/masuk`).
2. Buka **Realtime Database > Data > `profiles`**. Setiap akun adalah satu node bernama UID-nya (UID juga tampil di **Authentication > Users**). Buka node akun Anda, lalu ubah dua nilai (klik nilainya, ketik yang baru, tekan Enter):
   - `role` menjadi `admin`
   - `approval_status` menjadi `disetujui`
3. Di halaman *Menunggu persetujuan* klik **Periksa status**.

Setelah itu akun lain disetujui dari menu **Persetujuan Akun**, tempat admin juga memilih apakah akun itu dokter hewan atau admin.

### 3. Daftar layanan (opsional)

Harga standar diambil dari node `services` (field `name`, `type`, `price` berupa angka, `is_active` berupa `true`/`false`). Tipe yang dipakai: `konsultasi`, `vaksin`, `pemeriksaan`. Bila kosong, harga cadangan dipakai: konsultasi Rp 100.000, vaksin Rp 150.000, pemeriksaan Rp 250.000.

### Mode emulator (tanpa project Firebase)

Untuk mencoba atau mengembangkan tanpa menyentuh project Firebase sungguhan:

```bash
npm run emulator                                  # terminal 1: Auth + Realtime Database emulator (butuh Java 11+)
NEXT_PUBLIC_FIREBASE_EMULATOR=true npm run dev    # terminal 2
```

Mode ini mengabaikan isi `.env`. Data emulator hilang saat emulator dihentikan. Admin pertama dibuat lewat Emulator UI di <http://127.0.0.1:4000/database> dengan cara yang sama seperti langkah 2.

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
  masuk, daftar, menunggu-persetujuan
  dokter-hewan/      Portal dokter hewan
  admin/             Panel admin (dasbor, pasien, janji-temu, konsultasi, vaksinasi, ...)
components/
  ui/                Komponen dasar: tombol, input, kartu, tabel, modal
  umum/              Komponen yang dipakai beberapa halaman (termasuk penjaga-akses)
  dokter/ admin/ beranda/
context/             Status login (auth-context) dan notifikasi (toast-context)
hooks/               gunakan-data (memuat data), gunakan-aksi (simpan + notifikasi)
lib/
  firebase.ts        Konfigurasi dan koneksi Firebase
  data/              Semua akses ke Realtime Database, satu berkas per topik
  tipe.ts            Tipe data, sama dengan isi node di database
  label.ts           Teks tampilan untuk setiap status
database.rules.json  Aturan keamanan Realtime Database
firebase.json        Konfigurasi Firebase CLI dan emulator
pengujian/           Uji integrasi di emulator
```

Nama node dan field di database sama persis dengan nama field di kode (misalnya `appointments/{id}/start_time`), sehingga tidak ada lapisan pemetaan di antaranya. Nama tipe, fungsi, dan komponen di kode tetap berbahasa Indonesia.

## Model data

Realtime Database adalah satu pohon JSON. Tiap koleksi berupa node berisi anak-anak yang diberi id otomatis:

| Node | Isi | Catatan |
| --- | --- | --- |
| `profiles/{uid}` | Profil akun admin / dokter | Id = UID di Firebase Authentication. Dibuat otomatis saat mendaftar (dokter, menunggu) |
| `pets` | **Pasien**: hewan beserta pemiliknya | Kolom `owner_name`, `owner_phone`, `owner_email`, `owner_address` berisi data pemilik; satu pendaftaran = satu hewan |
| `appointments` | Janji temu | `pet_id`, `doctor_id`, `status`, `completed_at` (tanggal dan jam selesai oleh dokter); `vaccination_id` / `examination_id` terisi bila selesai lewat layanan terkait |
| `consultations/{appointmentId}` | Hasil konsultasi | Id = id janji temu, sehingga satu janji temu hanya punya satu hasil |
| `vaccinations` | Vaksinasi | Diusulkan dan diputuskan dokter; `appointment_id` (opsional) = janji temu yang ikut selesai saat disetujui |
| `examinations` | Pemeriksaan penunjang | Alurnya sama dengan vaksinasi, tanpa langkah suntik; juga punya `appointment_id` opsional |
| `transactions` | Transaksi **manual** admin | Transaksi layanan dihitung dari status layanannya (lihat di bawah) |
| `services` | Daftar layanan dan harga standar | Dikelola admin |
| `doctor_access/{uid}/pets` | Id pasien yang boleh dibaca dokter itu | Diisi admin saat janji temu dibuat atau dipindahkan |

Realtime Database tidak punya JOIN, foreign key, trigger, maupun view, jadi hal-hal tersebut ditangani di aplikasi:

- **Relasi** (nama pasien, pemilik, dokter pada tabel) dilampirkan di [lib/data/relasi.ts](lib/data/relasi.ts). Pemilik diturunkan dari kolom `owner_*` milik pasien.
- **Keterkaitan data** (pasien yang masih punya riwayat tidak bisa dihapus) diperiksa di [lib/data/arsip.ts](lib/data/arsip.ts).
- **Isian otomatis** (jam selesai, harga, status awal, status "selesai") diisi oleh fungsi di `lib/data`, bukan oleh pengguna.
- **Riwayat medis** adalah gabungan konsultasi, vaksinasi, dan pemeriksaan yang dihitung di [lib/data/riwayat-medis.ts](lib/data/riwayat-medis.ts).
- **Penulisan yang harus atomik** memakai `update()` multi-path: hasil konsultasi, status "selesai", dan tanggal-jam selesai pada janji temu tersimpan bersamaan atau tidak sama sekali.
- **Nilai kosong**: Realtime Database tidak menyimpan `null` (field-nya hilang). Saat dibaca, field yang boleh kosong diisi `null` lagi (lihat `KOLOM_BOLEH_KOSONG` di [lib/data/dasar.ts](lib/data/dasar.ts)).
- **Penyaringan dan pengurutan** dilakukan di aplikasi. Admin membaca satu koleksi utuh lalu menyaringnya; ini cocok untuk satu klinik. Untuk data yang jauh lebih besar, batasi kueri dengan `limitToLast` dan indeks `.indexOn` di `database.rules.json`.

## Aturan bisnis

**Pasien**: pemilik dan hewannya didaftarkan dalam satu formulir. Satu pendaftaran memuat satu hewan; pemilik yang punya beberapa hewan didaftarkan sekali per hewan.

**Janji temu**: dibuat admin untuk seorang pasien. `dijadwalkan` → `selesai` (oleh dokter) atau `dibatalkan` (oleh admin). Tidak ada langkah konfirmasi: begitu dokter selesai memeriksa, ia menekan **Tandai selesai** dan memilih **tanggal dan jam selesai pemeriksaan**; janji temu langsung berstatus Selesai dengan `completed_at` terisi. Hasil konsultasi boleh diisi pada saat yang sama (tidak wajib). Cara kedua menyelesaikannya: **menyetujui vaksinasi / pemeriksaan yang terkait janji temu itu**. Saat dokter mengusulkan vaksin atau pemeriksaan, janji temu berjalan milik pasien tersebut otomatis terpilih di kolom "Janji temu terkait" (bisa diganti atau dikosongkan). Begitu usulan **disetujui**, janji temunya langsung Selesai dan hilang dari "Janji Temu Mendatang" admin. Bila kolom itu dikosongkan, sistem tetap mencari janji temu dokter itu untuk pasien yang sama dengan keperluan yang cocok ("Vaksinasi" untuk vaksin, "Pemeriksaan" untuk pemeriksaan; yang terdekat bila ada beberapa). Menolak usulan tidak menyelesaikan janji temu. Janji temu yang sudah selesai tidak dapat diubah admin.

**Vaksinasi**: dokter mengusulkan jadwal (`dijadwalkan`, tampil "Menunggu keputusan dokter") → dokter **menyetujui** (`dikonfirmasi`) atau **menolak** (`dibatalkan`, alasan wajib) → bila disetujui, dokter menandai `sudah_disuntik`. Tidak ada jawaban pemilik.

**Pemeriksaan**: alurnya sama dengan vaksinasi, tanpa langkah suntik: dokter menyarankan, lalu menyetujui atau menolak sendiri.

**Keuangan**: transaksi layanan **tidak disimpan terpisah**, melainkan dihitung langsung dari status layanannya sehingga selalu cocok:

| Layanan | Dihitung sebagai pemasukan saat status |
| --- | --- |
| Janji temu | `selesai` |
| Vaksinasi | `dikonfirmasi` atau `sudah_disuntik` |
| Pemeriksaan | `dikonfirmasi` |

Janji temu yang selesai lewat vaksinasi / pemeriksaan tidak ditagih dua kali: yang dihitung biaya layanannya. Layanan yang dibatalkan atau ditolak tidak muncul di keuangan. Admin juga dapat mencatat transaksi manual (pemasukan atau pengeluaran lain); hanya itu yang disimpan di node `transactions`.

Harga standar diambil dari node `services`. Pengguna tidak bisa menentukan harga janji temu.

**Arsip**: admin mengarsipkan pasien, janji temu, konsultasi, vaksinasi, dan pemeriksaan agar tersembunyi dari daftar utama, lalu dapat memulihkan atau menghapus permanen. Data yang masih terhubung ke riwayat klinis atau keuangan tidak bisa dihapus permanen, hanya diarsipkan. Dokter juga bisa menyembunyikan janji temu dari daftarnya sendiri. Halaman admin Konsultasi, Vaksinasi, dan Pemeriksaan bersifat memantau; keputusannya ada pada dokter.

## Keamanan

Aturan akses dijaga di Realtime Database Security Rules ([database.rules.json](database.rules.json)), bukan hanya di tampilan:

- Dokter hanya melihat pasien (beserta pemiliknya), janji temu, konsultasi, vaksinasi, dan pemeriksaan yang berkaitan dengan dirinya. Keuangan hanya terlihat oleh admin.
- Akun yang belum disetujui dan pengguna yang belum login tidak punya akses ke data apa pun.
- Pendaftar selalu menjadi dokter berstatus menunggu; hanya admin yang dapat menyetujui, menolak, atau mengubah peran. Pengguna biasa hanya boleh mengubah nama dan nomor teleponnya.
- Dokter tidak bisa mengubah harga, membatalkan janji temu, atau mengubah kolom arsip. Ia hanya boleh menyelesaikan janji temunya sendiri yang masih berstatus dijadwalkan, dengan `completed_at` ditulis bersamaan; layanan pencatat penyelesaian (`vaccination_id` / `examination_id`) harus milik dokter itu, terkait janji temu itu, dan sudah disetujui. Ia juga menyetujui atau menolak (dengan alasan) usulannya sendiri. Aturan menolak perubahan lain walaupun dikirim langsung ke database.
- Aturan Realtime Database tidak menyaring data, melainkan menolak kueri yang bisa mengembalikan data terlarang. Karena itu dokter membaca janji temu, konsultasi, vaksinasi, dan pemeriksaan hanya lewat kueri `orderByChild('doctor_id').equalTo(uid)`, dan membaca pasien lewat daftar `doctor_access/{uid}/pets`. Bila Anda menulis kueri baru untuk dokter, ikuti pola yang sama.
- Halaman admin dan dokter dijaga di browser oleh [components/umum/penjaga-akses.tsx](components/umum/penjaga-akses.tsx): wajib login, wajib disetujui, dan sesuai peran. Penjaga ini hanya mengatur tampilan; pengaman sebenarnya adalah aturan di atas.
- Konfigurasi `NEXT_PUBLIC_FIREBASE_*` memang terlihat di browser dan aman, karena data dilindungi aturan, bukan kerahasiaan kunci.

`npm run uji` menjalankan sekitar 260 pemeriksaan di emulator, termasuk percobaan serangan langsung ke database (naik jadi admin, menyetujui diri sendiri, membaca pasien dokter lain, memberi diri sendiri akses, memalsukan harga, menyelesaikan janji temu orang lain atau yang sudah dibatalkan, mencatat layanan yang belum disetujui sebagai penyelesai, menulis separuh data, dan sebagainya).

## Catatan

- **Tidak ada konfirmasi email**: Firebase langsung membuat akun saat mendaftar; kontrol akses ada pada persetujuan admin.
- **Deploy**: aplikasi ini dapat dijalankan di hosting Node.js mana pun (mis. Vercel). Isi kelima variabel `NEXT_PUBLIC_FIREBASE_*` di pengaturan environment hosting, lalu deploy ulang. Nilai `NEXT_PUBLIC_` tertanam saat build.
- Tampilan hanya tersedia dalam mode terang.
