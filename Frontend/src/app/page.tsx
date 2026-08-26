"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Mail,
  RefreshCw,
  BarChart3,
  DollarSign,
  Shield,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const features = [
  {
    icon: Mail,
    title: "AI-Generated Dispute Emails",
    description:
      "Professionally crafted dispute emails generated instantly using AI, tailored to your specific billing issue.",
  },
  {
    icon: RefreshCw,
    title: "Automated Follow-Ups",
    description:
      "Never miss a follow-up. The system automatically escalates unresolved disputes on schedule.",
  },
  {
    icon: BarChart3,
    title: "Dispute Tracking",
    description:
      "Track every dispute from creation to resolution with a clear status pipeline and email history.",
  },
  {
    icon: DollarSign,
    title: "Recovery Tracking",
    description:
      "See exactly how much you've recovered and your success rate across all disputes.",
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Sign-in failed. Please try again.",
  identity_failed: "Could not verify your Google identity. Please try again.",
  missing_code: "OAuth flow was interrupted. Please try again.",
};

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorKey = searchParams.get("error");
  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? "Sign-in failed. Please try again.") : null;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight">
              DisputeFlow
            </span>
          </div>
          <button
            onClick={() => api.auth.login()}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            Sign in
          </button>
        </div>
      </header>

      {/* Auth error banner */}
      {errorMessage && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-32 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Stop Losing Money to{" "}
            <span className="text-primary">Billing Errors</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            DisputeFlow automates your billing dispute process end to end.
            Generate professional dispute emails with AI, track every case, and
            recover overcharges — all from one dashboard.
          </p>
          <div className="mt-10">
            <button
              onClick={() => api.auth.login()}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
            >
              Sign in with Google <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need to dispute &amp; recover
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <f.icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DisputeFlow. All rights reserved.
      </footer>
    </div>
  );
}
