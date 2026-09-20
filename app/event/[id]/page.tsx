"use client";

import { use, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { UserOrbitGraph } from "@/components/UserOrbitGraph";
import { EventQRWidget } from "@/components/EventQR";
import { useAuth } from "@/components/AuthProvider";
import { subscribeToEvent, subscribeToEventAttendees, joinEvent, type EventData } from "@/lib/events";
import { getUserProfile, type UserProfile } from "@/lib/users";
import { DUMMY_USERS } from "@/lib/mockUsers";
import { FiArrowRight } from "react-icons/fi";

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [attendees, setAttendees] = useState<UserProfile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const unsubEvent = subscribeToEvent(id, (data) => {
      setEventData(data);
      if (!data) setLoading(false);
    });

    const unsubAttendees = subscribeToEventAttendees(id, (users) => {
      setAttendees(users);
      setLoading(false);
    });

    return () => {
      unsubEvent();
      unsubAttendees();
    };
  }, [id]);

  const hasJoined = Boolean(user && attendees?.some((u) => u.uid === user.uid));

  const handleJoin = async () => {
    if (!user || hasJoined) return;
    setJoining(true);
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        await joinEvent(id, profile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm font-medium text-zinc-500">Loading event space...</p>
      </main>
    );
  }

  if (!eventData) {
    return (
      <main className="flex min-h-screen flex-col bg-white">
        <Header />
        <section className="flex flex-1 items-center justify-center">
          <p className="text-zinc-500">Event not found.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-white">
      <Header eventData={eventData} />

      <section className="relative flex flex-1 flex-col px-0 sm:px-4 pb-2">
        <div className="absolute top-6 left-6 z-10 hidden md:block">
          <EventQRWidget />
        </div>
        
        
        {hasJoined ? (
          <>
            <UserOrbitGraph 
              eventName={eventData.name}
              users={showDemo ? [...(attendees ?? []), ...DUMMY_USERS] : (attendees ?? [])} 
            />
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 rounded-full bg-white px-4 py-2.5 ring-1 ring-zinc-200">
              <span className="text-xs font-semibold text-zinc-600">Demo Users</span>
              <button
                type="button"
                role="switch"
                aria-checked={showDemo}
                onClick={() => setShowDemo(!showDemo)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  showDemo ? "bg-orange-600" : "bg-zinc-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block size-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                    showDemo ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </>
        ) : (
          <div className="z-20 flex w-full flex-1 flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-10 border border-zinc-100 max-w-sm text-center">
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Join {eventData.name}</h2>
              <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                Scan successful! Join the network to see who else is here and share your profile.
              </p>
              {user ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
                >
                  {joining ? "Joining..." : "Join Event Network"}
                  {!joining && <FiArrowRight className="size-4" />}
                </button>
              ) : (
                <p className="text-sm font-medium text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                  Please sign in from the top right to join.
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
