import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://passaprovas.com"),
  title: {
    default: "Passa Enem - Aprovado com IA",
    template: "%s | Passa Enem"
  },
  description: "A única plataforma onde você estuda para o ENEM e Concursos com Inteligência Artificial e ganhe prêmios em dinheiro. Cronograma personalizado, simulados inéditos, correção de redação e desafios valendo pix.",
  keywords: [
    "enem",
    "simulados",
    "ia",
    "inteligência artificial",
    "vestibular",
    "concurso",
    "prova",
    "redação",
    "correção de redação",
    "cronograma de estudos",
    "aprovação",
    "sisu",
    "prouni",
    "fies",
    "ganhar dinheiro estudando",
    "renda extra estudante"
  ],
  authors: [{ name: "Passa Enem Team" }],
  creator: "Passa Enem",
  publisher: "Passa Enem",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Passa Enem - Estude e Ganhe",
    description: "Estude para o ENEM e Concursos com Inteligência Artificial e ganhe prêmios em dinheiro nos desafios semanais.",
    url: "https://passaprovas.com",
    siteName: "Passa Enem",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: '/og-image.png', // We should probably ensure this exists or use a default
        width: 1200,
        height: 630,
        alt: 'Passa Enem Preview',
      }
    ],
  },
  alternates: {
    canonical: "https://passaprovas.com",
  },
  category: 'education',
};

import { MobileNav } from "@/components/MobileNav";

// ... existing imports

import { AppShell } from "@/components/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L1Q1XQJHWQ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-L1Q1XQJHWQ');
          `}
        </Script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
