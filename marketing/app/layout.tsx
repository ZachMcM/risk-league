import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import Image from "next/image";
import { LogoIcon } from "@/components/ui/logo-icon";

export const metadata: Metadata = {
  title: "Risk League",
  description: "The future of sports betting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center space-x-2">
                  <LogoIcon className="h-6 w-6 text-primary"/>
                  <span className="text-xl font-bold gradient-text">
                    Risk League
                  </span>
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                  <Link
                    href="/#features"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                  <Link
                    href="/#why-us"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Why Risk League
                  </Link>
                  <Link
                    href="/#how-it-works"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    How It Works
                  </Link>
                </nav>
              </div>
            </header>
            {children}
            <footer className="border-t border-border py-12">
              <div className="container px-4 md:px-6">
                <div className="grid gap-8 md:grid-cols-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <LogoIcon className="h-6 w-6 text-primary"/>
                      <span className="text-xl font-bold gradient-text">
                        Risk League
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The future of competitive fantasy sports. All skill, no
                      financial risk.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Product</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        <Link
                          href="/#features"
                          className="hover:text-primary transition-colors"
                        >
                          Features
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/#how-it-works"
                          className="hover:text-primary transition-colors"
                        >
                          How It Works
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/#"
                          className="hover:text-primary transition-colors"
                        >
                          Tournaments
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Company</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        <Link
                          href="/#"
                          className="hover:text-primary transition-colors"
                        >
                          About
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/#"
                          className="hover:text-primary transition-colors"
                        >
                          Blog
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/#"
                          className="hover:text-primary transition-colors"
                        >
                          Careers
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Legal</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        <Link
                          href="/#"
                          className="hover:text-primary transition-colors"
                        >
                          Privacy Policy
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/#"
                          className="hover:text-primary transition-colors"
                        >
                          Terms of Service
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/#"
                          className="hover:text-primary transition-colors"
                        >
                          Contact
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center space-x-4">
                      <Link
                        href="https://x.com/riskleaguex"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </Link>
                      <Link
                        href="https://www.tiktok.com/@riskleague"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </Link>
                      <Link
                        href="https://www.instagram.com/riskleague/"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      &copy; {new Date().getFullYear()} Risk League. All rights
                      reserved.
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
