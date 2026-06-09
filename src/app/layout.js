import { Anton, JetBrains_Mono, Condiment } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const condiment = Condiment({
  variable: "--font-condiment",
  weight: "400",
  subsets: ["latin"],
});

// Resolve the canonical site URL so social scrapers get absolute image URLs.
// Falls back to the Vercel-provided production host, then localhost in dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "WORLD CUP LIVE — Mundial 2026 Dashboard",
  description: "Dashboard inmersivo del Mundial 2026: resultados en vivo, partidos, grupos y estadísticas — en hora de Colombia.",
  openGraph: {
    title: "WORLD CUP LIVE — Mundial 2026",
    description: "Resultados en vivo, partidos, grupos y estadísticas del Mundial 2026 — en hora de Colombia.",
    url: "/",
    siteName: "WORLD CUP LIVE",
    locale: "es_CO",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "WORLD CUP LIVE — Mundial 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WORLD CUP LIVE — Mundial 2026",
    description: "Resultados en vivo, partidos, grupos y estadísticas del Mundial 2026.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${anton.variable} ${mono.variable} ${condiment.variable}`}>
      <body className="bg-bgnavy text-cream font-mono antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
