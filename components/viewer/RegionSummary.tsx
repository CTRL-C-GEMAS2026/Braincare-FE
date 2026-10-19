import type { CaseDTO } from '@/types/case';

const definitions = {
  WT: 'Whole Tumor · NCR + SNFH + ET',
  TC: 'Tumor Core · NCR + ET',
  ET: 'Enhancing Tumor · label ET',
} as const;

export function RegionSummary({ activeCase }: { activeCase: CaseDTO }) {
  const measurements = activeCase.regionMeasurements;
  return (
    <section className="mb-5 rounded-xl border border-slate-200 p-3.5" aria-label="Ringkasan segmentasi">
      <h2 className="mb-3 text-[12px] font-bold text-slate-700">Segmentasi &amp; perkiraan volume</h2>
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#3cb4ff]" />NCR · inti nekrotik</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ffd228]" />SNFH · kandidat edema</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ff3c3c]" />ET · region enhancing</span>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-100 text-[11px] text-slate-500">
          <tr><th className="pb-2 font-medium">Region</th><th className="pb-2 text-right font-medium">Voxel</th><th className="pb-2 text-right font-medium">cm³</th></tr>
        </thead>
        <tbody>
          {(Object.keys(definitions) as (keyof typeof definitions)[]).map((name) => {
            const region = measurements?.regions[name];
            return (
              <tr key={name}>
                <td className="py-2"><strong>{name}</strong><div className="text-[10px] text-slate-500">{definitions[name]}</div></td>
                <td className="text-right font-mono">{region?.voxelCount.toLocaleString('id-ID') ?? '—'}</td>
                <td className="text-right font-mono" data-testid={`volume-${name}`}>{region?.volumeCm3 != null ? region.volumeCm3.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[10.5px] leading-relaxed text-slate-500">
        {measurements?.physicalVolumeAvailable
          ? `Dihitung dari mask ${measurements.coverageSlices} slice volume unggahan dan geometri voxel. WT, TC, dan ET saling mencakup; jangan dijumlahkan.`
          : activeCase.volumeShape
            ? 'Volume cm³ belum tersedia: geometri voxel belum terverifikasi atau mask volume belum tersimpan. Nilai tidak diasumsikan.'
            : 'Unggahan 2D: volume cm³ tidak dapat ditentukan dari satu gambar.'}
      </p>
      {activeCase.sliceAreaPercent != null && (
        <p className="mt-1 text-[10.5px] text-slate-500">Luas WT pada slice terpilih: {activeCase.sliceAreaPercent.toFixed(2)}% (bukan volume 3D).</p>
      )}
    </section>
  );
}
