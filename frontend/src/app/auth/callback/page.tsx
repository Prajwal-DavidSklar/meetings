"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <AuthCallbackInner />
    </Suspense>
  );
}

function CallbackLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--secondary) 100%)",
      }}
    >
      <SpinnerDots />
    </div>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    if (errorParam) {
      setError(errorDesc ?? errorParam);
      return;
    }

    if (!code || !state) {
      setError("Missing authentication parameters.");
      return;
    }

    const savedState = sessionStorage.getItem("ms_oauth_state");
    if (savedState && savedState !== state) {
      setError("Invalid state parameter. Possible CSRF attempt.");
      return;
    }
    sessionStorage.removeItem("ms_oauth_state");

    authApi
      .microsoftCallback(code, state)
      .then(async (tokens) => {
        await login(tokens);
        router.replace("/portal");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Authentication failed.");
      });
  }, [searchParams, login, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--secondary) 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.2)",
          padding: "48px",
          textAlign: "center",
          maxWidth: "380px",
          width: "100%",
          margin: "24px",
        }}
      >
        {error ? (
          <>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(239,68,68,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <AlertCircle size={24} color="#fca5a5" />
            </div>
            <h2 style={{ color: "white", fontWeight: 700, fontSize: "18px", marginBottom: "10px" }}>
              Authentication Failed
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", marginBottom: "24px" }}>
              {error}
            </p>
            <button
              onClick={() => router.replace("/login")}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                background: "white",
                border: "none",
                color: "#01467f",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "24px" }}>
              <SpinnerDots />
            </div>
            <h2 style={{ color: "white", fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>
              Signing you in…
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
              Verifying your Microsoft account
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

function SpinnerDots() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "white",
          }}
        />
      ))}
    </div>
  );
}
