"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Tag,
  Users,
  RefreshCw,
  UserCircle,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/hosts", label: "Hosts", icon: UserCircle },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sync", label: "HubSpot Sync", icon: RefreshCw },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.replace(user ? "/portal" : "/login");
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const isActive = (item: (typeof NAV)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const SidebarContent = () => (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors group ${
              active
                ? "bg-primary-light text-primary"
                : "text-text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {active && (
              <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Admin Panel
              </p>
            </div>
            <SidebarContent />
          </div>
        </aside>

        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed bottom-4 right-4 z-30">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-20">
              <motion.div
                className="absolute inset-0 bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-background border-t border-border pb-8"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <p className="font-semibold text-text">Admin Navigation</p>
                </div>
                <SidebarContent />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
