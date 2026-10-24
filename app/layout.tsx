import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudySnap — AI Note Summarizer & Interactive Quiz for Students",
  description:
    "Snap handwritten lecture notes or past papers. Get comprehensive Bangla/English summaries, instant quizzes with source citations, and exam-focus topic detection.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col pb-16 md:pb-0 text-slate-100">
        <Suspense fallback={<div className="h-16 w-full glass-panel border-b border-white/10" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
