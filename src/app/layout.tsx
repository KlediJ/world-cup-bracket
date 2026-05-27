import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Bracket",
  description: "A private World Cup prediction pool for friends and family.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-950">
        <SiteNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">{children}</main>
      </body>
    </html>
  );
}
