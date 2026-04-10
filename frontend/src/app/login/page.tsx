"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, X, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/portal");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleMicrosoftLogin = async () => {
    setMsLoading(true);
    setError(null);
    try {
      const { auth_url, state } = await authApi.getMicrosoftLoginUrl();
      sessionStorage.setItem("ms_oauth_state", state);
      window.location.href = auth_url;
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate Microsoft login.",
      );
      setMsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setError(null);
    try {
      const tokens = await authApi.login(email, password);
      await login(tokens);
      setShowAdminModal(false);
      router.replace("/portal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setAdminLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--secondary) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 0] }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-5%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.2)",
          padding: "48px 40px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "40px" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect
                x="4"
                y="8"
                width="24"
                height="18"
                rx="3"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
              <path d="M4 12h24" stroke="white" strokeWidth="2" />
              <circle cx="10" cy="18" r="2" fill="white" />
              <circle cx="16" cy="18" r="2" fill="white" />
              <circle cx="22" cy="18" r="2" fill="white" />
            </svg>
          </div>
          <h1
            style={{
              color: "white",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "-0.3px",
              marginBottom: "6px",
            }}
          >
            Meeting Bookings
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px" }}>
            Internal Meeting Booking Portal
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMicrosoftLogin}
            disabled={msLoading}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: "12px",
              background: "white",
              border: "none",
              cursor: msLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#1a1a2e",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              opacity: msLoading ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {msLoading ? (
              <Loader2
                size={18}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <MicrosoftIcon />
            )}
            {msLoading ? "Redirecting…" : "Login with Microsoft"}
          </motion.button>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
                fontSize: "13px",
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}

          <div style={{ textAlign: "center", marginTop: "4px" }}>
            <button
              onClick={() => {
                setShowAdminModal(true);
                setError(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.6)",
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.9)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
              }
            >
              Admin Login
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              zIndex: 50,
            }}
            onClick={() => setShowAdminModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "380px",
                background: "var(--bg-modal)",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                padding: "32px",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Admin Login
                </h2>
                <button
                  onClick={() => setShowAdminModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "4px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={handleAdminLogin}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@company.com"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 36px",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        background: "var(--bg-input)",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 36px",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        background: "var(--bg-input)",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }
                    />
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                      fontSize: "13px",
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={adminLoading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
                    border: "none",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: adminLoading ? "not-allowed" : "pointer",
                    opacity: adminLoading ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  {adminLoading && (
                    <Loader2
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  )}
                  {adminLoading ? "Signing in…" : "Sign In"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
