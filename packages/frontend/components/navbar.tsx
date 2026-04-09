"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { WalletPill } from "./wallet-pill";

const navLinks = [
  { href: "/markets", label: "Markets" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#tokenomics", label: "Tokenomics" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
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
      <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <div
          className={`mx-auto max-w-7xl rounded-[30px] border px-4 py-3 transition-[background-color,border-color,transform] duration-200 sm:px-5 ${
            scrolled
              ? "border-white/12 bg-black/70 backdrop-blur-xl"
              : "border-white/10 bg-black/40 backdrop-blur-lg"
          }`}
        >
          <div className="grid items-center gap-4 md:grid-cols-[auto_1fr_auto]">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-[#ff3b6b]/30 blur-xl" />
                <Image
                  src="/logo.png"
                  alt="OpenBet"
                  width={38}
                  height={38}
                  className="relative rounded-2xl border border-white/10"
                />
              </div>
              <div>
                <div className="font-display text-lg font-semibold tracking-tight text-white">
                  OpenBet
                </div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/40">
                  Live on Base
                </div>
              </div>
            </Link>

            <div className="hidden items-center justify-center gap-8 md:flex">
              {navLinks.map((link) => {
                const content = (
                  <span className="text-[13px] uppercase tracking-[0.24em] text-white/62 transition-colors duration-200 hover:text-white">
                    {link.label}
                  </span>
                );

                return link.href.startsWith("/") ? (
                  <Link key={link.href} href={link.href}>
                    {content}
                  </Link>
                ) : (
                  <a key={link.href} href={link.href}>
                    {content}
                  </a>
                );
              })}
            </div>

            <div className="hidden md:flex md:justify-end">
              <WalletPill />
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
              aria-label="Toggle menu"
            >
              <div className="flex w-5 flex-col gap-[5px]">
                <span
                  className={`h-[1.5px] w-full rounded-full bg-current transition-transform duration-200 ${
                    mobileOpen ? "translate-y-[6.5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-[1.5px] w-full rounded-full bg-current transition duration-200 ${
                    mobileOpen ? "scale-x-0 opacity-0" : ""
                  }`}
                />
                <span
                  className={`h-[1.5px] w-full rounded-full bg-current transition-transform duration-200 ${
                    mobileOpen ? "-translate-y-[6.5px] -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-[#050103]/96 px-6 pt-28 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto max-w-sm rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col gap-5">
                {navLinks.map((link, index) => {
                  const content = (
                    <motion.span
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + index * 0.05, duration: 0.2 }}
                      className="font-display text-2xl text-white"
                    >
                      {link.label}
                    </motion.span>
                  );

                  return link.href.startsWith("/") ? (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                      {content}
                    </a>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.2 }}
                className="mt-6"
              >
                <WalletPill fullWidth showNetwork={false} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
