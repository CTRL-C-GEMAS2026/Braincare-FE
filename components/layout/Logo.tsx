export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <img 
      src="/logo-braincare.png" 
      alt="Braincare Logo" 
      width={size}
      style={{ height: 'auto' }} // Pertahankan rasio asli gambar (bukan persegi)
    />
  );
}