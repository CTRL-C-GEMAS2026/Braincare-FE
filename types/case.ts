export type Severity = 'normal' | 'rendah' | 'sedang' | 'tinggi';
export type CaseStatus = 'menunggu' | 'proses' | 'selesai' | 'perlu_review';
export type ReviewState = 'agree' | 'disagree' | 'none';

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
  volume: number | null;
  location: string | null;
  edema: string | null;
  narrative: string | null;
  review: ReviewState;
  reviewNote?: string;
  reviewedAt?: string;
  /** ISO 8601; when set and in the future, GET responses report isAnalyzing: true */
  analyzingUntil?: string | null;
  /** null kalau berkas belum diunggah / belum diproses oleh backend */
  imageUrl: string | null;
  maskUrl: string | null;
}

/** Case as returned by the API: raw enum fields plus the computed analyzing flag. */
export interface CaseDTO extends Case {
  isAnalyzing: boolean;
}
