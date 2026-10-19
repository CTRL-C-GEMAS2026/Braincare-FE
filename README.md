# BrainCare (Frontend)

Antarmuka radiolog untuk BrainCare — unggah studi MRI, lihat hasil analisis AI (segmentasi, Grad-CAM, narasi klinis), dan beri tinjauan (setuju/koreksi). Dibangun dengan Next.js (App Router) + SWR. Backend-nya ada di proyek terpisah [`Braincare-BE`](../Braincare-BE) (FastAPI + PostgreSQL).

## Quick Setup

1. **Install dependency**

   ```bash
   npm install
   ```

2. **Konfigurasi URL backend.** Salin `.env.example` ke `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   Isinya menunjuk ke backend publik BrainCare:

   ```
   NEXT_PUBLIC_API_BASE_URL=https://api.braincare-ai.com
   ```

   Gunakan URL dasar tanpa `/api` atau trailing slash; client menambahkan path
   endpoint sendiri. Untuk BE lokal pada mesin ini, gunakan `http://localhost:8002`.
   Restart dev server setelah mengubah konfigurasi. Domain publik tetap memerlukan
   DNS yang sudah mengenali `api.braincare-ai.com` pada perangkat pengguna.

3. **Jalankan backend** ([`Braincare-BE`](../Braincare-BE)) terlebih dahulu — lihat README di proyek itu. Aplikasi ini murni klien; tanpa backend jalan, semua halaman setelah login akan gagal memuat data.

4. **Jalankan dev server**:

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000). Halaman `/login` menyediakan tab "Daftar" untuk membuat akun dokter baru (tersimpan langsung ke database lewat backend).

## Integrasi dengan Backend

- Semua pemanggilan API lewat `lib/api/client.ts`, yang menambahkan header `Authorization: Bearer <token>` otomatis dari sesi tersimpan (`lib/auth/session.ts`) dan mengarah ke `NEXT_PUBLIC_API_BASE_URL`.
- Saat analisis berjalan, viewer menerima SSE dari `GET /api/cases/{id}/narrative/stream` melalui `fetch` berautentikasi. Narasi sementara tampil bertahap dan diganti dengan teks final setelah validasi backend. Koneksi terputus dicoba kembali; polling kasus tetap aktif. Langganan dibatalkan saat berpindah kasus atau halaman.
- Sesi (token + info user) disimpan di `localStorage` setelah login, dibaca oleh `lib/auth/AuthContext.tsx`. Token kedaluwarsa/invalid (respons 401) otomatis menghapus sesi dan mengarahkan ke `/login`.
- `app/(app)/layout.tsx` adalah route guard: halaman di bawah `(app)` (`dashboard`, `upload`, `history`, `profile`, `viewer`) hanya bisa diakses setelah login.
- Halaman **Unggah** mengumpulkan data pasien (nama, MRN, umur, jenis kelamin, tanggal periksa) karena backend mensyaratkan data ini untuk membuat kasus baru — ini bukan sekadar metadata unggahan, tapi identitas rekam medis yang tervalidasi di server.
- Unggah PNG/JPG, NIfTI, atau DICOM satu berkas menggunakan multipart `POST /api/cases`; analisis berjalan di background. Perakitan seri DICOM dari folder/ZIP belum tersedia.
- Tanggal/waktu dari backend (`examDate`, `reviewedAt`, `lastLogin.at`) dalam format ISO 8601 dan ditampilkan apa adanya (belum diformat ulang ke gaya Indonesia).

## Deployment

Viewer menyediakan penyuntingan narasi, draf AI asli, legenda NCR/SNFH/ET,
pengukuran WT/TC/ET, serta riwayat perubahan laporan. Nilai cm³ hanya tampil jika
backend memiliki geometri voxel terverifikasi. PNG/JPG menampilkan keterangan
bahwa volume fisik tidak dapat ditentukan.

**Setuju & Finalisasi** menyetujui revisi yang sedang dilihat. Narasi yang sedang
disunting harus disimpan/dibatalkan dahulu. Mengubah narasi atau membuka kembali
tinjauan membatalkan finalisasi, mempertahankan audit, dan mengunci unduhan PDF
sampai disetujui lagi. Konflik revisi tidak menimpa draf lokal. Kartu dashboard
"Selesai Ditinjau" menghitung laporan final, bukan sekadar analisis yang selesai.

**Unduh PDF Final** memanggil endpoint PDF berautentikasi pada BE. Cetak browser
menampilkan petunjuk untuk memakai unduhan resmi, sehingga halaman Viewer yang
belum ditinjau tidak menjadi laporan final melalui tombol cetak.

Jalankan migrasi dan versi BE yang menyediakan endpoint `/narrative`, `/audit`,
dan `/report.pdf` sebelum memakai FE ini. Perubahan ini memerlukan pembaruan FE
dan BE bersama; FE sebelumnya belum mengirim revisi saat meninjau laporan.

Saat deploy (mis. Vercel), set environment variable berikut pada dashboard hosting:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.braincare-ai.com
```

Terapkan pada environment Production (dan Preview jika dipakai), kemudian build
ulang/redeploy FE. Nilai `NEXT_PUBLIC_*` masuk ke bundle browser saat build;
mengubah `.env` lokal saja tidak memperbarui deployment yang sudah online.
Pastikan `CORS_ORIGINS` di backend mengizinkan origin domain frontend. Backend
saat ini memakai `*`; jika dibatasi, sertakan `https://braincare-ai.com`,
`https://www.braincare-ai.com` jika digunakan, dan origin lokal yang diperlukan.

Reverse proxy backend harus meneruskan SSE tanpa buffering. Uji parser streaming tanpa browser:

```bash
node --experimental-strip-types --test tests/sse.test.mjs
```

Uji browser alur laporan menggunakan Playwright pada FE/BE dan database **uji**:

```bash
BRAINCARE_E2E_FIXTURE=/path/to/dummy-fixture.json \
BRAINCARE_E2E_URL=http://127.0.0.1:13000 \
BRAINCARE_E2E_API_URL=http://127.0.0.1:18003 \
BRAINCARE_E2E_ARTIFACTS=/path/to/test-artifacts \
  node --test tests/report-workflow.test.mjs
```

Fixture JSON berisi `caseId`, `email`, `password`, dan `measurements` dari kasus
dummy baru yang menunggu tinjauan. Pengujian mengubah kasus tersebut; gunakan akun
dan database uji terpisah, bukan data produksi. Browser Chromium dan `pdftotext`
diperlukan untuk memeriksa unduhan PDF.
