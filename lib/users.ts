import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

export type SocialLinks = {
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
};

export const EMPTY_SOCIAL_LINKS: SocialLinks = {
  instagram: null,
  facebook: null,
  linkedin: null,
  twitter: null,
  github: null,
};

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  socials: SocialLinks;
};

export async function upsertUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toSocialLinks(data: Record<string, unknown>): SocialLinks {
  const raw =
    data.socials && typeof data.socials === "object"
      ? (data.socials as Record<string, unknown>)
      : data;

  return {
    instagram: readOptionalString(raw.instagram),
    facebook: readOptionalString(raw.facebook),
    linkedin: readOptionalString(raw.linkedin),
    twitter: readOptionalString(raw.twitter),
    github: readOptionalString(raw.github),
  };
}

function toUserProfile(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: typeof data.uid === "string" ? data.uid : id,
    email: typeof data.email === "string" ? data.email : null,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
    socials: toSocialLinks(data),
  };
}

/** Live subscription to every registered user. */
export function subscribeToUsers(
  onChange: (users: UserProfile[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      const users = snapshot.docs.map((d) =>
        toUserProfile(d.id, d.data() as Record<string, unknown>),
      );
      users.sort((a, b) =>
        (a.displayName ?? a.email ?? a.uid).localeCompare(
          b.displayName ?? b.email ?? b.uid,
        ),
      );
      onChange(users);
    },
    (error) => onError?.(error),
  );
}
