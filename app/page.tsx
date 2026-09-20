import { AuthButton } from "@/components/AuthButton";
import { UserOrbitGraph } from "@/components/UserOrbitGraph";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-[#f4f4f5]">
      <header className="flex items-center justify-between px-6 py-4">
        <p className="text-sm font-medium text-zinc-500">Network</p>
        <AuthButton />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-4 pb-10">
        <UserOrbitGraph />
      </section>
    </main>
  );
}
