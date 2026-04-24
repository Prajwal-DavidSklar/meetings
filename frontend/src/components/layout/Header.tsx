"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);

  const navLinks = [
    { href: "/portal", label: "Portal", icon: CalendarDays },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: LayoutDashboard }]
      : []),
  ];

  const isActive = (href: string) =>
    href === "/portal"
      ? pathname.startsWith("/portal")
      : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/portal" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm group-hover:shadow-md group-hover:bg-primary-hover transition-all">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-text hidden sm:block">
            Meetings Portal
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-primary-light dark:bg-blue-900 text-primary dark:text-white"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {isActive(href) && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-full bg-primary-light -z-10 dark:text-white"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-2 transition-colors"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </span>
              <span className="hidden sm:block max-w-30 truncate">
                {user?.name}
              </span>
              {isAdmin && (
                <ShieldCheck className="h-3.5 w-3.5 text-secondary hidden sm:block" />
              )}
              <ChevronDown
                className={`h-3.5 w-3.5 text-text-muted transition-transform ${userDropOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {userDropOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserDropOpen(false)}
                  />
                  <motion.div
                    className="absolute right-0 top-full mt-2 z-20 min-w-50 rounded-2xl border border-border bg-background shadow-xl p-1"
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-sm font-semibold text-text truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {user?.email}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isAdmin
                            ? "bg-secondary-light text-secondary"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        {user?.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-muted hover:bg-surface-2 hover:text-error transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-text-muted hover:text-text transition-colors"
          >
            {menuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="border-t border-border bg-background md:hidden overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col gap-1 p-3">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "bg-primary-light text-primary"
                      : "text-text-muted hover:bg-surface-2 hover:text-text"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
