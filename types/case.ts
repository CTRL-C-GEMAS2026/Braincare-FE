export type Severity = 'normal' | 'rendah' | 'sedang' | 'tinggi';
export type CaseStatus = 'menunggu' | 'proses' | 'selesai' | 'perlu_review';
export type ReviewState = 'agree' | 'disagree' | 'none';
export type ReportState = 'analyzing' | 'awaiting_review' | 'needs_correction' | 'finalized' | 'analysis_failed';

export interface RegionMeasurements {
  regions: Record<'WT' | 'TC' | 'ET', { voxelCount: number; volumeCm3: number | null }>;
  physicalVolumeAvailable: boolean;
  unavailableReason: string | null;
  voxelVolumeMm3: number | null;
  spacingSource: string | null;
  coverageSlices: number;
  method: 'full_volume_mask';
}

export interface AuditEvent {
  id: string;
  revision: number;
  action: string;
  actorName: string;
  actorId: string | null;
  occurredAt: string;
  before: { narrative: string | null; review: ReviewState; reviewNote: string | null; reportState: ReportState } | null;
  after: { narrative: string | null; review: ReviewState; reviewNote: string | null; reportState: ReportState };
  note: string | null;
}

export interface AuditPage {
  events: AuditEvent[];
  nextBeforeRevision: number | null;
}

/** Peta XAI yang sedang ditampilkan di viewer -- saling eksklusif, lihat MriStage/ViewerToolbar. */
export type XaiLayer = 'none' | 'gradcam' | 'attention';

export interface Case {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: 'Laki-laki' | 'Perempuan';
  examDate: string;
  status: CaseStatus;
  severity: Severity;
  tumorType: string | null;
  grade: string | null;
  confidence: number | null;
  /** Legacy: persentase luas WT pada slice terpilih, bukan cm³. */
  volume: number | null;
  location: string | null;
  edema: string | null;
  narrative: string | null;
  aiNarrative: string | null;
  reportRevision: number;
  reportState: ReportState;
  isFinalized: boolean;
  regionMeasurements: RegionMeasurements | null;
  sliceAreaPercent: number | null;
  reviewerName: string | null;
  review: ReviewState;
  reviewNote?: string;
  reviewedAt?: string;
  /** ISO 8601; when set and in the future, GET responses report isAnalyzing: true */
  analyzingUntil?: string | null;
  /** null kalau berkas belum diunggah / belum diproses oleh backend */
  imageUrl: string | null;
  maskUrl: string | null;
  /** null kalau peta XAI itu belum/tidak tersedia untuk kasus ini (mis. inferensi XAI gagal) */
  gradcamUrl: string | null;
  attentionUrl: string | null;
  /** null kalau case dibuat dari upload gambar tunggal (bukan volume NIfTI/DICOM) */
  modality: string | null;
  volumeShape: { axial: number; coronal: number; sagittal: number } | null;
  /** Indeks slice axial yang dipakai buat inferensi/mask (lihat imageUrl/maskUrl) --
   * null kalau case bukan dari volume. Dipakai buat loncat ke slice yang sama di
   * DicomVolumeViewer, lihat page.tsx. */
  bestSliceIndex: number | null;
  /** 3 huruf arah anatomis (axial,coronal,sagittal) tempat indeks slice membesar, mis.
   * "IPL" -- null kalau berkas sumber tidak punya info orientasi. Lihat DicomVolumeViewer. */
  axisLabels: string | null;
  /** Ukuran fisik voxel dalam mm (pixdim NIfTI / PixelSpacing+SliceThickness DICOM) --
   * null kalau case bukan dari volume. */
  voxelSpacing: { axial: number; coronal: number; sagittal: number } | null;
  /** Matriks 4x4 voxel->koordinat ruang nyata (RAS+ mm) dari header NIfTI -- null untuk
   * DICOM atau upload gambar tunggal. */
  affineMatrix: number[][] | null;
  /** Tipe data numerik berkas sumber sebelum dinormalisasi, mis. "int16"/"float32". */
  datatype: string | null;
}

/** Case as returned by the API: raw enum fields plus the computed analyzing flag. */
export interface CaseDTO extends Case {
  isAnalyzing: boolean;
}
