import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { type UserProfile } from "./users";

export type EventData = {
  id: string;
  name: string;
  date: string;
  hostUid: string;
  createdAt: unknown;
};

/**
 * Creates a new event in Firestore and returns its ID.
 */
export async function createEvent(name: string, date: string, hostUid: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "event";
    
  let slug = baseSlug;
  let newEventRef = doc(db, "events", slug);
  let snapshot = await getDoc(newEventRef);
  
  let counter = 1;
  while (snapshot.exists()) {
    slug = `${baseSlug}-${counter}`;
    newEventRef = doc(db, "events", slug);
    snapshot = await getDoc(newEventRef);
    counter++;
  }
  
  await setDoc(newEventRef, {
    id: newEventRef.id,
    name,
    date,
    hostUid,
    createdAt: serverTimestamp(),
  });

  return newEventRef.id;
}

/**
 * Live subscription to a single event's metadata.
 */
export function subscribeToEvent(
  eventId: string,
  onChange: (event: EventData | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "events", eventId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }
      onChange(snapshot.data() as EventData);
    },
    (err) => onError?.(err)
  );
}

/**
 * Joins an event by copying the user profile into the event's attendees subcollection.
 */
export async function joinEvent(eventId: string, profile: UserProfile) {
  const attendeeRef = doc(db, "events", eventId, "attendees", profile.uid);
  
  await setDoc(attendeeRef, {
    ...profile,
    joinedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Live subscription to all attendees in a specific event.
 */
export function subscribeToEventAttendees(
  eventId: string,
  onChange: (users: UserProfile[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "events", eventId, "attendees"),
    (snapshot) => {
      const attendees = snapshot.docs.map((d) => d.data() as UserProfile);
      
      attendees.sort((a, b) =>
        (a.displayName ?? a.email ?? a.uid).localeCompare(
          b.displayName ?? b.email ?? b.uid,
        ),
      );
      
      onChange(attendees);
    },
    (err) => onError?.(err)
  );
}

/** Update the user's profile snapshot in a specific event. */
export async function updateEventAttendeeProfile(eventId: string, uid: string, data: Partial<UserProfile>) {
  const ref = doc(db, "events", eventId, "attendees", uid);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
