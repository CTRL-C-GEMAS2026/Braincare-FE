export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path
        d="M24 6.5C18.5 6.2 13.3 8.6 11 13.2C9.6 16 9.4 18.7 10.6 20.8C8.6 22.6 7.6 25.4 8.6 28.2C9.8 31.6 13.2 33.6 17 33.4C18.4 35.6 21 37 24 37C27 37 29.6 35.6 31 33.4C34.8 33.6 38.2 31.6 39.4 28.2C40.4 25.4 39.4 22.6 37.4 20.8C38.6 18.7 38.4 16 37 13.2C34.7 8.6 29.5 6.2 24 6.5Z"
        fill="#fff"
      />
      <path
        d="M8 27H16L19.5 20.5L23.5 32L27 24.5L30 29H40"
        fill="none"
        stroke="#1D4ED8"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
