import type { Case, CaseDTO, ReviewState } from '@/types/case';

/**
 * In-memory mock store. Resets on server restart and is not shared across
 * multiple server instances/workers — acceptable for a demo, not a real DB.
 */
const cases: Case[] = [
  {
    id: 'c1', name: 'Andi Wijaya', mrn: 'MRN-778210', age: 54, gender: 'Laki-laki', examDate: '24 Jul 2026',
    status: 'perlu_review', severity: 'tinggi',
    tumorType: 'pituitari', grade: 'WHO Grade IV', confidence: 94, volume: '38.4',
    location: 'Lobus Temporal Kanan', edema: 'Luas, edema vasogenik signifikan',
    narrative: 'Terdeteksi massa heterogen dengan enhancement ireguler pada lobus temporal kanan, disertai area nekrosis sentral dan edema perilesi yang luas. Pola pertumbuhan dan karakteristik sinyal sangat sesuai dengan glioblastoma (WHO Grade IV). Disarankan korelasi klinis dan pertimbangan biopsi/reseksi segera.',
    review: 'none',
  },
  {
    id: 'c2', name: 'Siti Rahayu', mrn: 'MRN-661144', age: 41, gender: 'Perempuan', examDate: '23 Jul 2026',
    status: 'selesai', severity: 'sedang',
    tumorType: 'Meningioma Atipikal', grade: 'WHO Grade II', confidence: 87, volume: '14.2',
    location: 'Konveksitas Frontal Kiri', edema: 'Sedang, edema fokal di sekitar lesi',
    narrative: 'Lesi ekstra-aksial berbatas cukup tegas melekat pada dura di konveksitas frontal kiri, dengan dural tail sign positif. Karakteristik sinyal dan pola enhancement mengarah pada meningioma, dengan beberapa fitur atipikal yang perlu dikonfirmasi histopatologi.',
    review: 'none',
  },
  {
    id: 'c3', name: 'Budi Santoso', mrn: 'MRN-552087', age: 62, gender: 'Laki-laki', examDate: '22 Jul 2026',
    status: 'selesai', severity: 'rendah',
    tumorType: 'Meningioma Jinak', grade: 'WHO Grade I', confidence: 91, volume: '6.1',
    location: 'Falx Serebri', edema: 'Minimal',
    narrative: 'Lesi ekstra-aksial kecil pada falx serebri dengan batas tegas dan enhancement homogen pasca kontras, tanpa infiltrasi ke parenkim sekitar. Gambaran khas meningioma jinak dengan risiko keganasan rendah.',
    review: 'none',
  },
  {
    id: 'c4', name: 'Dewi Lestari', mrn: 'MRN-990321', age: 35, gender: 'Perempuan', examDate: '21 Jul 2026',
    status: 'menunggu', severity: 'normal',
    tumorType: '—', grade: '—', confidence: 0, volume: '—', location: '—', edema: '—',
    narrative: 'Studi belum dianalisis.',
    review: 'none',
    analyzingUntil: null,
  },
  {
    id: 'c5', name: 'Hendra Gunawan', mrn: 'MRN-334455', age: 58, gender: 'Laki-laki', examDate: '20 Jul 2026',
    status: 'proses', severity: 'normal',
    tumorType: '—', grade: '—', confidence: 0, volume: '—', location: '—', edema: '—',
    narrative: 'Studi sedang dianalisis AI.',
    review: 'none',
    analyzingUntil: null,
  },
  {
    id: 'c6', name: 'Maya Anggraini', mrn: 'MRN-118820', age: 47, gender: 'Perempuan', examDate: '18 Jul 2026',
    status: 'selesai', severity: 'normal',
    tumorType: 'Tidak Terdeteksi', grade: '—', confidence: 96, volume: '0',
    location: 'Tidak ditemukan lesi', edema: 'Tidak ada',
    narrative: 'Tidak ditemukan lesi massa intra maupun ekstra-aksial yang mencurigakan pada studi ini. Parenkim otak dalam batas normal sesuai usia.',
    review: 'none',
  },
];

let newCaseCounter = 0;

const NEW_CASE_TEMPLATE = {
  tumorType: 'Astrositoma Difus',
  grade: 'WHO Grade II',
  confidence: 88,
  volume: '11.7',
  location: 'Lobus Parietal Kiri',
  edema: 'Sedang, edema perilesi fokal',
  narrative: 'Lesi infiltratif dengan batas tidak tegas pada lobus parietal kiri, sinyal hiperintens pada FLAIR tanpa enhancement signifikan pasca kontras. Gambaran sesuai astrositoma difus derajat rendah; disarankan pemantauan berkala dan korelasi molekuler (IDH, 1p/19q).',
};

const ANALYSIS_DURATION_MS = 4000;

/** Lazily resolves a case out of its analyzing window into a settled status. */
function settle(c: Case): Case {
  if (c.analyzingUntil && Date.now() >= c.analyzingUntil) {
    c.analyzingUntil = null;
    if (c.status === 'menunggu' || c.status === 'proses') {
      c.status = c.severity === 'tinggi' ? 'perlu_review' : 'selesai';
    }
  }
  return c;
}

function toDTO(c: Case): CaseDTO {
  settle(c);
  const isAnalyzing = !!c.analyzingUntil && Date.now() < c.analyzingUntil;
  return { ...c, isAnalyzing };
}

export function listCases(): CaseDTO[] {
  return cases.map(toDTO);
}

export function getCaseById(id: string): CaseDTO | undefined {
  const c = cases.find((x) => x.id === id);
  if (!c) return undefined;
  // Seed cases start life as 'menunggu'/'proses' with no analyzingUntil set;
  // opening one for the first time kicks off the (mock) analysis window.
  if ((c.status === 'menunggu' || c.status === 'proses') && !c.analyzingUntil) {
    c.analyzingUntil = Date.now() + ANALYSIS_DURATION_MS;
  }
  return toDTO(c);
}

export function createCaseFromUpload(): CaseDTO {
  newCaseCounter += 1;
  const id = 'new' + newCaseCounter;
  const newCase: Case = {
    id,
    name: 'Pasien Baru',
    mrn: 'MRN-' + (100000 + newCaseCounter),
    age: 49,
    gender: 'Laki-laki',
    examDate: '24 Jul 2026',
    status: 'proses',
    severity: 'sedang',
    review: 'none',
    analyzingUntil: Date.now() + ANALYSIS_DURATION_MS,
    ...NEW_CASE_TEMPLATE,
  };
  cases.push(newCase);
  return toDTO(newCase);
}

export function updateCaseReview(
  id: string,
  action: 'agree' | 'disagree' | 'reset',
  note?: string
): CaseDTO | undefined {
  const c = cases.find((x) => x.id === id);
  if (!c) return undefined;

  if (action === 'agree') {
    c.review = 'agree' as ReviewState;
    c.reviewNote = undefined;
    c.reviewedAt = new Date().toISOString();
  } else if (action === 'disagree') {
    c.review = 'disagree' as ReviewState;
    c.reviewNote = note ?? '';
    c.reviewedAt = new Date().toISOString();
  } else {
    c.review = 'none' as ReviewState;
    c.reviewNote = undefined;
    c.reviewedAt = undefined;
  }
  return toDTO(c);
}
