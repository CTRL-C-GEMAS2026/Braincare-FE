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
  tumorType: string;
  grade: string;
  confidence: number;
  volume: string;
  location: string;
  edema: string;
  narrative: string;
  review: ReviewState;
  reviewNote?: string;
  reviewedAt?: string;
  /** epoch ms; when set and in the future, GET responses report isAnalyzing: true */
  analyzingUntil?: number | null;
}

/** Case as returned by the API: raw enum fields plus the computed analyzing flag. */
export interface CaseDTO extends Case {
  isAnalyzing: boolean;
}
