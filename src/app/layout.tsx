import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/nav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "GitHub Census — How Many GitHub Users Exist?",
  description:
    "Statistical estimation of GitHub's total valid user population using stratified random sampling across 24,000 API calls. Live frontier tracking with daily updates.",
  openGraph: {
    title: "GitHub Census — How Many GitHub Users Exist?",
    description:
      "We used stratified random sampling across 24,000 API calls to estimate GitHub's real user count. Find out the answer, with 95% confidence.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] antialiased min-h-[100dvh] flex flex-col`}
      >
        <Nav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="mt-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.22)" }}>
              Built with stratified random sampling · 24,000 API calls · Next.js
            </span>
            <span className="text-[12px] font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>
              Data collected Feb 2026
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
