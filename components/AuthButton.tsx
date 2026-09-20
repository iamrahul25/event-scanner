"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export function AuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("Sign-in failed. Try again.");
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch {
      setError("Sign-out failed. Try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <p className="hidden text-sm text-zinc-600 sm:block">
          {user.displayName ?? user.email}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut || signingIn}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={signingIn}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {signingIn ? "Signing in…" : "Sign in with Google"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
