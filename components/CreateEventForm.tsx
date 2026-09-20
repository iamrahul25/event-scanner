"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createEvent } from "@/lib/events";
import { FiCalendar, FiEdit3, FiArrowRight } from "react-icons/fi";
import { AuthButton } from "./AuthButton";

export function CreateEventForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name || !date) return;
    
    setCreating(true);
    try {
      const eventId = await createEvent(name, date, user.uid);
      router.push(`/event/${eventId}`);
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium text-zinc-600">
          Sign in to create your own event network space.
        </p>
        <AuthButton />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <FiEdit3 className="size-4 text-zinc-400" /> Event Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Expo 2026"
          required
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <FiCalendar className="size-4 text-zinc-400" /> Event Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>
      <button
        type="submit"
        disabled={creating || !name || !date}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
      >
        <span>{creating ? "Creating..." : "Create Event Space"}</span>
        {!creating && <FiArrowRight className="size-4" />}
      </button>
    </form>
  );
}
