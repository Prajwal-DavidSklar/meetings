"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/layout/LoadingScreen";
import { microsoftCallback } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) {
      setError("Invalid callback — missing code or state.");
      return;
    }

    microsoftCallback(code, state)
      .then(async (token) => {
        await login(token);
        setTimeout(() => router.replace("/portal"), 1300);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Authentication failed."
        );
      });
  }, [params, login, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center max-w-sm">
          <p className="text-lg font-semibold text-text mb-2">Sign-in failed</p>
          <p className="text-sm text-text-muted mb-4">{error}</p>
          <a
            href="/login"
            className="inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <LoadingScreen />
    </AnimatePresence>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AnimatePresence>
          <LoadingScreen />
        </AnimatePresence>
      }
    >
      <AuthCallback />
    </Suspense>
  );
}
