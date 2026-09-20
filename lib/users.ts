import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

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
