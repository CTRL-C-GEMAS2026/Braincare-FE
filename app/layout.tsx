import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "BrainCare — Dukungan Interpretasi MRI Tumor Otak",
  description: "Segmentasi otomatis, peta explainability, dan narasi klinis sebagai second opinion untuk dokter radiologi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${manrope.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-slate-900 bg-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
