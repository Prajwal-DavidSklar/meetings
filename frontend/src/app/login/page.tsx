"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AdminLoginModal from "@/components/auth/AdminLoginModal";
import LoadingScreen from "@/components/layout/LoadingScreen";
import { getMicrosoftLoginUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/portal");
    }
  }, [user, isLoading, router]);

  const handleMicrosoftLogin = async () => {
    setMsLoading(true);
    try {
      const { auth_url } = await getMicrosoftLoginUrl();
      window.location.href = auth_url;
    } catch {
      setMsLoading(false);
    }
  };

  const handleAdminSuccess = () => {
    setAdminModalOpen(false);
    setShowLoading(true);
    setTimeout(() => {
      router.replace("/portal");
    }, 1300);
  };

  if (isLoading) return null;

  return (
    <>
      <AnimatePresence>{showLoading && <LoadingScreen />}</AnimatePresence>

      <div className="relative min-h-screen flex flex-col">
        {/* Background gradient */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent), var(--color-background)",
          }}
        />

        {/* Top bar */}
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>

        {/* Center card */}
        <div className="flex flex-1 items-center justify-center px-4 pb-16">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
                <CalendarDays className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-text">
                  Meetings Portal
                </h1>
                <p className="mt-1 text-sm text-text-muted">
                  Sign in to book a meeting
                </p>
              </div>
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/5 flex flex-col gap-4">
              {/* Microsoft button */}
              <button
                onClick={handleMicrosoftLogin}
                disabled={msLoading}
                className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {msLoading ? (
                  <span className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                ) : (
                  <MicrosoftIcon />
                )}
                {msLoading ? "Redirecting…" : "Continue with Microsoft"}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Admin login link */}
              <button
                onClick={() => setAdminModalOpen(true)}
                className="text-sm text-text-muted hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                Admin Login
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-text-muted">
              Access is restricted to authorised users only.
            </p>
          </motion.div>
        </div>
      </div>

      <AdminLoginModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />
    </>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 21 21" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
