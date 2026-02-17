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
  title: "GitHub User Estimation | ~214.1M Valid Users",
  description:
    "Statistical estimation of total valid GitHub users using stratified random sampling. Live dashboard with daily frontier tracking.",
  openGraph: {
    title: "GitHub User Estimation | ~214.1M Valid Users",
    description:
      "How many real GitHub users exist? We used stratified random sampling to find out: ~214.1M valid accounts.",
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
        className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] antialiased min-h-screen`}
      >
        <Nav />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-border mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
            Built with stratified random sampling, 24,000 API calls, and Next.js.
            <span className="mx-2">|</span>
            Data collected Feb 2026.
          </div>
        </footer>
      </body>
    </html>
  );
}
