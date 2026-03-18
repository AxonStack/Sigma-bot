"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navLinks = [
  { href: "/markets", label: "Explore Markets" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#tokenomics", label: "Tokenomics" },
  { href: "#compare", label: "Compare" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass-strong border-b border-base-blue/[0.08] shadow-[0_4px_30px_rgba(0,82,255,0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 md:h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="ClawdBet"
              width={34}
              height={34}
              className="rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
            <span className="font-display text-xl text-navy tracking-tight">
              ClawdBet
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isInternal = link.href.startsWith("/") && !link.href.startsWith("/#");
              return isInternal ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium text-slate hover:text-base-blue transition-colors duration-200 tracking-wide uppercase"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium text-slate hover:text-base-blue transition-colors duration-200 tracking-wide uppercase"
                >
                  {link.label}
                </a>
              );
            })}
            <div className="navbar-connect">
              <ConnectButton />
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <div className="w-5 flex flex-col gap-[5px]">
              <span
                className={`h-[1.5px] w-full bg-navy rounded-full transition-all duration-300 origin-center ${
                  mobileOpen ? "rotate-45 translate-y-[6.5px]" : ""
                }`}
              />
              <span
                className={`h-[1.5px] w-full bg-navy rounded-full transition-all duration-300 ${
                  mobileOpen ? "opacity-0 scale-x-0" : ""
                }`}
              />
              <span
                className={`h-[1.5px] w-full bg-navy rounded-full transition-all duration-300 origin-center ${
                  mobileOpen ? "-rotate-45 -translate-y-[6.5px]" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 glass-strong flex flex-col items-center justify-center"
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => {
                const isInternal = link.href.startsWith("/") && !link.href.startsWith("/#");
                const content = (
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="text-2xl font-display text-navy"
                  >
                    {link.label}
                  </motion.span>
                );
                return isInternal ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="text-2xl font-display text-navy"
                  >
                    {link.label}
                  </motion.a>
                );
              })}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 navbar-connect"
              >
                <ConnectButton />
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
