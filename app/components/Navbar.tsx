"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, History, FileText, Camera } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Snap & Study", icon: Camera },
    { href: "/history", label: "Past Sessions", icon: History },
    { href: "/past-papers", label: "Exam Papers", icon: FileText },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  StudySnap
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
                  IIUC Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Handwritten Notes & Exam Prep Assistant
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-3 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs transition-colors ${
                  active ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    active ? "bg-indigo-500/20 text-indigo-300" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
