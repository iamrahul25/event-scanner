"use client";

import { useEffect, useMemo, useState } from "react";
import { layoutConcentricOrbit } from "@/lib/orbitLayout";
import { subscribeToUsers, type UserProfile } from "@/lib/users";

const NODE_SIZE = 96;
const CENTER_SIZE = 168;

function initials(user: UserProfile) {
  const name = user.displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return "?";
}

function shortLabel(user: UserProfile) {
  const name = user.displayName?.trim();
  if (name) {
    const first = name.split(/\s+/)[0]!;
    return first.length > 10 ? `${first.slice(0, 9)}…` : first;
  }
  if (user.email) {
    const local = user.email.split("@")[0]!;
    return local.length > 10 ? `${local.slice(0, 9)}…` : local;
  }
  return "User";
}

function UserNode({ user }: { user: UserProfile }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(user.photoURL) && !imgFailed;

  return (
    <div
      className="flex size-full flex-col items-center justify-center gap-1.5 px-2"
      title={user.displayName ?? user.email ?? user.uid}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Google avatars
        <img
          src={user.photoURL!}
          alt=""
          className="size-9 rounded-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
          {initials(user)}
        </span>
      )}
      <span className="max-w-full truncate text-center text-[11px] font-medium leading-tight text-zinc-800">
        {shortLabel(user)}
      </span>
    </div>
  );
}

export function UserOrbitGraph() {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToUsers(
      (next) => {
        setUsers(next);
        setError(null);
      },
      (err) => {
        console.error("Failed to load users:", err);
        setError("Could not load users. Check Firestore read rules.");
        setUsers([]);
      },
    );
  }, []);

  const layout = useMemo(
    () =>
      layoutConcentricOrbit(users?.length ?? 0, {
        nodeSize: NODE_SIZE,
        centerSize: CENTER_SIZE,
        gap: 28,
        padding: 32,
      }),
    [users],
  );

  const canvasSize = Math.max(layout.radius * 2, CENTER_SIZE + 64);
  const center = canvasSize / 2;

  if (users === null) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center text-sm text-zinc-500">
        Loading users…
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {error ? (
        <p className="mb-4 text-center text-sm text-red-600">{error}</p>
      ) : null}

      {!error && users.length === 0 ? (
        <p className="mb-4 text-center text-sm text-zinc-500">
          No registered users yet. Sign in to appear on the graph.
        </p>
      ) : null}

      <div className="w-full overflow-auto">
        <div
          className="relative mx-auto shrink-0"
          style={{ width: canvasSize, height: canvasSize }}
        >
          {/* Soft ring guides (decorative, not interactive) */}
          {Array.from({ length: layout.ringCount }, (_, ring) => {
            const ringRadius =
              CENTER_SIZE / 2 + NODE_SIZE / 2 + 28 + ring * (NODE_SIZE + 28);
            return (
              <div
                key={ring}
                aria-hidden
                className="pointer-events-none absolute rounded-full border border-zinc-200/70"
                style={{
                  width: ringRadius * 2,
                  height: ringRadius * 2,
                  left: center - ringRadius,
                  top: center - ringRadius,
                }}
              />
            );
          })}

          {/* Center hub — Event Scanner */}
          <div
            className="absolute z-10 flex flex-col items-center justify-center rounded-full bg-white shadow-[0_8px_28px_rgba(15,23,42,0.12)]"
            style={{
              width: CENTER_SIZE,
              height: CENTER_SIZE,
              left: center - CENTER_SIZE / 2,
              top: center - CENTER_SIZE / 2,
            }}
          >
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              Event Scanner
            </span>
            <span className="mt-1 text-xs text-zinc-500">
              {users.length} {users.length === 1 ? "user" : "users"}
            </span>
          </div>

          {/* User nodes */}
          {layout.positions.map((pos, i) => {
            const user = users[i]!;
            return (
              <div
                key={user.uid}
                className="absolute z-[5] rounded-full bg-white shadow-[0_6px_20px_rgba(15,23,42,0.1)] transition-transform duration-300 hover:z-20 hover:scale-105"
                style={{
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  left: center + pos.x - NODE_SIZE / 2,
                  top: center + pos.y - NODE_SIZE / 2,
                }}
              >
                <UserNode user={user} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
