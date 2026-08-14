"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppearance } from "@/context/appearance";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { findAccount, register } = useAuth();
  const { t } = useAppearance();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [found, setFound] = useState(false);
  const [sending, setSending] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  async function onLookup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value || !value.includes("@")) {
      toast.error(t("auth.forgot.needEmail"));
      return;
    }

    const account = findAccount(value);
    if (!account) {
      setFound(false);
      toast.error(t("auth.forgot.notFound"));
      return;
    }

    setFound(true);
    setSending(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
          fullName: account.fullName,
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        toast.error(payload.error || t("auth.forgot.sendFail"));
        return;
      }
      toast.success(payload.message || t("auth.forgot.sent"));
    } catch {
      toast.error(t("auth.forgot.mailFail"));
    } finally {
      setSending(false);
    }
  }

  async function onReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const account = findAccount(email);
    if (!account) {
      toast.error(t("auth.forgot.reenter"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("auth.forgot.short"));
      return;
    }
    await register({ ...account, password: newPassword });
    toast.success(t("auth.forgot.saved"));
    router.push("/dashboard");
  }

  return (
    <AuthShell>
      <h1 className="mt-10 text-3xl font-bold text-foreground">{t("auth.forgot.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("auth.forgot.subtitle")}</p>

      <form className="mt-8 space-y-4" onSubmit={onLookup}>
        <div>
          <Label htmlFor="email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-muted" />
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFound(false);
              }}
              placeholder="example@gmail.com"
              className="pe-10"
              required
            />
          </div>
        </div>
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={sending}>
          {sending ? t("auth.forgot.sending") : t("auth.forgot.send")}
        </Button>
      </form>

      {found && (
        <form className="mt-8 space-y-4 rounded-2xl border border-border p-4" onSubmit={onReset}>
          <p className="text-sm text-muted">{t("auth.forgot.found")}</p>
          <div>
            <Label htmlFor="newPassword">{t("auth.forgot.newPassword")}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full">
            {t("auth.forgot.save")}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.forgot.remember")}{" "}
        <Link href="/login" className="text-accent hover:underline">
          {t("auth.login.title")}
        </Link>
      </p>
    </AuthShell>
  );
}
