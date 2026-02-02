import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Passa Enem - Aprovado com IA",
  description: "A única plataforma onde você estuda para o ENEM com IA e ganha dinheiro. Simulados, Redação e Ranking Premiado.",
  openGraph: {
    title: "Passa Enem - Estude e Ganhe",
    description: "Estude para o ENEM e Concursos com Inteligência Artificial e ganhe prêmios em dinheiro nos desafios semanais.",
    url: "https://passaenem.com",
    siteName: "Passa Enem",
    locale: "pt_BR",
    type: "website",
  },
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
