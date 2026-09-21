"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ThemeLogo } from "@/components/ui/ThemeLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Building2, Code2, Menu, X, Book, Terminal, Zap } from "lucide-react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0E0E10] text-zinc-900 dark:text-white/90 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur flex-none border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-[#0E0E10]/80 supports-backdrop-blur:bg-white/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center" aria-label="PausePay home">
                <ThemeLogo />
              </Link>
              <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link href="/docs" className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Code2 size={16} />
                  Documentation
                </Link>
                <Link href="/companies" className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                  <Building2 size={16} />
                  Dashboard
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button 
                className="md:hidden p-2 text-zinc-600 dark:text-white/60 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 flex-1 flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/50 md:hidden" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 pt-16 pb-10 px-6 
          overflow-y-auto border-r border-zinc-200 dark:border-white/10 
          bg-white dark:bg-[#0E0E10] 
          transform transition-transform duration-300 md:translate-x-0 md:static md:block md:w-64 md:pt-10 md:px-4 md:z-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="space-y-8 text-sm">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Getting Started</h3>
              <ul className="space-y-2 border-l border-zinc-200 dark:border-white/10 pl-3">
                <li>
                  <Link href="/docs" className="block text-blue-600 dark:text-blue-400 font-medium">
                    Overview
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">API Reference</h3>
              <ul className="space-y-2 border-l border-zinc-200 dark:border-white/10 pl-3">
                <li>
                  <Link href="#evaluate" className="block text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    Evaluate Transaction
                  </Link>
                </li>
                <li>
                  <Link href="#scoring" className="block text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    Deterministic Scoring
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Article Content */}
        <main className="flex-1 min-w-0 py-10 md:pl-10">
          <div className="max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
