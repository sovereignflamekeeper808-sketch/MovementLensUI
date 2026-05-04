import "./globals.css";

export const metadata = {
  title: "Movement Lens | 1CMC RLRJ Sovereign Payment Interface",
  description:
    "Biometric-authenticated USDT payments via smart eyewear — powered by Movement Pay Core",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-sovereign-dark text-sovereign-text min-h-screen antialiased">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.05),transparent_50%)] pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
