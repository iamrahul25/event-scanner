import { Header } from "@/components/Header";
import { CreateEventForm } from "@/components/CreateEventForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-50">
      <Header />
      
      <section className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 border border-zinc-100">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900">Create an Event Space</h1>
            <p className="text-sm font-medium text-zinc-500">
              Host a dynamic network orbit for your attendees. They just scan a QR code to join.
            </p>
          </div>
          <CreateEventForm />
        </div>
      </section>
    </main>
  );
}
