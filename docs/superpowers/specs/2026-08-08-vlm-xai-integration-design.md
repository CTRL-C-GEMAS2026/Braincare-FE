# Integrasi VLM (Narasi Klinis) & XAI (Grad-CAM, Attention Weight Map) di Frontend

## Latar Belakang

`Braincare-BE` baru saja menambah commit `feat: integrate VLM Call and XAI` (860d359) di atas `feat: add ai integration` (925eaef, sudah disambungkan ke FE sebelumnya). Perubahan ini menambah dua kemampuan baru pada pipeline analisis case:

1. **Narasi klinis via LLM** (`ai/llm.py`) — setelah inferensi segmentasi selesai, backend memanggil model Ollama general (`qwen3.5:35b`, placeholder sebelum VLM ter-fine-tune `Qwen3.5-VL + LoRA` sesuai proposal) untuk menulis narasi klinis 1 paragraf dalam Bahasa Indonesia dari `tumorType`/`confidence`/`volume`. Hasilnya disimpan ke `case.narrative`; kalau panggilan gagal, `narrative` tetap `null` (tidak menggagalkan seluruh analisis).
2. **XAI: Grad-CAM & Attention Weight Map** (`ai/xai.py`) — dua peta interpretasi yang saling melengkapi dihitung dari model AttentionUNet yang sama: Grad-CAM (area yang menjadi penentu utama keputusan mask) dan Attention Weight Map (area fokus perhatian bawaan model). Keduanya dikembalikan sebagai **PNG komposit utuh** (citra grayscale asli + heatmap warna sudah di-blend di backend, lewat `build_heatmap_overlay`) — bukan overlay alpha-transparan mentah. Diekspos lewat endpoint baru `GET /cases/{id}/xai/gradcam` dan `GET /cases/{id}/xai/attention` (autentikasi Bearer, sama seperti `/image` dan `/mask`), dan URL-nya muncul di DTO sebagai `gradcamUrl`/`attentionUrl` (`null` kalau belum tersedia — mis. inferensi XAI gagal, computed secara best-effort dan tidak menggagalkan analisis case).

FE (`mvp_ppl_gemas`) saat ini punya sisa-sisa dari integrasi sebelumnya yang perlu diganti:

- `NarrativePanel` sudah menangani `narrative` sebagai nullable (dari sesi integrasi sebelumnya) — bagian ini sudah cocok, tidak berubah.
- `MriStage` & `ViewerToolbar` masih punya overlay Grad-CAM **dekoratif** (gradient CSS statis) yang sengaja disembunyikan untuk semua kasus bercitra asli (`showGradcam = !activeCase.imageUrl`), karena saat itu belum ada endpoint XAI sungguhan. Sekarang endpoint itu sudah ada dan heuristik ini perlu dibuang, diganti dengan data asli.
- `types/case.ts` belum punya field `gradcamUrl`/`attentionUrl`.

Proposal (`Proposal_BrainCare.pdf`) menjadi acuan tambahan: RF-04 ("Sistem dapat menampilkan peta XAI (Grad-CAM dan Attention Weight Map) atas hasil segmentasi"), mockup *Viewer Analisis* (Gambar 11) yang menampilkan toggle peta di toolbar dan keterangan cara membaca peta XAI di panel kanan, serta penjelasan bahwa kedua peta itu saling melengkapi tapi punya makna berbeda (Grad-CAM = penentu keputusan, Attention Weight Map = fokus pengamatan model).

## Tujuan

Menyambungkan FE ke narasi klinis dan kedua peta XAI yang sekarang benar-benar dihasilkan backend, menggantikan seluruh overlay Grad-CAM dekoratif yang lama. Tanpa mengubah `Braincare-BE`.

## Non-Tujuan

- Tidak membangun fitur Ekspor PDF (di luar cakupan; tombolnya sudah ada di `ViewerHeader` dari sebelumnya, tidak disentuh).
- Tidak menambah field `grade`/`location`/`edema` baru — VLM saat ini hanya menghasilkan `narrative`, bukan field terstruktur itu. Backend belum mengisinya (tetap `NULL`), FE tidak berubah di bagian ini.
- Tidak mengubah alur upload, review, auth, atau modul lain yang tidak terkait XAI/narasi.
- Tidak menyentuh kode di `Braincare-BE`.

## Desain

### 1. `types/case.ts` — field XAI baru

Tambah ke `Case` (dan otomatis ke `CaseDTO`):

```ts
gradcamUrl: string | null;
attentionUrl: string | null;
```

Mengikuti pola `imageUrl`/`maskUrl` yang sudah ada — `null` berarti peta itu belum/tidak tersedia untuk kasus ini.

### 2. State toggle XAI — saling eksklusif

State `layerGradcam: boolean` di halaman viewer diganti dengan:

```ts
type XaiLayer = 'none' | 'gradcam' | 'attention';
const [xaiLayer, setXaiLayer] = useState<XaiLayer>('gradcam');
```

Klik chip yang sedang aktif mematikannya (`'none'`); klik chip lain langsung berpindah (menggantikan yang sebelumnya aktif) — berperilaku seperti radio button, bukan dua checkbox independen. `layerSeg` (Segmentasi Tumor) tetap boolean independen seperti sekarang, bisa digabung tampil bersama salah satu peta XAI. Default `'gradcam'` aman dipakai walau `gradcamUrl` belum tentu ada untuk kasus tsb — baik toolbar maupun `MriStage` tetap merender kosong kalau URL-nya `null`, jadi tidak ada efek samping.

### 3. `ViewerToolbar` — dua chip XAI dari data asli

- Props berubah: `layerGradcam`/`onToggleGradcam`/`showGradcam` (boolean tunggal) diganti dengan `activeCase: CaseDTO`, `xaiLayer: XaiLayer`, `onSelectXai: (layer: 'gradcam' | 'attention') => void`.
- Chip "Grad-CAM (XAI)" hanya dirender kalau `activeCase.gradcamUrl !== null`; chip "Attention Weight Map" hanya kalau `activeCase.attentionUrl !== null`. Tiap chip `on` kalau `xaiLayer` sama dengan mapnya masing-masing; `onClick` memanggil `onSelectXai('gradcam' | 'attention')`, dan handler di halaman viewer yang menerapkan logika toggle-off-jika-sudah-aktif.
- Warna dot per chip: Grad-CAM tetap oranye (`#F97316`, sudah ada). Attention Weight Map dapat warna baru yang jelas berbeda, mis. ungu (`#A855F7`), supaya dua chip XAI tidak tertukar secara visual.

### 4. `MriStage` — render peta XAI asli sebagai blob

- Hapus total blok overlay Grad-CAM dekoratif (`radial-gradient` CSS) dan heuristik `showGradcam = !activeCase.imageUrl`.
- Tambah dua pemanggilan `useAuthenticatedImage` lagi (hook yang sudah ada, dipakai untuk `imageSrc`/`maskSrc`): `gradcamSrc = useAuthenticatedImage(activeCase.gradcamUrl)`, `attentionSrc = useAuthenticatedImage(activeCase.attentionUrl)`.
- Props baru: `xaiLayer: XaiLayer` (menggantikan `layerGradcam: boolean`).
- Render: tentukan `xaiSrc = xaiLayer === 'gradcam' ? gradcamSrc : xaiLayer === 'attention' ? attentionSrc : null`. Kalau `xaiSrc` ada, tumpuk sebagai `<img>` absolute di atas citra asli dengan opacity blend — pola identik dengan mask (`opacity: xaiSrc ? 0.85 : 0`, `transition-opacity`), ditumpuk **di atas** layer mask supaya urutan visual dari proposal (segmentasi + Grad-CAM dilihat bersamaan) tetap terjaga. Karena gambar XAI dari backend sudah komposit (grayscale + heatmap), tidak perlu logika blending tambahan di FE — cukup opacity-stack seperti mask.
- Kalau `imageUrl` null, perilaku placeholder yang sudah ada (`"Citra belum tersedia untuk kasus ini."`) tidak berubah.

### 5. `NarrativePanel` — keterangan XAI dinamis

- Terima prop tambahan `xaiLayer: XaiLayer`.
- Blok "Keterangan Peta XAI" tampil kalau `activeCase.gradcamUrl !== null || activeCase.attentionUrl !== null` (bukan lagi heuristik `!activeCase.imageUrl`).
- Teks keterangan mengikuti "peta efektif" yang sedang relevan, dihitung begini (menghindari kasus `xaiLayer === 'none'` tapi hanya salah satu peta yang tersedia untuk case ini):
  ```ts
  const effectiveXai =
    xaiLayer !== 'none' ? xaiLayer : activeCase.gradcamUrl ? 'gradcam' : 'attention';
  ```
  - `effectiveXai === 'gradcam'`: teks yang sudah ada sekarang — "Grad-CAM menyorot area citra yang paling memengaruhi keputusan model, bukan batas anatomis pasti. Gunakan bersama mask segmentasi untuk verifikasi klinis."
  - `effectiveXai === 'attention'`: "Attention Weight Map menunjukkan area yang menjadi fokus perhatian model selama proses analisis, sebagai fitur bawaan arsitektur AttentionUNet — bukan indikasi lokasi tumor secara langsung. Gunakan bersama Grad-CAM dan mask segmentasi untuk interpretasi yang lebih utuh."
- Blok narasi klinis (`activeCase.narrative`) dan `InfoCard` (`location`/`grade`/`edema`) **tidak berubah** — sudah menangani null dengan benar dari sesi sebelumnya.

### 6. Halaman viewer (`app/(app)/viewer/[caseId]/page.tsx`)

- Ganti state `layerGradcam` → `xaiLayer` (lihat #2).
- Handler baru:
  ```ts
  const handleSelectXai = (layer: 'gradcam' | 'attention') =>
    setXaiLayer((current) => (current === layer ? 'none' : layer));
  ```
- Teruskan `activeCase`, `xaiLayer`, `onSelectXai={handleSelectXai}` ke `ViewerToolbar`; teruskan `xaiLayer` ke `MriStage` dan `NarrativePanel` (menggantikan `layerGradcam`).

## Error Handling

- Fetch blob Grad-CAM/Attention di `MriStage`: memakai `useAuthenticatedImage` yang sudah ada apa adanya — kegagalan fetch (404 kalau peta belum siap, atau network error) sudah ditangani di sana dengan `src` tetap `null`, tidak melempar error yang mengganggu viewer. Karena chip toolbar sudah disembunyikan kalau `gradcamUrl`/`attentionUrl` backend `null`, kasus 404 murni-dari-null-url praktis tidak akan terjadi lewat UI normal; skenario sisanya (network error di tengah fetch) tetap aman diam-diam menyembunyikan layer, konsisten dengan perilaku mask saat ini.
- Narasi LLM yang gagal di backend (`case.narrative = null`): sudah tertangani oleh `NarrativePanel` yang ada (tidak dirender kalau null) — tidak ada perubahan.

## Testing

- Manual: jalankan `Braincare-BE` lokal (butuh Ollama & model checkpoint termuat) + FE, unggah gambar baru, tunggu `isAnalyzing` selesai, lalu di viewer verifikasi: narasi klinis tampil (atau pesan gagal-analisis kalau backend gagal), chip "Grad-CAM (XAI)" dan "Attention Weight Map" muncul dan bisa toggle mutual-exclusive, kombinasi dengan "Segmentasi Tumor" tampil benar secara visual, keterangan XAI di panel kanan berubah sesuai peta yang aktif.
- Manual: kasus lama tanpa `gradcamUrl`/`attentionUrl` (mis. hasil `feat: add ai integration` yang lama, sebelum kolom ini ada) — pastikan chip tidak muncul dan tidak ada error di console.
- `npx tsc --noEmit` dan `npm run lint` bersih sebelum merge, konsisten dengan proyek ini yang tidak punya test otomatis.

## Ringkasan File yang Disentuh

- `types/case.ts` — tambah `gradcamUrl`, `attentionUrl`.
- `components/viewer/ViewerToolbar.tsx` — dua chip XAI dari data asli, saling eksklusif.
- `components/viewer/MriStage.tsx` — fetch & render Grad-CAM/Attention asli, hapus overlay dekoratif lama.
- `components/viewer/NarrativePanel.tsx` — keterangan XAI dinamis berdasar peta aktif.
- `app/(app)/viewer/[caseId]/page.tsx` — state `xaiLayer`, wiring props baru.
