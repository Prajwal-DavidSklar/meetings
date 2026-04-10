"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings, User, ChevronDown, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const inAdmin = pathname.startsWith("/admin");

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--bg-header)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Logo */}
        <Link href="/portal" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="18" rx="3" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M4 12h24" stroke="white" strokeWidth="2"/>
              <circle cx="10" cy="18" r="2" fill="white"/>
              <circle cx="16" cy="18" r="2" fill="white"/>
              <circle cx="22" cy="18" r="2" fill="white"/>
            </svg>
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "15px",
              color: "var(--text-primary)",
              letterSpacing: "-0.2px",
            }}
          >
            VAC
          </span>
        </Link>

        {/* Nav tabs */}
        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <NavLink href="/portal" active={!inAdmin}>Meetings</NavLink>
          {isAdmin && (
            <NavLink href="/admin" active={inAdmin}>
              <Shield size={13} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
              Admin
            </NavLink>
          )}
        </nav>

        {/* User menu */}
        <div style={{ position: "relative" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border)",
              background: "var(--bg-hover)",
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <User size={13} color="white" />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name ?? user?.email}
            </span>
            <motion.div animate={{ rotate: menuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} color="var(--text-muted)" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 10 }}
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    minWidth: "200px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    boxShadow: "var(--shadow-lg)",
                    overflow: "hidden",
                    zIndex: 20,
                  }}
                >
                  {/* User info */}
                  <div
                    style={{
                      padding: "14px 16px 12px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {user?.name ?? "User"}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {user?.email}
                    </p>
                    {isAdmin && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "6px",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-pill)",
                          background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                          color: "var(--primary)",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        <Shield size={10} /> Admin
                      </span>
                    )}
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: "6px" }}>
                    {isAdmin && (
                      <MenuButton
                        icon={<Settings size={15} />}
                        label="Admin Panel"
                        onClick={() => {
                          setMenuOpen(false);
                          window.location.href = "/admin";
                        }}
                      />
                    )}
                    <MenuButton
                      icon={<LogOut size={15} />}
                      label="Sign Out"
                      danger
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 14px",
        borderRadius: "var(--radius-pill)",
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        textDecoration: "none",
        color: active ? "var(--primary)" : "var(--text-secondary)",
        background: active
          ? "color-mix(in srgb, var(--primary) 10%, transparent)"
          : "transparent",
        transition: "all 0.2s",
      }}
    >
      {children}
    </Link>
  );
}

function MenuButton({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 12px",
        borderRadius: "10px",
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 500,
        color: danger ? "#ef4444" : "var(--text-primary)",
        textAlign: "left",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = danger
          ? "rgba(239,68,68,0.08)"
          : "var(--bg-hover)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      {icon}
      {label}
    </button>
  );
}
