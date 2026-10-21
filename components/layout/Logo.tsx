export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <img 
      src="/logo-braincare.png" 
      alt="Braincare Logo" 
      width={size} 
      height={size} 
      style={{ objectFit: 'contain' }} // Memastikan gambar tidak terdistorsi
    />
  );
}