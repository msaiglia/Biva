import Providers from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "BIVA Platform — Dott. Mauro Saiglia",
  description: "Analisi vettoriale dell'impedenza bioelettrica (BIVA) per nutrizione clinica — sviluppata dal Dott. Mauro Saiglia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body style={{ margin: 0, fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
