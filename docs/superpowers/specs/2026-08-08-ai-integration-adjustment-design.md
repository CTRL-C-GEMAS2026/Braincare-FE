# Menyesuaikan Integrasi Frontend dengan Braincare-BE Setelah AI Integration

## Latar Belakang

Frontend (`mvp_ppl_gemas`) punya pekerjaan integrasi backend yang belum di-commit (auth, session, profile, review sudah diarahkan ke `Braincare-BE`). Pekerjaan itu dibuat sebelum commit `feat: add ai integration` (925eaef) di `Braincare-BE`, yang mengubah kontrak `POST /api/cases` dan menambah endpoint gambar/mask. Akibatnya ada beberapa titik di FE yang tidak lagi cocok dengan backend saat ini:

1. Halaman Unggah tidak pernah mengirim file gambar sungguhan — `Dropzone` tidak punya `<input type="file">`, progress bar adalah simulasi `setTimeout`, dan `onStartAnalysis` mengirim JSON biasa. Backend sekarang mewajibkan `multipart/form-data` dengan field pasien **plus** file `image` (PNG/JPEG saja).
2. `lib/api/client.ts` cuma bisa kirim JSON (`JSON.stringify` + `Content-Type: application/json`), tidak ada jalur untuk `FormData`.
3. `MriStage` murni dekorasi CSS, tidak menampilkan `imageUrl`/`maskUrl` dari `GET /cases/{id}/image` dan `/mask` — endpoint ini butuh header `Authorization: Bearer <token>`, jadi `<img src>` biasa tidak akan terautentikasi.
4. `types/case.ts` mewajibkan `grade`, `location`, `edema`, `narrative` sebagai `string` non-null. Model AI (`ai/inference.py`) hanya menghasilkan `tumorType`, `confidence`, `volume` (proksi persentase piksel tumor, bukan cm³ asli), dan mask segmentasi — kolom `grade`/`location`/`edema`/`narrative` di database tetap `NULL` selamanya untuk kasus yang dianalisis AI. `NarrativePanel` merender field-field ini seolah selalu terisi.

## Tujuan

Menyambungkan FE ke kontrak backend yang sekarang berlaku, tanpa mengubah `Braincare-BE` sama sekali. Auth, session, profile, dan review sudah cocok dan tidak disentuh.

## Non-Tujuan

- Tidak menambah fitur baru di luar menyambungkan yang sudah ada (mis. tidak membangun penyimpanan DICOM/NII sungguhan di backend).
- Tidak mengubah alur auth/session/profile/review yang sudah cocok dengan backend.
- Tidak menyentuh kode di `Braincare-BE`.

## Desain

### 1. `lib/api/client.ts` — dukungan FormData

`apiPost` diperiksa: jika `body instanceof FormData`, kirim langsung tanpa `JSON.stringify` dan tanpa header `Content-Type` (browser mengatur boundary multipart secara otomatis). Jika bukan, perilaku lama (JSON) tetap berlaku. `authHeader()` tetap dipasang di kedua jalur. Ditambahkan fungsi baru `apiUpload<T>(path: string, formData: FormData): Promise<T>` yang membungkus jalur FormData ini, dipakai eksplisit di halaman Unggah supaya pemanggilnya jelas ini bukan request JSON biasa.

### 2. `types/case.ts` — field yang memang bisa kosong dari AI

- `grade`, `location`, `edema`, `narrative` diubah dari `string` menjadi `string | null`, sesuai kenyataan bahwa AI hanya menghasilkan `tumorType`, `confidence`, `volume`, dan mask — field lain ini tidak pernah diisi oleh pipeline AI saat ini.
- `imageUrl: string | null` dan `maskUrl: string | null` ditambahkan ke `Case`, sesuai field yang sudah dikirim `_to_dto` backend (`/api/cases/{id}/image` dan `/mask`, `null` kalau belum ada berkas).

### 3. Halaman Unggah — dua mode

`app/(app)/upload/page.tsx` mendapat toggle dua mode di bagian atas form:

- **"Gambar MRI (PNG/JPG)"** (default, satu-satunya yang fungsional):
  - `Dropzone` diberi `<input type="file" accept="image/png,image/jpeg">` sungguhan (disembunyikan secara visual, dipicu lewat klik area dropzone seperti sekarang), plus dukungan drag-and-drop file native.
  - File asli disimpan di state komponen (bukan nama file palsu seperti `studi_mri_1.dcm`).
  - Progress bar dihilangkan untuk mode ini — upload sekarang satu request nyata (bukan simulasi bertahap 5 langkah); state cukup "dipilih" → "mengunggah & menganalisis" (dikombinasikan dengan status `starting` yang sudah ada di tombol).
  - `onStartAnalysis` membangun `FormData` (`mrn`, `name`, `age`, `gender`, `examDate` sebagai field teks + file di key `image`) dan mengirim lewat `apiUpload<CaseDTO>('/api/cases', formData)`.
  - Validasi FE minimal: file harus dipilih, dan tipe MIME-nya `image/png` atau `image/jpeg` (pesan error kalau tidak, sebelum request dikirim — mencerminkan validasi `ALLOWED_IMAGE_TYPES` di backend).
- **"Studi DICOM/NII"**:
  - UI lama (progress simulasi via `setTimeout`, label `.dcm/.nii/.nii.gz`) dipertahankan apa adanya untuk mode ini.
  - Tombol "Mulai Analisis AI" dinonaktifkan untuk mode ini dengan catatan singkat: backend belum mendukung format ini, gunakan PNG/JPG. Ini mencegah request yang pasti gagal terkirim ke server.

`UploadFileList` disesuaikan agar bisa menampilkan baik representasi file asli (mode gambar: nama file + ukuran, tanpa progress bar) maupun `UploadFile` simulasi (mode DICOM, progress bar seperti sekarang).

### 4. `MriStage` — render gambar & mask asli via blob URL

- Props berubah dari `{ zoom, slice, layerSeg, layerGradcam }` menjadi menerima juga `activeCase: CaseDTO` (atau `imageUrl`/`maskUrl` langsung — detail ditentukan saat implementasi).
- `useEffect` melakukan `fetch(imageUrl, { headers: authHeader() })` dan `fetch(maskUrl, ...)` (skip jika null), mengubah response jadi `URL.createObjectURL(blob)`, disimpan di state lokal, dan di-revoke (`URL.revokeObjectURL`) saat unmount atau saat URL sumber berganti — mencegah memory leak.
- `<img>` untuk citra asli ditumpuk dengan `<img>` mask (opacity mask dikontrol oleh `layerSeg`, sama seperti overlay segmentasi CSS sekarang).
- Overlay Grad-CAM dekoratif yang sudah ada (CSS gradient) **dipertahankan apa adanya** — backend belum expose peta XAI terpisah dari mask, jadi tidak ada data asli untuk menggantikannya.
- Kalau `imageUrl` null (kasus belum submit gambar, mis. data lama), tampilkan placeholder visual yang sudah ada sekarang.

### 5. `NarrativePanel` — sembunyikan field kosong

- Blok "Narasi Klinis Otomatis" (`activeCase.narrative`) dirender kondisional — hanya muncul jika `narrative` bukan `null`.
- Tiap `InfoCard` (`location`, `grade`, `edema`) dirender kondisional per field — hanya field yang bukan `null` yang muncul.
- Grid `InfoCard` menyesuaikan jumlah kolom secara otomatis berdasarkan berapa banyak field yang tersedia (mis. tetap `grid-cols-2` tapi card yang null memang tidak dirender, bukan diganti placeholder kosong).

## Error Handling

- Upload mode gambar: error dari `apiUpload` (mis. 400 tipe file salah, network error) ditangani sama seperti pola `try/catch` yang sudah ada di halaman lain (`console.error` + pesan error singkat di UI), tidak ada penanganan baru yang perlu diciptakan.
- Fetch blob gambar/mask di `MriStage`: kegagalan fetch (mis. 404 karena mask belum siap) ditangani dengan diam-diam tidak menampilkan layer tersebut (state tetap null), bukan melempar error yang mengganggu viewer.

## Testing

- Manual: jalankan `Braincare-BE` lokal (butuh model checkpoint termuat) + FE, lakukan alur penuh: login → unggah gambar PNG/JPG asli → tunggu status `isAnalyzing` selesai lewat polling SWR yang sudah ada → verifikasi citra asli & mask tampil di viewer → verifikasi field yang null (grade/location/edema/narrative) tidak dirender → coba alur review (agree/disagree, sudah berfungsi, dipakai sebagai regression check).
- Manual: coba pilih mode "Studi DICOM/NII" dan pastikan tombol submit nonaktif dengan pesan yang jelas.
- Tidak ada test otomatis (unit/e2e) yang sudah ada di proyek ini untuk dijadikan baseline — perubahan ini murni UI/integrasi yang diverifikasi manual, konsisten dengan proyek saat ini.

## Ringkasan File yang Disentuh

- `lib/api/client.ts` — tambah dukungan FormData + `apiUpload`.
- `types/case.ts` — field AI nullable, tambah `imageUrl`/`maskUrl`.
- `app/(app)/upload/page.tsx` — toggle mode, kirim FormData sungguhan.
- `components/upload/Dropzone.tsx` — input file asli, drag-and-drop.
- `components/upload/UploadFileList.tsx` — dukung representasi file asli (tanpa progress) & simulasi lama.
- `components/viewer/MriStage.tsx` — render gambar/mask asli via blob URL.
- `components/viewer/NarrativePanel.tsx` — sembunyikan field null.
