"use client";

import { useEffect, useMemo, useState } from "react";
import { layoutConcentricOrbit } from "@/lib/orbitLayout";
import {
  subscribeToUsers,
  type SocialLinks,
  type UserProfile,
} from "@/lib/users";

const RING_COLORS = [
  "border-sky-500",
  "border-violet-500",
  "border-amber-500",
  "border-emerald-500",
  "border-rose-500",
  "border-cyan-500",
  "border-orange-500",
  "border-indigo-500",
] as const;

const NODE_SIZE = 96;
const CENTER_SIZE = 168;
const CHILD_W = 118;
const CHILD_H = 52;
const BRANCH_DISTANCE = 148;

const SOCIAL_META: {
  key: keyof SocialLinks;
  label: string;
  short: string;
}[] = [
  { key: "instagram", label: "Instagram", short: "IG" },
  { key: "facebook", label: "Facebook", short: "FB" },
  { key: "linkedin", label: "LinkedIn", short: "in" },
  { key: "twitter", label: "Twitter", short: "X" },
  { key: "github", label: "GitHub", short: "GH" },
];

type BranchItem = {
  id: string;
  label: string;
  short: string;
  href: string | null;
  detail: string;
};

type BranchNode = BranchItem & {
  x: number;
  y: number;
};

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

function displayHandle(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    return path && path !== "/" ? path.slice(1) : parsed.hostname;
  } catch {
    return url;
  }
}

function branchItemsFor(user: UserProfile): BranchItem[] {
  const items: BranchItem[] = [];

  if (user.email) {
    items.push({
      id: "email",
      label: "Email",
      short: "@",
      href: `mailto:${user.email}`,
      detail: user.email,
    });
  }

  for (const meta of SOCIAL_META) {
    const href = user.socials[meta.key];
    if (!href) continue;
    items.push({
      id: meta.key,
      label: meta.label,
      short: meta.short,
      href,
      detail: displayHandle(href),
    });
  }

  return items;
}

/** Fan child nodes outward from the parent, away from the hub. */
function layoutBranches(
  parentX: number,
  parentY: number,
  items: BranchItem[],
): BranchNode[] {
  if (items.length === 0) return [];

  const radial = Math.atan2(parentY, parentX);
  const count = items.length;
  const spread = Math.min(Math.PI * 0.85, 0.42 * Math.max(count - 1, 1));
  const start = radial - spread / 2;

  return items.map((item, i) => {
    const angle =
      count === 1 ? radial : start + (spread * i) / Math.max(count - 1, 1);
    return {
      ...item,
      x: parentX + Math.cos(angle) * BRANCH_DISTANCE,
      y: parentY + Math.sin(angle) * BRANCH_DISTANCE,
    };
  });
}

function curvePath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const mx = (fromX + toX) / 2;
  const my = (fromY + toY) / 2;
  // Soft elbow toward the midpoint — Whimsical-like organic curve.
  const cx = mx + (toY - fromY) * 0.12;
  const cy = my - (toX - fromX) * 0.12;
  return `M ${pxNum(fromX)} ${pxNum(fromY)} Q ${pxNum(cx)} ${pxNum(cy)} ${pxNum(toX)} ${pxNum(toY)}`;
}

/** Stable CSS length for SSR + client (avoids number vs "Npx" hydration drift). */
function px(value: number): string {
  return `${value.toFixed(2)}px`;
}

function pxNum(value: number): string {
  return value.toFixed(2);
}

function UserNode({ user }: { user: UserProfile }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(user.photoURL) && !imgFailed;

  return (
    <div
      className="flex size-full flex-col items-center justify-center gap-0.5 px-1"
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

type UserOrbitGraphProps = {
  /** When set, skips Firestore and renders this list (UI testing). */
  users?: UserProfile[];
};

export function UserOrbitGraph({ users: usersProp }: UserOrbitGraphProps = {}) {
  const [liveUsers, setLiveUsers] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const useStatic = usersProp !== undefined;

  useEffect(() => {
    if (useStatic) return;
    return subscribeToUsers(
      (next) => {
        setLiveUsers(next);
        setError(null);
      },
      (err) => {
        console.error("Failed to load users:", err);
        setError("Could not load users. Check Firestore read rules.");
        setLiveUsers([]);
      },
    );
  }, [useStatic]);

  useEffect(() => {
    if (!selectedUid) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedUid(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedUid]);

  const users = useStatic ? usersProp : liveUsers;

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

  const selectedIndex =
    users && selectedUid
      ? users.findIndex((u) => u.uid === selectedUid)
      : -1;
  const selectedUser =
    selectedIndex >= 0 && users ? users[selectedIndex]! : null;
  const selectedPos =
    selectedIndex >= 0 ? layout.positions[selectedIndex]! : null;

  const branches = useMemo(() => {
    if (!selectedUser || !selectedPos) return [];
    return layoutBranches(
      selectedPos.x,
      selectedPos.y,
      branchItemsFor(selectedUser),
    );
  }, [selectedUser, selectedPos]);

  // Expand canvas so branch cards near the edge stay visible.
  const extent = useMemo(() => {
    let max = layout.radius;
    for (const b of branches) {
      const reach =
        Math.hypot(b.x, b.y) + Math.hypot(CHILD_W / 2, CHILD_H / 2) + 24;
      if (reach > max) max = reach;
    }
    return max;
  }, [layout.radius, branches]);

  const canvasSize = Math.ceil(Math.max(extent * 2, CENTER_SIZE + 64));
  const center = canvasSize / 2;

  if (users === null) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center text-sm text-zinc-500">
        Loading users…
      </div>
    );
  }

  function toggleUser(uid: string) {
    setSelectedUid((prev) => (prev === uid ? null : uid));
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

      {selectedUser ? (
        <p className="mb-3 text-center text-sm text-zinc-500">
          Viewing{" "}
          <span className="font-medium text-zinc-700">
            {selectedUser.displayName ?? "user"}
          </span>
          {" · "}
          click again or press Esc to collapse
        </p>
      ) : (
        <p className="mb-3 text-center text-sm text-zinc-500">
          Click a person to expand their profile on the map
        </p>
      )}

      <div className="w-full overflow-auto">
        <div
          className="relative mx-auto shrink-0"
          style={{ width: px(canvasSize), height: px(canvasSize) }}
          onClick={() => {
            if (selectedUid) setSelectedUid(null);
          }}
        >
          {/* Soft ring guides (decorative, not interactive) */}
          {Array.from({ length: layout.ringCount }, (_, ring) => {
            const ringRadius =
              CENTER_SIZE / 2 + NODE_SIZE / 2 + 28 + ring * (NODE_SIZE + 28);
            return (
              <div
                key={ring}
                aria-hidden
                className={`pointer-events-none absolute rounded-full border-[2.5px] transition-opacity duration-300 ${RING_COLORS[ring % RING_COLORS.length]} ${
                  selectedUid ? "opacity-25" : "opacity-100"
                }`}
                style={{
                  width: px(ringRadius * 2),
                  height: px(ringRadius * 2),
                  left: px(center - ringRadius),
                  top: px(center - ringRadius),
                }}
              />
            );
          })}

          {/* Connector lines — parent hub → selected user → children */}
          {selectedPos && selectedUser ? (
            <svg
              className="pointer-events-none absolute inset-0 z-[4] overflow-visible"
              width={canvasSize}
              height={canvasSize}
              aria-hidden
            >
              <path
                d={curvePath(
                  center,
                  center,
                  center + selectedPos.x,
                  center + selectedPos.y,
                )}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth={2}
                strokeLinecap="round"
                className="animate-[orbit-draw_420ms_ease-out]"
                style={{
                  strokeDasharray: 600,
                  strokeDashoffset: 0,
                }}
              />
              {branches.map((branch, i) => (
                <path
                  key={branch.id}
                  d={curvePath(
                    center + selectedPos.x,
                    center + selectedPos.y,
                    center + branch.x,
                    center + branch.y,
                  )}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  style={{
                    animation: `orbit-fade-in 320ms ease-out ${80 + i * 45}ms both`,
                  }}
                />
              ))}
            </svg>
          ) : null}

          {/* Center hub — Event Scanner */}
          <div
            className={`absolute z-10 flex flex-col items-center justify-center rounded-full bg-white shadow-[0_8px_28px_rgba(15,23,42,0.12)] transition-opacity duration-300 ${
              selectedUid ? "opacity-70" : "opacity-100"
            }`}
            style={{
              width: px(CENTER_SIZE),
              height: px(CENTER_SIZE),
              left: px(center - CENTER_SIZE / 2),
              top: px(center - CENTER_SIZE / 2),
            }}
            onClick={(e) => e.stopPropagation()}
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
            const isSelected = selectedUid === user.uid;
            const dimmed = Boolean(selectedUid) && !isSelected;
            return (
              <button
                key={user.uid}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleUser(user.uid);
                }}
                aria-expanded={isSelected}
                aria-label={`${isSelected ? "Collapse" : "Expand"} profile for ${user.displayName ?? user.email ?? "user"}`}
                className={`absolute rounded-full bg-white shadow-[0_6px_20px_rgba(15,23,42,0.1)] transition-all duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                  isSelected
                    ? "z-20 scale-110 ring-2 ring-sky-500 shadow-[0_10px_28px_rgba(14,165,233,0.28)]"
                    : dimmed
                      ? "z-[5] scale-95 opacity-35 hover:opacity-70"
                      : "z-[5] hover:z-20"
                }`}
                style={{
                  width: px(NODE_SIZE),
                  height: px(NODE_SIZE),
                  left: px(center + pos.x - NODE_SIZE / 2),
                  top: px(center + pos.y - NODE_SIZE / 2),
                }}
              >
                <UserNode user={user} />
              </button>
            );
          })}

          {/* Branch detail cards (Whimsical-style children) */}
          {selectedPos
            ? branches.map((branch, i) => {
                const content = (
                  <>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                      {branch.short}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block truncate text-[11px] font-semibold leading-tight text-zinc-800">
                        {branch.label}
                      </span>
                      <span className="block truncate text-[10px] leading-tight text-zinc-500">
                        {branch.detail}
                      </span>
                    </span>
                  </>
                );

                const className =
                  "absolute z-30 flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.12)] transition-transform duration-200 hover:scale-[1.03] hover:border-sky-300";
                const style = {
                  width: px(CHILD_W),
                  height: px(CHILD_H),
                  left: px(center + branch.x - CHILD_W / 2),
                  top: px(center + branch.y - CHILD_H / 2),
                  animation: `orbit-pop 380ms cubic-bezier(0.22, 1, 0.36, 1) ${90 + i * 45}ms both`,
                };

                if (branch.href) {
                  return (
                    <a
                      key={branch.id}
                      href={branch.href}
                      target={branch.id === "email" ? undefined : "_blank"}
                      rel={
                        branch.id === "email"
                          ? undefined
                          : "noopener noreferrer"
                      }
                      className={className}
                      style={style}
                      onClick={(e) => e.stopPropagation()}
                      title={`${branch.label}: ${branch.detail}`}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <div
                    key={branch.id}
                    className={className}
                    style={style}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {content}
                  </div>
                );
              })
            : null}

          {/* Empty branches message */}
          {selectedUser && selectedPos && branches.length === 0 ? (
            <div
              className="absolute z-30 rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-2 text-center text-[11px] text-zinc-500 shadow-sm"
              style={{
                width: px(140),
                left: px(
                  center +
                    selectedPos.x +
                    Math.cos(Math.atan2(selectedPos.y, selectedPos.x)) *
                      BRANCH_DISTANCE -
                    70,
                ),
                top: px(
                  center +
                    selectedPos.y +
                    Math.sin(Math.atan2(selectedPos.y, selectedPos.x)) *
                      BRANCH_DISTANCE -
                    18,
                ),
                animation: "orbit-pop 380ms cubic-bezier(0.22, 1, 0.36, 1) both",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              No profile links yet
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
