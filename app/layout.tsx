export const metadata = {
  title: "BIVA — Piattaforma di valutazione bioimpedenziometrica",
  description: "Analisi vettoriale dell'impedenza bioelettrica (BIVA) per nutrizione clinica",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body style={{ margin: 0, fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
