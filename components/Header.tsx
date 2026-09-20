import { AuthButton } from "./AuthButton";
import { FiGlobe } from "react-icons/fi";
import { MousePointerClick } from "lucide-react";
import { type EventData } from "@/lib/events";
import Link from "next/link";

export function Header({ eventData }: { eventData?: EventData }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200/50 bg-white/50 px-4 py-1.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-orange-700 text-white">
          <FiGlobe className="size-4" />
        </div>
        <div>
          <h1 className="text-md font-semibold leading-tight tracking-tight text-zinc-900">
            {eventData ? eventData.name : "Event Scanner"}
          </h1>
          <p className="text-[12px] font-medium leading-tight text-zinc-500">
            {eventData ? eventData.date : "Create your own network space"}
          </p>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-orange-200/50 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-100"
        >
          <MousePointerClick className="size-3.5" />
          Create your space
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <AuthButton />
      </div>
    </header>
  );
}
