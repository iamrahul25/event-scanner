"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { layoutConcentricOrbit } from "@/lib/orbitLayout";
import {
  subscribeToUsers,
  type UserProfile,
} from "@/lib/users";
import { SOCIAL_META } from "@/lib/socials";
import { FiMail, FiSearch } from "react-icons/fi";
import { type IconType } from "react-icons";
import { Mascot } from "page-mascot";

const RING_COLORS = [
  "border-emerald-400/60",
  "border-emerald-500/60",
  "border-emerald-600/60",
  "border-emerald-300/60",
] as const;

const NODE_SIZE = 64;
const CENTER_SIZE = 140;
const CHILD_W = 132;
const CHILD_H = 44;
const BRANCH_DISTANCE = 80;
/** Minimum center-to-center gap so detail cards never overlap. */
const CHILD_MIN_SEP = CHILD_W + 16;
/** Extra padding around the expanded cluster when auto-scrolling into view. */
const FOCUS_PAD = 48;



type BranchItem = {
  id: string;
  label: string;
  icon: IconType;
  colorClass: string;
  bgClass: string;
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
      icon: FiMail,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-100",
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
      icon: meta.icon,
      colorClass: meta.colorClass,
      bgClass: meta.bgClass,
      href,
      detail: displayHandle(href),
    });
  }

  return items;
}

/** Fan child nodes outward from the parent with spacing that prevents overlap. */
function layoutBranches(
  parentX: number,
  parentY: number,
  items: BranchItem[],
  isOutermost: boolean = false,
): BranchNode[] {
  if (items.length === 0) return [];

  let radial = Math.atan2(parentY, parentX);
  if (isOutermost) {
    radial += Math.PI;
  }
  const count = items.length;

  if (count === 1) {
    const item = items[0]!;
    return [
      {
        ...item,
        x: parentX + Math.cos(radial) * BRANCH_DISTANCE,
        y: parentY + Math.sin(radial) * BRANCH_DISTANCE,
      },
    ];
  }

  const maxSpread = Math.PI * 0.92;
  let distance = BRANCH_DISTANCE;

  // Grow the fan radius until angular spacing leaves enough chord length
  // between neighboring card centers.
  for (let attempt = 0; attempt < 24; attempt++) {
    const halfChord = CHILD_MIN_SEP / (2 * distance);
    if (halfChord >= 1) {
      distance += 20;
      continue;
    }
    const minAngle = 2 * Math.asin(halfChord);
    const spread = minAngle * (count - 1);
    if (spread <= maxSpread) {
      const start = radial - spread / 2;
      return items.map((item, i) => {
        const angle = start + minAngle * i;
        return {
          ...item,
          x: parentX + Math.cos(angle) * distance,
          y: parentY + Math.sin(angle) * distance,
        };
      });
    }
    distance += 20;
  }

  // Fallback: column stacked along the tangent (always non-overlapping).
  const tangentX = -Math.sin(radial);
  const tangentY = Math.cos(radial);
  const outX = Math.cos(radial);
  const outY = Math.sin(radial);
  const stackGap = CHILD_H + 16;
  const totalSpan = (count - 1) * stackGap;

  return items.map((item, i) => {
    const along = i * stackGap - totalSpan / 2;
    return {
      ...item,
      x: parentX + outX * (BRANCH_DISTANCE + 24) + tangentX * along,
      y: parentY + outY * (BRANCH_DISTANCE + 24) + tangentY * along,
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
      <span className="max-w-full truncate text-center text-[11px] font-medium leading-tight text-zinc-800 bg-zinc-50/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
        {shortLabel(user)}
      </span>
    </div>
  );
}

type UserOrbitGraphProps = {
  /** When set, skips Firestore and renders this list (UI testing). */
  users?: UserProfile[];
  eventName?: string;
};

export function UserOrbitGraph({ users: usersProp, eventName }: UserOrbitGraphProps = {}) {
  const [liveUsers, setLiveUsers] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
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
        gap: 16,
        padding: 24,
      }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    if (!users || !searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return users
      .filter(
        (u) =>
          u.displayName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [searchQuery, users]);

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
      Math.hypot(selectedPos.x, selectedPos.y) + 180 > layout.radius,
    );
  }, [selectedUser, selectedPos, layout.radius]);

  const extent = layout.radius;

  const canvasSize = Math.ceil(Math.max(extent * 2, CENTER_SIZE + 64));
  const center = canvasSize / 2;

  const focusBounds = useMemo(() => {
    if (!selectedPos) return null;

    let minX = center + selectedPos.x - NODE_SIZE / 2;
    let maxX = center + selectedPos.x + NODE_SIZE / 2;
    let minY = center + selectedPos.y - NODE_SIZE / 2;
    let maxY = center + selectedPos.y + NODE_SIZE / 2;

    for (const b of branches) {
      minX = Math.min(minX, center + b.x - CHILD_W / 2);
      maxX = Math.max(maxX, center + b.x + CHILD_W / 2);
      minY = Math.min(minY, center + b.y - CHILD_H / 2);
      maxY = Math.max(maxY, center + b.y + CHILD_H / 2);
    }

    return {
      left: minX - FOCUS_PAD,
      top: minY - FOCUS_PAD,
      width: maxX - minX + FOCUS_PAD * 2,
      height: maxY - minY + FOCUS_PAD * 2,
    };
  }, [selectedPos, branches, center]);

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
    <div className="relative flex flex-1 flex-col h-full w-full">
      {error ? (
        <p className="mb-4 text-center text-sm text-red-600">{error}</p>
      ) : null}

      {!error && users.length === 0 ? (
        <p className="mb-4 text-center text-sm text-zinc-500">
          No registered users yet. Sign in to appear on the graph.
        </p>
      ) : null}

      {selectedUser ? (
        <p className="shrink-0 pt-6 text-center text-sm text-zinc-500">
          Viewing{" "}
          <span className="font-medium text-zinc-700">
            {selectedUser.displayName ?? "user"}
          </span>
          {" · "}
          click again or press Esc to collapse
        </p>
      ) : (
        <p className="shrink-0 pt-6 text-center text-sm text-zinc-500">
          Click a person to expand their profile on the map
        </p>
      )}

      <div
        ref={scrollRef}
        className="flex-1 w-full overflow-auto flex items-center justify-center"
      >
        {/* Search Bar */}
        <div className="absolute right-6 top-6 z-20 flex w-64 flex-col gap-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search attendees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              className="w-full rounded-full border border-zinc-200 bg-white/80 backdrop-blur-md py-2 pl-9 pr-4 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          </div>
          {showSearch && filteredUsers.length > 0 && (
            <div className="absolute top-full mt-2 w-full rounded-xl border border-zinc-200 bg-white/95 p-2 backdrop-blur-xl">
              {filteredUsers.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => {
                    setSelectedUid(u.uid);
                    setSearchQuery("");
                    setShowSearch(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-zinc-100"
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600">
                    {initials(u)}
                  </div>
                  <div className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                    {u.displayName ?? u.email}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="relative mx-auto shrink-0"
          style={{ width: px(canvasSize), height: px(canvasSize) }}
          onClick={() => {
            if (selectedUid) setSelectedUid(null);
          }}
        >
          {focusBounds ? (
            <div
              ref={focusRef}
              aria-hidden
              className="pointer-events-none absolute z-0"
              style={{
                left: px(focusBounds.left),
                top: px(focusBounds.top),
                width: px(focusBounds.width),
                height: px(focusBounds.height),
              }}
            />
          ) : null}
          {/* Soft ring guides (decorative, not interactive) */}
          {Array.from({ length: layout.ringCount }, (_, ring) => {
            const ringRadius =
              CENTER_SIZE / 2 + NODE_SIZE / 2 + 16 + ring * (NODE_SIZE + 16);
            return (
              <div
                key={ring}
                aria-hidden
                className={`pointer-events-none absolute rounded-full border transition-opacity duration-300 ${RING_COLORS[ring % RING_COLORS.length]} ${selectedUid ? "opacity-25" : "opacity-100"
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

          {/* Connector lines — selected user → social children */}
          {selectedPos && selectedUser && branches.length > 0 ? (
            <svg
              className="pointer-events-none absolute inset-0 z-[4] overflow-visible"
              width={canvasSize}
              height={canvasSize}
              aria-hidden
            >
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
                  stroke="#10b981"
                  strokeOpacity={0.6}
                  strokeWidth={1}
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
            className={`absolute z-10 flex flex-col items-center justify-center rounded-full bg-white shadow-[0_8px_28px_rgba(15,23,42,0.12)] transition-opacity duration-300 ${selectedUid ? "opacity-70" : "opacity-100"
              }`}
            style={{
              width: px(CENTER_SIZE),
              height: px(CENTER_SIZE),
              left: px(center - CENTER_SIZE / 2),
              top: px(center - CENTER_SIZE / 2),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex flex-col items-center -mt-12">
              <Mascot
                directions="/mascots/frog-directions.webp"
                reactions="/mascots/frog-reactions.webp"
              />
            </div>
            <div className="relative z-20 flex flex-col items-center -mt-8">
              <span className="text-sm font-semibold tracking-tight text-zinc-900">
                {eventName || "Event Scanner"}
              </span>
              <span className="mt-1 text-xs text-zinc-500">
                {users.length} {users.length === 1 ? "user" : "users"}
              </span>
            </div>
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
                className={`absolute rounded-full transition-all duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${isSelected
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
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${branch.bgClass} ${branch.colorClass}`}>
                    <branch.icon className="size-4" />
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
