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

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
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

function toUserProfile(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: typeof data.uid === "string" ? data.uid : id,
    email: typeof data.email === "string" ? data.email : null,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
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
