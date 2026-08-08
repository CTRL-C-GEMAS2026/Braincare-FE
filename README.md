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

   Isinya menunjuk ke backend lokal secara default:

   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

   Ubah nilainya kalau backend jalan di alamat lain (mis. URL deployment).

3. **Jalankan backend** ([`Braincare-BE`](../Braincare-BE)) terlebih dahulu — lihat README di proyek itu. Aplikasi ini murni klien; tanpa backend jalan, semua halaman setelah login akan gagal memuat data.

4. **Jalankan dev server**:

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000). Halaman `/login` menyediakan tab "Daftar" untuk membuat akun dokter baru (tersimpan langsung ke database lewat backend).

## Integrasi dengan Backend

- Semua pemanggilan API lewat `lib/api/client.ts`, yang menambahkan header `Authorization: Bearer <token>` otomatis dari sesi tersimpan (`lib/auth/session.ts`) dan mengarah ke `NEXT_PUBLIC_API_BASE_URL`.
- Sesi (token + info user) disimpan di `localStorage` setelah login, dibaca oleh `lib/auth/AuthContext.tsx`. Token kedaluwarsa/invalid (respons 401) otomatis menghapus sesi dan mengarahkan ke `/login`.
- `app/(app)/layout.tsx` adalah route guard: halaman di bawah `(app)` (`dashboard`, `upload`, `history`, `profile`, `viewer`) hanya bisa diakses setelah login.
- Halaman **Unggah** mengumpulkan data pasien (nama, MRN, umur, jenis kelamin, tanggal periksa) karena backend mensyaratkan data ini untuk membuat kasus baru — ini bukan sekadar metadata unggahan, tapi identitas rekam medis yang tervalidasi di server.
- Unggah berkas DICOM/NII sendiri masih **simulasi** di sisi klien (progress bar tanpa upload sungguhan) — backend belum punya endpoint penyimpanan berkas biner.
- Tanggal/waktu dari backend (`examDate`, `reviewedAt`, `lastLogin.at`) dalam format ISO 8601 dan ditampilkan apa adanya (belum diformat ulang ke gaya Indonesia).

## Deployment

Saat deploy (mis. Vercel), set environment variable `NEXT_PUBLIC_API_BASE_URL` ke URL backend produksi, dan pastikan `CORS_ORIGINS` di backend menyertakan origin domain frontend ini.
