'use client';

import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialiser la session au chargement de l'app
    fetch('/api/init-session', {
      method: 'POST',
      credentials: 'include'
    }).catch(err => console.error('Erreur initialisation session:', err));
  }, []);

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <title>LUMI KPI - Suivi hebdomadaire</title>
        <meta name="description" content="Suivi des KPI commerciaux hebdomadaires" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
