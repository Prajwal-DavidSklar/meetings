"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Tag,
  Users,
  UserCog,
  RefreshCw,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import LoadingScreen from "@/components/layout/LoadingScreen";

const NAV_ITEMS = [
  { href: "/admin/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/hosts", label: "Hosts", icon: UserCog },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sync", label: "Sync", icon: RefreshCw },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) router.replace("/login");
      else if (!isAdmin) router.replace("/portal");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header />
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "24px",
          display: "flex",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            display: "none",
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 30,
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--primary)",
            border: "none",
            cursor: "pointer",
            boxShadow: "var(--shadow-lg)",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
          className="mobile-fab"
        >
          <Menu size={20} />
        </button>

        {/* Sidebar */}
        <aside
          style={{
            width: "220px",
            flexShrink: 0,
            position: "sticky",
            top: "84px",
          }}
        >
          <nav
            style={{
              background: "var(--bg-sidebar)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              padding: "8px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                padding: "6px 12px 10px",
              }}
            >
              Admin Panel
            </p>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} style={{ textDecoration: "none", display: "block" }}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      background: active
                        ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                        : "transparent",
                      color: active ? "var(--primary)" : "var(--text-secondary)",
                      fontWeight: active ? 600 : 500,
                      fontSize: "14px",
                      marginBottom: "2px",
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {active && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: 1, minWidth: 0 }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 40,
            }}
            onClick={() => setSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "260px",
                background: "var(--bg-sidebar)",
                padding: "24px 12px",
                borderRight: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    style={{ textDecoration: "none", display: "block" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: active ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent",
                        color: active ? "var(--primary)" : "var(--text-secondary)",
                        fontWeight: active ? 600 : 500,
                        fontSize: "15px",
                        marginBottom: "4px",
                      }}
                    >
                      <Icon size={18} />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
