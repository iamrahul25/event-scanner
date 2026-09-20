"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { FiLogOut, FiEdit3 } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { ProfileEditorModal } from "./ProfileEditorModal";

export function AuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-full border border-zinc-200 bg-white transition-colors hover:border-zinc-300">
          <p className="hidden px-2 py-2 text-sm text-zinc-600 sm:block">
            {user.displayName ?? user.email}
          </p>
          <div className="hidden h-4 w-px bg-zinc-200 sm:block" />
          <button
            type="button"
            title="Edit Profile"
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center justify-center rounded-r-full px-3 py-2 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 sm:rounded-none sm:rounded-r-full"
          >
            <FiEdit3 className="size-4" />
          </button>
        </div>
        <button
          type="button"
          title="Sign Out"
          onClick={handleSignOut}
          disabled={signingOut || signingIn}
          className="flex items-center justify-center rounded-full border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          <FiLogOut className="size-4" />
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <ProfileEditorModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={signingIn}
        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
      >
        <FcGoogle className="size-5" />
        {signingIn ? "Signing in…" : "Sign in with Google"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
