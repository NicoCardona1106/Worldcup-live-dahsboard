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

export const metadata = {
  title: "WORLD CUP LIVE — Mundial 2026 Dashboard",
  description: "Dashboard inmersivo del Mundial 2026: resultados en vivo, partidos, grupos y estadísticas.",
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
